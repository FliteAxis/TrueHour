# Changelog

All notable changes to TrueHour will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-01-03

### 🎉 Complete Rewrite - Modern React Frontend

TrueHour v2.0 is a ground-up rewrite with a modern React frontend, PostgreSQL database, and FastAPI backend.

### ✨ Added

#### Frontend & UI
- **Modern React 18 Frontend** with TypeScript for type safety
- **Vite** build system for fast development and optimized production builds
- **Tailwind CSS** for responsive, modern styling
- **Zustand** state management for efficient data flow
- **Recharts** for interactive data visualizations
- Dark-themed aviation-focused UI with custom color palette
- Responsive mobile-first design
- Hamburger navigation menu with all major sections

#### Flight Logging
- **ForeFlight CSV Import** with automatic aircraft detection
- Manual flight entry with comprehensive field support
- Import history tracking with hours breakdown
- Duplicate flight detection during import
- Flight filtering by date range, aircraft, and search terms
- Flight sorting and pagination
- Complete hour tracking:
  - Total, PIC, SIC, Solo time
  - Night, Cross-Country time
  - Actual/Simulated Instrument time
  - Dual Given/Received time
  - Complex, High Performance time
- Takeoff and landing counters (day/night)
- Approach and hold tracking
- Distance tracking for cross-country requirements
- Route and comments fields

#### Aircraft Management
- **FAA Aircraft Database Integration** (308K+ aircraft)
- Real-time N-number lookup from FAA registry
- Auto-population of make, model, year, category/class
- Gear type and engine type inference
- Aircraft rate management:
  - Wet rate (with fuel)
  - Dry rate (without fuel)
  - Fuel price per gallon
  - Fuel burn rate (gal/hr)
- Aircraft characteristics tracking:
  - Complex (retractable gear, constant-speed prop)
  - High Performance (>200hp)
  - TAA (Technically Advanced Aircraft)
  - Simulator/FTD designation
- Active/inactive status for aircraft fleet management
- Aircraft sorting by tail number, status, and type
- FAA data source attribution

#### Budget Cards v2.0
- **Smart Budget Card System** with aircraft linkage
- Budget card categories:
  - Flight Hours
  - Instruction
  - Training
  - Fees & Testing
  - Equipment
  - Medical
  - Insurance
  - Other (custom)
- **Quick Start Templates** for common budget items:
  - PPL training hours and instruction
  - IR training hours and instruction
  - CPL training requirements
  - Written exams and checkride fees
  - Equipment (headset, iPad, ForeFlight)
  - Medical certificates
  - Ground school
- **Aircraft-Linked Budget Cards**:
  - Auto-calculate cost from hours × aircraft rate
  - Support for wet rate, dry rate, or fuel cost
  - Recalculate when aircraft rates change
- Manual amount budget cards
- Budget card status (Active, Completed, Archived)
- "When" date for budget planning (monthly, quarterly, yearly)
- Real-time budget vs actual tracking
- Budget summary by category with totals
- Notes field for additional details

#### Expense Tracking
- Comprehensive expense management system
- Expense categories matching budget categories
- Payment method tracking (Cash, Credit, Debit, Check, Transfer, etc.)
- Vendor tracking
- **Budget Card Linking**:
  - Link expenses to one or multiple budget cards
  - Many-to-many expense-budget relationships
  - Real-time "actual spent" calculations
- Expense filtering by date range and category
- Category-based expense summaries
- Notes field for receipts and details

#### Certification Progress Tracking
- **Three Certification Types**: PPL, IR, CPL
- Automatic hour calculations from flight logs
- **Private Pilot (PPL) Requirements** (9 tracked):
  - Total Time (40hrs)
  - Dual Received (20hrs)
  - Solo Time (10hrs)
  - Solo Cross-Country (5hrs)
  - Solo Long XC (150nm, 3 stops)
  - Night Dual (3hrs)
  - Night Solo (10 T/Os & Landings)
  - Instrument Training (3hrs)
  - Checkride Prep (3hrs recent)
