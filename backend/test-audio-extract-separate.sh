#!/bin/bash
# Test /api/audio/extract and /api/audio/separate
# Usage: ./test-audio-extract-separate.sh [BASE_URL]
# Example: ./test-audio-extract-separate.sh http://localhost:3001

set -e
BASE_URL="${1:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUDIO_DIR="${SCRIPT_DIR}/audio_processing"
TEST_FILE="${AUDIO_DIR}/test_input_$$.mp4"
mkdir -p "$AUDIO_DIR"

cleanup() {
  rm -f "$TEST_FILE"
}
trap cleanup EXIT

echo "=== Testing Audio Extract & Separate ==="
echo "Base URL: $BASE_URL"
echo ""

# Create minimal 1s test video (320x240, silent) if ffmpeg available
if command -v ffmpeg &>/dev/null; then
  echo "Creating 1s test video..."
  ffmpeg -f lavfi -i "color=c=black:s=320x240:r=25" -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 1 -c:v libx264 -c:a aac -y "$TEST_FILE" 2>/dev/null || true
fi

if [[ ! -f "$TEST_FILE" || ! -s "$TEST_FILE" ]]; then
  echo "Could not create test video (ffmpeg missing or failed). Using tiny placeholder."
  # Fallback: minimal valid data so multer accepts and backend fails gracefully
  echo -n "fake" > "$TEST_FILE"
fi

echo "1. Testing /api/audio/extract (format=mp3)..."
EXTRACT_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/audio/extract" \
  -F "file=@$TEST_FILE" \
  -F "format=mp3")
EXTRACT_HTTP=$(echo "$EXTRACT_RES" | tail -n1)
EXTRACT_BODY=$(echo "$EXTRACT_RES" | sed '$d')
if [[ "$EXTRACT_HTTP" == "200" ]]; then
  echo "   OK (200)"
  echo "$EXTRACT_BODY" | head -c 200
  echo ""
else
  echo "   FAIL (HTTP $EXTRACT_HTTP)"
  echo "$EXTRACT_BODY"
fi
echo ""

echo "2. Testing /api/audio/separate (mode=voice)..."
SEP_V_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/audio/separate" \
  -F "file=@$TEST_FILE" \
  -F "mode=voice")
SEP_V_HTTP=$(echo "$SEP_V_RES" | tail -n1)
SEP_V_BODY=$(echo "$SEP_V_RES" | sed '$d')
if [[ "$SEP_V_HTTP" == "200" ]]; then
  echo "   OK (200)"
  echo "$SEP_V_BODY" | head -c 200
  echo ""
else
  echo "   FAIL (HTTP $SEP_V_HTTP)"
  echo "$SEP_V_BODY"
fi
echo ""

echo "3. Testing /api/audio/separate (mode=music)..."
SEP_M_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/audio/separate" \
  -F "file=@$TEST_FILE" \
  -F "mode=music")
SEP_M_HTTP=$(echo "$SEP_M_RES" | tail -n1)
SEP_M_BODY=$(echo "$SEP_M_RES" | sed '$d')
if [[ "$SEP_M_HTTP" == "200" ]]; then
  echo "   OK (200)"
  echo "$SEP_M_BODY" | head -c 200
  echo ""
else
  echo "   FAIL (HTTP $SEP_M_HTTP)"
  echo "$SEP_M_BODY"
fi
echo ""

echo "=== Done ==="
