# RAG Query Flow Reference

## Complete Query Pipeline

```python
import anthropic
from typing import List, Dict, Any

class RAGQueryEngine:
    def __init__(self, vector_store, anthropic_client: anthropic.Anthropic):
        self.vector_store = vector_store
        self.client = anthropic_client
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        return """You are an AI tutor specializing in AI/ML education, trained exclusively on Avi Levi's course materials from LearnWithAvi.

CRITICAL CONSTRAINTS:
1. You MUST ONLY answer questions using information from the PROVIDED CONTEXT below
2. If the answer is NOT in the provided context, respond exactly:
   "הנושא הזה לא מכוסה בחומרי הקורס הנוכחיים. אני יכול לספק תשובות מדויקות רק על תוכן מהקורסים של אבי. האם תרצה שאציע נושאים קשורים שכן מכוסים?"
   (Translation: "This topic isn't covered in the current course materials. I can only provide accurate answers about content from Avi's courses. Would you like me to suggest related topics that are covered?")
3. ALWAYS cite your sources using the format: [Video Title @ MM:SS]
4. When citing, include the clickable timestamp link
5. Use the Socratic method - ask clarifying questions before explaining complex topics
6. Respond in the same language the user uses (Hebrew or English)

TEACHING STYLE:
- Break down complex concepts into digestible parts
- Use analogies from the course materials when available
- Encourage the learner to think through problems
- Reference specific video moments for visual explanations"""

    def query(self, user_question: str, current_video_id: str = None) -> Dict[str, Any]:
        # Step 1: Generate query embedding
        query_embedding = self._get_embedding(user_question)

        # Step 2: Retrieve relevant chunks
        chunks = self.vector_store.query(
            query_embedding,
            top_k=7,
            filter={"video_id": current_video_id} if current_video_id else None
        )

        # Step 3: Format context with citations
        formatted_context = self._format_context(chunks)

        # Step 4: Generate response with Claude
        response = self._generate_response(user_question, formatted_context)

        return {
            "answer": response,
            "sources": self._extract_sources(chunks),
            "chunks_used": len(chunks)
        }

    def _format_context(self, chunks: List[Dict]) -> str:
        context_parts = []
        for i, chunk in enumerate(chunks):
            timestamp_str = self._format_timestamp(chunk["start_time"])
            context_parts.append(
                f"[Source {i+1}: {chunk['video_title']} @ {timestamp_str}]\n"
                f"URL: {chunk['source_url']}\n"
                f"Content: {chunk['text']}\n"
            )
        return "\n---\n".join(context_parts)

    def _generate_response(self, question: str, context: str) -> str:
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": self.system_prompt,
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"COURSE MATERIALS CONTEXT:\n{context}",
                            "cache_control": {"type": "ephemeral"}
                        },
                        {
                            "type": "text",
                            "text": f"STUDENT QUESTION: {question}"
                        }
                    ]
                }
            ]
        )
        return response.content[0].text

    def _format_timestamp(self, seconds: int) -> str:
        mins = seconds // 60
        secs = seconds % 60
        return f"{mins}:{secs:02d}"

    def _extract_sources(self, chunks: List[Dict]) -> List[Dict]:
        return [
            {
                "video_id": c["video_id"],
                "video_title": c["video_title"],
                "timestamp": c["start_time"],
                "url": c["source_url"],
                "relevance": c.get("score", 0)
            }
            for c in chunks
        ]
```

## Streaming Response

For better UX, use streaming:

```python
async def stream_response(self, question: str, context: str):
    async with self.client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=self.system_prompt,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
```
