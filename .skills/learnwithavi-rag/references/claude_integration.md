# Claude API Integration Reference

## Next.js API Route Implementation

### Basic Chat Endpoint

```typescript
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are an AI tutor specializing in AI/ML education, trained exclusively on Avi Levi's course materials.

CRITICAL RULES:
1. ONLY answer from the provided context
2. If not in context, say: "This topic isn't covered in the current course materials..."
3. ALWAYS cite with [Video Title @ MM:SS] format
4. Use Socratic method for complex topics
5. Respond in user's language (Hebrew/English)`;

export async function POST(request: NextRequest) {
  const { message, context, conversationHistory } = await request.json();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        ...conversationHistory,
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `COURSE CONTEXT:\n${context}`,
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: message,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      message: response.content[0].type === "text" ? response.content[0].text : "",
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens || 0,
        cacheWrite: response.usage.cache_creation_input_tokens || 0,
      },
    });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
```

### Streaming Endpoint

```typescript
// app/api/chat/stream/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { message, context } = await request.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${message}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## Prompt Caching Benefits

With prompt caching enabled:
- System prompt (cached): ~500 tokens at 0.1x cost after first request
- Context (cached): ~2000 tokens at 0.1x cost
- User message: Full cost (~50 tokens)

**Cost reduction: ~89% on repeated requests within 5-minute TTL**
