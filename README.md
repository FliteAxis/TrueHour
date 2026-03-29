# TrueHour v2.0

**Personal aviation flight training management and expense tracking**

TrueHour is a local-first web application for tracking flight training progress, managing aviation expenses, and planning your path to pilot
certification. Built for pilots who want complete control over their data without relying on cloud services.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ What's New in v2.0

TrueHour v2.0 is a complete rewrite with:
- 🎨 **Modern React Frontend** - Fast, responsive UI with Tailwind CSS
- 💰 **Budget Cards v2.0** - Smart budget tracking with aircraft linkage and real-time calculations
- 📊 **Certification Progress** - Track PPL, IR, and CPL requirements with qualifying flights
- ✈️ **Enhanced Aircraft Management** - FAA lookup integration with sorting and filtering
- 📁 **Export System** - CSV and PDF reports for all your data
- 🎯 **Training Settings** - Customize rates, pace, and certification goals
- 💸 **Expense Tracking** - Link expenses to budget cards for accurate cost tracking

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour/infrastructure

# Copy environment file and start containers
cp .env.example .env
docker compose up -d

# Access the application
open http://localhost:8181
```

The React frontend runs on `http://localhost:8181` and the backend API on `http://localhost:8000`.

### Option 2: Development Mode

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend-react
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173` (Vite dev server).

## 📋 System Requirements

- **Docker**: 20.10+ (for containerized deployment)
- **OR Local Development**:
  - Python 3.11+
  - Node.js 18+
  - PostgreSQL 14+
- **RAM**: 500MB minimum
- **Disk**: 1GB (more with extensive flight logs and FAA database)

## 🎯 Core Features

### Flight Logging & Import
- ✈️ **ForeFlight CSV Import** - Import complete logbook with aircraft detection
- 📝 **Manual Flight Entry** - Add flights with full details (hours, approaches, landings, routes)
- 🎓 **Qualifying Flights** - Auto-detect certification requirements (solo XC, night XC, 300nm, etc.)
- 📊 **Hour Calculations** - Automatic totals for PPL, IR, and CPL requirements
- 🔍 **Flight Filtering** - Search by date, aircraft, or route

### Aircraft Management
- 🔍 **FAA Lookup** - Real-time N-number lookups from 308K+ aircraft database
- ✈️ **Aircraft Cards** - Track owned, rental, and club aircraft
- 💰 **Rate Management** - Wet/dry rates, fuel prices, and burn rates
- 🏷️ **Aircraft Types** - Complex, high-performance, TAA, simulator classifications
- 📊 **Sorting & Filtering** - By active status, tail number, or type

### Budget Cards v2.0
- 💰 **Smart Budget Cards** - Link to aircraft for automatic cost calculations
- 📅 **When-Based Planning** - Set budget dates (monthly, quarterly, yearly)
- 🎯 **Category System** - Organize by flight hours, training, fees, equipment, etc.
- 📊 **Real-Time Totals** - Instant budget vs actual calculations
- ✈️ **Aircraft Linkage** - Auto-calculate costs from aircraft rates and planned hours
- 📋 **Templates** - Quick Start templates for common budget items

### Certification Progress
- 🎓 **Three Certifications** - Track PPL, IR, and CPL requirements
- 📊 **Visual Progress** - Progress bars and completion percentages
- ✅ **Qualifying Flights** - See which flights satisfy specific requirements
- 🎯 **Target Goals** - Set your current certification goal in settings
- 📈 **Detailed Tracking** - Solo hours, night ops, cross-country PIC, approaches, and more

### Expense Tracking
- 💸 **Expense Management** - Track all aviation expenses by category
- 🔗 **Budget Card Integration** - Link expenses to budget cards for accurate tracking
- 📊 **Category Summaries** - View spending by category
- 📅 **Date Filtering** - Filter expenses by date range
- 💳 **Payment Methods** - Track how you paid (cash, credit, etc.)

### Reports & Exports
- 📄 **CSV Exports** - Export flights, budget cards, expenses, and aircraft
- 📊 **PDF Reports** - Professional reports with charts and summaries:
  - Flight Log Report (with totals)
  - Budget Summary Report
  - Certification Progress Report (PPL/IR/CPL)
  - Annual Budget Report
- 💾 **Data Portability** - Take your data anywhere

### Training Settings
- ⚙️ **Custom Categories** - Define your own budget categories
- 💰 **Training Rates** - Set instructor, simulator, and hourly rates
- 📅 **Training Pace** - Plan lessons per week
- 🎯 **Certification Goals** - Set your target certification (PPL, IR, CPL, CFI)
- 🔢 **Cost Planning** - Configure all training-related costs

## 🏗️ Architecture

### Modern Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- Zustand for state management
- Recharts for visualizations

**Backend:**
- FastAPI (Python)
- PostgreSQL 16 for data persistence
- SQLite for FAA aircraft database
- Async operations with asyncpg
- Pydantic for validation

**Deployment:**
- Docker Compose
- Multi-stage builds for optimization
- Health checks and auto-restart
- Volume persistence for data

### Container Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   PostgreSQL    │
│   (React/Vite)  │     │   (FastAPI)     │     │   Database      │
│   Port 3000     │     │   Port 8000     │     │   Port 5432     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  FAA SQLite │
                        │   308K+     │
                        │  Aircraft   │
                        └─────────────┘
```

