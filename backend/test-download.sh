#!/bin/bash

echo "Testing backend download endpoint..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq .
echo ""
echo ""

# Test YouTube download with a short video
echo "2. Testing YouTube download..."
TEST_URL="https://www.youtube.com/watch?v=jNQXAC9IVRw"
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_URL\", \"platform\": \"youtube\"}" | jq .

echo ""
echo "Test complete. Check downloads folder for results."

