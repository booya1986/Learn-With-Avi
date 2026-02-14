# Multi-Agent System Setup Guide

## ⚠️ Important: Current Claude Code Limitations

**Status**: Claude Code (as of January 2026) does not have **built-in multi-agent orchestration** functionality in the same way that some AI agent frameworks do.

However, we can achieve similar results using:
1. **Claude Code Skills** - Specialized prompts that guide Claude's behavior
2. **Task Tool** - Spawn sub-agents for specific tasks
3. **Manual Orchestration** - You explicitly invoke different skills/agents

---

## 🎯 What We've Built

### 1. Multi-Agent Architecture Documentation
- [MULTI_AGENT_ARCHITECTURE.md](MULTI_AGENT_ARCHITECTURE.md) - Complete architecture design
- [agents/config.json](agents/config.json) - Agent configuration and delegation rules
- [agents/orchestrator/ORCHESTRATOR.md](agents/orchestrator/ORCHESTRATOR.md) - Orchestrator guide

### 2. Specialized Skills (Already Created!)
- ✅ [skills/frontend-engineer/SKILL.md](skills/frontend-engineer/SKILL.md)
- ✅ [skills/backend-engineer/SKILL.md](skills/backend-engineer/SKILL.md)
- ✅ [skills/rag-pipeline-optimizer/SKILL.md](skills/rag-pipeline-optimizer/SKILL.md)
- ✅ [skills/ui-ux-designer/SKILL.md](skills/ui-ux-designer/SKILL.md)
- ✅ [skills/devops-engineer/SKILL.md](skills/devops-engineer/SKILL.md)
- ✅ [skills/qa-engineer/SKILL.md](skills/qa-engineer/SKILL.md)
- ✅ [skills/product-manager/SKILL.md](skills/product-manager/SKILL.md)

---

## 🚀 How to Use Multi-Agent System

### Method 1: Use Claude Code Skills (Recommended)

Claude Code has a **Skill system** that allows you to create specialized prompts. Each skill is like a specialized agent.

#### Invoking Skills

In Claude Code, you can invoke skills using the `/` command:

```
You: /frontend-engineer "Add a dark mode toggle to the navigation"

Claude will load the frontend-engineer skill and execute with that context.
```

#### Available Skills

| Skill Command | Purpose | When to Use |
|---------------|---------|-------------|
| `/frontend-engineer` | React/Next.js development | UI components, styling, client-side logic |
| `/backend-engineer` | API and database work | Endpoints, database schemas, integrations |
| `/rag-pipeline-optimizer` | RAG optimization | Search quality, embeddings, vector DB |
| `/ui-ux-designer` | Design and accessibility | UI/UX reviews, accessibility audits |
| `/devops-engineer` | Deployment and infra | CI/CD, deployment, monitoring |
| `/qa-engineer` | Testing and quality | Writing tests, bug verification |
| `/product-manager` | Planning and requirements | PRDs, user stories, prioritization |

### Method 2: Use Task Tool for Sub-Agents

Claude Code has a **Task tool** that can spawn specialized agents:

```typescript
// Example: Spawn a frontend engineer agent
You: "I need help optimizing the video player performance.
     Use the Task tool with subagent_type='frontend-engineer'"

Claude will:
1. Spawn a specialized frontend engineer agent
2. Agent will analyze and optimize the video player
3. Report back results
```

**Available subagent_types**:
- `general-purpose` - General tasks
- `Bash` - Command execution
- `Explore` - Code exploration
- `Plan` - Implementation planning

### Method 3: Manual Orchestration (What You'll Do)

Since automatic orchestration isn't built-in, you'll act as the orchestrator:

**Simple Example:**
```
You: "Add a progress bar to the video player"

Your Orchestration:
1. First, invoke UI/UX Designer for design:
   "/ui-ux-designer review the video player and design a progress bar"

2. Then, invoke Frontend Engineer for implementation:
   "/frontend-engineer implement the progress bar designed above"

3. Finally, invoke QA Engineer for testing:
   "/qa-engineer test the new progress bar component"
```

