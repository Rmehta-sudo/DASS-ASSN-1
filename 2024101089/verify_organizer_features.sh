#!/bin/bash

# Configuration
API_URL="http://localhost:5000/api"
ORGANIZER_EMAIL="music@clubs.iiit.ac.in"
ORGANIZER_PASSWORD="thisisclub" # Updated default password from .env
PARTICIPANT_EMAIL="admin@felicity.iiit.ac.in" # Using admin as participant or create new? Admin has role 'admin' but can register? Seeder creates admin.
# Let's use a new participant or existing if known.
# Actually, seeder doesn't create standard participants other than admin.
# Let's create a participant first in the script or use admin if allowed.
# Admin role might not have permission to register?
# Let's sign up a participant in the script.
PARTICIPANT_EMAIL="testuser_$(date +%s)@test.com"
PARTICIPANT_PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "------------------------------------------------"
echo "Starting Organizer Feature Verification"
echo "------------------------------------------------"

# 0. Register a Participant
echo "0. Registering a new participant..."
REG_USER_RES=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$PARTICIPANT_EMAIL\",
    \"password\": \"$PARTICIPANT_PASSWORD\",
    \"contactNumber\": \"9876543210\",
    \"collegeName\": \"Test College\",
    \"participantType\": \"Non-IIIT\"
  }")

USER_TOKEN=$(echo $REG_USER_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$USER_TOKEN" ]; then
    echo -e "${RED}Failed to register participant.${NC}"
    echo "Response: $REG_USER_RES"
    # Proceeding might fail but let's see
else
    echo -e "${GREEN}Participant registered: $PARTICIPANT_EMAIL${NC}"
fi

# 1. Login as Organizer
echo "1. Logging in as Organizer..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ORGANIZER_EMAIL\", \"password\": \"$ORGANIZER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
ORGANIZER_ID=$(echo $LOGIN_RES | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to login as organizer.${NC}"
  echo "Response: $LOGIN_RES"
  exit 1
fi
echo -e "${GREEN}Organizer logged in. Token acquired.${NC}"

# 2. Update Organizer Profile (Webhook)
echo -e "\n2. Updating Organizer Profile (Setting Webhook)..."
UPDATE_RES=$(curl -s -X PUT "$API_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Organizer",
    "lastName": "User",
    "description": "Updated Description via Script",
    "category": "Technical",
    "discordWebhook": "https://discord.com/api/webhooks/TEST_WEBHOOK_URL"
  }')

WEBHOOK_CHECK=$(echo $UPDATE_RES | grep "TEST_WEBHOOK_URL")

if [ -n "$WEBHOOK_CHECK" ]; then
  echo -e "${GREEN}Organizer profile updated successfully with Webhook.${NC}"
else
  echo -e "${RED}Failed to update organizer profile.${NC}"
  echo "Response: $UPDATE_RES"
fi

# 3. Create a Test Event
echo -e "\n3. Creating a Test Event..."
EVENT_RES=$(curl -s -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Auto Test Event",
    "description": "Event created by verification script",
    "type": "Normal",
    "eligibility": "Everyone",
    "registrationFee": 100,
    "registrationLimit": 50,
    "startDate": "2024-12-01T10:00:00.000Z",
    "endDate": "2024-12-01T18:00:00.000Z",
    "deadline": "2024-11-30T23:59:00.000Z",
    "location": "Himalaya 105",
    "tags": ["Tech", "Coding"],
    "status": "Published"
  }')

EVENT_ID=$(echo $EVENT_RES | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')

if [ -z "$EVENT_ID" ]; then
  echo -e "${RED}Failed to create event.${NC}"
  echo "Response: $EVENT_RES"
else
  echo -e "${GREEN}Event created with ID: $EVENT_ID${NC}"
fi

# 4. Register a Participant
echo -e "\n4. Laughing participant to register..."

if [ -n "$USER_TOKEN" ]; then
    echo "Participant logged in (via registration). Registering for event..."
    REG_RES=$(curl -s -X POST "$API_URL/registrations" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_TOKEN" \
      -d "{
        \"eventId\": \"$EVENT_ID\"
      }")
    
    echo "Registration Response: $REG_RES"
else
    echo -e "${RED}No user token available. Skipping registration.${NC}"
fi

# 5. Fetch Event Analytics
echo -e "\n5. Fetching Event Analytics..."
ANALYTICS_RES=$(curl -s -X GET "$API_URL/events/$EVENT_ID/analytics" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_REGS=$(echo $ANALYTICS_RES | grep -o '"totalRegistrations":[0-9]*' | grep -o '[0-9]*')

if [ "$TOTAL_REGS" -gt 0 ]; then
  echo -e "${GREEN}Analytics fetched successfully. Total Registrations: $TOTAL_REGS${NC}"
else
  echo -e "${RED}Failed to fetch analytics or no registrations found.${NC}"
  echo "Response: $ANALYTICS_RES"
fi

# 6. Test CSV Export
echo -e "\n6. Testing CSV Export..."
CSV_RES=$(curl -s -X GET "$API_URL/events/$EVENT_ID/csv" \
  -H "Authorization: Bearer $TOKEN")

if [[ $CSV_RES == *"Ticket ID"* ]]; then
  echo -e "${GREEN}CSV Export successful (Header found).${NC}"
  echo "Preview:"
  echo "$CSV_RES" | head -n 3
else
  echo -e "${RED}CSV Export failed.${NC}"
  echo "Response Preview: ${CSV_RES:0:100}"
fi

echo -e "\n------------------------------------------------"
echo "Verification Complete"
echo "------------------------------------------------"
