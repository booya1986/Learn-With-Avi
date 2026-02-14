# Figma MCP Server Setup Guide

## Overview

The Model Context Protocol (MCP) allows Claude Code to connect directly to Figma, enabling AI-powered design-to-code workflows. This guide explains how to set up the Figma MCP server for the LearnWithAvi project.

## What is Figma MCP?

Figma's MCP server provides tools that enable LLMs to:
- Convert Figma frames into code
- Access design variables, components, and layout data
- Pull content from FigJam diagrams
- Integrate design systems into development workflows

## Prerequisites

- **Figma Account**: Active account with access to your designs
- **Claude Code**: Already installed and configured
- **Access Level**:
  - Remote server: Available on all Figma plans
  - Desktop server: Requires Dev or Full seat on paid plans

## Installation Methods

Figma offers two MCP server options:

### 1. Remote Server (Recommended)
Hosted by Figma at `https://mcp.figma.com/mcp` - works with browser-based Figma.

### 2. Desktop Server
Runs locally at `http://127.0.0.1:3845/mcp` - requires Figma Desktop app.

---

## Setup Instructions for Claude Code

### Step 1: Add Figma MCP Server

Run this command in your terminal:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

This registers the Figma remote server with Claude Code.

### Step 2: Authenticate with Figma

1. In Claude Code, type `/mcp`
2. Select **figma** from the list
3. Choose **Authenticate**
4. A browser window will open - grant access when prompted
5. Return to Claude Code

### Step 3: Verify Connection

1. Type `/mcp` again in Claude Code
2. You should see **figma** listed as connected
3. The server is now ready to use

---

## Usage

### Basic Workflow

1. **Copy Figma Link**: In Figma, right-click on a frame or component → Copy link
2. **Prompt Claude Code**: Paste the link and ask Claude to implement the design

Example:
```
Convert this Figma frame to a React component:
https://www.figma.com/file/ABC123/Design?node-id=123:456
```

### What Claude Can Do

- **Generate Code**: Convert frames to React/TypeScript components
- **Extract Design Tokens**: Pull colors, typography, spacing from Figma variables
- **Understand Layout**: Analyze flex/grid layouts and responsive behavior
- **Access Components**: Reference your design system components
- **Read Content**: Extract text, images, and structured data

### Example Commands

**Convert a button component:**
```
Generate a button component from this Figma frame:
https://www.figma.com/file/ABC/Design?node-id=42:100

Use Tailwind CSS and match the exact spacing and colors.
```

**Build a page layout:**
```
Implement this landing page design as a Next.js component:
https://www.figma.com/file/ABC/Design?node-id=1:1

Make it responsive and use our existing design system tokens.
```

**Extract design tokens:**
```
What colors and typography styles are used in this design?
https://www.figma.com/file/ABC/Design?node-id=5:20
```

---

## Integration with LearnWithAvi

### Use Cases for This Project

1. **Course UI Components**
   - Convert Figma course card designs to React components
   - Implement video player UI from design specs
   - Build chat panel layouts

2. **Admin Panel**
   - Generate admin dashboard components from Figma
   - Create form layouts for course/video management
   - Implement data table designs

3. **Design System**
   - Extract Figma variables as Tailwind config
   - Sync component library with Figma designs
   - Maintain consistency between design and code

4. **Responsive Layouts**
   - Convert mobile/tablet/desktop frames to responsive components
   - Implement RTL (Hebrew) layouts from Figma

### Example Workflow

```bash
# 1. Designer creates course card in Figma
# 2. Share Figma link with Claude Code

# 3. Generate component
claude code "Create a CourseCard component from this design:
https://www.figma.com/file/XYZ/LearnWithAvi?node-id=10:50

Requirements:
- TypeScript + React
- Tailwind CSS
- Support Hebrew RTL
- Match existing component structure in src/components/CourseCard.tsx"

# 4. Claude will:
#    - Fetch design data from Figma via MCP
#    - Generate code matching your project structure
#    - Apply existing patterns and conventions
#    - Ensure RTL compatibility
```

---

## Advanced Configuration

### Desktop Server Setup (Optional)

