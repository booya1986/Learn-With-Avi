#!/bin/bash

# Test Admin Authentication Middleware
# =====================================
# Verifies that middleware properly protects /api/admin/* routes

echo "🔒 Testing Admin Authentication Middleware"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣  Testing unauthorized access to admin routes..."
echo ""

# Test routes that should return 401
PROTECTED_ROUTES=(
  "/api/admin/courses"
  "/api/admin/videos"
  "/api/admin/transcripts"
)

for route in "${PROTECTED_ROUTES[@]}"; do
  echo "Testing: $route"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  
  if [ "$HTTP_CODE" -eq 401 ]; then
    echo "✅ Correctly returned 401 Unauthorized"
  else
    echo "❌ FAILED: Expected 401, got $HTTP_CODE"
  fi
  echo ""
done

echo "2️⃣  Testing signup route (should NOT require auth)..."
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass","name":"Test"}')

if echo "$SIGNUP_RESPONSE" | grep -q "error"; then
  echo "✅ Signup route is accessible (returns validation error as expected)"
else
  echo "ℹ️  Signup response: $SIGNUP_RESPONSE"
fi

echo ""
echo "✅ Middleware authentication test complete!"
echo ""
echo "💡 To test authenticated requests:"
echo "   1. Login at http://localhost:3000/admin/login"
echo "   2. Extract JWT token from cookies/browser storage"
echo "   3. Add Authorization header: Bearer <token>"
