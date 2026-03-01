#!/bin/bash

################################################################################
# Environment Variable Validation Script
# Checks for required environment variables before running app/deployment
# Usage: bash scripts/check-env.sh [--strict]
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tracking variables
MISSING_REQUIRED=()
MISSING_OPTIONAL=()
ENV_FILE="${1:-.env.local}"
STRICT_MODE="${2:-}"

# Function to print colored output
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

################################################################################
# Check if .env.local exists
################################################################################

if [ ! -f "$ENV_FILE" ]; then
  print_warning "$ENV_FILE not found. Creating from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example "$ENV_FILE"
    print_info "Created $ENV_FILE. Please fill in required values."
  else
    print_error ".env.example not found either. Cannot proceed."
    exit 1
  fi
fi

################################################################################
# Load environment variables from .env.local
################################################################################

if [ -f "$ENV_FILE" ]; then
  # Source the file, but be careful not to export secrets
  set -a
  source "$ENV_FILE"
  set +a
fi

################################################################################
# REQUIRED ENVIRONMENT VARIABLES
################################################################################

echo ""
echo "================================"
echo "REQUIRED VARIABLES"
echo "================================"

REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  value=$(eval echo \$$var)

  if [ -z "$value" ]; then
    print_error "Missing required variable: $var"
    MISSING_REQUIRED+=("$var")
  elif [[ "$value" == *"xxxxx"* ]] || [[ "$value" == *"your-"* ]] || [[ "$value" == *"example"* ]]; then
    print_warning "Variable $var appears to be unset (placeholder value detected)"
    MISSING_REQUIRED+=("$var")
  else
    # Mask sensitive values in output
    if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"PASSWORD"* ]]; then
      masked_value="***$(echo $value | tail -c 10)"
      print_success "$var is set ($masked_value)"
    else
      print_success "$var is set"
    fi
  fi
done

################################################################################
# OPTIONAL ENVIRONMENT VARIABLES (RECOMMENDED FOR PRODUCTION)
################################################################################

echo ""
echo "================================"
echo "OPTIONAL VARIABLES (Recommended)"
echo "================================"

OPTIONAL_VARS=(
  "ELEVENLABS_API_KEY:ElevenLabs Text-to-Speech (voice tutoring)"
  "YOUTUBE_API_KEY:YouTube Data API (video transcript import)"
  "GOOGLE_CLIENT_ID:Google OAuth (student login)"
  "GOOGLE_CLIENT_SECRET:Google OAuth (student login)"
  "REDIS_URL:Redis caching (distributed sessions)"
  "SENTRY_DSN:Sentry error tracking"
)

for var_entry in "${OPTIONAL_VARS[@]}"; do
  var="${var_entry%:*}"
  description="${var_entry#*:}"
  value=$(eval echo \$$var)

  if [ -z "$value" ] || [[ "$value" == *"xxxxx"* ]] || [[ "$value" == *"your-"* ]]; then
    print_warning "Optional: $var ($description)"
    MISSING_OPTIONAL+=("$var")
  else
    # Mask sensitive values
    if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"DSN"* ]]; then
      masked_value="***$(echo $value | tail -c 10)"
      print_success "$var is set ($description) [$masked_value]"
    else
      print_success "$var is set ($description)"
    fi
  fi
done

################################################################################
# ENVIRONMENT CHECKS
################################################################################

echo ""
echo "================================"
echo "ENVIRONMENT VALIDATION"
echo "================================"

# Check Node.js version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  print_success "Node.js: $NODE_VERSION"
else
  print_error "Node.js not found"
fi

# Check npm version
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  print_success "npm: $NPM_VERSION"
else
  print_error "npm not found"
fi

# Check NODE_ENV
if [ -z "$NODE_ENV" ]; then
  print_warning "NODE_ENV not set (defaults to 'development')"
  NODE_ENV="development"
else
  print_success "NODE_ENV: $NODE_ENV"
fi

# Check DATABASE_URL format
if [ ! -z "$DATABASE_URL" ] && [[ ! "$DATABASE_URL" == *"xxxxx"* ]]; then
  if [[ "$DATABASE_URL" =~ ^postgresql:// ]] || [[ "$DATABASE_URL" =~ ^postgres:// ]]; then
    print_success "DATABASE_URL format is valid (PostgreSQL)"
  else
    print_warning "DATABASE_URL may not be a valid PostgreSQL connection string"
  fi
fi

# Check NEXTAUTH_SECRET length
if [ ! -z "$NEXTAUTH_SECRET" ] && [[ ! "$NEXTAUTH_SECRET" == *"xxxxx"* ]] && [[ ! "$NEXTAUTH_SECRET" == *"your-"* ]]; then
  SECRET_LENGTH=${#NEXTAUTH_SECRET}
  if [ $SECRET_LENGTH -ge 32 ]; then
    print_success "NEXTAUTH_SECRET length is sufficient ($SECRET_LENGTH chars)"
  else
    print_warning "NEXTAUTH_SECRET is short (consider using at least 32 chars: openssl rand -base64 32)"
  fi
fi

# Check NEXTAUTH_URL matches environment
if [ ! -z "$NEXTAUTH_URL" ]; then
  if [[ "$NODE_ENV" == "production" ]] && [[ "$NEXTAUTH_URL" == "http://localhost"* ]]; then
    print_warning "NEXTAUTH_URL is localhost but NODE_ENV=production (may cause issues)"
  else
    print_success "NEXTAUTH_URL: $NEXTAUTH_URL"
  fi
fi

################################################################################
# SUMMARY AND EXIT
################################################################################

echo ""
echo "================================"
echo "SUMMARY"
echo "================================"

REQUIRED_COUNT=${#MISSING_REQUIRED[@]}
OPTIONAL_COUNT=${#MISSING_OPTIONAL[@]}

if [ $REQUIRED_COUNT -eq 0 ]; then
  print_success "All required environment variables are set"
else
  print_error "$REQUIRED_COUNT required variable(s) missing:"
  for var in "${MISSING_REQUIRED[@]}"; do
    echo "  - $var"
  done
fi

if [ $OPTIONAL_COUNT -gt 0 ]; then
  print_warning "$OPTIONAL_COUNT optional variable(s) not configured:"
  for var in "${MISSING_OPTIONAL[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "For production deployment, configure optional variables in:"
  echo "  - GitHub Secrets: https://github.com/repo/settings/secrets/actions"
  echo "  - Vercel Environment: https://vercel.com/project/settings/environment-variables"
fi

echo ""

# Exit status
if [ $REQUIRED_COUNT -eq 0 ]; then
  echo "Environment validation completed successfully"
  exit 0
else
  print_error "Environment validation failed: missing required variables"
  echo ""
  echo "Setup instructions:"
  echo "  1. Copy .env.example to .env.local"
  echo "  2. Fill in all REQUIRED variables"
  echo "  3. For production, also fill in OPTIONAL variables"
  echo ""
  echo "See .env.example for detailed documentation on each variable."
  exit 1
fi
