#!/bin/bash
# TrueHour v2.0 Test Data Generator
# Generates realistic test data for smoke tests:
# - 1 aircraft (N12345)
# - 1 simulator (PFCMFD01)
# - 1 real flight
# - 1 simulator flight
# - Budget cards with expenses

set -e

# Configuration
API_BASE="${API_BASE:-http://localhost:8000}"
TMP_DIR="${TMP_DIR:-/tmp/truehour_test_data}"
CSV_FILE="${TMP_DIR}/test_logbook.csv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Create temp directory
mkdir -p "$TMP_DIR"

log_info "Generating test ForeFlight CSV..."

# Generate ForeFlight CSV with proper format
cat > "$CSV_FILE" << 'EOF'
ForeFlight Logbook Import,This row is required for importing into ForeFlight. Do not delete or modify.

Aircraft Table
AircraftID,TypeCode,Year,Make,Model,GearType,EngineType,equipType (FAA),aircraftClass (FAA),complexAircraft (FAA),taa (FAA),highPerformance (FAA),pressurized (FAA)
N12345,C172,1975,CESSNA,172M Skyhawk,fixed_tricycle,Piston,aircraft,airplane_single_engine_land,,,,
PFCMFD01,AATD,,,,,,aatd,airplane_single_engine_land,,,,

Flights Table
Date,AircraftID,From,To,Route,TimeOut,TimeOff,TimeOn,TimeIn,OnDuty,OffDuty,TotalTime,PIC,SIC,Night,Solo,CrossCountry,PICUS,MultiPilot,IFR,Examiner,NVG,NVG Ops,Distance,ActualInstrument,SimulatedInstrument,HobbsStart,HobbsEnd,TachStart,TachEnd,Holds,Approach1,Approach2,Approach3,Approach4,Approach5,Approach6,DualGiven,DualReceived,SimulatedFlight,GroundTraining,GroundTrainingGiven,InstructorName,InstructorComments,Person1,Person2,Person3,Person4,Person5,Person6,PilotComments,Flight Review (FAA),IPC (FAA),Checkride (FAA),FAA 61.58 (FAA),NVG Proficiency (FAA),Takeoff Day,Landing Full-Stop Day,Landing Touch-and-Go Day,DayTakeoffs,DayLandingsFullStop,NightTakeoffs,NightLandingsFullStop,AllLandings,[Hours]Complex,[Hours]High Performance
2026-01-15,N12345,KDPA,KORD,Direct,14:30,14:45,15:10,15:20,,,0.8,0.8,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,25.00,0.0,0.0,123.50,124.30,0.00,0.00,0,,,,,,,0.0,0.0,0.0,0.0,0.0,,,,,,,,,"""Local flight to O'Hare and back. Beautiful weather.""",,,,,,1,1,,1,1,0,0,1,0.0,0.0
2026-01-16,PFCMFD01,KDPA,KDPA,,09:00,09:05,10:30,10:35,,,1.5,1.5,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,0.00,0.0,1.0,0.00,0.00,0.00,0.00,2,1;ILS OR LOC RWY 28R;28R;KDPA;;,,,,,,0.0,1.5,1.5,0.0,0.0,John Smith,,,,,,,,"""Instrument training - holds and approaches""",,,,,,2,2,,2,2,0,0,2,0.0,0.0
2026-01-17,N12345,KORD,KMDW,Direct,10:00,10:15,10:45,11:00,,,1.0,1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,0.0,0,15.00,0.0,0.0,124.30,125.30,0.00,0.00,0,,,,,,,0.0,0.0,0.0,0.0,0.0,,,,,,,,,"""Cross-country to Midway""",,,,,,1,1,,1,1,0,0,1,0.0,0.0
2026-01-18,PFCMFD01,KORD,KMDW,,13:00,13:05,15:00,15:05,,,2.0,2.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,15.00,0.0,1.5,0.00,0.00,0.00,0.00,1,1;ILS OR LOC RWY 31C;31C;KORD;;,1;RNAV (GPS) RWY 31C;31C;KMDW;;,,,,,0.0,2.0,2.0,0.0,0.0,John Smith,,,,,,,,"""Advanced instrument procedures - ILS 31C ORD, RNAV 31C MDW""",,,,,,2,2,,2,2,0,0,2,0.0,0.0
EOF

log_success "Generated test logbook CSV with 4 flights"

# Import the CSV via API
log_info "Importing test data via API..."
IMPORT_RESPONSE=$(curl -s -X POST "${API_BASE}/api/user/flights/import" \
    -F "file=@${CSV_FILE}" \
    -H "accept: application/json")

IMPORTED=$(echo "$IMPORT_RESPONSE" | jq -r '.imported // 0')
SKIPPED=$(echo "$IMPORT_RESPONSE" | jq -r '.skipped // 0')
ERROR_COUNT=$(echo "$IMPORT_RESPONSE" | jq -r '.errors | length // 0')

if [ "$IMPORTED" -gt 0 ]; then
    log_success "Imported $IMPORTED flights, skipped $SKIPPED (errors: $ERROR_COUNT)"
