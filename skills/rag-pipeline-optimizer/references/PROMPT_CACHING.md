# Prompt Caching Strategy for Claude API

Reduce API costs by 50-90% through intelligent prompt caching in your RAG pipeline.

## What is Prompt Caching?

Claude API supports **prompt caching** to reuse previously processed content across requests. When you mark content with `cache_control`, Claude stores it and doesn't reprocess it on subsequent calls.

**Cost savings**:
- Cached tokens: **90% cheaper** than regular input tokens
- Cache writes: Same price as regular input tokens
- Cache reads: 10% of regular input token price

**Example**: A 10,000 token video transcript:
- Without caching: 10,000 tokens × $3/MTok = **$0.03 per request**
- With caching (90% cache hit): 1,000 new tokens + 9,000 cached = **$0.0057 per request**
- **Savings**: 81% reduction

---

## How Caching Works

### Cache Lifecycle

1. **Cache Write** (first request): Claude processes and stores content marked with `cache_control`
2. **Cache Hit** (subsequent 5 minutes): Exact same cached content reused at 10% cost
3. **Cache Miss** (after 5 minutes or content changed): Cache expired, write new cache

**Cache TTL**: 5 minutes of inactivity (extends on each use)

### What to Cache

✅ **DO cache**:
- System prompts (static)
- Video transcripts (semi-static per video)
- Course materials (static per course)
- Tool definitions (static)
- Knowledge base documents (semi-static)

❌ **DON'T cache**:
- User queries (always dynamic)
- Retrieved RAG context (changes per query)
- Conversation history (changes every turn)
- Real-time data

---

## Implementation for LearnWithAvi

### Current Implementation (No Caching)

```typescript
// src/app/api/chat/route.ts - BEFORE

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: `You are an AI tutor for LearnWithAvi...

Video Context:
${videoTranscript}

User Question: ${userQuery}`
    }
  ]
})

// Cost: ~15,000 tokens/request × $3/MTok = $0.045/request
```

### Optimized Implementation (With Caching)

```typescript
// src/app/api/chat/route.ts - AFTER

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        // Cache system prompt (static)
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }
        },
        // Cache video transcript (semi-static per video)
        {
          type: "text",
          text: `Video Context:\n${videoTranscript}`,
          cache_control: { type: "ephemeral" }
        },
        // Dynamic query (not cached)
        {
          type: "text",
          text: `Retrieved Context:\n${ragContext}\n\nUser Question: ${userQuery}`
        }
      ]
    }
  ]
})

// Cost with 90% cache hit:
// - 1,500 new tokens × $3/MTok = $0.0045
// - 13,500 cached tokens × $0.30/MTok = $0.00405
// Total: $0.00855/request (81% savings!)
```

---

## Caching Strategies

### Strategy 1: System Prompt + Video Transcript (Recommended)

**Best for**: Single-video Q&A sessions

```typescript
const buildCachedPrompt = (videoId: string, userQuery: string) => {
  const video = getVideo(videoId)
  const transcript = getTranscript(videoId)

  return [
    // Level 1: System prompt (always cached)
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" }
    },
    // Level 2: Video transcript (cached per video)
    {
      type: "text",
      text: formatTranscript(transcript),
      cache_control: { type: "ephemeral" }
    },
    // Level 3: Dynamic content (not cached)
    {
      type: "text",
      text: `User Question: ${userQuery}`
    }
  ]
}
```

**Cache behavior**:
- First query for a video: Cache write (full cost)
- Subsequent queries within 5 min: Cache hit (10% cost)
- Switch to different video: New cache write
- Return to first video (within 5 min): Cache hit

**Expected savings**: 70-85% for active learning sessions

### Strategy 2: Multi-level Caching

**Best for**: Multi-turn conversations with retrieved context

