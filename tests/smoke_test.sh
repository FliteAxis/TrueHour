#!/bin/bash
# TrueHour v2.0 Smoke Test Suite
# Tests all major API endpoints to ensure the system is working correctly
# Can be run manually or as part of CI/CD pipeline
#
# Usage:
#   ./smoke_test.sh              - Run tests against existing data
#   GENERATE_DATA=true ./smoke_test.sh  - Generate test data first, then run tests

# Continue on errors to run all tests

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:8000}"
VERBOSE="${VERBOSE:-false}"
GENERATE_DATA="${GENERATE_DATA:-false}"

# Generate test data if requested
if [ "$GENERATE_DATA" = "true" ]; then
    echo "=========================================
  Generating Test Data
========================================="
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/generate_test_data.sh" ]; then
        API_BASE="$API_BASE" "$SCRIPT_DIR/generate_test_data.sh"
        echo ""
    else
        echo -e "${RED}✗${NC} Test data generator not found at $SCRIPT_DIR/generate_test_data.sh"
        exit 1
    fi
fi

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test functions
test_health_check() {
    log_info "Testing health check endpoint..."
    RESPONSE=$(curl -s "${API_BASE}/api/v1/health")
    STATUS=$(echo "$RESPONSE" | jq -r '.status')

    if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; then
        log_success "Health check endpoint working (status: $STATUS)"
        if [ "$VERBOSE" = "true" ]; then
            echo "$RESPONSE" | jq '.'
        fi
    else
        log_fail "Health check endpoint failed"
        echo "$RESPONSE"
    fi
}

test_faa_lookup() {
    log_info "Testing FAA aircraft lookup..."
    RESPONSE=$(curl -s "${API_BASE}/api/v1/aircraft/N172SP")
    MANUFACTURER=$(echo "$RESPONSE" | jq -r '.manufacturer')

    if [ "$MANUFACTURER" != "null" ] && [ -n "$MANUFACTURER" ]; then
        MODEL=$(echo "$RESPONSE" | jq -r '.model')
        GEAR=$(echo "$RESPONSE" | jq -r '.gear_type')
        COMPLEX=$(echo "$RESPONSE" | jq -r '.is_complex')
        log_success "FAA lookup working: $MANUFACTURER $MODEL (gear: $GEAR, complex: $COMPLEX)"
    else
        log_fail "FAA lookup failed"
        echo "$RESPONSE"
    fi
}

test_flights_list() {
    log_info "Testing flights list endpoint..."
    RESPONSE=$(curl -s -L "${API_BASE}/api/user/flights/")
    COUNT=$(echo "$RESPONSE" | jq 'length // 0')

    if [ "$COUNT" -ge 0 ] 2>/dev/null; then
        log_success "Flights list working ($COUNT flights found)"
    else
        log_fail "Flights list endpoint failed"
        echo "$RESPONSE"
    fi
}

test_aircraft_list() {
    log_info "Testing aircraft list endpoint..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/aircraft")
    COUNT=$(echo "$RESPONSE" | jq 'length')

    if [ "$COUNT" -ge 0 ] 2>/dev/null; then
        log_success "Aircraft list working ($COUNT aircraft found)"
    else
        log_fail "Aircraft list endpoint failed"
        echo "$RESPONSE"
    fi
}

test_budget_cards() {
    log_info "Testing budget cards endpoint..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/budget-cards/")
    COUNT=$(echo "$RESPONSE" | jq 'length')

    if [ "$COUNT" -ge 0 ] 2>/dev/null; then
        log_success "Budget cards working ($COUNT cards found)"

        # Test budget calculation if cards exist
        if [ "$COUNT" -gt 0 ]; then
            CARD=$(echo "$RESPONSE" | jq -r '.[0]')
            BUDGETED=$(echo "$CARD" | jq -r '.budgeted_amount')
            ACTUAL=$(echo "$CARD" | jq -r '.actual_amount')
            REMAINING=$(echo "$CARD" | jq -r '.remaining_amount')

            if [ "$BUDGETED" != "null" ]; then
                log_success "Budget calculations working (budgeted: \$$BUDGETED, actual: \$$ACTUAL, remaining: \$$REMAINING)"
            fi
        fi
    else
        log_fail "Budget cards endpoint failed"
        echo "$RESPONSE"
    fi
}

test_expenses() {
    log_info "Testing expenses endpoint..."
    RESPONSE=$(curl -s -L "${API_BASE}/api/user/expenses/")

    # Check if response is array or error object
    if echo "$RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
        COUNT=$(echo "$RESPONSE" | jq 'length')
        log_success "Expenses endpoint working ($COUNT expenses found)"
    elif echo "$RESPONSE" | jq -e '.detail' >/dev/null 2>&1; then
        DETAIL=$(echo "$RESPONSE" | jq -r '.detail')
        if [ "$DETAIL" = "No expenses found" ]; then
            log_success "Expenses endpoint working (0 expenses)"
        else
            log_fail "Expenses endpoint error: $DETAIL"
        fi
    else
        log_fail "Expenses endpoint failed"
        echo "$RESPONSE"
    fi
}

