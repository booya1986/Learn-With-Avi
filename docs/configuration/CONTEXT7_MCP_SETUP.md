# Context7 MCP Setup Guide

## Overview

Context7 is an MCP (Model Context Protocol) server that provides up-to-date, version-specific documentation for libraries and frameworks directly in Claude Code. Instead of relying on training data, Context7 dynamically fetches current documentation from official sources.

## Why Context7 is Critical for LearnWithAvi

This project uses cutting-edge technologies that evolve rapidly:

- **React 19** - Major concurrent features update (December 2024)
- **Next.js 16** - Significant App Router changes (January 2026)
- **Anthropic Claude API** - Frequent updates to streaming, caching, tool use
- **OpenAI API** - Regular updates to embeddings and models
- **Prisma** - Continuous syntax and feature evolution
- **Tailwind CSS 4** - Major version with new utilities

**Without Context7**, you might implement deprecated patterns or miss new features. **With Context7**, you get current, accurate documentation for every task.

---

## Installation

### Method 1: Remote Server with OAuth (Recommended)

**Easiest setup - no API key needed:**

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp/oauth
```

**Authenticate:**
1. Type `/mcp` in Claude Code
2. Select **context7**
3. Click **Authenticate**
4. Browser opens → grant access
5. Tokens stored securely and refresh automatically

### Method 2: Remote Server with API Key

**Get an API key** from [context7.com](https://context7.com), then:

```bash
claude mcp add --header "CONTEXT7_API_KEY: YOUR_API_KEY" --transport http context7 https://mcp.context7.com/mcp
```

Replace `YOUR_API_KEY` with your actual API key.

### Method 3: Local Server (Advanced)

**Requires Node.js 18+:**

```bash
# With API key in command
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY

# Or set environment variable
export CONTEXT7_API_KEY=YOUR_API_KEY
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

---

## Verification

**Check connection status:**

```bash
# In Claude Code
/mcp

# Or in terminal
claude mcp list
```

You should see `context7` listed as connected.

---

## Usage

### Basic Usage in Prompts

Add "use context7" to your prompts to fetch documentation:

```
use context7 to show me how to implement Server Actions in Next.js 16
```

```
use context7 for React 19 useOptimistic hook examples
```

```
use context7 for Prisma query syntax with relations
```

### Manual Documentation Queries

Use the `/context7:docs` command:

```
/context7:docs <library> [query]
```

**Examples:**
```
/context7:docs react hooks
/context7:docs /vercel/next.js app router
/context7:docs prisma relations
/context7:docs tailwind responsive design
```

### Using Library IDs

If you know the exact library ID, use it directly to skip resolution:

```
/context7:docs /vercel/next.js server components
/context7:docs /prisma/prisma schema
/context7:docs /tailwindlabs/tailwindcss utilities
```

---

## Use Cases for LearnWithAvi

### Frontend Development

```
use context7 for Next.js 16 Server Components best practices
use context7 for React 19 concurrent features
use context7 for Tailwind CSS 4 RTL support
use context7 for Radix UI Dialog accessibility
use context7 for Next.js streaming SSR
```

### Backend Development

```
use context7 for Next.js 16 API Routes with streaming
use context7 for Prisma schema many-to-many relationships
use context7 for Anthropic Claude API prompt caching
use context7 for OpenAI embeddings API parameters
use context7 for Next.js middleware authentication
```

### RAG Pipeline Optimization

```
use context7 for ChromaDB collection management
use context7 for OpenAI text-embedding-3-small
use context7 for Anthropic Claude streaming responses
use context7 for vector similarity search optimization
```

### Testing & QA

```
use context7 for Vitest React component testing
use context7 for Playwright E2E testing patterns
use context7 for Testing Library best practices
use context7 for axe-core accessibility testing
```

### DevOps & Deployment

```
use context7 for Vercel deployment configuration
use context7 for Docker multi-stage builds for Next.js
use context7 for GitHub Actions CI/CD
use context7 for Next.js production optimization
```

---

## Best Practices

### 1. Use Context7 Liberally

**Don't hesitate** to query Context7. It's better to verify with current documentation than implement outdated patterns.

### 2. Query Before Implementation

Check Context7 **BEFORE** writing code for any unfamiliar pattern or API.

```
❌ Bad: Write code → encounter errors → debug
✅ Good: Query Context7 → understand current API → write correct code
```

### 3. Version-Specific Queries

Always specify versions when relevant:

```
use context7 for Next.js 16 App Router patterns
use context7 for React 19 Server Components
use context7 for Prisma 5 query syntax
```

### 4. Combine with Project Knowledge

1. **Query Context7** for library-specific documentation
2. **Read existing code** to understand project patterns
3. **Adapt Context7 examples** to match project conventions

### 5. Use for Verification

When reviewing pull requests or code:

```
use context7 to verify this Prisma query syntax is current
use context7 to check if this Next.js pattern is recommended
```

---

## Integration with Sub-Agents

All sub-agents in this project are configured to use Context7 MCP:

### Frontend Engineer
- Uses Context7 for React, Next.js, Tailwind, Radix UI documentation
- Verifies current patterns before implementing components

### Backend Engineer
- Uses Context7 for Next.js API Routes, Prisma, external API integration
- Checks current security and authentication patterns

### RAG Specialist
- Uses Context7 for ChromaDB, OpenAI, Anthropic API documentation
- Optimizes based on current best practices

