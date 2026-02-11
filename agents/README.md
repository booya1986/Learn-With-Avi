# Multi-Agent System for LearnWithAvi

## Overview

This directory contains the configuration and documentation for the LearnWithAvi multi-agent system. The system consists of an orchestrator agent (Project Manager AI) that delegates tasks to specialized sub-agents based on task type and complexity.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT MANAGER AI                      │
│                   (Orchestrator Agent)                      │
│                                                             │
│  • Analyzes user requests                                  │
│  • Breaks down into subtasks                               │
│  • Delegates to specialized agents                         │
│  • Coordinates dependencies                                │
│  • Tracks progress                                         │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ FRONTEND         │ │ BACKEND          │ │ RAG PIPELINE     │
│ ENGINEER         │ │ ENGINEER         │ │ SPECIALIST       │
│                  │ │                  │ │                  │
│ • React/Next.js  │ │ • APIs           │ │ • Vector Search  │
│ • TypeScript     │ │ • Database       │ │ • Embeddings     │
│ • UI Components  │ │ • Auth           │ │ • Prompt Cache   │
│ • Responsive     │ │ • Security       │ │ • Hybrid Search  │
└──────────────────┘ └──────────────────┘ └──────────────────┘

           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ PRODUCT          │ │ UI/UX            │ │ DEVOPS           │
│ MANAGER          │ │ DESIGNER         │ │ ENGINEER         │
│                  │ │                  │ │                  │
│ • Requirements   │ │ • User Flows     │ │ • CI/CD          │
│ • Prioritization │ │ • Accessibility  │ │ • Monitoring     │
│ • Roadmapping    │ │ • RTL Design     │ │ • Deployment     │
│ • User Stories   │ │ • Design System  │ │ • Infrastructure │
└──────────────────┘ └──────────────────┘ └──────────────────┘

                         ▼
              ┌──────────────────┐
              │ QA ENGINEER      │
              │                  │
              │ • Test Automation│
              │ • Quality Gates  │
              │ • Bug Verification│
              │ • E2E Testing    │
              └──────────────────┘
```

## Files

### Configuration
- **[config.json](config.json)** - Main configuration file with all agent definitions, delegation rules, and coordination patterns

### Orchestrator
- **[orchestrator/ORCHESTRATOR.md](orchestrator/ORCHESTRATOR.md)** - Detailed orchestrator agent documentation with decision frameworks, delegation matrix, and example workflows

### Skills (Sub-Agents)
All skill definitions are located in the `/skills` directory:

- **[/skills/frontend-engineer/SKILL.md](../skills/frontend-engineer/SKILL.md)** - Frontend Engineer agent (React, Next.js, TypeScript, Tailwind CSS)
- **[/skills/backend-engineer/SKILL.md](../skills/backend-engineer/SKILL.md)** - Backend Engineer agent (Next.js API Routes, PostgreSQL, Prisma)
- **[/skills/rag-pipeline-optimizer/SKILL.md](../skills/rag-pipeline-optimizer/SKILL.md)** - RAG Pipeline Specialist (ChromaDB, embeddings, hybrid search)
- **[/skills/product-manager/SKILL.md](../skills/product-manager/SKILL.md)** - Product Manager agent (requirements, roadmapping, OKRs)
- **[/skills/ui-ux-designer/SKILL.md](../skills/ui-ux-designer/SKILL.md)** - UI/UX Designer agent (accessibility, responsive design, RTL)
- **[/skills/devops-engineer/SKILL.md](../skills/devops-engineer/SKILL.md)** - DevOps Engineer agent (CI/CD, monitoring, infrastructure)
- **[/skills/qa-engineer/SKILL.md](../skills/qa-engineer/SKILL.md)** - QA Engineer agent (testing, quality assurance, automation)

## Quick Start

### For Users (Requesting Work)

**Simple Request** (Single Agent):
```
User: "Fix the chat input styling on mobile"

