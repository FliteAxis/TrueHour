# TrueHour

**Personal aviation expense tracking and flight management application**

TrueHour (formerly flight-budget) is a local-first application for tracking aviation expenses, managing flight logs, and analyzing your flying costs. Built for pilots who want complete control over their data without relying on cloud services.

## 🚀 Quick Start

### Using Pre-Built Images (Recommended)

```bash
# Clone the repository
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour

# Pull and start latest stable images
docker compose -f infrastructure/docker-compose.ghcr.yml pull
docker compose -f infrastructure/docker-compose.ghcr.yml up -d

# Access the application
open http://localhost:8181
```

### Building from Source

```bash
# Clone and build
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour

# Build and start all services
docker compose -f infrastructure/docker-compose.yml up -d --build

# Access the application
open http://localhost:8181
```

That's it! The database schema will be automatically initialized on first run.

## ✨ Features

### Current Features
- ✈️ **Aircraft Management** - Track owned, club, and rental aircraft with CRUD API
- 📊 **Expense Tracking** - Full expense management with filtering and summaries
- 💰 **Expense Reports** - Aggregated summaries by category with statistics
- 🔍 **FAA Aircraft Lookup** - Real-time N-number lookups with baked-in FAA registry (308K+ aircraft)
- 📝 **ForeFlight Import** - Import your complete logbook from ForeFlight CSV
- 💾 **Data Persistence** - Save/load all data to PostgreSQL with custom modal UX
- 🎓 **Training State Persistence** - Certification goals, flight hours, and training settings saved to database
- 🔄 **Auto-Save** - Debounced auto-save with 3-second delay and toggle switch
- 📁 **Export/Import Config** - Download and upload JSON configuration files
- 🗑️ **Safe Delete** - Multi-step confirmation for deleting all data
- ✅ **Form Accessibility** - Proper labels and semantic HTML for all form inputs
- 🐳 **Local Deployment** - Runs entirely on your machine with Docker
- 💾 **PostgreSQL Storage** - Persistent data with proper relational database
- 🔄 **Automated Builds** - Nightly FAA data updates via GitHub Actions
- 📦 **GHCR Images** - Multi-platform Docker images (amd64/arm64)

### Coming Soon
- 💰 **Budget Tracking** - Manual budget allocations with spending comparison (Phase 4)
- 🔔 **Reminders** - Track medical, flight review, and currency deadlines (Phase 6)
- 🤖 **AI Chat Assistant** - Natural language queries powered by Claude (Phase 7)
- 📅 **Calendar Integration** - Sync with Google Calendar (Phase 8)

## 🏗️ Architecture

TrueHour is a monorepo containing:

```
truehour/
├── frontend/          # Static HTML/CSS/JS (nginx)
├── backend/           # Python FastAPI application
├── infrastructure/    # Docker configs and SQL schema
└── data/             # Local config.json (gitignored)
```

### Three Container Architecture

| Container | Purpose | Port |
|-----------|---------|------|
| **frontend** | nginx serving static files | 8181 |
| **api** | FastAPI backend with FAA data | 8000 |
| **db** | PostgreSQL 16 | 5432 (internal) |

**Total RAM Usage:** ~100-150MB

## 📋 Requirements

- Docker & Docker Compose
- 150MB RAM
- 1GB disk space (more with extensive flight logs)

## 🔧 Configuration

### Basic Setup

1. Copy the environment template:
```bash
cp infrastructure/.env.example infrastructure/.env
```

2. Edit `infrastructure/.env` to enable features:
```bash
# Enable FAA aircraft lookups (optional, enabled by default)
ENABLE_FAA_LOOKUP=true

# Customize port if needed
APP_PORT=8181
```

Core features available:
- Aircraft management
- Expense tracking
- ForeFlight CSV import
- **FAA lookups** - 308K+ aircraft database baked into the image (toggle with `ENABLE_FAA_LOOKUP` in `.env`)

The FAA aircraft database is automatically included in all Docker images and updated nightly.

### Advanced Features (Requires API Keys - Phase 7+)

Edit `data/config.json` to enable future features:

```json
{
  "claude": {
    "api_key": "sk-ant-...",
    "model": "claude-sonnet-4-20250514"
  },
  "google": {
    "client_id": "...",
    "client_secret": "...",
    "refresh_token": "...",
    "calendar_id": "primary"
  },
  "notifications": {
    "slack_webhook_url": "https://hooks.slack.com/...",
    "discord_webhook_url": "https://discord.com/api/webhooks/...",
    "telegram_bot_token": "...",
    "telegram_chat_id": "..."
  },
  "preferences": {
    "timezone": "America/Chicago",
    "reminder_advance_days": 30
  }
}
```

## 🛠️ Development

### Local Development with Hot Reload