- **Instrument Rating (IR) Requirements** (6 tracked):
  - Total Time (50hrs)
  - Cross-Country PIC (50hrs)
  - Instrument Time (40hrs)
  - Instrument with Instructor (15hrs)
  - 250nm Instrument XC with 3 approaches
  - Approaches (50 total)
- **Commercial Pilot (CPL) Requirements** (11 tracked):
  - Total Time (250hrs)
  - PIC (100hrs)
  - Cross-Country PIC (50hrs)
  - Night (5hrs)
  - Night Towered Operations (10 T/Os & Landings)
  - Solo/PIC (10hrs)
  - Instrument Time (10hrs)
  - Training in Complex/TAA (10hrs)
  - Solo 2hr Day XC (100nm)
  - Solo 2hr Night XC (100nm)
  - Solo Long XC (300nm+, 3 stops, 1 leg 250nm+)
- **Qualifying Flight Detection**:
  - Automatic detection of flights satisfying specific requirements
  - Distance-based XC detection
  - Solo long cross-country identification
  - Night operations tracking
  - Approach counting
- Progress bars and completion percentages
- Detailed hour breakdowns by requirement
- Visual progress indicators

#### Dashboard
- Summary cards:
  - Total flight hours
  - Budget overview (planned vs actual)
  - Active budget card count
  - Certification progress widget
- **Budget Donut Chart** showing spending by category
- Quick access to all major features
- Real-time data updates

#### Reports & Exports
- **CSV Exports**:
  - Flight log export with all fields and totals
  - Budget cards export with aircraft linkage
  - Expenses export with categories and vendors
  - Aircraft export with specifications and rates
  - Date-based filtering for flights and expenses
- **PDF Reports**:
  - Budget Summary Report (with donut chart)
  - Certification Progress Report (PPL/IR/CPL with selector)
  - Flight Log Report (formatted table with totals)
  - Annual Budget Report (year-end summary)
- Report year selection (current year + 5 years back)
- Auto-generated filenames with export date
- Professional formatting with TrueHour branding

#### Settings & Configuration
- **Target Certification Selection** (PPL, IR, CPL, CFI)
- **Training Settings**:
  - Instructor hourly rate
  - Simulator hourly rate
  - Training pace (lessons per week)
  - Weekly buffer percentage
- **Custom Budget Categories**:
  - Add/remove budget categories
  - Categories used across budget cards and expenses
- Persistent settings storage
- User data management

### 🏗️ Technical Architecture

#### Backend
- **FastAPI** Python web framework
- **PostgreSQL 16** primary database
- **SQLite** FAA aircraft database
- **asyncpg** for async PostgreSQL operations
- **Pydantic** for data validation
- RESTful API design
- CORS configuration for frontend
- Automatic database migrations
- Health check endpoints
- Comprehensive error handling

#### Database Schema
- `flights` table with 30+ columns
- `aircraft` table with FAA data support
- `budget_cards` table with aircraft linkage
- `expenses` table with category tracking
- `expense_budget_links` many-to-many relationship
- `import_history` for ForeFlight imports
- `user_data` JSON field for settings
- Foreign key relationships
- Indexes on frequently queried fields
- Unique constraints where appropriate

#### Deployment
- **Docker Compose** multi-container setup
- Three services: frontend, backend, database
- Volume persistence for data
- Health checks and auto-restart
- Environment variable configuration
- Multi-stage Docker builds for optimization
- Production-ready containerization

### 🔧 Changed

- Complete UI redesign from HTML/CSS to React + Tailwind
- Database migration from SQLite to PostgreSQL
- Backend rewrite from Python scripts to FastAPI
- Build system changed from simple HTML to Vite
- State management moved to Zustand
- Navigation changed to hamburger menu
- Dark theme as primary design

### 🗑️ Removed

- Old HTML/CSS frontend
- Phase 1/2 legacy code
- SQLite as primary database (kept for FAA data only)
- Inline JavaScript scripts
- Manual HTML report generation

### 🐛 Fixed

- CSV import duplicate detection
- Aircraft matching during ForeFlight import
- Hour calculation accuracy for certifications
- Cross-country distance requirements
- Qualifying flight detection logic
- Budget vs actual calculation errors
- PDF export font readability (dark text on light background)
- TypeScript compilation errors
- React state management issues
- CORS configuration for development