System: Analyzes request → Delegates to Frontend Engineer
Result: CSS fixes applied to chat input component
```

**Complex Request** (Multiple Agents):
```
User: "Add user authentication with progress tracking"

System: Analyzes request → Creates task breakdown:
1. Product Manager: Define requirements
2. Backend Engineer: Implement auth + database
3. Frontend Engineer: Build auth UI + progress display
4. QA Engineer: Test authentication flow

Result: Complete feature implemented with tests
```

### Request Patterns

**Bug Fix**:
```
"Fix [bug description]"
→ Appropriate engineer (Frontend/Backend) + QA verification
```

**New Feature**:
```
"Add [feature description]"
→ Product Manager (requirements) → Engineers → QA → DevOps (deploy)
```

**Optimization**:
```
"Improve [performance/quality aspect]"
→ Relevant specialist (Frontend/Backend/RAG/DevOps)
```

**Planning**:
```
"What should we build next?" or "Help me plan [feature]"
→ Product Manager (strategy, prioritization)
```

**Design**:
```
"Design [UI/UX aspect]" or "Improve accessibility of [feature]"
→ UI/UX Designer
```

**Infrastructure**:
```
"Set up [CI/CD/monitoring/deployment]"
→ DevOps Engineer
```

**Testing**:
```
"Add tests for [feature]" or "Test [functionality]"
→ QA Engineer
```

## Agent Capabilities

### High Priority Agents (Always Active)

#### 1. Frontend Engineer
**When to use**: UI components, styling, responsive design, client-side logic
**Technologies**: React 19, Next.js 16, TypeScript, Tailwind CSS
**Typical tasks**:
- Build/refactor React components
- Fix layout and responsive issues
- Optimize rendering performance
- Implement accessibility features

#### 2. Backend Engineer
**When to use**: APIs, database, authentication, server logic
**Technologies**: Next.js API Routes, PostgreSQL, Prisma, Server-Sent Events
**Typical tasks**:
- Create/modify API endpoints
- Design database schemas
- Implement authentication
- Optimize API performance

#### 3. RAG Pipeline Specialist
**When to use**: AI search quality, embeddings, context retrieval
**Technologies**: ChromaDB, OpenAI Embeddings, Claude AI
**Typical tasks**:
- Improve search relevance
- Optimize embedding generation
- Implement hybrid search
- Reduce AI costs through caching

### Medium Priority Agents (Available as Needed)

#### 4. Product Manager
**When to use**: Requirements, prioritization, planning, strategy
**Methodologies**: RICE, MoSCoW, OKRs, User Stories
**Typical tasks**:
- Define feature requirements
- Prioritize backlog
- Create product roadmap
- Write user stories

#### 5. UI/UX Designer
**When to use**: Design, accessibility, user experience
**Standards**: WCAG 2.1, Responsive Design, RTL Support
**Typical tasks**:
- Design UI components
- Conduct accessibility audits
- Create user flows
- Design responsive layouts

### Lower Priority Agents (Specific Phases)

#### 6. DevOps Engineer
**When to use**: Deployment, CI/CD, monitoring, infrastructure
**Technologies**: Vercel, GitHub Actions, Docker, Sentry
**Typical tasks**:
- Set up CI/CD pipelines
- Configure monitoring
- Optimize deployment
- Manage infrastructure

#### 7. QA Engineer
**When to use**: Testing, quality assurance, bug verification
**Technologies**: Vitest, Playwright, Testing Library
**Typical tasks**:
- Write automated tests
- Perform cross-browser testing
- Verify bug fixes
- Conduct accessibility testing

## Delegation Rules

The orchestrator uses keywords and context to determine which agent(s) to invoke:

| Keywords | Agent | Example |
|----------|-------|---------|
| component, UI, styling, responsive | Frontend Engineer | "Fix the mobile menu styling" |
| API, database, auth, server | Backend Engineer | "Add user registration endpoint" |
| RAG, embeddings, search, ChromaDB | RAG Specialist | "Improve search relevance" |
| requirements, roadmap, prioritize | Product Manager | "What should we build next?" |
| design, UX, accessibility, flow | UI/UX Designer | "Design the onboarding flow" |
| deploy, CI/CD, monitoring | DevOps Engineer | "Set up staging environment" |
| test, QA, bug, quality | QA Engineer | "Add tests for chat feature" |

## Coordination Patterns

### Sequential Execution
**When**: Tasks have dependencies (one must complete before another starts)

**Example**: New feature implementation
```
1. Product Manager: Define requirements
   ↓
