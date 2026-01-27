#!/bin/bash
# Daily cache refresh script for development
# Usage: ./scripts/refresh-cache.sh

echo ""
echo "======================================"
echo " Clockwise Capital - Cache Refresh"
echo "======================================"
echo ""

# Check if ADMIN_API_KEY environment variable is set
if [ -z "$ADMIN_API_KEY" ]; then
    echo "ERROR: ADMIN_API_KEY environment variable not set"
    echo "Please set it in your .env.local file and run:"
    echo "  export ADMIN_API_KEY=your_key_here"
    echo ""
    exit 1
fi

echo "Refreshing all caches..."
echo "(This will take 5-7 minutes)"
echo ""

curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d "{\"cacheType\": \"all\", \"adminKey\": \"$ADMIN_API_KEY\"}"

echo ""
echo ""
echo "======================================"
echo "Cache refresh triggered!"
echo "Check your dev server terminal for progress"
echo "======================================"
echo ""
