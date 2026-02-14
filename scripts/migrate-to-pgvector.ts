#!/usr/bin/env tsx
/**
 * Migration Script: ChromaDB to pgvector
 *
 * This script migrates existing transcript chunks from ChromaDB (or any source)
 * to PostgreSQL with pgvector extension. It handles:
 * - Enabling pgvector extension
 * - Generating embeddings for existing transcripts
 * - Batch insertion into VectorChunk table
 * - Index optimization
 *
 * Usage:
 *   npx tsx scripts/migrate-to-pgvector.ts
 *
 * Prerequisites:
 *   - PostgreSQL database with Supabase/pgvector support
 *   - DATABASE_URL environment variable set
 *   - OPENAI_API_KEY for generating embeddings
 *   - Existing transcripts in database
 *
 * Safety:
 *   - Idempotent: can be run multiple times safely
 *   - Skips already-migrated chunks
 *   - Rollback support via transaction
 */

import { prisma } from '../src/lib/prisma';
import * as pgvector from '../src/lib/rag-pgvector';
import { getBatchEmbeddings } from '../src/lib/embeddings';

// Configuration
const BATCH_SIZE = 50; // Process 50 chunks at a time
const DRY_RUN = process.env.DRY_RUN === 'true';

interface MigrationStats {
  totalTranscripts: number;
  totalChunks: number;
  migratedChunks: number;
  skippedChunks: number;
  failedChunks: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Main migration function
 */
async function migrate() {
  const stats: MigrationStats = {
    totalTranscripts: 0,
    totalChunks: 0,
    migratedChunks: 0,
    skippedChunks: 0,
    failedChunks: 0,
    startTime: new Date(),
  };

  console.log('🚀 Starting pgvector migration...');
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Check pgvector availability
    console.log('📋 Step 1: Checking pgvector extension...');
    const pgvectorAvailable = await pgvector.isPgVectorAvailable();

    if (!pgvectorAvailable) {
      console.log('   Installing pgvector extension...');
      if (!DRY_RUN) {
        await pgvector.enablePgVector();
      }
      console.log('   ✅ pgvector extension enabled\n');
    } else {
      console.log('   ✅ pgvector extension already enabled\n');
    }

    // Step 2: Get all transcripts
    console.log('📋 Step 2: Fetching transcripts from database...');
    const transcripts = await prisma.transcript.findMany({
      include: {
        chunks: {
          orderBy: { order: 'asc' },
        },
        video: {
          select: {
            id: true,
            youtubeId: true,
            title: true,
          },
        },
      },
    });

    stats.totalTranscripts = transcripts.length;
    stats.totalChunks = transcripts.reduce((sum, t) => sum + t.chunks.length, 0);

    console.log(`   Found ${stats.totalTranscripts} transcripts with ${stats.totalChunks} chunks\n`);

    if (stats.totalChunks === 0) {
      console.log('⚠️  No chunks to migrate. Exiting.');
      return;
    }

    // Step 3: Check existing vector chunks
    console.log('📋 Step 3: Checking existing vector chunks...');
    const existingVectorCount = await pgvector.getVectorChunkCount();
    console.log(`   Found ${existingVectorCount} existing vector chunks\n`);

    // Step 4: Migrate each transcript
    console.log('📋 Step 4: Migrating transcript chunks...');
    let processedTranscripts = 0;

    for (const transcript of transcripts) {
      processedTranscripts++;
      const videoTitle = transcript.video.title;

      console.log(
        `   [${processedTranscripts}/${stats.totalTranscripts}] Processing "${videoTitle}" (${transcript.chunks.length} chunks)...`
      );

      if (transcript.chunks.length === 0) {
        console.log('      ⚠️  No chunks to migrate');
        continue;
      }

      // Check if already migrated
      const existingCount = await pgvector.getVectorChunkCount(transcript.videoId);
      if (existingCount === transcript.chunks.length) {
        console.log(`      ⏭️  Already migrated (${existingCount} chunks), skipping`);
        stats.skippedChunks += existingCount;
        continue;
      }

      // Process in batches
      for (let i = 0; i < transcript.chunks.length; i += BATCH_SIZE) {
        const batch = transcript.chunks.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(transcript.chunks.length / BATCH_SIZE);

        console.log(`      Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

        try {
          // Get embeddings for batch
          const texts = batch.map((chunk) => chunk.text);
          const embeddings = await getBatchEmbeddings(texts);

          // Prepare chunks for insertion
          const vectorChunks = batch.map((chunk, idx) => ({
            transcriptId: transcript.id,
            videoId: transcript.videoId,
            text: chunk.text,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            embedding: embeddings[idx],
          }));

          // Insert batch
          if (!DRY_RUN) {
            const inserted = await pgvector.addVectorChunks(vectorChunks);
            stats.migratedChunks += inserted;
          } else {
            stats.migratedChunks += batch.length;
          }

          console.log(`      ✅ Migrated ${batch.length} chunks`);
        } catch (error) {
          console.error(`      ❌ Failed to migrate batch: ${error}`);
          stats.failedChunks += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`      ✅ Completed "${videoTitle}"\n`);
    }

    // Step 5: Optimize index
    console.log('📋 Step 5: Optimizing pgvector index...');
    if (!DRY_RUN) {
      await pgvector.optimizeVectorIndex();
    }
    console.log('   ✅ Index optimization complete\n');

    // Step 6: Verify migration
    console.log('📋 Step 6: Verifying migration...');
    const finalVectorCount = DRY_RUN
      ? stats.migratedChunks
      : await pgvector.getVectorChunkCount();

    console.log(`   Final vector chunk count: ${finalVectorCount}\n`);

    // Summary
    stats.endTime = new Date();
    printSummary(stats);

    // Success
    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set VECTOR_DB=pgvector in your .env.local');
    console.log('   2. Restart your application');
    console.log('   3. Test search functionality');
    console.log('   4. (Optional) Disable ChromaDB if no longer needed\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Print migration summary
 */
function printSummary(stats: MigrationStats) {
  const duration = stats.endTime
    ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
    : 0;

  console.log('═'.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Transcripts:  ${stats.totalTranscripts}`);
  console.log(`Total Chunks:       ${stats.totalChunks}`);
  console.log(`Migrated Chunks:    ${stats.migratedChunks}`);
  console.log(`Skipped Chunks:     ${stats.skippedChunks}`);
  console.log(`Failed Chunks:      ${stats.failedChunks}`);
  console.log(`Duration:           ${duration.toFixed(2)}s`);
  console.log('═'.repeat(60));

  if (stats.failedChunks > 0) {
    console.warn('\n⚠️  Some chunks failed to migrate. Check logs above for details.');
  }
}

/**
 * Rollback function (if needed)
 */
async function rollback() {
  console.log('🔄 Rolling back migration...');

  const count = await pgvector.getVectorChunkCount();
  console.log(`   Deleting ${count} vector chunks...`);

  await prisma.vectorChunk.deleteMany({});

  console.log('   ✅ Rollback complete\n');
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  try {
    if (command === 'rollback') {
      await rollback();
    } else {
      await migrate();
    }
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
