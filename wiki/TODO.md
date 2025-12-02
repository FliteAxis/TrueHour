# TODO - TrueHour

## Feature Roadmap

This document tracks planned features and improvements for the TrueHour. Items are organized by priority and customer impact.

---

## Current Features

### ✅ Completed
- ForeFlight CSV import with aircraft recognition
- Multi-aircraft support
- Certification type selection (Private, IR, CPL, CFI, ATP)
- Real-time budget calculations with graphs
- PDF export with detailed breakdown
- Simulator aircraft support
- Set default aircraft
- Native upload UI for CSV import
- Dark mode support
- Multi-architecture Docker deployment (ARM/x64)

---

## Planned Features

### 🔴 High Priority (Customer Impact)

#### FAA Aircraft Lookup Integration
**Status**: ✅ COMPLETED (Implemented via tail-lookup service)
**Description**: Automatic aircraft verification using FAA registration database
- Self-hosted tail-lookup service for FAA data
- Automatic tail number validation
- Aircraft make/model verification
- Visual "✓ FAA Verified" indicators

**Implementation**:
- Lightweight Python + SQLite service (~256MB memory)
- Pre-built database in Docker image (no setup required)
- Automatic nightly FAA data updates via CI/CD
- Profile-based conditional deployment

---

#### Multi-Currency Support
**Priority**: High
**Description**: Allow users to calculate budgets in different currencies
- Support for USD, EUR, GBP, CAD, AUD
- Real-time or configurable exchange rates
- Currency selector in UI
- Formatted currency display throughout app

**Benefits**:
- International user support
- Flight schools in different countries
- Students training abroad

---

#### Budget Scenario Comparison
**Priority**: High
**Description**: Save and compare multiple training scenarios
- Save different aircraft/training combinations
- Side-by-side comparison view
- Visual differences in cost/time
- Export comparison reports

**Use Cases**:
- Compare Part 61 vs Part 141
- Compare different aircraft rental rates
- Compare different flight schools
- Time vs cost trade-offs

---

### 🟡 Medium Priority

#### Enhanced Export Options
**Priority**: Medium
**Description**: Additional export formats beyond PDF
- Excel spreadsheet export (.xlsx)
- CSV export for analysis
- Printable HTML summary
- Email-friendly format

---

#### Mobile UI Improvements
**Priority**: Medium
**Description**: Better mobile experience
- Touch-optimized controls
- Responsive tables
- Mobile-friendly graphs
- Simplified navigation
- Landscape orientation support

---

#### Aircraft Cost Templates
**Priority**: Medium
**Description**: Pre-configured aircraft cost templates
- Common training aircraft (Cessna 172, Piper PA-28, etc.)
- Regional average rental rates
- Instructor rate suggestions
- Ground school cost estimates

**Benefits**:
- Faster setup for new users
- Realistic cost estimates
- Compare against local rates

---

#### Progress Tracking
**Priority**: Medium
**Description**: Track actual flight time against budget
- Log completed flights
- Compare actual vs estimated costs
- Remaining budget calculation
- Progress visualization
- Milestone tracking

---

### 🟢 Low Priority (Nice to Have)

#### User Accounts
**Priority**: Low
**Description**: Optional user registration for cloud sync
- Save budgets to cloud
- Access from multiple devices
- Share with instructor/CFI
- Collaboration features

**Note**: Only if there's significant demand; keep app functional without accounts

---

#### Integration with ForeFlight
**Priority**: Low
**Description**: Automatic logbook sync
- Import actual flight hours
- Compare budgeted vs actual
- Progress tracking
- Cost per flight analysis

---

#### Flight School Management Features
**Priority**: Low
**Description**: Features for flight schools to manage students
- Student budget tracking
- School-wide aircraft rates
- Instructor scheduling integration
- Payment tracking

**Note**: Would require backend API and database

---

#### Dark Mode Enhancements
**Priority**: Low
**Description**: Improve dark mode experience
- Better contrast ratios
- Smoother transitions
- Per-user preference persistence
- Auto-switch based on time of day

---

## Quality of Life Improvements

### Data Validation
- Better error messages for invalid CSV files
- Real-time validation feedback
- Helpful suggestions for common errors
- Format examples/templates

### Performance Optimization
- Lazy load Chart.js library
- Optimize JavaScript bundle
- Add service worker for offline use
- Reduce initial page load time

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Font size controls

---

## Testing & Quality Assurance

### Ongoing Testing Needs
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Different screen sizes and resolutions
- [ ] PDF export on various browsers
- [ ] Large CSV file imports (100+ aircraft)
- [ ] Calculator accuracy verification

---

## Community Requests

### Feature Requests to Evaluate
*This section will be populated based on user feedback and GitHub issues*

**How to Request a Feature**:
1. Open an issue on GitHub: [github.com/ryakel/flight-budget/issues](https://github.com/ryakel/flight-budget/issues)
2. Use the "Feature Request" template
3. Describe the use case and benefit
4. Community can vote with 👍 reactions

---

## Technical Debt & Behind-the-Scenes

### Items Not Listed Here
This TODO focuses on customer-facing features. Technical items like infrastructure improvements, CI/CD enhancements, monitoring, and security updates are tracked separately and handled as part of ongoing maintenance.

---

## Contributing

Interested in contributing to any of these features? See our [Contributing Guide](Contributing.md) for:
- Development setup
- Code standards
- Pull request process
- Feature discussion guidelines

---

**Last Updated**: 2025-11-28