**Complex Example:**
```
You: "Implement voice input feature for chat"

Your Orchestration:
1. Planning:
   "/product-manager define requirements for voice input feature"

2. Backend (parallel with frontend):
   "/backend-engineer implement Whisper API endpoint for voice transcription"

3. Frontend (parallel with backend):
   "/frontend-engineer create voice recording UI component"

4. Integration:
   "Integrate the backend API with the frontend component"

5. Testing:
   "/qa-engineer test voice input end-to-end"
```

---

## 🛠️ Configuration Files

### What's Already Configured

1. **Skills Directory Structure**
   ```
   skills/
   ├── frontend-engineer/SKILL.md
   ├── backend-engineer/SKILL.md
   ├── rag-pipeline-optimizer/SKILL.md
   ├── ui-ux-designer/SKILL.md
   ├── devops-engineer/SKILL.md
   ├── qa-engineer/SKILL.md
   └── product-manager/SKILL.md
   ```

2. **Agent Configuration**
   - [agents/config.json](agents/config.json) - Defines all agents and delegation rules
   - [agents/orchestrator/ORCHESTRATOR.md](agents/orchestrator/ORCHESTRATOR.md) - Orchestrator behavior

3. **Documentation**
   - [MULTI_AGENT_ARCHITECTURE.md](MULTI_AGENT_ARCHITECTURE.md) - Complete architecture
   - [QUICK_START_MULTI_AGENT.md](QUICK_START_MULTI_AGENT.md) - User guide

### How Claude Code Loads Skills

Claude Code automatically detects skills in the `skills/` directory if they follow this structure:

```
skills/
└── skill-name/
    └── SKILL.md      # Skill definition and prompts
```

Each `SKILL.md` file contains:
- Role description
- Expertise areas
- Methodologies
- Tools and commands
- Examples and best practices

---

## 📖 Practical Usage Examples

### Example 1: Fix a Bug

**Without Multi-Agent:**
```
You: "The chat input doesn't clear after sending"
Claude: [Fixes the bug directly]
```

**With Multi-Agent:**
```
You: "/frontend-engineer Fix: The chat input doesn't clear after sending"
Claude (as Frontend Engineer):
- Reads ChatPanel.tsx
- Identifies missing state reset
- Fixes the issue
- Tests the fix
✓ Done!
```

### Example 2: Add New Feature

**With Multi-Agent Orchestration:**
```
Step 1: Planning
You: "/product-manager Define requirements for user progress tracking"
→ Gets: PRD, user stories, acceptance criteria

Step 2: Backend
You: "/backend-engineer Based on the PRD above, create the database schema and API endpoints"
→ Gets: Prisma schema, API routes

Step 3: Frontend
You: "/frontend-engineer Based on the API above, build the progress tracking UI"
→ Gets: React components

Step 4: Testing
You: "/qa-engineer Test the progress tracking feature end-to-end"
→ Gets: Tests and verification
```

### Example 3: Performance Optimization

**Parallel Investigation:**
```
You: "The app is slow. I need performance analysis from multiple angles."

Approach 1 (Sequential):
1. "/frontend-engineer Analyze frontend performance"
2. "/backend-engineer Analyze backend performance"
3. "/rag-pipeline-optimizer Analyze RAG performance"
4. Synthesize findings and prioritize fixes

Approach 2 (Parallel - Manual):
Open 3 separate conversations:
- Conversation 1: "/frontend-engineer Analyze frontend performance"
- Conversation 2: "/backend-engineer Analyze backend performance"
- Conversation 3: "/rag-pipeline-optimizer Analyze RAG performance"
Then consolidate findings yourself
```

---

## 🎓 Best Practices

### 1. Always Start with the Right Agent