```bash
# Start with development configuration
docker compose -f infrastructure/docker-compose.yml \
               -f infrastructure/docker-compose.dev.yml up

# Backend will auto-reload on code changes
# Database will be exposed on localhost:5432
```

### Test with Develop Branch Images

```bash
# Pull and run latest develop builds
docker compose -f infrastructure/docker-compose.ghcr-develop.yml pull
docker compose -f infrastructure/docker-compose.ghcr-develop.yml up -d
```

### Run FAA Database Build Script

```bash
cd backend
pip install requests
python scripts/update_faa_data.py data/aircraft.db
# Creates backend/data/aircraft.db with latest FAA data
```

### Access Database Directly

```bash
# Connect to running database
docker exec -it infrastructure-db-1 psql -U truehour truehour

# Run queries
\dt                    # List tables
SELECT COUNT(*) FROM aircraft;
SELECT * FROM expenses ORDER BY date DESC LIMIT 10;
\q                     # Quit
```

## 💾 Backup & Restore

### Backup Database

```bash
docker exec infrastructure-db-1 pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup_20251203.sql | docker exec -i infrastructure-db-1 psql -U truehour truehour
```

### Reset Everything (⚠️ Destroys All Data)

```bash
docker compose -f infrastructure/docker-compose.yml down -v
docker compose -f infrastructure/docker-compose.yml up -d
```

## 📊 Database Schema

The PostgreSQL database includes:

- **aircraft** - Your aircraft list (owned, club, rental)
- **flights** - Flight log entries from ForeFlight or manual entry (Phase 3)
- **expenses** - All aviation expenses (fuel, insurance, subscriptions, etc.)
- **budgets** - Budget definitions for expense tracking (Phase 4)
- **budget_entries** - Monthly budget allocations (Phase 4)
- **reminders** - Deadlines for medicals, flight reviews, currency (Phase 6)
- **chat_history** - Conversation history with Claude AI (Phase 7)

See [infrastructure/init.sql](infrastructure/init.sql) for complete schema.

## 🔍 API Endpoints

### FAA Aircraft Lookup

```
GET  /api/v1/aircraft/{tail}    # Lookup by N-number (e.g., N172SP)
POST /api/v1/aircraft/bulk      # Bulk lookup (max 50)
GET  /api/v1/stats               # FAA database statistics
GET  /api/v1/health              # Health check
```

### User Aircraft Management (Phase 1)

```
GET    /api/user/aircraft         # List user's aircraft
GET    /api/user/aircraft/{id}    # Get single aircraft
POST   /api/user/aircraft         # Add aircraft
PUT    /api/user/aircraft/{id}    # Update aircraft
DELETE /api/user/aircraft/{id}    # Remove aircraft
```

### Expense Tracking (Phase 1)

```
GET    /api/expenses              # List expenses (with filters)
GET    /api/expenses/{id}         # Get single expense
GET    /api/expenses/summary      # Aggregated summary by category
POST   /api/expenses              # Add expense
PUT    /api/expenses/{id}         # Update expense
DELETE /api/expenses/{id}         # Delete expense
```

**Query Parameters for `/api/expenses`:**
- `aircraft_id` - Filter by aircraft
- `category` - Filter by expense category
- `start_date` / `end_date` - Date range filter
- `limit` / `offset` - Pagination

### User Data Management (Phase 3)

```
POST   /api/user/save          # Save all data to database
GET    /api/user/load          # Load all data from database
DELETE /api/user/data          # Delete all user data (requires confirmation)
GET    /api/user/settings      # Get user settings
PUT    /api/user/settings      # Update user settings
```

**Headers:**
- `X-Session-ID` - Session identifier for tracking saves

**SaveDataRequest Model:**
```json
{
  "aircraft": [...],
  "budget_state": {
    "targetCert": "ir",
    "currentHours": {...},
    "settings": {
      "lessonsPerWeek": 2,
      "instructorRate": 65,
      "simulatorRate": 45,
      "groundHours": 20,
      "headsetCost": 300,
      "booksCost": 300,
      "bagCost": 50,
      "medicalCost": 150,
      "knowledgeCost": 175,
      "checkrideCost": 900,
      "insuranceCost": 1000,
      "foreflightCost": 280,
      "onlineSchoolCost": 0,
      "contingencyPercent": 15
    }
  }
}
```

**API Documentation:** http://localhost:8000/docs (Swagger UI)

## 📦 Docker Images

### Available Images

TrueHour publishes multi-platform Docker images to GitHub Container Registry:

| Image | Tag | Purpose | Updated |
|-------|-----|---------|---------|
| `ghcr.io/fliteaxis/truehour-api` | `latest` | Stable API releases | On main branch push |
| `ghcr.io/fliteaxis/truehour-api` | `develop` | Development builds | On develop branch push |
| `ghcr.io/fliteaxis/truehour-api` | `nightly` | Latest FAA data | Daily at 6 AM UTC |
| `ghcr.io/fliteaxis/truehour-frontend` | `latest` | Stable frontend | On main branch push |
| `ghcr.io/fliteaxis/truehour-frontend` | `develop` | Development frontend | On develop branch push |