2. UI/UX Designer: Create mockups
   ↓
3. Backend Engineer: Build API
   ↓
4. Frontend Engineer: Build UI
   ↓
5. QA Engineer: Test feature
   ↓
6. DevOps Engineer: Deploy to production
```

### Parallel Execution
**When**: Tasks are independent (can run simultaneously)

**Example**: Bug fixes
```
Frontend Engineer: Fix mobile menu bug
∥ (simultaneously)
Backend Engineer: Optimize API response time
∥
RAG Specialist: Improve search caching
```

### Parallel Then Coordinate
**When**: Multiple perspectives needed, then combine findings

**Example**: Performance investigation
```
1. Frontend + Backend + DevOps: Investigate in parallel
2. Coordinate: Share findings, identify root cause
3. Appropriate agent: Implement fix
```

## Usage Examples

### Example 1: Simple Bug Fix

**User Request**: "The chat input doesn't clear after sending a message"

**Orchestrator Decision**:
- Complexity: Simple
- Agent: Frontend Engineer
- Pattern: Single agent

**Execution**:
```
1. Read ChatPanel.tsx component
2. Identify issue: missing state reset
3. Fix: Add setState('') after message send
4. Verify: Test manually
5. Report: "Fixed. Input now clears after submission."
```

### Example 2: New Feature (Multi-Agent)

**User Request**: "Add voice input for the chat"

**Orchestrator Decision**:
- Complexity: Complex (multiple systems)
- Agents: Product Manager → Backend → Frontend → QA
- Pattern: Sequential

**Execution**:
```
1. Product Manager:
   - Define requirements (Hebrew support, 60s max, error handling)
   - Write user stories
   - Define success metrics

2. Backend Engineer:
   - Implement /api/voice/transcribe endpoint
   - Integrate Whisper API
   - Add rate limiting

3. Frontend Engineer:
   - Build voice recording UI
   - Implement Web Audio API
   - Connect to backend API
   - Add error states

4. QA Engineer:
   - Test voice input flow
   - Verify Hebrew transcription
   - Test error scenarios
   - Cross-browser testing

Result: Complete feature with tests and documentation
```

### Example 3: Performance Optimization

**User Request**: "The app is slow, investigate and fix"

**Orchestrator Decision**:
- Complexity: Complex (unclear root cause)
- Agents: Frontend + Backend + DevOps
- Pattern: Parallel then coordinate

**Execution**:
```
1. Parallel Investigation:
   - Frontend Engineer: Check rendering, bundle size
   - Backend Engineer: Check API latency, database queries
   - DevOps Engineer: Check infrastructure, network

2. Coordination:
   - Frontend: "Rendering is fine, waiting on API"
   - Backend: "API queries taking 800ms on average"
   - DevOps: "Infrastructure is healthy"
   - Conclusion: Database queries are the bottleneck

3. Sequential Fix:
   - Backend Engineer: Add database indexes, optimize queries
   - DevOps Engineer: Monitor improvements
   - QA Engineer: Verify performance gains