Match the task to the agent's expertise:

| Task Type | Agent to Invoke |
|-----------|-----------------|
| UI bug, component styling | `/frontend-engineer` |
| API endpoint, database | `/backend-engineer` |
| Search quality, embeddings | `/rag-pipeline-optimizer` |
| Design review, accessibility | `/ui-ux-designer` |
| Deployment, CI/CD | `/devops-engineer` |
| Testing, QA | `/qa-engineer` |
| Requirements, planning | `/product-manager` |

### 2. Provide Context

Always give the agent context:

❌ **Bad:**
```
You: "/frontend-engineer Add a button"
```

✅ **Good:**
```
You: "/frontend-engineer Add a 'Share Course' button to the course header that copies the course URL to clipboard"
```

### 3. Chain Agents for Complex Tasks

For multi-step tasks, chain agents:

```
You: "/product-manager Define requirements for quiz feature"
[Review output]

You: "/backend-engineer Based on the requirements above, create the quiz API"
[Review output]

You: "/frontend-engineer Based on the API above, build the quiz UI"
[Review output]

You: "/qa-engineer Test the complete quiz flow"
```

### 4. Use the Task Tool for Exploration

When you need deep analysis:

```
You: "Use the Task tool with subagent_type='Explore' to understand how the RAG pipeline works"
```

### 5. Document Decisions

When agents provide multiple options, document your choice:

```
Agent: "Here are 3 approaches: A, B, C"
You: "Let's go with approach B because [reason]. Implement it."
```

---

## 🔧 Advanced Configuration

### Customizing Agent Behavior

Edit the skill files to customize behavior:

1. Open [skills/frontend-engineer/SKILL.md](skills/frontend-engineer/SKILL.md)
2. Modify the prompts, examples, or methodologies
3. Save the file
4. The changes take effect immediately on next invocation

### Adding New Agents

To add a new specialized agent:

1. Create directory: `skills/new-agent-name/`
2. Create file: `skills/new-agent-name/SKILL.md`
3. Define the agent's role, expertise, and prompts
4. Invoke with: `/new-agent-name "task description"`

**Example: Creating a "Security Engineer" agent**

```bash
mkdir -p skills/security-engineer
```

Create `skills/security-engineer/SKILL.md`:
```markdown
# Security Engineer - Claude Code Skill

## Role
Security specialist focusing on vulnerability detection, secure coding practices, and penetration testing.

## Expertise
- OWASP Top 10 vulnerabilities
- Authentication and authorization
- API security
- XSS, SQL injection, CSRF prevention
- Security audits and reviews

## When to Invoke
Use this skill when:
- Reviewing code for security vulnerabilities
- Implementing authentication/authorization
- Auditing API endpoints for security issues
- Adding input validation and sanitization

## Methodology
1. Identify potential attack vectors
2. Review code for vulnerabilities
3. Recommend security improvements
4. Implement secure alternatives
5. Verify fixes with security tests

## Tools & Commands
- Bash: For running security scanners
- Read: For reviewing code
- Grep: For finding security patterns
- Edit/Write: For implementing fixes
```

Then invoke:
```
You: "/security-engineer Audit the authentication system for vulnerabilities"
```

---

## 📊 Monitoring Agent Performance

Since orchestration is manual, track your own metrics:

### Task Completion Checklist

For each task, verify:
- [ ] Correct agent(s) invoked
- [ ] All subtasks completed
- [ ] Code quality standards met
- [ ] Tests written and passing
- [ ] Documentation updated

### Agent Usage Tracking

Keep a log of which agents you use for different tasks to learn patterns:

```
Task: Add progress tracking
Agents Used:
1. Product Manager (requirements) - 10 min
2. Backend Engineer (API) - 20 min
3. Frontend Engineer (UI) - 15 min
4. QA Engineer (testing) - 10 min
Total: 55 min
Result: Success ✓
```

---

## 🆘 Troubleshooting