test_expense_budget_links() {
    log_info "Testing expense-budget-card linking..."

    # Get first expense if it exists
    EXPENSES=$(curl -s -L "${API_BASE}/api/user/expenses/")
    if echo "$EXPENSES" | jq -e 'type == "array" and length > 0' >/dev/null 2>&1; then
        EXPENSE_ID=$(echo "$EXPENSES" | jq -r '.[0].id')
        RESPONSE=$(curl -s "${API_BASE}/api/user/expense-budget-links/expense/${EXPENSE_ID}")

        if echo "$RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
            COUNT=$(echo "$RESPONSE" | jq 'length')
            log_success "Expense-budget links working ($COUNT links found for expense $EXPENSE_ID)"
        else
            log_fail "Expense-budget links endpoint failed"
            echo "$RESPONSE"
        fi
    else
        # No expenses, so skip this test
        log_success "Expense-budget links endpoint available (no expenses to test)"
    fi
}

test_csv_export_flights() {
    log_info "Testing flights CSV export..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/exports/flights/csv")
    LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')

    # Check if it's a CSV (should have header line at minimum)
    if echo "$RESPONSE" | head -1 | grep -q "Date,Aircraft"; then
        log_success "Flights CSV export working ($LINES lines)"
    else
        log_fail "Flights CSV export failed"
        echo "$RESPONSE" | head -5
    fi
}

test_csv_export_budget_cards() {
    log_info "Testing budget cards CSV export..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/exports/budget-cards/csv")

    if echo "$RESPONSE" | head -1 | grep -q "Category,Name"; then
        LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')
        log_success "Budget cards CSV export working ($LINES lines)"
    else
        log_fail "Budget cards CSV export failed"
        echo "$RESPONSE" | head -5
    fi
}

test_csv_export_aircraft() {
    log_info "Testing aircraft CSV export..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/exports/aircraft/csv")

    if echo "$RESPONSE" | head -1 | grep -q "Tail Number,Make"; then
        LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')
        log_success "Aircraft CSV export working ($LINES lines)"
    else
        log_fail "Aircraft CSV export failed"
        echo "$RESPONSE" | head -5
    fi
}

test_import_history() {
    log_info "Testing import history endpoint..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/import-history/")

    if echo "$RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
        COUNT=$(echo "$RESPONSE" | jq 'length')
        log_success "Import history working ($COUNT imports found)"
    else
        log_fail "Import history endpoint failed"
        echo "$RESPONSE"
    fi
}

test_user_settings() {
    log_info "Testing user settings endpoint..."
    RESPONSE=$(curl -s "${API_BASE}/api/user/settings")

    if echo "$RESPONSE" | jq -e '.target_certification' >/dev/null 2>&1; then
        TARGET_CERT=$(echo "$RESPONSE" | jq -r '.target_certification // "none"')
        log_success "User settings working (target cert: $TARGET_CERT)"
    else
        log_fail "User settings endpoint failed"
        echo "$RESPONSE"
    fi
}

test_data_management() {
    log_info "Testing data management endpoint availability..."

    # Note: We don't actually DELETE data in smoke tests, just verify endpoint exists
    # The endpoint requires a DELETE request, so we test with OPTIONS to check availability
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${API_BASE}/api/data/delete-all")

    # OPTIONS might return 405 (Method Not Allowed) or 200, both mean endpoint exists
    # 404 would mean endpoint doesn't exist
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "204" ]; then
        log_success "Data management endpoint available"
    elif [ "$HTTP_CODE" = "404" ]; then
        log_fail "Data management endpoint not found"
    else
        log_success "Data management endpoint available (HTTP $HTTP_CODE)"
    fi
}

# Main test execution
echo "========================================="
echo "  TrueHour v2.0 Smoke Test Suite"
echo "========================================="
echo "API Base: $API_BASE"
echo "Verbose: $VERBOSE"
echo ""

# Run all tests
test_health_check
test_faa_lookup
test_flights_list
test_aircraft_list
test_budget_cards
test_expenses
test_expense_budget_links
test_import_history
test_user_settings
test_data_management
echo ""
log_info "Testing CSV exports..."
test_csv_export_flights
test_csv_export_budget_cards
test_csv_export_aircraft

# Summary
echo ""
echo "========================================="
echo "  Test Results"
echo "========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ Smoke tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All smoke tests PASSED${NC}"
    exit 0
fi
