---
name: learnwithavi-rag
description: RAG (Retrieval-Augmented Generation) system for LearnWithAvi AI tutor platform. Use when processing video transcripts, creating embeddings, querying the vector database, or building context for Claude API responses. Handles transcript chunking with timestamp preservation, semantic search, and citation generation.
---

# LearnWithAvi RAG System

## Quick Start

### 1. Ingest Transcripts

```bash
python scripts/ingest_transcripts.py <transcripts_folder> --output <chunks.json>
```

### 2. Generate Embeddings

```python
from openai import OpenAI
client = OpenAI()

def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
```

### 3. Query with Context

```python
# See references/query_flow.md for complete implementation
results = vector_db.query(query_embedding, top_k=5)
context = format_context(results)
response = claude_with_context(query, context)
```

## Chunk Schema

Each transcript chunk must include:

```json
{
  "id": "video_abc123_chunk_005",
  "video_id": "abc123",
  "video_title": "Understanding Embeddings",
  "text": "Transcript text for this segment...",
  "start_time": 330,
  "end_time": 345,
  "topic": "embeddings",
  "source_url": "https://youtube.com/watch?v=abc123&t=330"
}
```

## Chunking Strategy

- **Segment size**: 15-30 seconds of speech (~100-200 words)
- **Overlap**: 5 seconds between chunks for context continuity
- **Split points**: Natural pauses, sentence boundaries (never mid-sentence)
- **Timestamp format**: Store as seconds (integer) for seeking, format as HH:MM:SS for display

## Content Boundary Enforcement

The AI tutor must distinguish between in-scope and out-of-scope questions:

**System Prompt Template:**
```
You are an AI tutor trained on Avi Levi's AI/ML course materials.

CRITICAL RULES:
1. ONLY answer from the provided context documents
2. If information is not in context, respond:
   "This topic isn't covered in the current course materials. I can only provide
   accurate answers about content from Avi's courses. Would you like me to suggest
   related topics that are covered?"
3. ALWAYS cite sources with format: [Video Title @ MM:SS]
4. Use Socratic method - ask clarifying questions before complex explanations
```

## References

- **Ingestion pipeline**: See `scripts/ingest_transcripts.py`
- **Query flow**: See `references/query_flow.md`
- **Claude integration**: See `references/claude_integration.md`
