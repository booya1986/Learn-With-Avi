#!/usr/bin/env node

/**
 * Documentation Manager
 *
 * Utilities for managing markdown documentation across the codebase.
 *
 * Usage:
 *   node scripts/docs-manager.js list           # List all MD files
 *   node scripts/docs-manager.js check-links    # Check for broken links
 *   node scripts/docs-manager.js generate-toc   # Generate table of contents
 *   node scripts/docs-manager.js find-orphans   # Find orphaned docs
 *   node scripts/docs-manager.js stats          # Show documentation statistics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build'];

/**
 * Find all markdown files in the project
 */
function findMarkdownFiles(dir = ROOT_DIR, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const dirName = path.basename(filePath);
      if (!EXCLUDE_DIRS.includes(dirName)) {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * List all markdown files
 */
function listMarkdownFiles() {
  const files = findMarkdownFiles();
  const relativePaths = files.map(f => path.relative(ROOT_DIR, f));

  console.log('\n📄 Markdown Files Found:', files.length);
  console.log('═'.repeat(60));

  // Group by directory
  const byDirectory = {};
  relativePaths.forEach(file => {
    const dir = path.dirname(file);
    if (!byDirectory[dir]) {
      byDirectory[dir] = [];
    }
    byDirectory[dir].push(path.basename(file));
  });

  // Display grouped
  Object.keys(byDirectory).sort().forEach(dir => {
    console.log(`\n📁 ${dir}/`);
    byDirectory[dir].sort().forEach(file => {
      console.log(`   - ${file}`);
    });
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`Total: ${files.length} files\n`);
}

/**
 * Extract links from markdown content
 */
function extractLinks(content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    });
  }

  return links;
}

/**
 * Check for broken internal links
 */
function checkBrokenLinks() {
  const files = findMarkdownFiles();
  const brokenLinks = [];

  console.log('\n🔍 Checking for broken links...\n');

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const links = extractLinks(content);
    const relativePath = path.relative(ROOT_DIR, file);

    links.forEach(link => {
      // Skip external URLs
      if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
        return;
      }

      // Skip anchors only
      if (link.url.startsWith('#')) {
        return;
      }

      // Remove anchor from URL
      const urlWithoutAnchor = link.url.split('#')[0];

      // Resolve relative path
      const targetPath = path.resolve(path.dirname(file), urlWithoutAnchor);

      // Check if file exists
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push({
          sourceFile: relativePath,
          linkText: link.text,
          linkUrl: link.url,
          targetPath: path.relative(ROOT_DIR, targetPath)
        });
      }
    });
  });

  if (brokenLinks.length === 0) {
    console.log('✅ No broken links found!\n');
  } else {
    console.log(`❌ Found ${brokenLinks.length} broken links:\n`);
    brokenLinks.forEach(link => {
      console.log(`📄 ${link.sourceFile}`);
      console.log(`   ❌ [${link.linkText}](${link.linkUrl})`);
      console.log(`   → Target not found: ${link.targetPath}\n`);
    });
  }

  return brokenLinks.length;
}

/**
 * Find orphaned documentation (not linked from anywhere)
 */
function findOrphanedDocs() {
  const files = findMarkdownFiles();
  const linkedFiles = new Set();

  // Add README.md as it's the entry point
  linkedFiles.add('README.md');

  console.log('\n🔍 Finding orphaned documentation...\n');

  // Find all internal links
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const links = extractLinks(content);

    links.forEach(link => {
      // Skip external URLs and anchors
      if (link.url.startsWith('http://') ||
          link.url.startsWith('https://') ||
          link.url.startsWith('#')) {
        return;
      }

      const urlWithoutAnchor = link.url.split('#')[0];
      const targetPath = path.resolve(path.dirname(file), urlWithoutAnchor);
      const relativePath = path.relative(ROOT_DIR, targetPath);

      if (fs.existsSync(targetPath) && targetPath.endsWith('.md')) {
        linkedFiles.add(relativePath);
      }
    });
  });

  // Find orphaned files
  const orphanedFiles = files
    .map(f => path.relative(ROOT_DIR, f))
    .filter(f => !linkedFiles.has(f))
    .filter(f => {
      // Exclude auto-generated API docs
      return !f.startsWith('docs/api-reference/');
    });

  if (orphanedFiles.length === 0) {
    console.log('✅ No orphaned documentation found!\n');
  } else {
    console.log(`⚠️  Found ${orphanedFiles.length} orphaned files:\n`);
    orphanedFiles.forEach(file => {
      console.log(`   📄 ${file}`);
    });
    console.log('\nThese files are not linked from any other documentation.\n');
  }

  return orphanedFiles.length;
}

