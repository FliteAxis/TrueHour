# TrueHour v2.0 Test Suite

This directory contains automated tests for TrueHour v2.0.

## Smoke Tests

The smoke test suite (`smoke_test.sh`) verifies that all major API endpoints are working correctly. This is a comprehensive end-to-end test that should be run:

- **Before deploying** to production
- **After making changes** to API endpoints
- **As part of CI/CD** pipeline
- **When troubleshooting** issues

### Running Smoke Tests

```bash
# Run with default settings (http://localhost:8000)
./tests/smoke_test.sh

# Generate test data automatically, then run tests
GENERATE_DATA=true ./tests/smoke_test.sh

# Run against different API endpoint
API_BASE=http://production.example.com ./tests/smoke_test.sh

# Run with verbose output
VERBOSE=true ./tests/smoke_test.sh

# Combine options
GENERATE_DATA=true VERBOSE=true ./tests/smoke_test.sh
```

### What's Tested

The smoke test suite includes **14 comprehensive tests**:

1. **Health Check** - Verifies backend is running and FAA database is loaded
2. **FAA Aircraft Lookup** - Tests aircraft lookup with N172SP and validates enriched data (gear type, complex, high performance)
3. **Flights List** - Verifies flight log endpoint returns flights
4. **Aircraft List** - Tests user aircraft CRUD endpoint
5. **Budget Cards** - Validates budget card retrieval
6. **Budget Calculations** - Verifies budget vs actual vs remaining calculations
7. **Expenses** - Tests expense tracking endpoint
8. **Expense-Budget Links** - Validates many-to-many expense-budget card linking
9. **Import History** - Tests ForeFlight CSV import tracking
10. **User Settings** - Validates user configuration endpoint
11. **Data Management** - Verifies delete-all endpoint availability (doesn't actually delete in tests)
12. **Flights CSV Export** - Tests CSV export with real flight data
13. **Budget Cards CSV Export** - Tests budget card CSV generation
14. **Aircraft CSV Export** - Validates aircraft data export

### Exit Codes

- `0` - All tests passed ✅
- `1` - One or more tests failed ❌

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Smoke Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 10
      - name: Run smoke tests
        run: ./tests/smoke_test.sh
```

### Adding New Tests

To add a new test to the smoke test suite:

1. Create a new function in `smoke_test.sh` following the pattern:

```bash
test_my_new_feature() {
    log_info "Testing my new feature..."
    RESPONSE=$(curl -s "${API_BASE}/api/my-endpoint")

    if [ condition ]; then
        log_success "My feature working"
    else
        log_fail "My feature failed"
        echo "$RESPONSE"
    fi
}
```

2. Call your test function in the main execution section
3. Update this README with the new test description

## Test Data

### Automated Test Data Generation

The `generate_test_data.sh` script creates a complete test dataset including:

- **2 aircraft**: N12345 (C172 Skyhawk) and PFCMFD01 (simulator)
- **4 flights**: 2 real aircraft flights + 2 simulator sessions
- **3 budget cards**: Training budget, aircraft rental budget, and annual insurance
- **3 expenses**: Linked to budget cards for testing expense tracking
- **User settings**: Configured with target certification (IR)

Run the generator manually:
```bash
./tests/generate_test_data.sh
```

Or use the `GENERATE_DATA=true` flag with smoke tests to generate data automatically before testing.

### Manual Test Data

The smoke tests use real data from the running instance. For consistent test results:

- Use `generate_test_data.sh` for automated test data generation
- Or use the provided ForeFlight CSV test files in the repo root
- Run tests against a clean database state for reproducibility

## Requirements

- `curl` - For HTTP requests
- `jq` - For JSON parsing
- Running TrueHour v2.0 backend (port 8000 by default)

## Troubleshooting

### Tests failing with connection errors

Ensure the backend is running:
```bash
curl http://localhost:8000/api/v1/health
```

### FAA lookup tests failing

Verify the FAA database is loaded:
```bash
ls -lh backend/data/aircraft.db
```

Should show ~25MB file.

### Database state causing inconsistent results

Reset the database to a known state:
```bash
docker-compose down -v
docker-compose up -d
```

Then re-import test data before running smoke tests.

## Future Enhancements

- [ ] Add unit tests for individual functions
- [ ] Add integration tests for complex workflows
- [ ] Add load/performance testing
- [ ] Add security testing (SQL injection, XSS, etc.)
- [ ] Add API contract testing with OpenAPI spec
- [ ] Add frontend E2E tests with Playwright/Cypress
