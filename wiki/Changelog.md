# Changelog

All notable changes to the TrueHour are documented here.

## Latest Changes

### Phase 4: Expense Tracking & Budget Integration Complete (2025-12-14)
- **Expense Management**: Full CRUD for aviation expenses
  - 9 expense categories (Fuel, Instructor, Rental, Insurance, Maintenance, Subscription, Membership, Supplies, Other)
  - Track vendor, date, amount, description, subcategory
  - Recurring expense support (monthly, quarterly, annual)
  - Tax deductible flag
  - `POST /api/expenses` - Create expense
  - `GET /api/expenses` - List with filtering (month, category, date range)
  - `PUT /api/expenses/{id}` - Update expense
  - `DELETE /api/expenses/{id}` - Delete expense
  - `GET /api/expenses/summary` - Aggregated statistics
- **Expense-Budget Linking**: Connect expenses to budget cards
  - Split expenses across multiple budget cards
  - `POST /api/expense-budget-links` - Create link
  - `GET /api/expense-budget-links/expense/{id}` - Get links for expense
  - `GET /api/expense-budget-links/budget-card/{id}` - Get expenses for budget
  - `DELETE /api/expense-budget-links/{id}` - Remove link
  - Validates amount doesn't exceed expense total
  - Prevents duplicate links with unique constraint
- **Budget Card Actual Amounts**: Real-time spending tracking
  - Budget cards auto-calculate actual_amount from linked expenses
  - SQL query with LEFT JOIN for efficient aggregation
  - Progress bars show budget utilization percentage
  - Over-budget warnings when actual > budgeted
- **Frontend Expense UI**: Comprehensive expense tracking interface
  - Month-grouped expense list with totals
  - Color-coded category badges
  - Filter by month and category
  - Summary cards (total count, total amount, average)
  - Link expenses to budget cards via modal dialog
  - Visual indication of existing links and remaining unlocked amount
  - Edit/delete actions with confirmation
  - Responsive design for mobile
- **Integration & Auto-save**: Seamless budget updates
  - Budget cards reload automatically after expense changes
  - UserDataManager.triggerAutoSave() called on all expense actions
  - No page refresh needed for budget updates
- **New files**:
  - `backend/app/routers/expense_budget_links.py` (135 lines)
  - `frontend/js/expenses.js` (650 lines)
  - Expense section and modals in index.html
  - Expense tracking CSS styles
- **Documentation**: [Expense Tracking Wiki](wiki/Expense-Tracking.md)

### Phase 3: Data Persistence 100% Complete (2025-12-04)
- **Save/Load API endpoints**: Complete user data management
  - `POST /api/user/save` - Persist all aircraft and budget state to PostgreSQL
  - `GET /api/user/load` - Load all data (aircraft, expenses, flights, settings, budget state)
  - `DELETE /api/user/data` - Safe delete with multi-step confirmation
  - `GET/PUT /api/user/settings` - User settings management
- **Budget/Training state persistence**: All training configuration now saved to database
  - Certification goal (PPL, IR, CPL, CFI, etc.) saved and restored
  - Current flight hours from ForeFlight import persisted
  - All 14 training settings (instructor rates, costs, contingency %) saved
  - Survives localStorage.clear() and browser session changes
  - Stored as JSONB column in user_settings table
  - Auto-save triggers on any certification or settings change
- **Auto-save system**: Debounced auto-save with 3-second delay
  - Triggers automatically on aircraft add/update/delete
  - Triggers on certification goal changes (targetCert dropdown)
  - Triggers on all 14 training settings field changes
  - Toggle on/off via hamburger menu
  - Status indicators show pending/saving/success/error states
  - Last saved timestamp persists to database and displays in menu
- **Custom modal dialogs**: No more browser popups
  - Three-step delete confirmation process
  - Live validation (type "DELETE" to confirm)
  - Keyboard shortcuts (Enter to confirm, Escape to cancel)
  - Centered dropdown menu with improved text alignment
- **Export/Import config**: Download and upload JSON configuration files
  - Exports all aircraft with metadata
  - Exports budget state (certification, hours, settings)
  - Import with option to save to database or load temporarily
- **Form accessibility improvements**: Full WCAG compliance
  - All 14 settings inputs have proper `<label>` elements with `for` attributes
  - All inputs have `name` attributes for better form handling
  - No more console warnings about missing labels or form field attributes
- **UI improvements**: Refined hamburger menu dropdown
  - All menu text centered for better visual balance
  - Consistent alignment for "Auto-Save: ON" and "Last saved:" timestamp
  - Clean, modern appearance with proper spacing
