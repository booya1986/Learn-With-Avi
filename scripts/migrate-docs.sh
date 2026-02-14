#!/bin/bash

###############################################################################
# Documentation Migration Script
#
# This script reorganizes markdown documentation according to the plan in
# docs/DOCUMENTATION_REORGANIZATION_PLAN.md
#
# Usage:
#   ./scripts/migrate-docs.sh --dry-run   # Preview changes
#   ./scripts/migrate-docs.sh --execute   # Execute migration
#   ./scripts/migrate-docs.sh --rollback  # Undo migration
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Backup directory
BACKUP_DIR="$ROOT_DIR/.docs-backup-$(date +%Y%m%d-%H%M%S)"

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

# Create directory if it doesn't exist
ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_info "Created directory: $1"
    fi
}

# Move file and create redirect
move_with_redirect() {
    local source="$1"
    local target="$2"
    local dry_run="$3"

    if [ ! -f "$source" ]; then
        log_warning "Source file not found: $source"
        return 1
    fi

    if [ "$dry_run" = "true" ]; then
        echo "   MOVE: $source → $target"
        return 0
    fi

    # Create target directory
    ensure_dir "$(dirname "$target")"

    # Copy file
    cp "$source" "$target"
    log_success "Copied: $source → $target"

    # Create redirect at old location
    local rel_target=$(realpath --relative-to="$(dirname "$source")" "$target" 2>/dev/null || echo "$target")
    cat > "$source" << EOF
# MOVED

**This document has been moved to:** [$rel_target]($rel_target)

Please update your bookmarks and links.

---

*This is a redirect file. The original content is now at the location above.*
EOF

    log_info "Created redirect at: $source"
}

###############################################################################
# Migration Functions
###############################################################################

create_directory_structure() {
    local dry_run="$1"

    log_info "Creating new directory structure..."

    local dirs=(
        "docs/getting-started"
        "docs/product"
        "docs/architecture"
        "docs/api"
        "docs/api/admin"
        "docs/guides/development"
        "docs/agents/definitions"
        "docs/skills/catalog"
        "docs/configuration"
        "docs/status"
    )

    for dir in "${dirs[@]}"; do
        if [ "$dry_run" = "true" ]; then
            echo "   CREATE DIR: $dir/"
        else
            ensure_dir "$dir"
        fi
    done
}

migrate_getting_started() {
    local dry_run="$1"

    log_info "Migrating getting started documentation..."

    move_with_redirect "QUICKSTART_CHECKLIST.md" "docs/getting-started/quickstart-checklist.md" "$dry_run"
    move_with_redirect "DATABASE_SETUP.md" "docs/getting-started/database-setup.md" "$dry_run"
    move_with_redirect "FINAL_SETUP_STEPS.md" "docs/getting-started/final-setup-steps.md" "$dry_run"
}

migrate_product_docs() {
    local dry_run="$1"

    log_info "Migrating product documentation..."

    move_with_redirect "LearnWithAvi-PRD.md" "docs/product/prd.md" "$dry_run"
    move_with_redirect "LearnWithAvi-PRD-Complete-History.md" "docs/product/prd-history.md" "$dry_run"
}

migrate_architecture_docs() {
    local dry_run="$1"

    log_info "Migrating architecture documentation..."

    move_with_redirect "MULTI_AGENT_ARCHITECTURE.md" "docs/architecture/overview.md" "$dry_run"
    move_with_redirect "MULTI_AGENT_IMPLEMENTATION_SUMMARY.md" "docs/architecture/implementation.md" "$dry_run"
    move_with_redirect "docs/VIDEO_SYSTEM_RULES.md" "docs/architecture/video-system.md" "$dry_run"
}

migrate_api_docs() {
    local dry_run="$1"

    log_info "Migrating API documentation..."

    move_with_redirect "API_QUICK_REFERENCE.md" "docs/api/quick-reference.md" "$dry_run"
    move_with_redirect "ADMIN_API_DOCUMENTATION.md" "docs/api/admin/documentation.md" "$dry_run"
    move_with_redirect "ADMIN_API_REFERENCE.md" "docs/api/admin/reference.md" "$dry_run"
    move_with_redirect "ADMIN_API_SUMMARY.md" "docs/api/admin/summary.md" "$dry_run"
}

migrate_guides() {
    local dry_run="$1"

    log_info "Migrating guides..."

    move_with_redirect "ADMIN_PANEL_COMPLETE.md" "docs/guides/admin-panel.md" "$dry_run"
}