### Pull Specific Version

```bash
# Pull specific dated release
docker pull ghcr.io/fliteaxis/truehour-api:2025-12-03

# Pull nightly build
docker pull ghcr.io/fliteaxis/truehour-api:nightly

# Pull develop
docker pull ghcr.io/fliteaxis/truehour-api:develop
```

## 📝 Data Import

### ForeFlight CSV Import

Export your logbook from ForeFlight and import via the web interface:

1. Open http://localhost:8181
2. Click "Import Logbook" or use the CSV import button
3. Select your ForeFlight export CSV file
4. Review and confirm aircraft mappings
5. Import flights and aircraft data

The importer handles:
- Multi-section CSV format
- Aircraft and flights
- Simulator vs aircraft distinction
- Automatic FAA data lookup for N-numbers (when enabled)
- Deduplication on re-import

## 🚦 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker compose -f infrastructure/docker-compose.yml logs

# Restart services
docker compose -f infrastructure/docker-compose.yml restart

# Check container status
docker compose -f infrastructure/docker-compose.yml ps
```

### Database Connection Issues

```bash
# Verify database is healthy
docker ps --filter "name=infrastructure-db"

# Check database logs
docker logs infrastructure-db-1
```

### Frontend Not Loading

```bash
# Check if ports are available
lsof -i :8181
lsof -i :8000

# Rebuild frontend container
docker compose -f infrastructure/docker-compose.yml up -d --build frontend
```

### API Returns 503

```bash
# Check if FAA database exists
docker exec infrastructure-api-1 ls -lh /app/data/

# Rebuild database if missing
cd backend
python scripts/update_faa_data.py data/aircraft.db
docker compose -f infrastructure/docker-compose.yml restart api
```

## 🗺️ Roadmap

### Phase 0: Repository Setup ✅ Complete
- Monorepo structure
- Docker Compose with 3 containers
- PostgreSQL schema
- Basic frontend/backend migration

### Phase 1: Backend Foundation ✅ Complete
- PostgreSQL integration with asyncpg
- User aircraft CRUD endpoints
- Expenses CRUD endpoints with filtering
- Expense summary and aggregation
- GHCR image publishing
- Automated nightly FAA data builds
- ForeFlight CSV import (already working)

### Phase 2: Frontend Migration ✅ Complete
- Onboarding flow with guided setup
- Aircraft management UI with database integration
- ForeFlight CSV import with aircraft mapping
- FAA lookup integration in UI

### Phase 3: Data Persistence ✅ 100% Complete
- Save button with PostgreSQL persistence
- Auto-save with 3-second debounce and toggle
- Export/Import config as JSON files
- Multi-step delete confirmation with custom modals
- Status indicators (pending/saving/success/error)
- Session tracking and last-saved timestamps
- Training state persistence (certification goals, flight hours, all training settings)
- Form accessibility improvements (proper labels and semantic HTML)
- Centered menu dropdown UI with improved alignment

### Phase 4: Future Features (Next)
- Budget tracking with monthly allocations
- Notifications system
- Reminders for medicals and currency
- Claude chatbot integration
- Google Calendar sync
- CI/CD enhancements

See [tmp/fliteaxis_architecture_final.md](tmp/fliteaxis_architecture_final.md) for detailed architecture.

## 📜 Migration Notice

This project consolidates two previous repositories:

- **ryakel/flight-budget** - Frontend and expense tracking
- **ryakel/tail-lookup** - FAA aircraft registry backend

Both repositories are now archived. All future development happens here in the FliteAxis organization.

## 🤝 Contributing

This is currently a personal project. If you're interested in contributing or have suggestions:

1. Open an issue for discussion
2. Fork the repository
3. Submit a pull request

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🔗 Links

- **GitHub Organization:** [FliteAxis](https://github.com/FliteAxis)
- **Container Registry:** [GHCR Packages](https://github.com/orgs/FliteAxis/packages)
- **Issues:** [Report bugs or request features](https://github.com/FliteAxis/TrueHour/issues)
- **API Documentation:** http://localhost:8000/docs (when running)

## ✈️ About

TrueHour is built for pilots who want to:
- Track actual costs of flying, not estimates
- Understand where every dollar goes
- Maintain their own data locally
- Have full control over their flight records

Built with:
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Backend:** Python FastAPI
- **Database:** PostgreSQL 16 + SQLite (FAA data)
- **Aircraft Data:** FAA Registry (nightly updates, 308K+ aircraft)
- **Deployment:** Docker Compose
- **CI/CD:** GitHub Actions → GHCR

---

**Questions?** Open an issue or check the [API documentation](http://localhost:8000/docs)

**Happy Flying!** 🛩️