- **Session tracking**: UUID-based sessions with last-saved timestamps
- **Data persistence**: All aircraft and training data now survives localStorage.clear()
- **Onboarding improvements**: Auto-skips onboarding when data exists in database

### Phase 1: Backend Foundation Complete (2025-12-02)
- **PostgreSQL integration**: Full async PostgreSQL support with connection pooling
- **User aircraft CRUD API**: Complete REST API for managing personal aircraft
  - `GET /api/user/aircraft` - List all user aircraft with optional filtering
  - `GET /api/user/aircraft/{id}` - Get single aircraft details
  - `POST /api/user/aircraft` - Add new aircraft
  - `PUT /api/user/aircraft/{id}` - Update aircraft details
  - `DELETE /api/user/aircraft/{id}` - Remove aircraft
- **Expense tracking API**: Full expense management with filtering and aggregation
  - `GET /api/expenses` - List expenses with filtering (by aircraft, category, date range)
  - `GET /api/expenses/{id}` - Get single expense
  - `GET /api/expenses/summary` - Aggregated summary by category with statistics
  - `POST /api/expenses` - Add new expense
  - `PUT /api/expenses/{id}` - Update expense
  - `DELETE /api/expenses/{id}` - Delete expense
- **ForeFlight CSV import**: Full logbook import from ForeFlight exports (already working)
  - Multi-section CSV format support
  - Aircraft and flight data import
  - Simulator vs aircraft distinction
  - Automatic FAA data lookup for N-numbers
  - Deduplication on re-import
- **GHCR migration complete**: All workflows now push to GitHub Container Registry
  - `ghcr.io/fliteaxis/truehour-api:latest` - Stable API releases
  - `ghcr.io/fliteaxis/truehour-api:develop` - Development builds
  - `ghcr.io/fliteaxis/truehour-api:nightly` - Nightly FAA data updates
  - `ghcr.io/fliteaxis/truehour-frontend:latest` - Stable frontend
  - `ghcr.io/fliteaxis/truehour-frontend:develop` - Development frontend
- **Multi-platform images**: All images built for linux/amd64 and linux/arm64
- **Database schema**: Complete PostgreSQL schema with aircraft, expenses, flights, budgets, and reminders tables
- **Automated testing**: Comprehensive endpoint testing with 21 test cases covering CRUD, filtering, and error handling

### Automated Release System (2025-11-28)
- **Automatic releases on main branch merges**: Creates GitHub releases when PRs from develop are merged
- **Semantic versioning**: Automatic version bumping based on commit message conventions
  - `breaking:` or `major:` → Major version bump (x.0.0)
  - `feat:` or `feature:` → Minor version bump (0.x.0)
  - All other commits → Patch version bump (0.0.x)
- **Release notes generation**: Automatically extracts content from this changelog
- **Docker image tagging**: Images tagged with both `latest` and version number
- **Comprehensive release documentation**: Created [Release Process](Release-Process) guide

### FAA Lookup Bug Fixes & UX Improvements (2025-11-28)
- **Fixed API endpoint mismatch**: Updated health check to use `/tail-lookup-api/api/v1/health`
- **Fixed data source persistence**: Aircraft imported with FAA lookup now correctly save `source: 'faa'` property
- **Added data source badges**:
  - "✓ FAA Verified" badge (green) for FAA-sourced aircraft data
  - "ForeFlight" badge (blue) for ForeFlight CSV data
  - Badges display consistently in both CSV import modal and Manage Aircraft screen
- **Browser cache issue resolved**: Updated JavaScript correctly served after container rebuild
- **Example deployment configurations**:
  - `infrastructure/examples/docker-compose.basic.yml` - Simple deployment without FAA lookup
  - `infrastructure/examples/docker-compose.with-faa-lookup.yml` - Full deployment with tail-lookup
  - `infrastructure/examples/README.md` - Comprehensive deployment documentation

### tail-lookup Integration (2025-11-28)
- **Integrated tail-lookup service** for FAA aircraft data verification
- **Lightweight Python + SQLite architecture** (256MB memory)
- Profile-based conditional deployment (`profiles: [faa-lookup]`)
- Internal networking only (`expose: ["8080"]`)
- Environment variables:
  - `ENABLE_FAA_LOOKUP` - Toggle FAA lookup feature
  - `TAIL_LOOKUP_API_URL=http://tail-lookup:8080`
- Automatic daily FAA data updates via tail-lookup nightly builds
- Simpler service architecture with single lightweight container
- Verified working with local testing (N172SP, N55350)

