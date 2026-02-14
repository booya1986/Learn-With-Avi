#!/bin/bash

###############################################################################
# Documentation Cleanup Script
#
# Removes redirect files and organizes documentation management files
#
# Usage:
#   ./scripts/cleanup-docs.sh --dry-run   # Preview changes
#   ./scripts/cleanup-docs.sh --execute   # Execute cleanup
#   ./scripts/cleanup-docs.sh --rollback  # Undo cleanup
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="$ROOT_DIR/.docs-cleanup-backup-$(date +%Y%m%d-%H%M%S)"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

###############################################################################
# Redirect Files to Delete
###############################################################################

REDIRECT_FILES=(
    "ADMIN_API_DOCUMENTATION.md"
    "ADMIN_API_REFERENCE.md"
    "ADMIN_API_SUMMARY.md"
    "ADMIN_PANEL_COMPLETE.md"
    "AGENT_CONFIGURATION_COMPLETE.md"
    "API_QUICK_REFERENCE.md"
    "DATABASE_SETUP.md"
    "FINAL_SETUP_STEPS.md"
    "FINAL_SUB_AGENTS_SUMMARY.md"
    "LearnWithAvi-PRD-Complete-History.md"
    "LearnWithAvi-PRD.md"
    "MULTI_AGENT_ARCHITECTURE.md"
    "MULTI_AGENT_IMPLEMENTATION_SUMMARY.md"
    "MULTI_AGENT_SETUP_GUIDE.md"
    "QUICKSTART_CHECKLIST.md"
    "QUICK_START_MULTI_AGENT.md"
    "SETUP_COMPLETE.md"
    "SKILLS_SUMMARY.md"
    "SUB_AGENTS_CONFIGURED.md"
)

###############################################################################
# Files to Move
###############################################################################

# Using parallel arrays instead of associative array for compatibility
FILES_TO_MOVE_SRC=(
    "DOCS_QUICK_REFERENCE.md"
    "DOCUMENTATION_MANAGEMENT_SUMMARY.md"
    "MIGRATION_COMPLETE.md"
    "CLEANUP_PLAN.md"
)

FILES_TO_MOVE_DST=(
    "docs/DOCS_QUICK_REFERENCE.md"
    "docs/DOCUMENTATION_MANAGEMENT_SUMMARY.md"
    "docs/MIGRATION_COMPLETE.md"
    "docs/CLEANUP_PLAN.md"
)

###############################################################################
# Main Functions
###############################################################################

delete_redirect_files() {
    local dry_run="$1"

    log_info "Deleting redirect files..."

    local count=0
    for file in "${REDIRECT_FILES[@]}"; do
        if [ -f "$file" ]; then
            if [ "$dry_run" = "true" ]; then
                echo "   DELETE: $file"
            else
                rm "$file"
                log_success "Deleted: $file"
            fi
            ((count++))
        else
            if [ "$dry_run" = "false" ]; then
                log_warning "Not found: $file"
            fi
        fi
    done

    if [ "$dry_run" = "true" ]; then
        log_info "Would delete $count redirect files"
    else
        log_success "Deleted $count redirect files"
    fi
}

move_doc_management_files() {
    local dry_run="$1"

    log_info "Moving documentation management files..."

    local count=0
    local len=${#FILES_TO_MOVE_SRC[@]}

    for ((i=0; i<$len; i++)); do
        local source="${FILES_TO_MOVE_SRC[$i]}"
        local target="${FILES_TO_MOVE_DST[$i]}"

        if [ -f "$source" ]; then
            if [ "$dry_run" = "true" ]; then
                echo "   MOVE: $source → $target"
            else
                mv "$source" "$target"
                log_success "Moved: $source → $target"
            fi
            ((count++))
        else
            if [ "$dry_run" = "false" ]; then
                log_warning "Not found: $source"
            fi
        fi
    done

    if [ "$dry_run" = "true" ]; then
        log_info "Would move $count files"
    else
        log_success "Moved $count files"
    fi
}

update_readme_links() {
    local dry_run="$1"

    log_info "Updating README.md links..."

    if [ ! -f "README.md" ]; then
        log_warning "README.md not found"
        return
    fi

    if [ "$dry_run" = "true" ]; then
        echo "   UPDATE: README.md (update links to moved files)"
        return
    fi

    # Update links to moved files
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|MIGRATION_COMPLETE.md|docs/MIGRATION_COMPLETE.md|g' README.md
        sed -i '' 's|DOCS_QUICK_REFERENCE.md|docs/DOCS_QUICK_REFERENCE.md|g' README.md
    else
        # Linux
        sed -i 's|MIGRATION_COMPLETE.md|docs/MIGRATION_COMPLETE.md|g' README.md
        sed -i 's|DOCS_QUICK_REFERENCE.md|docs/DOCS_QUICK_REFERENCE.md|g' README.md
    fi

    log_success "Updated README.md links"
}

show_final_state() {
    log_info "Final root directory state:"
    echo ""
    ls -lh *.md 2>/dev/null | awk '{print "   " $9, "(" $5 ")"}'
    echo ""

    local count=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')
    log_success "Root directory now has $count MD files"
}

create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"

    # Backup root MD files
    find . -maxdepth 1 -name "*.md" -exec cp {} "$BACKUP_DIR/" \; 2>/dev/null || true

    # Backup docs directory
    if [ -d "docs" ]; then
        cp -r docs "$BACKUP_DIR/"
    fi

    log_success "Backup created at: $BACKUP_DIR"
}