```typescript
const buildMultiLevelCachedPrompt = (
  videoId: string,
  conversationHistory: Message[],
  retrievedContext: string,
  userQuery: string
) => {
  return [
    // Level 1: System prompt (static, always cached)
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" }
    },
    // Level 2: Video transcript (semi-static per video)
    {
      type: "text",
      text: `Video Transcript:\n${getTranscript(videoId)}`,
      cache_control: { type: "ephemeral" }
    },
    // Level 3: Conversation history (changes per turn, cache strategically)
    {
      type: "text",
      text: formatConversationHistory(conversationHistory),
      cache_control: conversationHistory.length > 3
        ? { type: "ephemeral" }
        : undefined  // Don't cache short conversations
    },
    // Level 4: Retrieved context + query (always dynamic)
    {
      type: "text",
      text: `Retrieved Context:\n${retrievedContext}\n\nUser: ${userQuery}`
    }
  ]
}
```

**When to cache conversation history**:
- ✅ 3+ turn conversations (worth caching)
- ❌ 1-2 turn conversations (overhead not worth it)

### Strategy 3: Cross-Video Course Cache

**Best for**: Course-level context spanning multiple videos

```typescript
const buildCourseCachedPrompt = (
  courseId: string,
  currentVideoId: string,
  userQuery: string
) => {
  const course = getCourse(courseId)
  const courseContext = buildCourseContext(course)  // All video summaries

  return [
    // Level 1: System prompt
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" }
    },
    // Level 2: Course-wide context (cached per course)
    {
      type: "text",
      text: courseContext,
      cache_control: { type: "ephemeral" }
    },
    // Level 3: Current video details
    {
      type: "text",
      text: `Current Video Context:\n${getTranscript(currentVideoId)}`,
      cache_control: { type: "ephemeral" }
    },
    // Level 4: Dynamic query
    {
      type: "text",
      text: `User Question: ${userQuery}`
    }
  ]
}
```

**Use case**: Questions like "How does this relate to the RAG video we watched earlier?"

---

## Monitoring Cache Performance

### Add Usage Tracking

```typescript
// src/lib/analytics/cache-metrics.ts

interface CacheMetrics {
  cacheCreationTokens: number
  cacheReadTokens: number
  inputTokens: number
  outputTokens: number
  cacheHitRate: number
  cost: number
}

export function trackCacheUsage(response: Anthropic.Message): CacheMetrics {
  const usage = response.usage

  const cacheCreationTokens = usage.cache_creation_input_tokens || 0
  const cacheReadTokens = usage.cache_read_input_tokens || 0
  const inputTokens = usage.input_tokens
  const outputTokens = usage.output_tokens

  const cacheHitRate = inputTokens > 0
    ? cacheReadTokens / inputTokens
    : 0

  // Calculate cost (Claude Sonnet 4 pricing)
  const cost = (
    (inputTokens - cacheReadTokens) * 3 / 1_000_000 +  // Regular input
    cacheCreationTokens * 3 / 1_000_000 +              // Cache writes
    cacheReadTokens * 0.30 / 1_000_000 +               // Cache reads
    outputTokens * 15 / 1_000_000                      // Output
  )

  return {
    cacheCreationTokens,
    cacheReadTokens,
    inputTokens,
    outputTokens,
    cacheHitRate,
    cost
  }
}

// Usage in API route
const response = await anthropic.messages.create(...)
const metrics = trackCacheUsage(response)

console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
console.log(`Cost: $${metrics.cost.toFixed(4)}`)

// Log to analytics
await logMetrics('claude_api', metrics)
```

### Dashboard Metrics

Track over time:
- **Cache hit rate**: Target >80% for active sessions
- **Average cost per request**: Should decrease as cache hits increase
- **Cache creation frequency**: New videos/users create new caches
- **Token distribution**: What % is system vs. video vs. query

### Example Dashboard Query

```sql
-- Daily cache performance
SELECT
  DATE(timestamp) as date,
  AVG(cache_hit_rate) as avg_cache_hit_rate,
  AVG(cost) as avg_cost_per_request,
  SUM(cache_read_tokens) as total_cached_tokens,
  COUNT(*) as total_requests
FROM cache_metrics
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC
```

---

## Advanced Optimizations

### Optimization 1: Intelligent Cache Breakpoints

Split large transcripts into chapters, cache only relevant ones:

```typescript
// Instead of caching entire 20-min transcript
const transcript = getFullTranscript(videoId)  // 15,000 tokens

// Cache only relevant chapters based on query
const relevantChapters = getRelevantChapters(videoId, userQuery)  // 5,000 tokens
const chapterContext = formatChapters(relevantChapters)

// 66% reduction in cached content
```

**Trade-off**: Requires chapter-level retrieval, more complex logic

### Optimization 2: Differential Caching

Update only changed parts:

```typescript
// Conversation grows: cache previous turns, add new turn
const previousTurns = conversationHistory.slice(0, -1)
const latestTurn = conversationHistory[conversationHistory.length - 1]

return [
  { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  { type: "text", text: formatHistory(previousTurns), cache_control: { type: "ephemeral" } },
  { type: "text", text: formatTurn(latestTurn) }  // Only new turn uncached
]
```

### Optimization 3: Preemptive Cache Warming

Warm cache before user arrives:

```typescript
// When user starts watching video, preemptively cache transcript
async function warmCacheForVideo(videoId: string) {
  await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1,  // Minimal output
    messages: [{
      role: "user",
      content: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        { type: "text", text: getTranscript(videoId), cache_control: { type: "ephemeral" } },
        { type: "text", text: "Ready" }
      ]
    }]
  })

  // Cache is now warmed for next 5 minutes
}

// Trigger on video page load
useEffect(() => {
  warmCacheForVideo(currentVideoId)
}, [currentVideoId])
```

**Cost**: Small upfront cost for ~1 token output, saves on subsequent queries

---

## Common Pitfalls

### ❌ Pitfall 1: Caching Dynamic Content

```typescript
// BAD: Retrieved context changes every query
{
  type: "text",
  text: `${retrievedContext}\n\nUser: ${userQuery}`,
  cache_control: { type: "ephemeral" }  // ❌ Never hits!
}
```

### ❌ Pitfall 2: Too Many Cache Breakpoints

```typescript
// BAD: 5 cache breakpoints (complex, hard to hit all)
[
  { text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  { text: VIDEO_META, cache_control: { type: "ephemeral" } },
  { text: TRANSCRIPT, cache_control: { type: "ephemeral" } },
  { text: COURSE_INFO, cache_control: { type: "ephemeral" } },
  { text: USER_PROFILE, cache_control: { type: "ephemeral" } },
  { text: QUERY }  // Unlikely all 5 caches hit
]

// GOOD: 2-3 cache breakpoints
[
  { text: SYSTEM_PROMPT + VIDEO_META, cache_control: { type: "ephemeral" } },
  { text: TRANSCRIPT, cache_control: { type: "ephemeral" } },
  { text: QUERY }
]
```

### ❌ Pitfall 3: Not Monitoring Cache Hits

Without monitoring, you won't know if caching is working:

```typescript
// Always log usage stats
const response = await anthropic.messages.create(...)
console.log('Cache stats:', response.usage)  // ✅ Essential!
```

---

## Prompt Caching Checklist

- [ ] System prompt marked with `cache_control`
- [ ] Video transcript marked with `cache_control`
- [ ] Dynamic content (query, RAG context) NOT cached
- [ ] Cache usage metrics logged on every request
- [ ] Cache hit rate monitored (target >80%)
- [ ] Cost per request tracked over time
- [ ] Cache warming implemented for video page loads
- [ ] Conversation history caching for 3+ turns
- [ ] Tested with real user query patterns

---

## Expected Results

After implementing prompt caching for LearnWithAvi:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Cost per request | $0.045 | $0.009 | **80% reduction** |
| Monthly API cost (1000 queries/day) | $1,350 | $270 | **$1,080 saved** |
| Cache hit rate | 0% | 85% | N/A |
| Response latency | 800ms | 750ms | Slightly faster |

---

## Resources

- **Claude Prompt Caching Guide**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- **Pricing Calculator**: https://www.anthropic.com/pricing
- **LearnWithAvi API**: `/src/app/api/chat/route.ts`

---

## Next Steps

1. Implement cache tracking in chat API
2. Add `cache_control` to system prompt and transcripts
3. Monitor cache hit rates for 1 week
4. Analyze cost savings
5. Optimize cache breakpoints based on usage patterns
6. Consider preemptive cache warming for popular videos