else
    log_fail "Import failed"
    echo "$IMPORT_RESPONSE" | jq '.'
    exit 1
fi

# Get aircraft IDs for budget card creation
log_info "Fetching aircraft IDs..."
AIRCRAFT_RESPONSE=$(curl -s "${API_BASE}/api/user/aircraft")
AIRCRAFT_ID=$(echo "$AIRCRAFT_RESPONSE" | jq -r '[.[] | select(.tail_number == "N12345")][0].id // empty')
SIMULATOR_ID=$(echo "$AIRCRAFT_RESPONSE" | jq -r '[.[] | select(.tail_number == "PFCMFD01")][0].id // empty')

if [ -z "$AIRCRAFT_ID" ]; then
    log_fail "Could not find N12345 in aircraft list"
    exit 1
fi

log_success "Found aircraft: N12345 (ID: $AIRCRAFT_ID), PFCMFD01 (ID: $SIMULATOR_ID)"

# Create budget cards
log_info "Creating budget cards..."

# Budget card 1: Flight Training Budget (monthly, simulator)
if [ -n "$SIMULATOR_ID" ]; then
    CARD1_RESPONSE=$(curl -s -X POST "${API_BASE}/api/user/budget-cards/" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"January Flight Training\",
            \"category\": \"Training\",
            \"frequency\": \"monthly\",
            \"when_date\": \"2026-01-01\",
            \"budgeted_amount\": 800.00,
            \"notes\": \"Simulator training - instrument procedures\",
            \"associated_hours\": 5.0,
            \"aircraft_id\": $SIMULATOR_ID,
            \"hourly_rate_type\": \"wet\",
            \"status\": \"active\"
        }")

    CARD1_ID=$(echo "$CARD1_RESPONSE" | jq -r '.id // empty')
    if [ -n "$CARD1_ID" ]; then
        log_success "Created Flight Training Budget card (ID: $CARD1_ID)"
    else
        log_fail "Failed to create Flight Training Budget card"
        echo "$CARD1_RESPONSE" | jq '.'
    fi
fi

# Budget card 2: Aircraft Rental Budget (monthly, N12345)
CARD2_RESPONSE=$(curl -s -X POST "${API_BASE}/api/user/budget-cards/" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"January Aircraft Rental\",
        \"category\": \"Aircraft Rental\",
        \"frequency\": \"monthly\",
        \"when_date\": \"2026-01-01\",
        \"budgeted_amount\": 1500.00,
        \"notes\": \"C172 rental budget\",
        \"associated_hours\": 10.0,
        \"aircraft_id\": $AIRCRAFT_ID,
        \"hourly_rate_type\": \"wet\",
        \"status\": \"active\"
    }")

CARD2_ID=$(echo "$CARD2_RESPONSE" | jq -r '.id // empty')
if [ -n "$CARD2_ID" ]; then
    log_success "Created Aircraft Rental Budget card (ID: $CARD2_ID)"
else
    log_fail "Failed to create Aircraft Rental Budget card"
    echo "$CARD2_RESPONSE" | jq '.'
fi

# Budget card 3: Annual Insurance
CARD3_RESPONSE=$(curl -s -X POST "${API_BASE}/api/user/budget-cards/" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Annual Insurance Payment\",
        \"category\": \"Administrative\",
        \"frequency\": \"annual\",
        \"when_date\": \"2026-01-01\",
        \"budgeted_amount\": 1200.00,
        \"notes\": \"Renter's insurance annual premium\",
        \"hourly_rate_type\": \"wet\",
        \"status\": \"active\"
    }")

CARD3_ID=$(echo "$CARD3_RESPONSE" | jq -r '.id // empty')
if [ -n "$CARD3_ID" ]; then
    log_success "Created Annual Insurance card (ID: $CARD3_ID)"
else
    log_fail "Failed to create Annual Insurance card"
    echo "$CARD3_RESPONSE" | jq '.'
fi

# Create expenses
log_info "Creating test expenses..."

# Expense 1: Simulator session (linked to training budget)
if [ -n "$CARD1_ID" ]; then
    EXPENSE1=$(curl -s -L -X POST "${API_BASE}/api/user/expenses" \
        -H "Content-Type: application/json" \
        -d "{
            \"aircraft_id\": $SIMULATOR_ID,
            \"category\": \"instruction\",
            \"subcategory\": \"simulator\",
            \"description\": \"Simulator session - instrument training (1.5 hours)\",
            \"amount\": 150.00,
            \"date\": \"2026-01-16\",
            \"vendor\": \"Flight School Inc\",
            \"is_recurring\": false,
            \"is_tax_deductible\": false
        }")

    EXPENSE1_ID=$(echo "$EXPENSE1" | jq -r '.id // empty')
    if [ -n "$EXPENSE1_ID" ]; then
        log_success "Created simulator expense (ID: $EXPENSE1_ID)"

        # Link to budget card
        LINK1=$(curl -s -L -X POST "${API_BASE}/api/user/budget-cards/${CARD1_ID}/link-expense?expense_id=$EXPENSE1_ID&amount=150.00" \
            -H "Content-Type: application/json")
        LINK1_ID=$(echo "$LINK1" | jq -r '.id // empty')
        if [ -n "$LINK1_ID" ]; then
            log_success "Linked expense $EXPENSE1_ID to budget card $CARD1_ID"
        else
            log_fail "Failed to link expense $EXPENSE1_ID"
            echo "$LINK1" | jq '.'
        fi
    else
        log_fail "Failed to create simulator expense"
        echo "$EXPENSE1" | jq '.'
    fi
