#!/bin/bash

# ============================================
# BULK IMPORT API TESTING SCRIPT
# ============================================
# This script provides quick commands to test bulk import endpoints
# Usage: ./test-bulk.sh <endpoint> [token]

set -e

API_URL="http://localhost:3000/api"
TOKEN="${2:-your-jwt-token-here}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local data=$2
  local description=$3

  print_header "$description"
  echo -e "Endpoint: ${BLUE}POST $API_URL/bulk/$endpoint${NC}"
  echo -e "Token: ${BLUE}$TOKEN${NC}\n"

  echo "Request Body:"
  echo "$data" | jq '.' 2>/dev/null || echo "$data"
  echo ""

  echo "Response:"
  curl -s -X POST "$API_URL/bulk/$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$data" | jq '.' 2>/dev/null || echo "Error: Invalid response"

  echo ""
}

# Test data
CLUBS_DATA='{
  "items": [
    {
      "name": "Club Fenix",
      "city": "Tegucigalpa",
      "logoUrl": null,
      "active": true
    },
    {
      "name": "Club Artemisa",
      "city": "San Pedro Sula",
      "logoUrl": null,
      "active": true
    }
  ]
}'

ATHLETES_DATA='{
  "items": [
    {
      "firstName": "Juan",
      "lastName": "Pérez",
      "gender": "M",
      "bowType": "RECURVE",
      "clubName": "Club Fenix",
      "active": true
    },
    {
      "firstName": "Ana",
      "lastName": "García",
      "gender": "F",
      "bowType": "RECURVE",
      "clubName": null,
      "active": true
    }
  ]
}'

EVENTS_DATA='{
  "items": [
    {
      "name": "Test Event 2025",
      "organizer": "Test Org",
      "location": "Test City",
      "country": "Honduras",
      "startDate": "2025-05-10T08:00:00Z",
      "endDate": "2025-05-12T18:00:00Z",
      "eventScope": "NATIONAL_FEDERATION",
      "technicalLevel": "WA_STANDARD",
      "official": true,
      "clubMedalsEnabled": true
    }
  ]
}'

EVENT_CATEGORIES_DATA='{
  "items": [
    {
      "eventName": "Test Event 2025",
      "bowType": "RECURVE",
      "gender": "M",
      "division": "Senior",
      "modalityName": "INDIVIDUAL"
    }
  ]
}'

RESULTS_DATA='{
  "items": [
    {
      "eventName": "Test Event 2025",
      "bowType": "RECURVE",
      "gender": "M",
      "division": "Senior",
      "modalityName": "INDIVIDUAL",
      "phaseName": "QUALIFICATION",
      "athleteFirstName": "Juan",
      "athleteLastName": "Pérez",
      "score": 645,
      "position": 1,
      "notes": "Test result"
    }
  ]
}'

# Main logic
case "${1:-help}" in
  clubs)
    test_endpoint "clubs" "$CLUBS_DATA" "Testing Bulk Club Import"
    ;;
  athletes)
    test_endpoint "athletes" "$ATHLETES_DATA" "Testing Bulk Athlete Import"
    ;;
  events)
    test_endpoint "events" "$EVENTS_DATA" "Testing Bulk Event Import"
    ;;
  event-categories)
    test_endpoint "event-categories" "$EVENT_CATEGORIES_DATA" "Testing Bulk Event-Category Import"
    ;;
  results)
    test_endpoint "results" "$RESULTS_DATA" "Testing Bulk Results Import"
    ;;
  all)
    echo -e "${GREEN}Running all bulk import tests...${NC}"
    test_endpoint "clubs" "$CLUBS_DATA" "1. Testing Bulk Club Import"
    read -p "Press enter to continue..."
    test_endpoint "athletes" "$ATHLETES_DATA" "2. Testing Bulk Athlete Import"
    read -p "Press enter to continue..."
    test_endpoint "events" "$EVENTS_DATA" "3. Testing Bulk Event Import"
    read -p "Press enter to continue..."
    test_endpoint "event-categories" "$EVENT_CATEGORIES_DATA" "4. Testing Bulk Event-Category Import"
    read -p "Press enter to continue..."
    test_endpoint "results" "$RESULTS_DATA" "5. Testing Bulk Results Import"
    ;;
  help|*)
    print_header "Bulk Import API - Test Script"
    echo -e "Usage: ${GREEN}./test-bulk.sh <endpoint> [token]${NC}\n"
    echo "Available endpoints:"
    echo "  ${BLUE}clubs${NC}             - Test club bulk import"
    echo "  ${BLUE}athletes${NC}           - Test athlete bulk import"
    echo "  ${BLUE}events${NC}             - Test event bulk import"
    echo "  ${BLUE}event-categories${NC}   - Test event-category bulk import"
    echo "  ${BLUE}results${NC}            - Test results bulk import"
    echo "  ${BLUE}all${NC}                - Run all tests sequentially"
    echo "  ${BLUE}help${NC}               - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ${GREEN}./test-bulk.sh clubs${NC}"
    echo "  ${GREEN}./test-bulk.sh athletes eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...${NC}"
    echo "  ${GREEN}./test-bulk.sh all eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...${NC}"
    echo ""
    echo "Notes:"
    echo "  - API must be running on http://localhost:3000"
    echo "  - Token is required for all requests (ADMIN/SUPER_ADMIN)"
    echo "  - Use 'jq' for pretty JSON output (install: apt-get install jq)"
    echo ""
    ;;
esac