Result: API latency reduced from 800ms to 150ms
```

## Configuration Details

### Agent Priority Levels

**High Priority** (P0):
- Frontend Engineer
- Backend Engineer
- RAG Pipeline Specialist

**Medium Priority** (P1):
- Product Manager
- UI/UX Designer

**Low Priority** (P2):
- DevOps Engineer
- QA Engineer

### Model Assignments

- **Orchestrator**: claude-sonnet-4-5 (needs reasoning power)
- **Engineers**: claude-sonnet-4-5 (technical complexity)
- **Product Manager**: claude-sonnet-4-5 (strategic thinking)
- **UI/UX Designer**: claude-sonnet-4-5 (design expertise)
- **DevOps Engineer**: claude-sonnet-4-5 (infrastructure complexity)
- **QA Engineer**: claude-haiku (cost-effective for testing tasks)

### Escalation Policy

**User Clarification Needed**:
- Use AskUserQuestion tool
- Provide context and options
- Wait for user response

**Agent Blocked**:
- Identify blocker
- Coordinate with blocking agent
- Resolve dependency

**Out of Scope**:
- Explain why it's out of scope
- Suggest alternatives
- Document decision

**Conflicting Requirements**:
- Escalate to Product Manager
- Present options with trade-offs
- User makes final decision

## Best Practices

### For Orchestrator

✅ **Do**:
- Always create todos for non-trivial tasks
- Break complex tasks into smaller subtasks
- Delegate to most specialized agent
- Coordinate between dependent tasks
- Update user regularly
- Verify task completion

❌ **Don't**:
- Skip creating todos
- Guess without verification
- Delegate to wrong agent
- Start new tasks before completing current ones
- Leave user uninformed
- Mark tasks complete prematurely

### For Sub-Agents

✅ **Do**:
- Read relevant files before making changes
- Follow project conventions
- Write clear, maintainable code
- Test your changes
- Document complex logic
- Handle errors gracefully

❌ **Don't**:
- Make assumptions about code structure
- Introduce breaking changes without discussion
- Skip error handling
- Ignore TypeScript errors
- Over-engineer solutions
- Forget about edge cases

## Monitoring & Metrics

### Success Metrics

**Task Completion**:
- % of tasks completed successfully
- Average time to completion
- User satisfaction rating

**Code Quality**:
- TypeScript strict compliance
- Test coverage
- Accessibility compliance (WCAG 2.1 AA)
- Performance metrics (Core Web Vitals)

**Agent Effectiveness**:
- Correct agent selection rate
- Rework required (%)
- Dependency coordination success

## Troubleshooting

### Issue: Wrong agent selected

**Solution**: Review [config.json](config.json) delegation rules and update keywords if needed

### Issue: Task blocked on dependency

**Solution**: Orchestrator should identify dependency and coordinate between agents

### Issue: Agent doesn't have needed information

**Solution**: Orchestrator should provide full context when delegating

### Issue: Quality issues in deliverables

**Solution**: Review agent skill definition, update quality checklist

## Future Enhancements

### Planned Improvements

1. **Learning from history**: Agents learn from past similar tasks
2. **Automatic agent creation**: Generate new specialized agents as needed
3. **Cross-project knowledge**: Share learnings across projects
4. **Predictive task breakdown**: AI suggests task structure before execution
5. **Real-time collaboration**: Multiple agents work simultaneously with conflict resolution

## Contributing

When adding new agents or modifying existing ones:

1. Update [config.json](config.json) with agent definition
2. Create skill file in `/skills/[agent-name]/SKILL.md`
3. Document agent capabilities and typical tasks
4. Add delegation rules and keywords
5. Test agent with sample requests
6. Update this README

## Support

For questions or issues with the multi-agent system:
1. Review relevant agent skill file
2. Check [orchestrator documentation](orchestrator/ORCHESTRATOR.md)
3. Consult [config.json](config.json) for delegation rules
4. Create an issue in the project repository

---

**Version**: 1.0.0
**Last Updated**: 2026-01-16
**Maintained By**: LearnWithAvi Team