### Build Performance Optimization (2025-11-28)
- **Parallelized multi-architecture builds** using GitHub Actions matrix strategy
- Split workflows into prepare, build (parallel), and merge jobs
- Build each platform separately using push-by-digest strategy
- Merge platform images into single multi-platform manifest
- Per-platform cache scoping for better efficiency
- Applied to: `docker-build.yml`, `docker-build-develop.yml`, `cron.yml`
- **Expected build time**: ~15 minutes (down from 45+ minutes, 3x speedup)

### Platform Support Changes (2025-11-28)
- **Dropped ARM v7 support** from all workflows (too slow, rarely used)
- Kept `linux/amd64` and `linux/arm64` (most common platforms)
- Updated all documentation to remove arm/v7 references

## Features

### Aircraft Import UI Redesign
- Replaced single "Aircraft Name" field with separate fields for Tail Number, Year, Make, and Model
- Fields display in 2x2 grid with larger text boxes for easier editing
- All fields pre-fill from logbook CSV data
- Added purple gradient button styling matching app theme
- Dropdown format changed to `[TailNumber] Type` (e.g., `[N52440] Cessna P172 Skyhawk Powermatic`)

### Simulator Support
- Fixed AATD simulator not appearing in import list
- Simulator time properly tracked from `SimulatedFlight` column
- Simulator fields auto-populate: "N/A" for Year/Make, type for Model (e.g., "AATD Simulator")

### Set as Default Feature
- Added "★ Set as Default" button to aircraft management form
- Button appears when viewing a non-default aircraft
- Matches existing button styling (btn-secondary)
- Automatically hides when aircraft is already default
- Updates dropdown to show ★ indicator after setting default
- Added "★ Set as default aircraft" checkbox to CSV import modal
- First aircraft in import list is checked by default
- Only one aircraft can be marked as default at a time
- Default aircraft is set automatically during import

### FAA Aircraft Lookup (Self-Hosted via tail-lookup)
- Automatic aircraft details lookup from FAA Registry for US aircraft (N-numbers)
- **Fully self-contained** - runs entirely in your infrastructure with no external API dependencies
- **Conditional deployment** - Enable/disable via environment flag (`ENABLE_FAA_LOOKUP`)
- Self-hosted tail-lookup service runs as Docker sidecar container using Compose profiles
- **No CORS issues** - dynamically proxied through nginx at `/tail-lookup-api/`
- Profile-based conditional deployment
- Opt-in feature (disabled by default) with checkbox toggle in UI
- Only attempts lookup for tail numbers starting with 'N'
- Shows data source badges: "✓ FAA Verified" (green), "ForeFlight" (blue)
- 24-hour cache duration to improve performance and reduce API calls
- Graceful fallback to ForeFlight CSV data if lookup fails or is disabled
- JSON API integration - no HTML scraping required
- Three deployment modes: Basic (no lookup), with tail-lookup service
- Dynamic nginx configuration based on deployment mode
- Automated deployment script with automatic profile selection
- Full Portainer support with native profile integration
- Automated daily database updates via tail-lookup nightly builds
- Environment configuration template with feature flags
- Debug function available in console: `AircraftLookup.testLookup('N12345')`

## Bug Fixes

- **CSV Format**: Dynamic header row detection for ForeFlight format changes
- **Data Loss**: Fixed aircraft import modal clearing data before use
- **Year Field**: Fixed Year field data flow from CSV to UI
- **equipType Field**: Fixed simulator detection by checking both `equipType (FAA)` and `equipType` fields
- **Default Values**: Pre-filled rate fields with defaults ($150 wet, $120 dry, $6/gal, 8 gal/hr)
- **Duplicate IDs**: Added random component to ID generation
- **Name Formatting**: Removed "Aircraft" suffix and replaced "AICSA" with "Piper"
- **Certification Reset**: Fixed certification dropdown not resetting aircraft hours to 0 when "None" is selected
- **FAA Lookup UX**: Replaced system alerts with inline status messages that auto-hide after 4 seconds
- **FAA Lookup Availability**: Checkbox automatically detects if tail-lookup API is available; disables and greys out with
  informational message when FAA lookup is not enabled in deployment

## Documentation

### Docs Folder Migration
- Migrated all documentation from `docs/` to `wiki/` for GitHub Wiki integration
- Updated `README.md` to reference wiki instead of docs
- Updated `.dockerignore` to exclude wiki folders
- Deleted `docs/` folder

## Related Documentation

- [Release Process](Release-Process) - How releases are created
- [Branch Strategy](Branch-Strategy) - Git workflow
- [GitHub Actions](GitHub-Actions) - CI/CD pipeline
- [Deployment Guide](Deployment) - Production deployment

---

**Note**: This changelog is used to generate release notes when PRs are merged from develop to main. Keep it up to date with all changes!
