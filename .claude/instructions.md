# FliteAxis / TrueHour - Claude Instructions

## Project Overview

**Brand**: FliteAxis
**Product**: TrueHour
**Purpose**: Aviation expense tracking application that calculates true hourly
flying costs by combining fixed expenses (insurance, subscriptions,
memberships) with variable costs (rental rates, fuel)

**Current Status**: Personal-first tool with potential SaaS expansion. Market
validation showed lukewarm interest, so focus is on building a functional
personal tool that may expand based on organic interest. Six-month checkpoint
(June 2026) to reassess SaaS viability.

**Core Insight**: Pilots significantly underestimate their true hourly flying
costs by only counting rental rates while ignoring fixed expenses.

---

## Technical Architecture

### Stack

- **Backend**: FastAPI (Python 3.12) with raw asyncpg for async PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 3 + Zustand
- **Database**: PostgreSQL 18 (containerized), SQLite FAA aircraft database
- **Web Server**: nginx (reverse proxy for frontend)
- **Containerization**: Docker (three-container architecture)
- **Deployment**: Local-first design; no cloud dependencies until validated

### Repository Structure

```
truehour/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, health endpoint
│   │   ├── models.py            # Pydantic models (request/response)
│   │   ├── postgres_database.py # Raw asyncpg database operations
│   │   ├── db_migrations.py     # Startup schema migrations
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic (budget_service.py)
│   │   └── utils/               # Helpers (gear_inference.py)
│   ├── scripts/                 # FAA data refresh, calculations
│   ├── tests/                   # unit/ and integration/ tests
│   ├── data/                    # FAA aircraft.db (SQLite)
│   ├── Dockerfile               # Multi-stage Python 3.12-slim
│   └── requirements.txt
├── frontend-react/
│   ├── src/
│   │   ├── features/            # Feature-based component organization
│   │   ├── components/common/   # Shared UI components
│   │   ├── store/               # Zustand state stores
│   │   ├── services/api.ts      # API client
│   │   ├── types/api.ts         # TypeScript interfaces
│   │   └── utils/               # PDF export, helpers
│   ├── package.json
│   └── vite.config.ts
├── infrastructure/
│   ├── docker-compose.yml       # Local dev stack
│   ├── init.sql                 # PostgreSQL schema
│   ├── Dockerfile.frontend-react
│   └── .env.example
├── .github/workflows/           # CI/CD pipelines
├── tests/                       # Smoke tests, test data generation
├── wiki/                        # GitHub Wiki source
├── CLAUDE.md                    # Development quick-reference
└── renovate.json                # Dependency update config
```

### Architecture Decisions

- Consolidated monorepo (not microservices) - simpler to maintain
- Raw asyncpg over SQLAlchemy ORM - lightweight async database access
- Custom startup migrations (`db_migrations.py`) instead of Alembic
- FAA data baked into nightly-rebuilt Docker images (SQLite, 308K+ aircraft)
- Single-user design (no user_id columns) - multi-tenancy deferred until
  SaaS validation
- MIT license with public repositories (FliteAxis GitHub organization)

---

## Git & Branching

### Branch Strategy

- `main` - production-ready, protected
- `develop` - integration branch for next release
- `feature/v{version}-description` - new features
- `fix/v{version}-description` - bug fixes
- `chore/description` - maintenance, deps, docs

**Flow**: `feature-branch` -> `develop` (PR) -> `main` (PR)

### Commit Conventions

- Conventional commits: `fix:`, `feat:`, `chore:`, `chore(deps):`, etc.
- Co-Authored-By tags for AI-assisted commits are expected and encouraged
- Focus on what changed and why

### Operations

- Merges, rebases, and resets are allowed when appropriate for the workflow
- Prefer merge commits for branch integration to preserve history
- Force pushes to `main` or `develop` require explicit confirmation
- Always create feature branches for non-trivial changes

---

## AI Practices

### Encouraged

- Use Claude Code and AI tooling for development, testing, and review
- Co-Authored-By attribution on AI-assisted commits for transparency
- AI-generated tests, documentation, and code are welcome
- Use AI for code review, security analysis, and dependency auditing

### Code Quality

- AI-generated code should meet the same quality bar as hand-written code
- All code must pass pre-commit hooks and CI checks
- Review AI suggestions critically - don't blindly accept

---

## Security Practices

### Code Security

- Follow OWASP Top 10 guidelines for all code changes
- Input validation via Pydantic models on all API endpoints
- No secrets in code, config files, or commit history
- Use environment variables for all sensitive configuration
- Pre-commit hooks include: Bandit (Python security), Gitleaks (secret
  scanning), private key detection

### CI Security Pipeline