/**
 * Generate documentation statistics
 */
function generateStats() {
  const files = findMarkdownFiles();
  const stats = {
    total: files.length,
    byDirectory: {},
    totalLines: 0,
    totalWords: 0,
    avgLinesPerFile: 0,
    avgWordsPerFile: 0
  };

  files.forEach(file => {
    const relativePath = path.relative(ROOT_DIR, file);
    const dir = path.dirname(relativePath);

    if (!stats.byDirectory[dir]) {
      stats.byDirectory[dir] = {
        count: 0,
        lines: 0,
        words: 0
      };
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;

    stats.byDirectory[dir].count++;
    stats.byDirectory[dir].lines += lines;
    stats.byDirectory[dir].words += words;
    stats.totalLines += lines;
    stats.totalWords += words;
  });

  stats.avgLinesPerFile = Math.round(stats.totalLines / stats.total);
  stats.avgWordsPerFile = Math.round(stats.totalWords / stats.total);

  console.log('\n📊 Documentation Statistics');
  console.log('═'.repeat(60));
  console.log(`Total Files: ${stats.total}`);
  console.log(`Total Lines: ${stats.totalLines.toLocaleString()}`);
  console.log(`Total Words: ${stats.totalWords.toLocaleString()}`);
  console.log(`Avg Lines/File: ${stats.avgLinesPerFile}`);
  console.log(`Avg Words/File: ${stats.avgWordsPerFile}`);
  console.log('\n📁 By Directory:');
  console.log('─'.repeat(60));

  Object.keys(stats.byDirectory)
    .sort((a, b) => stats.byDirectory[b].count - stats.byDirectory[a].count)
    .forEach(dir => {
      const dirStats = stats.byDirectory[dir];
      console.log(`\n${dir}/`);
      console.log(`  Files: ${dirStats.count}`);
      console.log(`  Lines: ${dirStats.lines.toLocaleString()}`);
      console.log(`  Words: ${dirStats.words.toLocaleString()}`);
    });

  console.log('\n' + '═'.repeat(60) + '\n');
}

/**
 * Generate table of contents for a markdown file
 */
function generateTOC(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = [];

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[`*_]/g, ''); // Remove formatting
      const anchor = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      headers.push({ level, text, anchor });
    }
  });

  console.log('\n📑 Table of Contents:\n');
  headers.forEach(header => {
    const indent = '  '.repeat(header.level - 1);
    console.log(`${indent}- [${header.text}](#${header.anchor})`);
  });
  console.log('');
}

// Main CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    listMarkdownFiles();
    break;

  case 'check-links':
    const brokenCount = checkBrokenLinks();
    process.exit(brokenCount > 0 ? 1 : 0);
    break;

  case 'find-orphans':
    const orphanCount = findOrphanedDocs();
    process.exit(orphanCount > 0 ? 1 : 0);
    break;

  case 'stats':
    generateStats();
    break;

  case 'generate-toc':
    if (!arg) {
      console.error('❌ Please provide a file path');
      console.log('Usage: node scripts/docs-manager.js generate-toc <file.md>');
      process.exit(1);
    }
    generateTOC(arg);
    break;

  default:
    console.log(`
📚 Documentation Manager

Usage:
  node scripts/docs-manager.js <command> [options]

Commands:
  list              List all markdown files grouped by directory
  check-links       Check for broken internal links
  find-orphans      Find documentation not linked from anywhere
  stats             Show documentation statistics
  generate-toc      Generate table of contents for a file
                    Usage: generate-toc <file.md>

Examples:
  node scripts/docs-manager.js list
  node scripts/docs-manager.js check-links
  node scripts/docs-manager.js stats
  node scripts/docs-manager.js generate-toc README.md
`);
    break;
}