### 📚 Documentation

- Complete README rewrite for v2.0
- Installation guide (Docker and development)
- Comprehensive user guide
- API documentation via FastAPI Swagger UI
- Database schema documentation
- Troubleshooting guide
- Contributing guidelines
- Changelog (this file)

### 🚀 Performance

- Fast React rendering with Zustand
- Vite HMR for instant development updates
- Async database operations
- Efficient PostgreSQL queries with indexes
- Lazy loading of components
- Optimized Docker images
- Production build optimizations

### 🔒 Security

- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping
- CORS configuration
- Environment variable secrets
- No hardcoded credentials
- Validated user inputs

---

## [1.x] - Legacy Version

TrueHour v1.x was the original HTML/CSS/JavaScript implementation with SQLite database. It provided basic flight logging, aircraft management, and budget tracking functionality.

### Features (v1.x)
- Flight log with manual entry
- Basic aircraft management
- Simple budget tracking
- HTML-based reports
- SQLite database
- Local-only operation

**Note**: v1.x is deprecated. Users should migrate to v2.0.

---

## Roadmap

### [2.1.0] - Planned (Q1-Q2 2026)

#### Reports & Analysis
- Expense report PDFs by category
- Budget templates library
- Multi-year budget planning
- Flight history charts (burndown, monthly trends)
- Budget vs actual visualizations
- Cost per hour analysis
- Training pace actual vs planned

#### User Experience
- Automatic training pace calculation from flight history
- Checkride prep recent hours calculator (date-based)
- Mobile responsive improvements
- Onboarding wizard for new users
- Tooltips and contextual help
- Keyboard shortcuts

#### Export Improvements
- General CSV import (not just ForeFlight)
- Custom PDF templates
- Export to Excel with formulas
- iCloud/Google Drive backup

### [2.2.0] - Future (Q3-Q4 2026)

#### Advanced Features
- Currency tracking (instrument, night, passenger-carrying)
- Reminders system:
  - Medical certificate expiration
  - Flight review due date
  - Endorsement expirations
  - Currency warnings
- Calendar integration (Google Calendar, iCal)
- Multi-user support with authentication
- Cloud sync across devices
- Tax reporting features

#### Notifications
- Slack/Discord webhooks
- Email notifications
- Push notifications (if mobile app)

#### Mobile App
- React Native mobile app
- iOS and Android support
- Offline-first design
- Mobile-optimized UI

### [3.0.0] - Vision (2027+)

- AI-powered budget recommendations
- Flight planning integration
- Weather integration
- Airport information database
- Fuel price tracking
- Maintenance tracking and reminders
- Insurance policy tracking
- Partnership with flight schools
- Instructor portal
- Student progress tracking (CFI features)
- Multi-currency support
- International certification tracking (EASA, Transport Canada, etc.)

---

## Upgrade Guide

### Upgrading from v1.x to v2.0

**⚠️ Breaking Changes**: v2.0 is a complete rewrite and cannot directly upgrade from v1.x.

**Migration Path**:

1. **Export data from v1.x**:
   - Export your logbook to CSV if possible
   - Note your aircraft list
   - Save budget information

2. **Install v2.0** (see [INSTALLATION.md](INSTALLATION.md))

3. **Import data into v2.0**:
   - Use ForeFlight CSV import if you have it
   - Or manually re-enter aircraft and flights
   - Recreate budget cards using Quick Start templates
   - Re-enter expenses

**Data Migration Tools**:
- v1.x SQLite to v2.0 PostgreSQL converter (planned for v2.0.1)

### Upgrading v2.0.x

```bash
# With Docker
cd infrastructure
docker-compose down
git pull origin main
docker-compose up -d --build

# Development mode
git pull origin main
cd backend && pip install -r requirements.txt --upgrade
cd frontend-react && npm install
```

Database migrations run automatically on startup.

---

## Contributors

- **Ryan Kelch** - Original Author & Lead Developer

## License

TrueHour is released under the [MIT License](../LICENSE).

---

**Questions or issues?** Open an issue on [GitHub](https://github.com/FliteAxis/TrueHour/issues)

**Happy Flying!** 🛩️
