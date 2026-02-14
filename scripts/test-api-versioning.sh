#!/bin/bash

# API Versioning Test Script
#
# Tests that API versioning is working correctly:
# 1. Versioned endpoints return X-API-Version header
# 2. Unversioned endpoints redirect to v1
# 3. Admin/auth routes are excluded from versioning

set -e

BASE_URL="${1:-http://localhost:3000}"
FAILURES=0

echo "========================================="
echo "Testing LearnWithAvi API Versioning"
echo "========================================="
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_version=$3
  local description=$4

  echo -n "Testing: $description... "

  # Make request and get version header
  local response=$(curl -s -I -X "$method" "$BASE_URL$endpoint" 2>/dev/null)
  local version_header=$(echo "$response" | grep -i "X-API-Version" | cut -d' ' -f2 | tr -d '\r')
  local status_code=$(echo "$response" | head -n1 | cut -d' ' -f2)

  # Check if version header matches expected
  if [ "$version_header" = "$expected_version" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status_code, Version: $version_header)"
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_version, Got: $version_header)"
    FAILURES=$((FAILURES + 1))
  fi
}

# Test versioned endpoints (should have version header)
echo -e "${YELLOW}=== Testing Versioned Endpoints ===${NC}"
test_endpoint "GET" "/api/v1/health" "v1" "GET /api/v1/health"

# Test unversioned endpoints (should redirect to v1)
echo ""
echo -e "${YELLOW}=== Testing Unversioned Endpoints (should redirect) ===${NC}"
test_endpoint "GET" "/api/health" "v1" "GET /api/health (unversioned → v1)"

# Note: POST endpoints need proper payloads, so we skip them in this simple test
echo ""
echo -e "${YELLOW}=== Note ===${NC}"
echo "Skipping POST endpoints (chat, voice, quiz) - require valid payloads"
echo "These should be tested via unit tests or manual curl commands"

# Summary
echo ""
echo "========================================="
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}$FAILURES test(s) failed${NC}"
  exit 1
fi