### DevOps Engineer
- Uses Context7 for deployment, CI/CD, infrastructure documentation

### QA Engineer
- Uses Context7 for testing framework documentation
- Implements current testing patterns

### Technical Writer
- Uses Context7 to ensure documentation accuracy
- Verifies API signatures and examples

### UI/UX Designer
- Uses Context7 for accessibility standards and design system patterns

### Product Manager
- Uses Context7 to understand technical capabilities for feature planning

---

## Recent MCP Tool Search Update (January 2026)

Anthropic released **MCP Tool Search** on January 14, 2026, which:

- Dynamically loads tools into context as needed
- Reduces context pollution from MCP servers with 50+ tools
- Makes Context7 more efficient with Claude Code
- Allows selective tool loading based on query

This makes Context7 even more valuable for accessing documentation without consuming excessive context.

---

## Managing Context7 MCP

```bash
# List all MCP servers
claude mcp list

# Remove Context7
claude mcp remove context7

# Re-add Context7
claude mcp add --transport http context7 https://mcp.context7.com/mcp/oauth

# View server details in Claude Code
/mcp
```

---

## Troubleshooting

### "Server not responding"
- Check internet connection
- Verify Context7 service status at [context7.com](https://context7.com)

### "Authentication failed"
1. Type `/mcp`
2. Select **context7** → **Re-authenticate**
3. Grant permissions again in browser

### "No results found"
- Try different query phrasing
- Use library ID directly: `/context7:docs /vercel/next.js [query]`
- Check library name spelling

### Rate Limiting
- Free tier may have request limits
- Consider upgrading for unlimited access
- Use local server for more control

---

## Common Library IDs for LearnWithAvi

```
/vercel/next.js          # Next.js framework
/facebook/react          # React library
/prisma/prisma          # Prisma ORM
/tailwindlabs/tailwindcss # Tailwind CSS
/radix-ui/primitives     # Radix UI components
/anthropics/anthropic-sdk # Anthropic SDK
/openai/openai-node      # OpenAI Node SDK
/chromadb/chromadb       # ChromaDB
/vitest-dev/vitest       # Vitest testing
/playwright              # Playwright E2E
```

---

## Comparison: Context7 vs Training Data

| Scenario | Training Data | Context7 |
|----------|---------------|----------|
| **Next.js 16 features** | May use Next.js 13 patterns | Current Next.js 16 docs |
| **React 19 hooks** | Uses React 18 syntax | Latest React 19 APIs |
| **Anthropic API** | Outdated parameters | Current API signature |
| **Prisma syntax** | Old query format | Latest Prisma 5 syntax |
| **Security patterns** | May be deprecated | Current best practices |
| **Cost optimization** | Misses prompt caching | Shows latest caching features |

**Result**: Context7 prevents technical debt and reduces debugging time.

---

## Integration Workflow Example

**Task**: Implement Next.js 16 Server Action for course enrollment

```
1. Query Context7:
   use context7 for Next.js 16 Server Actions with Prisma

2. Review Context7 response:
   - Current Server Action syntax
   - Revalidation patterns
   - Error handling

3. Read existing code:
   - Check similar actions in project
   - Review database schema

4. Implement:
   - Use Context7 patterns
   - Adapt to project structure
   - Add project-specific error handling

5. Test:
   - Verify against Context7 examples
   - Test edge cases
```

**Benefits:**
- ✅ Used current Next.js 16 syntax
- ✅ Avoided deprecated patterns
- ✅ Implemented recommended security practices
- ✅ Reduced debugging time

---

## Resources

### Official Documentation
- [Context7 Official Site](https://context7.com)
- [Context7 GitHub](https://github.com/upstash/context7)
- [Context7 Claude Code Setup](https://context7.com/docs/clients/claude-code)

### MCP Resources
- [MCP Servers Directory - LobeHub](https://lobehub.com/mcp/upstash-context7)
- [ClaudeLog - Context7 Guide](https://claudelog.com/claude-code-mcps/context7-mcp/)
- [MCPcat - Adding MCP Servers Guide](https://mcpcat.io/guides/adding-an-mcp-server-to-claude-code/)

### Tutorials
- [Context7 Tutorial - DEV Community](https://dev.to/mehmetakar/context7-mcp-tutorial-3he2)
- [How to Install Context7 - Apidog](https://apidog.com/blog/context7-mcp-server/)

---

## Quick Reference Commands

```bash
# Setup
claude mcp add --transport http context7 https://mcp.context7.com/mcp/oauth

# Verify
/mcp
claude mcp list

# Usage in prompts
use context7 for [library] [topic]

# Manual queries
/context7:docs [library] [query]
/context7:docs /vercel/next.js [topic]

# Management
claude mcp remove context7
claude mcp list
```

---

## Next Steps

1. ✅ Install Context7 MCP (see Installation section)
2. ✅ Authenticate with Context7 (see Method 1)
3. ✅ Verify connection (`/mcp` or `claude mcp list`)
4. 🚀 Start using Context7 in your development workflow!
5. 📚 Share knowledge with your team about Context7 benefits

---

**Last Updated**: January 2026
**Status**: Recommended for all LearnWithAvi developers
**Integration**: All sub-agents configured to use Context7

For questions or issues, check the [Context7 documentation](https://context7.com/docs) or ask in the team chat.