run_cleanup() {
    local dry_run="$1"

    if [ "$dry_run" = "true" ]; then
        log_warning "DRY RUN MODE - No files will be modified"
        echo ""
    else
        create_backup
    fi

    delete_redirect_files "$dry_run"
    echo ""

    move_doc_management_files "$dry_run"
    echo ""

    update_readme_links "$dry_run"
    echo ""

    if [ "$dry_run" = "false" ]; then
        show_final_state
        echo ""
        log_success "Cleanup completed successfully!"
        log_info "Backup created at: $BACKUP_DIR"
    else
        echo ""
        log_info "Dry run completed. Run with --execute to perform cleanup."
    fi
}

rollback_cleanup() {
    local latest_backup=$(ls -td .docs-cleanup-backup-* 2>/dev/null | head -1)

    if [ -z "$latest_backup" ]; then
        log_error "No cleanup backup found"
        exit 1
    fi

    log_warning "Rolling back cleanup from: $latest_backup"

    # Restore files
    cp -r "$latest_backup"/* . 2>/dev/null || true

    log_success "Rollback completed"
}

###############################################################################
# Additional Cleanup Functions
###############################################################################

clean_old_redirects_in_docs() {
    local dry_run="$1"

    log_info "Checking for redirect files in docs/..."

    # Find small files that might be redirects
    local redirect_files=$(find docs -name "*.md" -size -500c -type f 2>/dev/null)

    if [ -z "$redirect_files" ]; then
        log_success "No redirect files found in docs/"
        return
    fi

    echo "$redirect_files" | while read -r file; do
        # Check if it contains "MOVED" text
        if grep -q "# MOVED" "$file" 2>/dev/null; then
            if [ "$dry_run" = "true" ]; then
                echo "   DELETE: $file (redirect)"
            else
                rm "$file"
                log_success "Deleted redirect: $file"
            fi
        fi
    done
}

suggest_merge_candidates() {
    log_info "Analyzing documentation for merge candidates..."
    echo ""

    cat << 'EOF'
📋 Merge Candidates (review manually):

1. Agent Documentation (6 files → 1-2 files)
   docs/agents/overview.md
   docs/agents/configuration.md
   docs/agents/summary.md
   docs/agents/setup-guide.md
   docs/agents/quick-start.md
   → Suggest: Merge into docs/agents/README.md + docs/agents/setup.md

2. API Admin Documentation (3 files → 1 file)
   docs/api/admin/documentation.md
   docs/api/admin/reference.md
   docs/api/admin/summary.md
   → Suggest: Merge into docs/api/admin/README.md

3. Getting Started (3 files → 1 file)
   docs/getting-started/quickstart-checklist.md
   docs/getting-started/database-setup.md
   docs/getting-started/final-setup-steps.md
   → Suggest: Merge into docs/getting-started/README.md

Run: node scripts/docs-manager.js stats
     node scripts/docs-manager.js find-orphans

EOF
}

###############################################################################
# CLI
###############################################################################

show_help() {
    cat << EOF
Documentation Cleanup Script

Removes redirect files and organizes documentation.

Usage:
    ./scripts/cleanup-docs.sh [OPTION]

Options:
    --dry-run       Preview cleanup without making changes
    --execute       Execute the cleanup (creates backup)
    --rollback      Rollback to the last backup
    --deep          Also clean redirect files in docs/ directory
    --suggest       Show merge candidates for manual review
    --help          Show this help message

What this script does:
    1. Deletes 19 redirect files from root (e.g., ADMIN_API_*.md)
    2. Moves 4 doc management files to docs/
    3. Updates links in README.md
    4. Creates backup before any changes

Examples:
    ./scripts/cleanup-docs.sh --dry-run
    ./scripts/cleanup-docs.sh --execute
    ./scripts/cleanup-docs.sh --deep --execute
    ./scripts/cleanup-docs.sh --suggest

EOF
}

# Parse arguments
DRY_RUN=false
DEEP_CLEAN=false
SUGGEST=false

case "$1" in
    --dry-run)
        DRY_RUN=true
        run_cleanup true
        ;;
    --execute)
        if [ "$2" = "--deep" ] || [ "$2" = "" ]; then
            if [ "$2" = "--deep" ]; then
                DEEP_CLEAN=true
            fi
            run_cleanup false
            if [ "$DEEP_CLEAN" = "true" ]; then
                echo ""
                clean_old_redirects_in_docs false
            fi
        fi
        ;;
    --rollback)
        rollback_cleanup
        ;;
    --suggest)
        suggest_merge_candidates
        ;;
    --help|-h)
        show_help
        ;;
    *)
        log_error "Invalid option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
