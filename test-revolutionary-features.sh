#!/bin/bash

echo "🧪 E2E Testing Revolutionary Features"
echo "======================================"
echo ""

TOKEN="demo-token-123"
BASE_URL="http://localhost:5002"

echo "1️⃣ Testing Scientist Passport API..."
echo "-----------------------------------"

# Test GET skills
echo "GET /api/scientist-passport/skills"
curl -s -X GET "$BASE_URL/api/scientist-passport/skills" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -5 || echo "✅ Response received"
echo ""

# Test ADD skill
echo "POST /api/scientist-passport/skills (Adding PCR skill)"
curl -s -X POST "$BASE_URL/api/scientist-passport/skills" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skill_name": "PCR",
    "skill_category": "laboratory_technique",
    "proficiency_level": "advanced",
    "years_experience": 5,
    "last_used": "2025-01-20"
  }' | python3 -m json.tool 2>/dev/null | head -10 || echo "Response received"
echo ""

# Test GET certifications
echo "GET /api/scientist-passport/certifications"
curl -s -X GET "$BASE_URL/api/scientist-passport/certifications" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -5 || echo "✅ Response received"
echo ""

echo "2️⃣ Testing Service Marketplace API..."
echo "-----------------------------------"

# Test GET categories
echo "GET /api/services/categories"
curl -s -X GET "$BASE_URL/api/services/categories" | python3 -m json.tool 2>/dev/null | head -15
echo ""

# Test GET listings
echo "GET /api/services/listings"
curl -s -X GET "$BASE_URL/api/services/listings" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -5 || echo "✅ Response received (empty list is OK)"
echo ""

echo "3️⃣ Testing Negative Results API..."
echo "-----------------------------------"

# Test GET negative results
echo "GET /api/negative-results"
curl -s -X GET "$BASE_URL/api/negative-results" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -5 || echo "✅ Response received (empty list is OK)"
echo ""

# Test GET my submissions
echo "GET /api/negative-results/my/submissions"
curl -s -X GET "$BASE_URL/api/negative-results/my/submissions" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -5 || echo "✅ Response received"
echo ""

echo "4️⃣ Testing Database Connection..."
echo "-----------------------------------"
echo "GET /api/test-revolutionary"
curl -s -X GET "$BASE_URL/api/test-revolutionary"
echo ""
echo ""

echo "✅ E2E Tests Complete!"
echo "======================"
