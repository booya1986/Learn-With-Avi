---
name: technical-writer
description: Teaches Claude how to write technical documentation following LearnWithAvi standards. Provides templates, style guides, and best practices for API documentation, component documentation, and developer guides.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Technical Writing Skill

This skill teaches Claude how to create high-quality technical documentation for the LearnWithAvi platform, following industry best practices and project-specific standards.

## Core Documentation Types

### 1. API Endpoint Documentation

Document all API routes in `/src/app/api/` with:
- Endpoint purpose and overview
- Request parameters (query, body, headers)
- Response formats (success and error cases)
- Authentication requirements
- Rate limiting information
- Working code examples

**Template**: See `assets/templates/api-endpoint.template.md`

### 2. React Component Documentation

Document all components in `/src/components/` with TSDoc:
- Component purpose and usage
- Props interface with descriptions
- Usage examples
- Related components
- Accessibility considerations (WCAG 2.1 AA)
- RTL (Hebrew) support notes if applicable

**Template**: See `assets/templates/component.template.tsx`

### 3. Custom Hook Documentation

Document all hooks in `/src/hooks/` with TSDoc:
- Hook purpose and when to use it
- Parameters and return values
- State management details
- Side effects
- Usage examples
- Related hooks

**Template**: See `assets/templates/hook.template.tsx`

### 4. Utility Function Documentation

Document all utilities in `/src/lib/` with JSDoc:
- Function purpose
- Parameters with types
- Return values
- Error conditions
- Usage examples
- Performance considerations

**Template**: See `assets/templates/utility.template.ts`

## LearnWithAvi Documentation Standards

### Writing Style

1. **Clarity First**
   - Use simple, direct language
   - Avoid jargon unless necessary and explained
   - Write in active voice
   - Use present tense

2. **Audience Awareness**
   - Write for intermediate to advanced developers
   - Provide context for complex concepts
   - Link to external resources for background information
   - Include examples for all levels

3. **Accuracy**
   - Always verify code examples work
   - Ensure parameters match implementation
   - Keep docs in sync with code changes
   - Test all links and references

### Code Example Standards

```typescript
// Good: Complete, runnable example with context
import { useChat } from '@/hooks/useChat'

function ChatComponent() {
  const { messages, sendMessage, isLoading } = useChat()

  return (
    <div>
      {messages.map(msg => <p key={msg.id}>{msg.content}</p>)}
      <button onClick={() => sendMessage('Hello')}>
        Send
      </button>
    </div>
  )
}
```

```typescript
// Bad: Incomplete snippet without context
const { messages } = useChat()
```

### Markdown Formatting