- Semgrep SAST on every PR
- CodeQL analysis for Python
- Trivy container scanning on Docker images
- OWASP dependency check for known vulnerabilities
- SBOM generation and attestation on releases

### Docker Security

- Non-root users in all containers (appuser:1000)
- Multi-stage builds to minimize attack surface
- Slim/Alpine base images with minimal packages
- Health checks enabled on all services
- No curl in API image - use Python urllib for healthchecks

### Dependency Management

- Renovate automates dependency updates (Mondays before 6am ET)
- `minimumReleaseAge: 3 days` before adopting new versions
- Python 3.12 pinned (asyncpg incompatible with 3.13+)
- Major version bumps for fastapi/pydantic disabled (require manual review)
- FastAPI and Uvicorn must be updated together

---

## Data Import Requirements

### ForeFlight CSV Import

- Primary import source for flight data
- Handle distinction between:
  - **Simulated Instrument Time**: Time flying actual aircraft while
    practicing instrument procedures under a hood/foggles
  - **Simulated Flight Time**: Time in a simulator/training device (not
    actual flight time)
- These are different fields and must not be conflated
- Preserve all ForeFlight CSV columns during import

### Future Import Sources (Planned)

- Garmin Pilot
- MyFlightBook

---

## Feature Priorities

### Core Features (Phase 1 - Implemented)

- Expense tracking (recurring and one-time)
- ForeFlight CSV logbook import with deduplication
- Flight categorization and certification tracking
- True hourly cost calculation
- Budget cards with expense linking
- PDF export (reports, logbook summaries)

### Role-Based Onboarding

Support different pilot types with appropriate defaults:

- **Student Pilot**: Training-focused, certification tracking
- **Active Pilot**: Ongoing expense management, currency tracking
- **Advancing Pilot**: Additional ratings/certifications path
- **Owner/Operator**: Aircraft-specific costs, maintenance reserves

### Certification Tracking

- Medical certificate expiration
- Flight review (BFR) tracking
- Currency requirements (landings, night, IFR)
- Rating progression (PPL, IR, CPL, CFI)

---

## Development Guidelines

### Code Style

- Clean, readable Python following PEP 8
- 120 character line length (enforced by Black, Flake8, ESLint)
- Type hints for function signatures
- Docstrings for public functions and classes
- Meaningful variable names (aviation terminology where appropriate)
- TypeScript strict mode for frontend

### Database

- Raw asyncpg with parameterized queries (prevent SQL injection)
- Schema defined in `infrastructure/init.sql`
- Startup migrations in `backend/app/db_migrations.py` for schema evolution
- Foreign key constraints enabled
- Index frequently queried fields (date ranges, categories, status)

### API Design

- Health endpoint: `GET /api/v1/health`
- User endpoints: `GET/POST/PUT/DELETE /api/user/{resource}`
- Consistent error responses with meaningful status codes
- Input validation via Pydantic models
- Pagination for list endpoints

---

## Messaging & Copy Guidelines

### Tone

- Direct and factual, not hyperbolic
- Speak to pilots as peers (founder is a pilot)
- Focus on the "true cost revelation"

### Key Message

"Know What Flying Actually Costs You"

### Avoid

- Overpromising on market size or revenue potential
- Marketing buzzwords
- Claims about being "the only" or "the best"

### Financial Projections

When discussing market viability, use conservative estimates:

- Assume high churn (20-25%)
- Assume low conversion rates (<1% of addressable market)
- Focus on profitability at small scale (100-500 users)

---

## Domain Knowledge Reference

### True Hourly Cost Calculation

```
True Hourly Cost = (Annual Fixed Costs / Annual Flight Hours)
                 + Hourly Variable Costs
```

Example: $3,000 fixed costs / 50 hours = $60/hour hidden cost
Add to $180/hour rental = $240/hour true cost (33% higher than perceived)

### Common Aviation Expenses (Fixed)

- ForeFlight/Garmin Pilot subscription ($100-200/year)
- Renter's insurance ($200-400/year)
- Flying club membership ($100-500/month)
- Medical exam ($100-200 every 2-5 years)
- Flight review ($200-400 every 2 years)

### Common Aviation Expenses (Variable)

- Aircraft rental (wet rate: $150-250/hour typical)
- Fuel (if paying separately)
- Instructor fees ($50-100/hour)
- Landing fees
- Tie-down/parking

---

## Project Checkpoints

### June 2026 Checkpoint

Evaluate based on:

- Personal usage patterns (is it actually useful?)
- Any organic interest from other pilots
- Technical stability
- Time investment vs. value received

Decision: Continue as personal tool, pursue SaaS expansion, or sunset