fi

# Expense 2: Aircraft rental (linked to rental budget)
if [ -n "$CARD2_ID" ]; then
    EXPENSE2=$(curl -s -L -X POST "${API_BASE}/api/user/expenses" \
        -H "Content-Type: application/json" \
        -d "{
            \"aircraft_id\": $AIRCRAFT_ID,
            \"category\": \"fuel\",
            \"description\": \"C172 rental - 0.8 hours wet rate\",
            \"amount\": 120.00,
            \"date\": \"2026-01-15\",
            \"vendor\": \"Flight School Inc\",
            \"is_recurring\": false,
            \"is_tax_deductible\": false
        }")

    EXPENSE2_ID=$(echo "$EXPENSE2" | jq -r '.id // empty')
    if [ -n "$EXPENSE2_ID" ]; then
        log_success "Created aircraft rental expense (ID: $EXPENSE2_ID)"

        # Link to budget card
        LINK2=$(curl -s -L -X POST "${API_BASE}/api/user/budget-cards/${CARD2_ID}/link-expense?expense_id=$EXPENSE2_ID&amount=120.00" \
            -H "Content-Type: application/json")
        LINK2_ID=$(echo "$LINK2" | jq -r '.id // empty')
        if [ -n "$LINK2_ID" ]; then
            log_success "Linked expense $EXPENSE2_ID to budget card $CARD2_ID"
        else
            log_fail "Failed to link expense $EXPENSE2_ID"
            echo "$LINK2" | jq '.'
        fi
    else
        log_fail "Failed to create aircraft rental expense"
        echo "$EXPENSE2" | jq '.'
    fi
fi

# Expense 3: Insurance payment (linked to administrative budget)
if [ -n "$CARD3_ID" ]; then
    EXPENSE3=$(curl -s -L -X POST "${API_BASE}/api/user/expenses" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"insurance\",
            \"description\": \"Renter's insurance annual premium\",
            \"amount\": 1200.00,
            \"date\": \"2026-01-05\",
            \"vendor\": \"Aviation Insurance Co\",
            \"is_recurring\": true,
            \"recurrence_interval\": \"annual\",
            \"is_tax_deductible\": false
        }")

    EXPENSE3_ID=$(echo "$EXPENSE3" | jq -r '.id // empty')
    if [ -n "$EXPENSE3_ID" ]; then
        log_success "Created insurance expense (ID: $EXPENSE3_ID)"

        # Link to budget card
        LINK3=$(curl -s -L -X POST "${API_BASE}/api/user/budget-cards/${CARD3_ID}/link-expense?expense_id=$EXPENSE3_ID&amount=1200.00" \
            -H "Content-Type: application/json")
        LINK3_ID=$(echo "$LINK3" | jq -r '.id // empty')
        if [ -n "$LINK3_ID" ]; then
            log_success "Linked expense $EXPENSE3_ID to budget card $CARD3_ID"
        else
            log_fail "Failed to link expense $EXPENSE3_ID"
            echo "$LINK3" | jq '.'
        fi
    else
        log_fail "Failed to create insurance expense"
        echo "$EXPENSE3" | jq '.'
    fi
fi

# Update user settings
log_info "Updating user settings..."
SETTINGS=$(curl -s -X PUT "${API_BASE}/api/user/settings" \
    -H "Content-Type: application/json" \
    -d "{
        \"pilot_name\": \"Test Pilot\",
        \"certificate_number\": \"1234567\",
        \"target_certification\": \"IR\",
        \"enable_faa_lookup\": true,
        \"timezone\": \"America/New_York\"
    }")

TARGET_CERT=$(echo "$SETTINGS" | jq -r '.target_certification // empty')
if [ "$TARGET_CERT" = "IR" ]; then
    log_success "Updated user settings (target cert: IR)"
else
    log_fail "Failed to update user settings"
    echo "$SETTINGS" | jq '.'
fi

# Summary
echo ""
echo "==========================================="
echo "Test Data Generation Complete!"
echo "==========================================="
echo ""
echo "Created:"
echo "  - 2 aircraft (N12345, PFCMFD01)"
echo "  - 4 flights (2 real, 2 simulator)"
echo "  - 3 budget cards"
echo "  - 3 expenses (all linked to budget cards)"
echo "  - User settings (target: IR)"
echo ""
echo "You can now run the smoke tests:"
echo "  API_BASE=$API_BASE ./tests/smoke_test.sh"
echo ""

# Clean up
rm -rf "$TMP_DIR"
log_success "Cleaned up temporary files"