- **Headers**: Use proper hierarchy (# for title, ## for sections, ### for subsections)
- **Code Blocks**: Always specify language (```typescript, ```json, ```bash)
- **Links**: Use relative paths for internal docs (`[README](./README.md)`)
- **Tables**: Use for structured data and API parameters
- **Lists**: Use `-` for unordered, `1.` for ordered
- **Emphasis**: Use `**bold**` for important terms, `*italic*` for emphasis

## TSDoc/JSDoc Conventions

### For React Components

```typescript
/**
 * VideoPlayer - Interactive video player with chapter navigation
 *
 * Displays video content with synchronized chapter markers and
 * transcript highlighting. Supports Hebrew RTL layout.
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   videoUrl="https://youtube.com/watch?v=..."
 *   chapters={videoChapters}
 *   onChapterChange={handleChapterChange}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.videoUrl - YouTube video URL
 * @param props.chapters - Array of chapter objects with timestamps
 * @param props.onChapterChange - Callback when chapter changes
 * @returns Rendered video player component
 */
export default function VideoPlayer({ videoUrl, chapters, onChapterChange }: VideoPlayerProps) {
  // Implementation
}
```

### For Custom Hooks

```typescript
/**
 * useChat - Manages chat state and message handling
 *
 * Provides real-time chat functionality with message history,
 * loading states, and error handling. Integrates with Claude API.
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isLoading, error } = useChat()
 *
 * await sendMessage('What is RAG?')
 * ```
 *
 * @returns Chat state and actions
 * @returns messages - Array of chat messages
 * @returns sendMessage - Function to send a new message
 * @returns isLoading - Loading state boolean
 * @returns error - Error object if request failed
 *
 * @throws {Error} When API request fails
 */
export function useChat() {
  // Implementation
}
```

### For Utility Functions

```typescript
/**
 * hybridSearch - Performs vector + keyword search on transcripts
 *
 * Combines semantic vector search with BM25 keyword matching
 * for improved retrieval accuracy. Optimized for Hebrew text.
 *
 * @param query - Search query string
 * @param options - Search configuration options
 * @param options.topK - Number of results to return (default: 10)
 * @param options.alpha - Vector/keyword balance (default: 0.7)
 * @param options.videoId - Optional video ID filter
 * @returns Promise resolving to search results
 *
 * @example
 * ```typescript
 * const results = await hybridSearch('מה זה embeddings?', {
 *   topK: 5,
 *   alpha: 0.8
 * })
 * ```
 */
export async function hybridSearch(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  // Implementation
}
```

## Documentation Workflow

### 1. Research Phase

```bash
# Find all components
npm run glob "src/components/**/*.tsx"

# Search for API usage patterns
npm run grep "fetch\('/api/" --type ts

# Read existing documentation
cat docs/ARCHITECTURE.md
```

### 2. Analysis Phase

- Understand the code's purpose and functionality
- Identify dependencies and relationships
- Review existing documentation (if any)
- Note edge cases and error handling

### 3. Writing Phase

- Start with overview and purpose
- Document parameters and return values
- Provide complete working examples
- Add notes for edge cases
- Link to related documentation

### 4. Verification Phase

```bash
# Test TypeScript examples compile
npx tsc --noEmit path/to/example.tsx

# Run example code if possible
npm run dev # and test manually

# Check markdown rendering
npx markdownlint docs/**/*.md
```

## Project-Specific Considerations

### LearnWithAvi Architecture

1. **Next.js App Router** (`src/app/`)
   - Document Server Components vs Client Components
   - Note RSC (React Server Components) usage
   - Explain route handlers in `api/` folder

2. **RAG Pipeline** (`src/lib/rag.ts`)
   - Document vector search logic
   - Explain embedding generation
   - Note prompt caching strategy
   - Include Hebrew language considerations

3. **Multi-Agent System** (`.claude/agents/`, `skills/`)
   - Document agent responsibilities
   - Explain delegation patterns
   - Note coordination workflows

4. **RTL Support** (Right-to-Left for Hebrew)
   - Note RTL layout considerations
   - Document Tailwind RTL classes used
   - Explain bidirectional text handling

5. **Accessibility** (WCAG 2.1 AA)
   - Document ARIA attributes
   - Note keyboard navigation support
   - Explain screen reader compatibility

## Quality Checklist

Before finalizing documentation:

- [ ] All code examples are tested and working
- [ ] TypeScript types are accurate
- [ ] Parameters match actual implementation
- [ ] Return types are documented
- [ ] Common use cases are covered
- [ ] Edge cases are explained
- [ ] Error handling is documented
- [ ] Prerequisites are listed
- [ ] Links are valid and use relative paths
- [ ] Markdown renders correctly
- [ ] No jargon without explanation
- [ ] Active voice and clear language used
- [ ] Examples follow project conventions (TypeScript, RTL, accessibility)

## Reference Documentation

For detailed style guides and standards, see:

- **Style Guide**: `references/STYLE_GUIDE.md` - Comprehensive writing guidelines
- **TSDoc Standards**: `references/TSDOC_STANDARDS.md` - TSDoc/JSDoc patterns and examples

## Common Documentation Patterns

### API Response Documentation

```markdown
## Response

### Success (200)

```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "role": "assistant",
      "content": "The answer is...",
      "sources": [...]
    }
  ]
}
```

### Errors

| Status | Code | Description | Solution |
|--------|------|-------------|----------|
| 400 | INVALID_INPUT | Missing required field | Provide all required fields |
| 401 | UNAUTHORIZED | Invalid auth token | Check authentication |
| 429 | RATE_LIMIT | Too many requests | Wait and retry |
| 500 | INTERNAL_ERROR | Server error | Contact support |
```

### Component Props Documentation

```typescript
interface VideoPlayerProps {
  /** YouTube video URL to display */
  videoUrl: string

  /**
   * Array of chapter markers with timestamps
   * @example [{ id: '1', title: 'Intro', timestamp: 0 }]
   */
  chapters: Chapter[]

  /**
   * Callback invoked when active chapter changes
   * @param chapterId - ID of the new active chapter
   */
  onChapterChange?: (chapterId: string) => void

  /**
   * Enable Hebrew RTL layout
   * @default false
   */
  isRTL?: boolean
}
```

## Tools and Scripts

The `scripts/` folder contains documentation automation tools:

- **audit-docs.ts** - Scan codebase for undocumented code
- **generate-component-docs.ts** - Auto-generate component prop documentation
- **validate-api-docs.ts** - Validate API documentation completeness
- **check-coverage.ts** - Report documentation coverage metrics

Run scripts with:

```bash
npx tsx skills/technical-writer/scripts/audit-docs.ts
```

## Best Practices Summary

1. **Always research before writing** - Read the code thoroughly
2. **Test all examples** - Every code snippet must work
3. **Be accurate** - Documentation must match implementation
4. **Be concise** - Clarity over verbosity
5. **Be helpful** - Think about what developers need
6. **Link proactively** - Connect related documentation
7. **Update regularly** - Keep docs in sync with code
8. **Review thoroughly** - Use the quality checklist

## Integration with Development Workflow

Documentation should be:

- **Created** when new features are implemented
- **Updated** when code changes
- **Reviewed** alongside code reviews
- **Tested** with example code validation
- **Maintained** as part of the project lifecycle

Good documentation is code that explains code. Make it clear, make it accurate, make it useful.