If you prefer using the local desktop server:

1. **Enable in Figma Desktop**:
   - Open Figma Desktop app
   - Enter Dev Mode
   - Open Inspect panel
   - Enable "MCP Server"

2. **Add to Claude Code**:
```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

3. **Use Desktop Server**:
   - Type `/mcp` in Claude
   - Select **figma-desktop**
   - Authenticate as before

### Switching Between Servers

You can have both remote and desktop servers configured. Use `/mcp` to select which one to use for each session.

---

## Troubleshooting

### "Server not responding"
- **Remote**: Check internet connection and Figma status
- **Desktop**: Ensure Figma Desktop app is running and MCP is enabled

### "Authentication failed"
1. Type `/mcp`
2. Select figma → **Re-authenticate**
3. Grant permissions again in browser

### "Cannot access file"
- Verify you have access to the Figma file
- Check that the link is a valid Figma URL
- Ensure the node-id exists in the file

### "Tool call limit reached" (Starter plan)
- Upgrade to a paid Figma plan for unlimited calls
- Or use desktop server (requires Dev/Full seat)

---

## Best Practices

### 1. Use Specific Frames
Point Claude to specific frames/components, not entire pages:
```
✅ Good: https://www.figma.com/file/ABC/Design?node-id=42:100
❌ Avoid: https://www.figma.com/file/ABC/Design (entire file)
```

### 2. Provide Context
Give Claude information about your project structure:
```
"Convert this design to match our existing component patterns in src/components/.
Use Tailwind CSS classes and TypeScript types from src/types/."
```

### 3. Specify Constraints
Be explicit about requirements:
- Framework (React, Next.js)
- Styling approach (Tailwind, CSS-in-JS)
- Accessibility needs (WCAG AA, RTL)
- Responsive breakpoints

### 4. Iterate
Start with basic implementation, then refine:
```
1. "Generate basic component from this frame"
2. "Add hover states and animations"
3. "Make it responsive for mobile"
4. "Add Hebrew RTL support"
```

### 5. Maintain Design-Code Sync
- Update components when Figma designs change
- Use Figma variables for design tokens
- Keep component names consistent with Figma layers

---

## MCP Tools Available

The Figma MCP server provides these tools to Claude:

- `get_node_data` - Fetch design data for a specific node
- `get_variables` - Access design variables (colors, typography, etc.)
- `get_components` - List components from a file
- `get_styles` - Access text/color/effect styles
- `search_files` - Find Figma files by name

Claude automatically uses these tools when you provide Figma links.

---

## Security & Privacy

- **Authentication**: OAuth-based, scoped to files you have access to
- **Data Access**: Claude can only read designs you have permission to view
- **No Storage**: Design data is not stored by MCP, only queried in real-time
- **Revoke Access**: Manage connected apps in Figma account settings

---

## Resources

### Official Documentation
- [Figma MCP Server Guide](https://help.figma.com/hc/en-us/articles/32132100833559)
- [Developer Documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Remote Server Installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Desktop Server Installation](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/)

### MCP Specification
- [Model Context Protocol](https://www.figma.com/resource-library/what-is-mcp/)
- [MCP Introduction Blog Post](https://www.figma.com/blog/introducing-figma-mcp-server/)

### Claude Code MCP Docs
- Run `/help mcp` in Claude Code
- [Anthropic MCP Documentation](https://www.anthropic.com/mcp)

---

## Next Steps

1. ✅ Install Figma MCP server (see Step 1 above)
2. ✅ Authenticate with Figma account (see Step 2)
3. ✅ Verify connection (see Step 3)
4. 🎨 Share Figma designs with your team
5. 🚀 Start converting designs to code!

---

## Questions?

- Check `/mcp` in Claude Code to see connection status
- Review Figma MCP server logs in Claude Code output
- Consult [Figma Help Center](https://help.figma.com/) for design-side issues
- Ask Claude Code directly: "How do I use the Figma MCP server?"

---

**Last Updated**: January 2026
**Status**: Remote MCP server recommended for all users
**Compatibility**: Works with Claude Code, VS Code, Cursor, Windsurf
