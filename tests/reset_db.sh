#!/bin/bash
# Quick database reset script for development testing
# Uses the existing DELETE /api/user/data endpoint

set -e

API_BASE="${API_BASE:-http://localhost:8000}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Resetting database via API...${NC}"

# Call the delete-all endpoint (simpler version, no confirmation)
RESPONSE=$(curl -s -X DELETE "${API_BASE}/api/data/delete-all")

# Check if successful
if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database reset complete${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo "Error resetting database:"
    echo "$RESPONSE" | jq '.'
    exit 1
fi