## 📁 Project Structure

```
truehour/
├── frontend-react/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── features/       # Feature-specific components
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state management
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models.py       # Pydantic models
│   │   ├── database.py     # Database connections
│   │   └── main.py         # App entry point
│   ├── data/               # FAA aircraft database
│   └── scripts/            # Utility scripts
├── infrastructure/          # Deployment configs
│   ├── docker-compose.yml
│   ├── init.sql            # Database schema
│   └── .env.example
└── docs/                    # Documentation
```

## 🔧 Configuration

### Environment Variables

Create `infrastructure/.env`:

```bash
# Database
POSTGRES_USER=truehour
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=truehour

# Backend
DATABASE_URL=postgresql://truehour:your_secure_password@db:5432/truehour

# Frontend
VITE_API_URL=http://localhost:8000

# Features
ENABLE_FAA_LOOKUP=true

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

### First-Time Setup

1. **Import Your Logbook**
   - Export CSV from ForeFlight
   - Click "Import Logbook" in the hamburger menu
   - Review aircraft mapping
   - Confirm import

2. **Add Your Aircraft**
   - Go to Aircraft section
   - Use FAA Lookup for N-numbers
   - Add rates (wet/dry, fuel price, burn rate)
   - Set aircraft characteristics

3. **Set Training Goals**
   - Go to Settings
   - Choose target certification (PPL, IR, CPL)
   - Set training rates and pace
   - Configure budget categories

4. **Create Budget Cards**
   - Go to Budget section
   - Use Quick Start templates or create custom
   - Link aircraft for automatic calculations
   - Set "when" dates for planning

5. **Track Expenses**
   - Go to Expenses section
   - Add expenses as they occur
   - Link to budget cards
   - View category summaries

## 📊 Database Schema

### Core Tables

- **flights** - Flight log entries with full details
- **aircraft** - User aircraft with rates and specifications
- **budget_cards** - Budget planning with aircraft linkage
- **expenses** - Expense tracking with categories
- **expense_budget_links** - Many-to-many expense/budget relationships
- **import_history** - ForeFlight import tracking
- **user_data** - Settings and preferences

See [infrastructure/init.sql](infrastructure/init.sql) for complete schema.

## 🔌 API Endpoints

### Flight Management
```
GET    /api/user/flights                  # List all flights
POST   /api/user/flights                  # Add flight
PUT    /api/user/flights/{id}             # Update flight
DELETE /api/user/flights/{id}             # Delete flight
POST   /api/user/flights/import           # Import ForeFlight CSV
```

### Aircraft Management
```
GET    /api/user/aircraft                 # List aircraft
POST   /api/user/aircraft                 # Add aircraft
PUT    /api/user/aircraft/{id}            # Update aircraft
DELETE /api/user/aircraft/{id}            # Delete aircraft
GET    /api/v1/aircraft/{tail}            # FAA lookup
```

### Budget Cards
```
GET    /api/user/budget-cards             # List cards
POST   /api/user/budget-cards             # Create card
PUT    /api/user/budget-cards/{id}        # Update card
DELETE /api/user/budget-cards/{id}        # Delete card
```

### Expenses
```
GET    /api/user/expenses                 # List expenses
POST   /api/user/expenses                 # Add expense
PUT    /api/user/expenses/{id}            # Update expense
DELETE /api/user/expenses/{id}            # Delete expense
```

### Exports
```
GET    /api/user/exports/flights/csv      # Export flights CSV
GET    /api/user/exports/budget-cards/csv # Export budget cards CSV
GET    /api/user/exports/expenses/csv     # Export expenses CSV
GET    /api/user/exports/aircraft/csv     # Export aircraft CSV
```

### User Settings & Import History
```
GET    /api/user/settings                 # Get user settings
PUT    /api/user/settings                 # Update user settings
GET    /api/user/import-history           # Get import history
```

**Interactive API Docs:** http://localhost:8000/docs

## 💾 Backup & Restore

### Backup

```bash
# Database backup
docker exec infrastructure-db-1 pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql

# Or use CSV exports from the Reports page
```

### Restore

```bash
# Restore from SQL dump
cat backup_20251225.sql | docker exec -i infrastructure-db-1 psql -U truehour truehour

# Or re-import ForeFlight CSV
```

## 🚨 Troubleshooting

### Frontend won't load

```bash
# Check container status
docker-compose ps

# View frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Backend API errors

```bash
# View backend logs
docker-compose logs backend

# Check database connection
docker exec -it infrastructure-db-1 psql -U truehour truehour

# Restart backend
docker-compose restart backend
```

### Database issues

```bash
# Check database is running
docker ps | grep postgres

# View database logs
docker-compose logs db

# Reset database (⚠️ destroys all data)
docker-compose down -v
docker-compose up -d
```

### Port conflicts

```bash
# Check if ports are in use
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Change ports in docker-compose.yml if needed
```

## 🗺️ Roadmap

### v2.0 ✅ Complete
- React frontend with TypeScript
- Budget Cards v2.0 system
- Certification progress tracking (PPL/IR/CPL)
- Aircraft management with FAA lookup
- Expense tracking and budget linking
- CSV and PDF export system
- Training settings and configuration

### v2.1 (Next)
- Expense report PDFs by category
- Budget templates library
- Multi-year budget planning
- Flight history charts
- Budget vs actual visualizations
- Mobile responsive improvements
- Automatic training pace calculations

### v2.2 (Future)
- Reminders (medical, flight review, currency)
- Multi-user support
- Cloud sync (optional)
- Calendar integration
- Tax reporting features
- AI-powered budget recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🔗 Links

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/FliteAxis/TrueHour/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FliteAxis/TrueHour/discussions)
- **API Docs**: http://localhost:8000/docs (when running)

## ✈️ About TrueHour

TrueHour helps pilots:
- **Track training progress** toward PPL, IR, and CPL
- **Plan budgets** with accurate cost projections
- **Understand spending** with detailed expense tracking
- **Maintain control** of their data locally
- **Stay organized** with comprehensive flight logging

Built by a pilot, for pilots who want to:
- Know exactly where every training dollar goes
- Track progress toward certification goals
- Keep complete control of flight records
- Use professional tools that respect their privacy

---

**Questions?** Open an issue or check the [documentation](docs/).

**Happy Flying!** 🛩️
