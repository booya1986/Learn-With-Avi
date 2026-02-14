# Figma MCP Quick Start

## 🚀 3-Step Setup

### 1. Install Figma MCP Server
```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

### 2. Authenticate
1. Type `/mcp` in Claude Code
2. Select **figma**
3. Choose **Authenticate**
4. Grant access in browser

### 3. Start Using
Copy any Figma frame link and prompt Claude:
```
Convert this to a React component:
https://www.figma.com/file/ABC/Design?node-id=123:456
```

---

## 💡 Common Use Cases

### Generate Component from Design
```
"Implement this button component from Figma:
[paste link]

Use TypeScript, Tailwind CSS, and match our existing Button component structure."
```

### Build Page Layout
```
"Create a Next.js page from this Figma design:
[paste link]

Make it responsive and support Hebrew RTL."
```

### Extract Design Tokens
```
"What colors, fonts, and spacing are used in this design?
[paste link]"
```

---

## 📚 Full Documentation

See [docs/configuration/FIGMA_MCP_SETUP.md](docs/configuration/FIGMA_MCP_SETUP.md) for complete guide.

---

## ✅ Verify Connection

```bash
# Check MCP status
/mcp

# Should show:
# ✓ figma (connected)
```

---

## 🔧 Troubleshooting

**Not connected?**
- Re-run install command
- Re-authenticate with `/mcp` → figma → Authenticate

**Can't access file?**
- Verify you have Figma file access
- Check link includes `?node-id=`

**Need help?**
- Type `/help mcp` in Claude Code
- See full setup guide: [docs/configuration/FIGMA_MCP_SETUP.md](docs/configuration/FIGMA_MCP_SETUP.md)