migrate_agent_docs() {
    local dry_run="$1"

    log_info "Migrating agent documentation..."

    move_with_redirect "SUB_AGENTS_CONFIGURED.md" "docs/agents/overview.md" "$dry_run"
    move_with_redirect "AGENT_CONFIGURATION_COMPLETE.md" "docs/agents/configuration.md" "$dry_run"
    move_with_redirect "agents/orchestrator/ORCHESTRATOR.md" "docs/agents/orchestrator.md" "$dry_run"
    move_with_redirect "MULTI_AGENT_SETUP_GUIDE.md" "docs/agents/setup-guide.md" "$dry_run"
    move_with_redirect "QUICK_START_MULTI_AGENT.md" "docs/agents/quick-start.md" "$dry_run"
    move_with_redirect "FINAL_SUB_AGENTS_SUMMARY.md" "docs/agents/summary.md" "$dry_run"
}

migrate_skills_docs() {
    local dry_run="$1"

    log_info "Migrating skills documentation..."

    move_with_redirect "SKILLS_SUMMARY.md" "docs/skills/overview.md" "$dry_run"
    move_with_redirect "docs/SKILLS_RECOMMENDATIONS.md" "docs/skills/recommendations.md" "$dry_run"
}

migrate_configuration_docs() {
    local dry_run="$1"

    log_info "Migrating configuration documentation..."

    move_with_redirect ".claude.md" "docs/configuration/claude.md" "$dry_run"
    move_with_redirect "SETUP_COMPLETE.md" "docs/configuration/setup-complete.md" "$dry_run"
}

migrate_status_docs() {
    local dry_run="$1"

    log_info "Migrating status documentation..."

    if [ -f "docs/IMPLEMENTATION_STATUS.md" ]; then
        move_with_redirect "docs/IMPLEMENTATION_STATUS.md" "docs/status/implementation-status.md" "$dry_run"
    fi

    if [ -f "docs/DOCUMENTATION_COVERAGE.md" ]; then
        move_with_redirect "docs/DOCUMENTATION_COVERAGE.md" "docs/status/documentation-coverage.md" "$dry_run"
    fi
}

###############################################################################
# Main Migration
###############################################################################

run_migration() {
    local dry_run="$1"

    if [ "$dry_run" = "true" ]; then
        log_warning "DRY RUN MODE - No files will be modified"
        echo ""
    fi

    create_directory_structure "$dry_run"
    migrate_getting_started "$dry_run"
    migrate_product_docs "$dry_run"
    migrate_architecture_docs "$dry_run"
    migrate_api_docs "$dry_run"
    migrate_guides "$dry_run"
    migrate_agent_docs "$dry_run"
    migrate_skills_docs "$dry_run"
    migrate_configuration_docs "$dry_run"
    migrate_status_docs "$dry_run"

    if [ "$dry_run" = "false" ]; then
        log_success "Migration completed successfully!"
        log_info "Backup created at: $BACKUP_DIR"
    else
        echo ""
        log_info "Dry run completed. Run with --execute to perform migration."
    fi
}

create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"

    # Backup all MD files at root
    find . -maxdepth 1 -name "*.md" -exec cp {} "$BACKUP_DIR/" \;

    # Backup docs directory
    if [ -d "docs" ]; then
        cp -r docs "$BACKUP_DIR/"
    fi

    log_success "Backup created at: $BACKUP_DIR"
}

rollback_migration() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "No backup found to rollback"
        exit 1
    fi

    log_warning "Rolling back migration from: $BACKUP_DIR"

    # Restore files
    cp -r "$BACKUP_DIR"/* .

    log_success "Rollback completed"
}

###############################################################################
# CLI
###############################################################################

show_help() {
    cat << EOF
Documentation Migration Script

Usage:
    ./scripts/migrate-docs.sh [OPTION]

Options:
    --dry-run       Preview migration without making changes
    --execute       Execute the migration (creates backup)
    --rollback      Rollback to the last backup
    --help          Show this help message

Examples:
    ./scripts/migrate-docs.sh --dry-run
    ./scripts/migrate-docs.sh --execute
    ./scripts/migrate-docs.sh --rollback

EOF
}

case "$1" in
    --dry-run)
        run_migration true
        ;;
    --execute)
        create_backup
        run_migration false
        ;;
    --rollback)
        rollback_migration
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
