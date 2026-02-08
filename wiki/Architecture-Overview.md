# TrueHour v2.0 Architecture Overview

Complete architectural documentation for TrueHour v2.0 - a modern, full-stack aviation training management system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Architecture](#database-architecture)
7. [API Design](#api-design)
8. [Data Flow](#data-flow)
9. [Deployment Architecture](#deployment-architecture)
10. [Security](#security)
11. [Performance](#performance)
12. [Future Enhancements](#future-enhancements)

---

## System Overview

TrueHour v2.0 is a local-first, containerized web application for aviation flight training management. It consists of three main components running in Docker containers:

1. **React Frontend** - Modern single-page application (SPA)
2. **FastAPI Backend** - Python REST API with async operations
3. **PostgreSQL Database** - Primary data store with JSONB support

The application also includes:
- **SQLite FAA Database** - 308K+ aircraft lookup (embedded in backend)
- **Docker Compose** - Container orchestration
- **Nginx** - Production frontend serving (future)

**Design Philosophy:**
- Local-first (no cloud dependencies)
- Privacy-focused (data never leaves your machine)
- Self-contained (batteries included)
- Modern tech stack (React 18, FastAPI, PostgreSQL 16)
- Docker-based (consistent across platforms)

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI framework with hooks and concurrent features |
| **TypeScript** | 5.6+ | Type safety and developer experience |
| **Vite** | 5.4+ | Fast build tool with HMR |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **Zustand** | 5.0+ | Lightweight state management |
| **Recharts** | 2.12+ | Chart visualizations |
| **jsPDF** | 2.5+ | PDF generation |
| **html2canvas** | 1.4+ | Chart rendering for PDFs |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Programming language |
| **FastAPI** | 0.115+ | Modern async web framework |
| **Pydantic** | 2.9+ | Data validation and settings |
| **asyncpg** | 0.30+ | Async PostgreSQL driver |
| **SQLite3** | 3.x | FAA aircraft database |
| **Uvicorn** | 0.32+ | ASGI server |

### Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **PostgreSQL** | 16+ | Primary relational database |
| **SQLite** | 3.x | FAA aircraft lookup database |

### DevOps

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Docker** | 20.10+ | Containerization |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **GitHub Actions** | - | CI/CD (future) |

---

## Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Browser                              │
│                      (User Interface)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP / REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Docker Compose                               │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │   Frontend      │  │   Backend API    │  │   PostgreSQL   ││
│  │   Container     │  │   Container      │  │   Container    ││
│  ├─────────────────┤  ├──────────────────┤  ├────────────────┤│
│  │ React + Vite    │  │ FastAPI          │  │ PostgreSQL 16  ││
│  │ Tailwind CSS    │◄─┤ Python 3.11      │◄─┤                ││
│  │ Zustand         │  │ asyncpg          │  │ Data:          ││
│  │ TypeScript      │  │ Pydantic         │  │ • flights      ││
│  │                 │  │                  │  │ • aircraft     ││
│  │ Port: 3000      │  │ FAA SQLite DB    │  │ • budget_cards ││
│  │                 │  │ (308K aircraft)  │  │ • expenses     ││
│  │                 │  │                  │  │ • user_data    ││
│  │                 │  │ Port: 8000       │  │ Port: 5432     ││
│  └─────────────────┘  └──────────────────┘  └────────────────┘│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Container Communication

```
Frontend (React)
    │
    │ HTTP REST API (axios)
    │ http://localhost:8000/api/*
    ▼
Backend (FastAPI)
    │
    ├─► PostgreSQL (asyncpg)
    │   postgresql://truehour:password@db:5432/truehour
    │   • User data (flights, budget, expenses)
    │   • Settings and preferences
    │
    └─► SQLite (sqlite3)
        /app/data/aircraft.db
        • FAA aircraft database (read-only)
        • 308K+ US aircraft registrations
```

---

## Frontend Architecture

### Directory Structure

```
frontend-react/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx           # Main layout with navigation
│   │   ├── Modal.tsx            # Modal dialog component
│   │   └── LoadingSpinner.tsx   # Loading indicators
│   │
│   ├── features/         # Feature-specific components
│   │   ├── dashboard/           # Dashboard view
│   │   ├── flights/             # Flight logging
│   │   ├── aircraft/            # Aircraft management
│   │   ├── budget/              # Budget cards
│   │   ├── expenses/            # Expense tracking
│   │   ├── certification/       # Certification progress
│   │   ├── reports/             # Reports & exports
│   │   └── settings/            # Settings & configuration
│   │
│   ├── services/         # API client
│   │   └── api.ts              # Centralized API calls
│   │
│   ├── store/            # Zustand state management
│   │   ├── useStore.ts         # Main store
│   │   └── types.ts            # Store types
│   │
│   ├── types/            # TypeScript definitions
│   │   └── api.ts              # API response types
│   │
│   ├── utils/            # Utility functions
│   │   ├── pdfExport.ts        # PDF generation
│   │   ├── calculations.ts     # Hour calculations
│   │   └── formatters.ts       # Data formatting
│   │
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
│
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
└── tsconfig.json         # TypeScript config
```

### State Management (Zustand)

TrueHour uses Zustand for lightweight, efficient state management:

**Store Structure:**
```typescript
interface AppState {
  // UI State
  currentView: string;
  isLoading: boolean;

  // Data State
  flights: Flight[];
  aircraft: Aircraft[];
  budgetCards: BudgetCard[];
  expenses: Expense[];
  userData: UserData | null;

  // Actions
  setCurrentView: (view: string) => void;
  fetchFlights: () => Promise<void>;
  fetchAircraft: () => Promise<void>;
  // ... other actions
}
```

**Benefits:**
- No boilerplate (compared to Redux)
- TypeScript-friendly
- React hooks integration
- Small bundle size (~1KB)
- Easy to test

### Component Architecture

**Layout Hierarchy:**
```
App
 └─ Layout
     ├─ Navigation (hamburger menu)
     └─ View Container
         ├─ Dashboard
         ├─ FlightsView
         ├─ AircraftView
         ├─ BudgetView
         ├─ ExpensesView
         ├─ CertificationProgressView
         ├─ ReportsView
         └─ SettingsView
```

**Component Patterns:**
- **Container Components** - Fetch data, manage state (e.g., FlightsView)
- **Presentational Components** - Render UI (e.g., FlightCard)
- **Modal Components** - Dialogs for add/edit operations
- **Form Components** - Reusable form inputs with validation

### API Client (`services/api.ts`)

Centralized API client using `fetch`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function getFlights(): Promise<Flight[]> {
  const response = await fetch(`${API_BASE}/api/flights`);
  if (!response.ok) throw new Error('Failed to fetch flights');
  return response.json();
}

export async function createFlight(flight: FlightCreate): Promise<Flight> {
  const response = await fetch(`${API_BASE}/api/flights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flight),
  });
  if (!response.ok) throw new Error('Failed to create flight');
  return response.json();
}
```

**Benefits:**
- Single source of truth for API endpoints
- Consistent error handling
- Type-safe requests and responses
- Easy to mock for testing

### Routing

TrueHour uses **view-based routing** (not React Router):
- Single-page application with conditional rendering
- `currentView` state determines which component to show
- No URL-based routing (simplicity, local-first focus)
- Hamburger menu for navigation

**Future Enhancement:** Could add React Router for URL-based navigation and deep linking.

---

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── routers/              # API route modules
│   │   ├── flights.py               # Flight endpoints
│   │   ├── aircraft.py              # Aircraft endpoints
│   │   ├── budget_cards.py          # Budget card endpoints
│   │   ├── expenses.py              # Expense endpoints
│   │   ├── exports.py               # CSV export endpoints
│   │   ├── import_history.py        # Import history endpoints
│   │   └── user_data.py             # User data endpoints
│   │
│   ├── main.py               # FastAPI app entry point
│   ├── models.py             # Pydantic models
│   ├── database.py           # Database connection (deprecated)
│   ├── postgres_database.py  # PostgreSQL connection pool
│   ├── db_migrations.py      # Database schema migrations
│   └── faa_lookup.py         # FAA aircraft lookup logic
│
├── data/
│   └── aircraft.db           # SQLite FAA aircraft database
│
├── scripts/
│   ├── download_faa_data.py  # Download FAA data
│   └── build_aircraft_db.py  # Build SQLite database
│
├── requirements.txt          # Python dependencies
├── Dockerfile               # Container build instructions
└── .env.example             # Environment template
```

### FastAPI Application (`main.py`)

**Key Features:**
- **Lifespan Context Manager** - Database connection pool management
- **CORS Middleware** - Allow frontend to call backend
- **Router Registration** - Modular route organization
- **Auto Documentation** - Swagger UI at `/docs`
- **Health Check** - `/api/health` endpoint

**Example:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import flights, aircraft, budget_cards

app = FastAPI(title="TrueHour API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(flights.router)
app.include_router(aircraft.router)
app.include_router(budget_cards.router)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

### Database Connection (`postgres_database.py`)

**Connection Pooling:**
```python
import asyncpg

class PostgresDatabase:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            self.database_url,
            min_size=2,
            max_size=10,
        )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    def acquire(self):
        return self.pool.acquire()

postgres_db = PostgresDatabase(os.getenv("DATABASE_URL"))
```

**Benefits:**
- **Connection pooling** - Reuse connections, reduce overhead
- **Async operations** - Non-blocking I/O
- **Context manager** - Automatic connection management
- **Error handling** - Centralized error handling

### API Router Pattern

Each feature has its own router module:

**Example (`routers/flights.py`):**
```python
from fastapi import APIRouter, HTTPException
from app.models import Flight, FlightCreate
from app.postgres_database import postgres_db

router = APIRouter(prefix="/api/flights", tags=["Flights"])

@router.get("/", response_model=list[Flight])
async def get_flights():
    async with postgres_db.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM flights ORDER BY date DESC")
        return [dict(row) for row in rows]

@router.post("/", response_model=Flight)
async def create_flight(flight: FlightCreate):
    async with postgres_db.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO flights (...) VALUES (...) RETURNING *""",
            flight.date, flight.tail_number, ...
        )
        return dict(row)
```

**Benefits:**
- **Modular** - Each router is independent
- **Type-safe** - Pydantic models enforce types
- **Auto-docs** - FastAPI generates OpenAPI schema
- **Testable** - Easy to unit test each router

### Pydantic Models (`models.py`)

**Request/Response Models:**
```python
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class FlightBase(BaseModel):
    date: date
    tail_number: str
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    total_time: float = Field(..., gt=0)
    # ... other fields

class FlightCreate(FlightBase):
    pass

class Flight(FlightBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

**Benefits:**
- **Validation** - Automatic input validation
- **Serialization** - Convert between JSON and Python objects
- **Documentation** - OpenAPI schema generation
- **Type safety** - IDE autocomplete and type checking

### Database Migrations (`db_migrations.py`)

**Auto-Migration System:**
- Runs on backend startup
- Creates tables if they don't exist
- Adds columns if they're missing
- No manual SQL required

**Example:**
```python
async def run_migrations():
    async with postgres_db.acquire() as conn:
        # Create flights table if not exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS flights (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                tail_number TEXT NOT NULL,
                total_time NUMERIC NOT NULL,
                -- ... other columns
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
```

---

## Database Architecture

### PostgreSQL Schema

TrueHour uses PostgreSQL 16 with the following tables:

#### Core Tables

**1. `flights`** - Flight log entries

```sql
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    aircraft_id INTEGER REFERENCES aircraft(id),
    tail_number TEXT,
    departure_airport TEXT,
    arrival_airport TEXT,
    route TEXT,
    total_time NUMERIC NOT NULL,
    pic_time NUMERIC DEFAULT 0,
    sic_time NUMERIC DEFAULT 0,
    night_time NUMERIC DEFAULT 0,
    solo_time NUMERIC DEFAULT 0,
    cross_country_time NUMERIC DEFAULT 0,
    actual_instrument_time NUMERIC DEFAULT 0,
    simulated_instrument_time NUMERIC DEFAULT 0,
    simulated_flight_time NUMERIC DEFAULT 0,
    dual_given_time NUMERIC DEFAULT 0,
    dual_received_time NUMERIC DEFAULT 0,
    complex_time NUMERIC DEFAULT 0,
    high_performance_time NUMERIC DEFAULT 0,
    day_takeoffs INTEGER DEFAULT 0,
    day_landings_full_stop INTEGER DEFAULT 0,
    night_takeoffs INTEGER DEFAULT 0,
    night_landings_full_stop INTEGER DEFAULT 0,
    all_landings INTEGER DEFAULT 0,
    holds INTEGER DEFAULT 0,
    approaches TEXT,
    distance NUMERIC,
    instructor_name TEXT,
    pilot_comments TEXT,
    qualifying_flight_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flights_date ON flights(date);
CREATE INDEX idx_flights_aircraft_id ON flights(aircraft_id);
```

**2. `aircraft`** - User aircraft fleet

```sql
CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    tail_number TEXT UNIQUE NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    category_class TEXT,
    gear_type TEXT,
    engine_type TEXT,
    is_complex BOOLEAN DEFAULT FALSE,
    is_high_performance BOOLEAN DEFAULT FALSE,
    is_taa BOOLEAN DEFAULT FALSE,
    is_simulator BOOLEAN DEFAULT FALSE,
    wet_rate NUMERIC,
    dry_rate NUMERIC,
    fuel_price_per_gallon NUMERIC,
    fuel_burn_rate NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    data_source TEXT DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**3. `budget_cards`** - Budget planning cards

```sql
CREATE TABLE budget_cards (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC,
    when_date DATE,
    status TEXT DEFAULT 'active',
    aircraft_id INTEGER REFERENCES aircraft(id),
    associated_hours NUMERIC,
    hourly_rate_type TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_cards_category ON budget_cards(category);
CREATE INDEX idx_budget_cards_when_date ON budget_cards(when_date);
```

**4. `expenses`** - Expense tracking

```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    vendor TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

**5. `expense_budget_links`** - Many-to-many expense/budget relationships

```sql
CREATE TABLE expense_budget_links (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    budget_card_id INTEGER REFERENCES budget_cards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(expense_id, budget_card_id)
);
```

**6. `import_history`** - ForeFlight CSV import tracking

```sql
CREATE TABLE import_history (
    id SERIAL PRIMARY KEY,
    filename TEXT,
    imported_at TIMESTAMP DEFAULT NOW(),
    flights_imported INTEGER,
    hours_imported JSONB
);
```

**7. `user_data`** - Settings and preferences

```sql
CREATE TABLE user_data (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### SQLite FAA Database

**Location:** `backend/data/aircraft.db`

**Tables:**
- `master` - 308K+ US aircraft registrations
- `acftref` - Aircraft model reference data
- `metadata` - Database update tracking

**Schema:**
```sql
CREATE TABLE master (
    n_number TEXT PRIMARY KEY,
    serial_number TEXT,
    mfr_mdl_code TEXT,
    year_mfr INTEGER,
    -- ... FAA fields
);

CREATE TABLE acftref (
    code TEXT PRIMARY KEY,
    mfr TEXT,
    model TEXT,
    type_acft TEXT,
    type_eng TEXT,
    no_eng INTEGER,
    no_seats INTEGER
);

CREATE INDEX idx_mfr_mdl_code ON master(mfr_mdl_code);
```

**Update Process:**
- Manually run `scripts/download_faa_data.py`
- Parses FAA ReleasableAircraft.zip
- Rebuilds aircraft.db
- No automatic updates (by design, user controls data)

---

## API Design

### RESTful Endpoints

TrueHour follows REST principles with consistent patterns:

**URL Structure:**
```
/api/{resource}/{id?}/{action?}
```

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Delete resources

### Endpoint Inventory

#### Flights

```
GET    /api/flights                  # List all flights
POST   /api/flights                  # Create flight
GET    /api/flights/{id}             # Get single flight
PUT    /api/flights/{id}             # Update flight
DELETE /api/flights/{id}             # Delete flight
POST   /api/import-csv               # Import ForeFlight CSV
```

#### Aircraft

```
GET    /api/aircraft                 # List aircraft
POST   /api/aircraft                 # Create aircraft
GET    /api/aircraft/{id}            # Get single aircraft
PUT    /api/aircraft/{id}            # Update aircraft
DELETE /api/aircraft/{id}            # Delete aircraft
GET    /api/faa/{tail_number}        # FAA lookup
```

#### Budget Cards

```
GET    /api/budget-cards                        # List cards
POST   /api/budget-cards                        # Create card
GET    /api/budget-cards/{id}                   # Get single card
PUT    /api/budget-cards/{id}                   # Update card
DELETE /api/budget-cards/{id}                   # Delete card
GET    /api/budget-cards/summary-by-category   # Category summaries
```

#### Expenses

```
GET    /api/expenses                 # List expenses
POST   /api/expenses                 # Create expense
GET    /api/expenses/{id}            # Get single expense
PUT    /api/expenses/{id}            # Update expense
DELETE /api/expenses/{id}            # Delete expense
```

#### Exports

```
GET    /api/exports/flights/csv        # Export flights CSV
GET    /api/exports/budget-cards/csv   # Export budget cards CSV
GET    /api/exports/expenses/csv       # Export expenses CSV
GET    /api/exports/aircraft/csv       # Export aircraft CSV
```

#### User Data

```
GET    /api/user-data                  # Get user settings
POST   /api/user-data                  # Save user settings
GET    /api/import-history/latest      # Get latest import info
```

### Response Formats

**Success (200 OK):**
```json
{
  "id": 1,
  "date": "2026-01-03",
  "tail_number": "N172SP",
  "total_time": 1.5
}
```

**List (200 OK):**
```json
[
  { "id": 1, "date": "2026-01-03", ... },
  { "id": 2, "date": "2026-01-02", ... }
]
```

**Error (400/404/500):**
```json
{
  "detail": "Flight not found"
}
```

### Auto Documentation

FastAPI generates interactive API docs:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

## Data Flow

### Flight Logging Flow

1. User clicks "Add Flight" in frontend
2. React modal opens with form
3. User fills in flight details
4. User clicks "Save Flight"
5. Frontend validates data
6. Frontend calls `POST /api/flights` with JSON body
7. Backend receives request
8. Pydantic validates request body
9. Backend inserts row into `flights` table
10. PostgreSQL returns inserted row
11. Backend returns Flight object as JSON
12. Frontend updates Zustand store
13. Frontend re-renders FlightsView
14. User sees new flight in list

### Budget vs Actual Flow

1. User creates budget card: "$6,600 for 40 hours"
2. Backend stores in `budget_cards` table
3. User adds expense: "$165 flight on 2026-01-03"
4. Backend stores in `expenses` table
5. User links expense to budget card
6. Backend creates row in `expense_budget_links` table
7. Frontend requests budget card summary
8. Backend aggregates:
   ```sql
   SELECT bc.*, SUM(e.amount) as actual
   FROM budget_cards bc
   LEFT JOIN expense_budget_links ebl ON bc.id = ebl.budget_card_id
   LEFT JOIN expenses e ON ebl.expense_id = e.id
   GROUP BY bc.id
   ```
9. Backend returns: `{ budgeted: 6600, actual: 165, remaining: 6435 }`
10. Frontend displays budget card with progress bar

### FAA Aircraft Lookup Flow

1. User enters N-number in "Add Aircraft" form
2. User clicks "Lookup FAA Data"
3. Frontend calls `GET /api/faa/N172SP`
4. Backend normalizes N-number ("N172SP" → "172SP")
5. Backend queries SQLite aircraft.db:
   ```sql
   SELECT m.*, a.* FROM master m
   JOIN acftref a ON m.mfr_mdl_code = a.code
   WHERE m.n_number = '172SP'
   ```
6. Backend maps numeric codes to strings (type_acft: "4" → "Fixed Wing Single-Engine")
7. Backend returns aircraft data as JSON
8. Frontend pre-fills form fields
9. User adds rates and characteristics
10. User saves aircraft
11. Frontend calls `POST /api/aircraft`
12. Backend stores in PostgreSQL `aircraft` table

---

## Deployment Architecture

### Docker Compose Stack

**File:** `infrastructure/docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend-react
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://truehour:password@db:5432/truehour
    depends_on:
      - db
    volumes:
      - ./backend/data:/app/data

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=truehour
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=truehour
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Container Details

**Frontend Container:**
- Base: Node 18
- Build: `npm run build` (Vite production build)
- Serve: Dev server (port 3000) or Nginx (future)
- Size: ~200MB

**Backend Container:**
- Base: Python 3.11-slim
- Runtime: Uvicorn ASGI server
- Port: 8000
- FAA Database: Bundled in image
- Size: ~200MB

**Database Container:**
- Image: postgres:16
- Port: 5432 (internal)
- Data: Persistent volume
- Size: ~300MB

**Total Footprint:** ~700MB (containers + data)

---

## Security

### API Security

- **No Authentication** - Local-only application (by design)
- **CORS** - Restricted to frontend origins
- **Input Validation** - Pydantic validates all inputs
- **SQL Injection Protection** - Parameterized queries via asyncpg
- **XSS Protection** - React escapes all rendered content

### Container Security

- **Non-root User** - TODO: Add to Dockerfiles
- **Minimal Base Images** - slim variants reduce attack surface
- **No Secrets in Images** - Environment variables for configuration
- **Read-only FAA Database** - SQLite is read-only

### Data Security

- **Local-First** - Data never leaves your machine
- **No Telemetry** - No tracking or analytics
- **User-Controlled Backups** - CSV exports and pg_dump

---

## Performance

### Frontend Performance

- **Vite HMR** - Instant hot module replacement
- **Code Splitting** - Future: Lazy load routes
- **Tree Shaking** - Vite removes unused code
- **Bundle Size** - ~300KB gzipped (estimated)

### Backend Performance

- **Async I/O** - Non-blocking FastAPI operations
- **Connection Pooling** - Reuse PostgreSQL connections (max 10)
- **Efficient Queries** - Indexed columns, optimized JOINs
- **Response Time** - <50ms typical (local database)

### Database Performance

- **Indexes** - All foreign keys and date columns indexed
- **JSONB** - Efficient storage for qualifying_flight_metadata
- **Aggregations** - Budget vs actual uses efficient GROUP BY
- **Size** - ~1MB per 1000 flights (estimated)

---

## Future Enhancements

### v2.1 (Q1-Q2 2026)

- PDF report improvements
- Budget templates library
- Flight history charts
- Multi-year budget planning
- Training pace calculator
- Mobile responsive improvements

### v2.2 (Q3-Q4 2026)

- Currency tracking (instrument, night, passenger-carrying)
- Reminders system (medical, flight review, endorsements)
- Multi-user support with authentication
- Cloud sync (optional)
- Calendar integration
- React Native mobile app

### v3.0 (2027+)

- AI-powered budget recommendations
- Flight planning integration
- Weather integration
- Maintenance tracking
- Multi-currency support
- International certifications (EASA, Transport Canada)

---

## References

- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

**Last Updated:** 2026-01-03
**Version:** 2.0.0
**Status:** Production Ready