### Skill Not Found

**Error:** "Skill 'frontend-engineer' not found"

**Solution:**
1. Check that `skills/frontend-engineer/SKILL.md` exists
2. Restart Claude Code to reload skills
3. Use `/` command to see available skills

### Agent Gives Generic Response

**Problem:** Agent doesn't follow the skill's specialized behavior

**Solution:**
1. Be more explicit: "Using the frontend-engineer skill, [task]"
2. Reference the skill directly: "As a frontend engineer, [task]"
3. Check that the SKILL.md file has clear role definitions

### Conflicting Agent Outputs

**Problem:** Two agents give different recommendations

**Solution:**
1. Review both recommendations
2. Ask for clarification: "Compare approach A vs B"
3. Consult Product Manager agent for prioritization
4. Make a decision and document it

---

## 🎯 Summary

### What You Have

✅ **Complete Multi-Agent Architecture**
- Documentation and design
- Agent configuration
- Skill definitions
- Usage guides

### What You Can Do Now

1. **Use Skills Directly**
   ```
   /frontend-engineer "task"
   /backend-engineer "task"
   /rag-pipeline-optimizer "task"
   ```

2. **Manual Orchestration**
   - Invoke agents sequentially for dependent tasks
   - Invoke agents in parallel (multiple conversations) for independent tasks

3. **Customize Agents**
   - Edit `skills/*/SKILL.md` files
   - Add new agents as needed

### What You Need to Do (Manual Orchestration)

Since Claude Code doesn't have automatic orchestration, you'll:
1. Analyze the task yourself
2. Decide which agent(s) to invoke
3. Invoke agents in the right order
4. Coordinate handoffs between agents
5. Verify completion

**Think of it as:** You are the Project Manager AI orchestrator, and you manually delegate tasks to specialized AI agents (skills).

---

## 📚 Quick Reference

### Agent Invocation Cheatsheet

| Task | Command |
|------|---------|
| UI work | `/frontend-engineer [task]` |
| API work | `/backend-engineer [task]` |
| RAG optimization | `/rag-pipeline-optimizer [task]` |
| Design review | `/ui-ux-designer [task]` |
| Deployment | `/devops-engineer [task]` |
| Testing | `/qa-engineer [task]` |
| Planning | `/product-manager [task]` |

### Common Workflows

**Bug Fix:**
```
/[relevant-agent] "Fix: [description]"
```

**New Feature:**
```
1. /product-manager "Define: [feature]"
2. /backend-engineer "Implement API: [feature]"
3. /frontend-engineer "Implement UI: [feature]"
4. /qa-engineer "Test: [feature]"
```

**Optimization:**
```
1. /[agent] "Analyze: [system]"
2. /[agent] "Optimize: [specific issue]"
3. /qa-engineer "Verify: [improvement]"
```

---

## 🚀 Next Steps

1. **Try a Simple Task**
   ```
   /frontend-engineer "Add a tooltip to the video play button"
   ```

2. **Try a Complex Task**
   ```
   /product-manager "Define requirements for a quiz feature"
   [Review output, then...]
   /backend-engineer "Based on the requirements above, design the database schema"
   ```

3. **Customize an Agent**
   - Edit `skills/frontend-engineer/SKILL.md`
   - Add project-specific conventions or patterns

4. **Create a New Agent**
   - Copy an existing skill as a template
   - Customize for your specific needs

---

## 💡 Future Improvements

As Claude Code evolves, we may get:
- ✨ Automatic agent orchestration
- ✨ Agent-to-agent communication
- ✨ Parallel task execution
- ✨ Built-in progress tracking
- ✨ Agent performance metrics

Until then, manual orchestration with skills is the way to go!

---

**Remember:** The multi-agent system is designed and ready. You just need to manually orchestrate by invoking the right skills at the right time. Think of yourself as the conductor, and the skills as your orchestra of specialized experts!
