# LearnWithAvi Documentation Style Guide

This comprehensive style guide ensures consistency, clarity, and quality across all documentation for the LearnWithAvi platform.

## Table of Contents

- [General Principles](#general-principles)
- [Writing Style](#writing-style)
- [Formatting Standards](#formatting-standards)
- [Code Examples](#code-examples)
- [Markdown Conventions](#markdown-conventions)
- [API Documentation](#api-documentation)
- [Component Documentation](#component-documentation)
- [Accessibility Documentation](#accessibility-documentation)
- [Common Patterns](#common-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## General Principles

### 1. Clarity Over Cleverness

Write documentation that is immediately understandable. Avoid:
- Clever wordplay or puns
- Ambiguous language
- Overly technical jargon without explanation
- Assumptions about reader knowledge

**Good**:
```markdown
The `useChat` hook manages message state and handles API communication with the Claude AI service.
```

**Bad**:
```markdown
The `useChat` hook is your friendly neighborhood state manager for all things chatty.
```

### 2. Accuracy Is Paramount

- **Always verify**: Test code examples before publishing
- **Keep in sync**: Update docs when code changes
- **Be precise**: Use exact parameter names, types, and values
- **Admit unknowns**: If unsure, note it explicitly

### 3. Progressive Disclosure

Organize information from simple to complex:
1. Brief summary (what it does)
2. Common use cases (how to use it)
3. Detailed parameters (configuration options)
4. Advanced scenarios (edge cases, optimization)
5. Implementation details (for deep dives)

### 4. Respect the Reader's Time

- Start with most important information
- Use scannable formatting (headers, lists, tables)
- Provide working examples early
- Link to related documentation instead of repeating

---

## Writing Style

### Voice and Tone

- **Active voice**: "The function returns..." not "The value is returned by..."
- **Present tense**: "The hook manages..." not "The hook will manage..."
- **Second person**: "You can configure..." not "One can configure..."
- **Professional but approachable**: Technical without being dry

**Examples**:

| ✅ Good | ❌ Bad |
|--------|-------|
| "Pass the `videoId` parameter to filter results" | "The `videoId` parameter should be passed for filtering" |
| "This component renders the chat interface" | "This component will be rendering the chat interface" |
| "Configure the timeout in milliseconds" | "The timeout can be configured using milliseconds" |

### Sentence Structure

- **Keep it concise**: Aim for 15-20 words per sentence
- **One idea per sentence**: Split complex thoughts
- **Vary sentence length**: Mix short and medium-length sentences
- **Use parallel structure**: Maintain consistency in lists

**Good**:
```markdown
The RAG pipeline performs three operations:
- Generates embeddings for the user query
- Searches the vector database for relevant chunks
- Returns ranked results with source attribution
```

**Bad**:
```markdown
The RAG pipeline will generate embeddings for the user's query, and then it searches the vector database to find relevant chunks, returning the ranked results that include source attribution.
```

### Terminology

**Consistent Terms**:
- Use "parameter" for function inputs, not "argument"
- Use "property" for object fields, not "attribute"
- Use "returns" for function outputs, not "gives back"
- Use "user" for humans, "client" for code making requests

**Project-Specific Terms**:
- **RAG** (Retrieval-Augmented Generation) - define on first use
- **Embeddings** - vector representations of text
- **Chunks** - transcript segments for semantic search
- **RTL** (Right-to-Left) - layout for Hebrew text
- **SSE** (Server-Sent Events) - streaming protocol

---

## Formatting Standards

### Headers

Use proper hierarchy:

```markdown
# Document Title (H1 - only one per document)

## Main Section (H2)

### Subsection (H3)

#### Detail Section (H4)

##### Rarely Needed (H5)
```

**Rules**:
- One H1 per document (the title)
- Don't skip levels (H2 → H4 is wrong)
- Use sentence case, not title case: "How to configure embeddings"
- Be descriptive: "API Endpoints" not "Endpoints"

### Lists

**Unordered Lists** (use `-`):
```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

**Ordered Lists** (use `1.`):
```markdown
1. First step
2. Second step
3. Third step
```

**Lists with Details**:
```markdown
- **Term**: Definition or explanation
- **Another Term**: More details here
```

### Tables

Use tables for structured comparison data:

```markdown
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `topK` | number | No | 10 | Results to return |
```

**Table Guidelines**:
- Use header row with `|---|---|`
- Align columns for readability in source
- Use code formatting for parameter names
- Keep cell content concise

### Emphasis

- **Bold** (`**text**`): Important terms, first use of key concepts
- *Italic* (`*text*`): Slight emphasis, technical terms
- `Code` (`` `text` ``): Variable names, code keywords, file paths
- ~~Strikethrough~~ (`~~text~~`): Deprecated features

**Examples**:
```markdown
The **RAG pipeline** uses *semantic search* to find relevant `TranscriptChunk` entries.
```

---

## Code Examples

### General Principles

1. **Complete and runnable**: Don't use `...` or partial code
2. **Self-contained**: Include necessary imports
3. **Follow project conventions**: Use TypeScript, project structure
4. **Test before publishing**: Verify code actually works
5. **Include comments**: Explain non-obvious logic

### Code Block Formatting

Always specify the language:

````markdown
```typescript
const result = await fetch('/api/chat')
```

```json
{
  "success": true
}
```

```bash
npm install
```
````

### TypeScript Examples

**Good Example** (complete, with imports):
```typescript
import { useChat } from '@/hooks/useChat'
import { useState } from 'react'

export function ChatInterface() {
  const { messages, sendMessage, isLoading } = useChat()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (input.trim()) {
      await sendMessage(input)
      setInput('')
    }
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

**Bad Example** (incomplete, no imports):
```typescript
const { messages } = useChat()
// ... rest of component
```

### API Examples

Show complete fetch calls:

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'What is RAG?',
    videoId: 'video-123'
  })
})

if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`)
}

const data = await response.json()
console.log(data.messages)
```

### Inline Code vs Code Blocks

**Inline code** (`` `code` ``) for:
- Function names: `useChat()`
- Variable names: `videoId`
- File paths: `src/lib/rag.ts`
- Short expressions: `const x = 5`

**Code blocks** (` ```lang `) for:
- Multi-line code
- Complete examples
- API requests/responses
- Command sequences

---

## Markdown Conventions

### Links

**Internal Links** (use relative paths):
```markdown
See [API Documentation](./api/README.md)
See [useChat hook](../hooks/useChat.md)
```

**External Links**:
```markdown
See [Next.js Documentation](https://nextjs.org/docs)
```

**Code References** (in VSCode):
```markdown
See [VideoPlayer.tsx](src/components/video/VideoPlayer.tsx)
See [rag.ts:42](src/lib/rag.ts#L42)
```

### Escaping

Escape special markdown characters when needed:

```markdown
Use \* for asterisks
Use \_ for underscores
Use \` for backticks
```

### Line Breaks

- One blank line between paragraphs
- Two blank lines before major sections
- No trailing spaces at end of lines

---

## API Documentation

### Endpoint Documentation Structure

```markdown
# POST /api/endpoint

Brief description.

## Overview
Detailed explanation.

## Endpoint Details
- Method, Path, Auth, Rate Limit

## Request
- Headers, Query Params, Body

## Response
- Success (with example JSON)
- Errors (with all status codes)

## Examples
- Working TypeScript examples

## Related
- Links to related endpoints
```

### Request Documentation

```markdown
### Body Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `message` | string | Yes | 1-1000 chars | User message |
| `videoId` | string | No | UUID format | Filter by video |
```

### Response Documentation

Show both success and error cases:

```markdown
### Success (200)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error (400)
```json
{
  "error": "Invalid input",
  "code": "VALIDATION_ERROR",
  "details": [...]
}
```
```

---

## Component Documentation

### TSDoc Format

Use comprehensive TSDoc comments:

```typescript
/**
 * VideoPlayer - Interactive YouTube video player
 *
 * Displays video with synchronized chapter markers and
 * transcript highlighting. Supports RTL layout for Hebrew.
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   videoUrl="https://youtube.com/watch?v=..."
 *   chapters={chapters}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.videoUrl - YouTube video URL
 * @param props.chapters - Chapter markers array
 * @returns Rendered video player
 */
```

### Props Documentation

Document interface with JSDoc:

```typescript
interface VideoPlayerProps {
  /** YouTube video URL to display */
  videoUrl: string

  /**
   * Chapter markers with timestamps
   * @example [{ id: '1', title: 'Intro', timestamp: 0 }]
   */
  chapters: Chapter[]

  /**
   * Callback when chapter changes
   * @param chapterId - ID of new active chapter
   */
  onChapterChange?: (chapterId: string) => void
}
```

---

## Accessibility Documentation

Document accessibility features for all UI components:

```markdown
## Accessibility

- **Keyboard Navigation**: Tab to focus, Enter to activate, Escape to close
- **Screen Reader**: Announces "Chat message from AI assistant" with ARIA labels
- **Focus Management**: Traps focus in modal, restores on close
- **Color Contrast**: Meets WCAG 2.1 AA standards (4.5:1 ratio)
- **ARIA Attributes**:
  - `role="region"`
  - `aria-label="Chat interface"`
  - `aria-live="polite"` for dynamic content
```

---

## Common Patterns

### Documenting Async Functions

```typescript
/**
 * fetchChatResponse - Sends message to AI and streams response
 *
 * @param message - User message
 * @returns Promise resolving to AI response
 * @throws {Error} When API request fails
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchChatResponse('Hello')
 *   console.log(response)
 * } catch (error) {
 *   console.error('Failed:', error)
 * }
 * ```
 */
async function fetchChatResponse(message: string): Promise<string> {
  // Implementation
}
```

### Documenting Error Handling

```markdown
## Error Handling

The function throws errors in these cases:

| Error Type | When | Example |
|------------|------|---------|
| `TypeError` | Invalid parameter type | `searchQuery` is not a string |
| `RangeError` | Value out of range | `topK` exceeds 100 |
| `NetworkError` | API request fails | Service unavailable |

**Error Handling Example**:
```typescript
try {
  const results = await search(query)
} catch (error) {
  if (error instanceof RangeError) {
    console.error('Invalid range')
  }
}
```
```

### Documenting Options/Config Objects

```typescript
interface SearchOptions {
  /**
   * Number of results to return
   * @default 10
   * @minimum 1
   * @maximum 100
   */
  topK?: number

  /**
   * Balance between vector and keyword search
   * @default 0.7
   * @range 0.0 to 1.0 (0 = keyword only, 1 = vector only)
   */
  alpha?: number
}
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Use Future Tense

```markdown
Bad: "The function will return the result"
Good: "The function returns the result"
```

### ❌ Don't: Use Passive Voice

```markdown
Bad: "The data is processed by the function"
Good: "The function processes the data"
```

### ❌ Don't: Include Incomplete Code

```markdown
Bad:
```typescript
const result = doSomething()
// ... more code here
```

Good:
```typescript
const result = doSomething()
console.log(result.value)
```
```

### ❌ Don't: Assume Context

```markdown
Bad: "It returns the value"
Good: "The `search` function returns the value"
```

### ❌ Don't: Use Vague Language

```markdown
Bad: "This might cause issues sometimes"
Good: "This throws a RangeError when topK exceeds 100"
```

### ❌ Don't: Forget Error Cases

```markdown
Bad: Only document the success case
Good: Document success + all error cases with status codes
```

### ❌ Don't: Use Jargon Without Definition

```markdown
Bad: "Uses RAG with hybrid search"
Good: "Uses RAG (Retrieval-Augmented Generation) with hybrid search combining vector and keyword matching"
```

---

## Checklist for Every Document

Before publishing, verify:

- [ ] Tested all code examples
- [ ] Checked all links work
- [ ] Used consistent terminology
- [ ] Added table of contents (if > 500 lines)
- [ ] Specified language for all code blocks
- [ ] Documented all parameters
- [ ] Included error cases
- [ ] Used active voice and present tense
- [ ] Followed markdown formatting standards
- [ ] Proofread for typos and grammar

---

## Version History

- **v1.0** (2024-01-16): Initial style guide
