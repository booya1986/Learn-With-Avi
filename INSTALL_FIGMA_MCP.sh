#!/bin/bash

# Figma MCP Installation Script for LearnWithAvi
# This script installs and configures the Figma MCP server for Claude Code

set -e  # Exit on error

echo "🎨 Figma MCP Installation for LearnWithAvi"
echo "=========================================="
echo ""

# Check if claude command is available
if ! command -v claude &> /dev/null; then
    echo "❌ Error: Claude Code CLI not found"
    echo "Please install Claude Code first: https://claude.com/claude-code"
    exit 1
fi

echo "✅ Claude Code CLI found"
echo ""

# Install Figma MCP server
echo "📦 Installing Figma MCP server..."
claude mcp add --transport http figma https://mcp.figma.com/mcp

if [ $? -eq 0 ]; then
    echo "✅ Figma MCP server installed successfully"
else
    echo "❌ Failed to install Figma MCP server"
    exit 1
fi

echo ""
echo "✨ Installation Complete!"
echo ""
echo "Next Steps:"
echo "1. Type '/mcp' in Claude Code"
echo "2. Select 'figma' from the list"
echo "3. Choose 'Authenticate'"
echo "4. Grant access in the browser window"
echo "5. Start using Figma MCP!"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: .figma-mcp-quickstart.md"
echo "  - Full Setup: docs/configuration/FIGMA_MCP_SETUP.md"
echo "  - Workflows: docs/guides/FIGMA_TO_CODE_WORKFLOW.md"
echo "  - Summary: docs/configuration/FIGMA_MCP_SUMMARY.md"
echo ""
echo "🎯 Example Usage:"
echo '  "Convert this button to React: https://www.figma.com/file/ABC?node-id=42:100"'
echo ""
echo "Happy designing! 🚀"
