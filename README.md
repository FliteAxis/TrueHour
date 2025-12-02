# TrueHour

**Personal aviation expense tracking and flight management application**

TrueHour (formerly flight-budget) is a local-first application for tracking aviation expenses, managing flight logs, and analyzing your flying costs. Built for pilots who want complete control over their data without relying on cloud services.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour

# Create local configuration
mkdir -p data
cp config.example.json data/config.json
# Edit data/config.json with your API keys (optional for basic features)

# Start all services
docker-compose -f infrastructure/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f

# Access the application
open http://localhost:8181
```

That's it! The database schema will be automatically initialized on first run.

## ✨ Features

### Current (Phase 0)
- ✈️ **Aircraft Management** - Track owned, club, and rental aircraft
- 📊 **Expense Tracking** - Monitor all aviation-related costs
- 🔍 **FAA Aircraft Lookup** - Real-time N-number lookups with baked-in FAA registry
- 🐳 **Local Deployment** - Runs entirely on your machine with Docker
- 💾 **PostgreSQL Storage** - Persistent data with proper relational database

### Coming Soon
- 📝 **ForeFlight Import** - Import your complete logbook from ForeFlight CSV (Phase 3)
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

### Basic Setup (No API Keys Required)

TrueHour works out of the box for:
- Aircraft management
- Expense tracking
- FAA lookups

### Advanced Features (Requires API Keys)

Edit `data/config.json` to enable:

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
docker-compose -f infrastructure/docker-compose.yml \
               -f infrastructure/docker-compose.dev.yml up

# Backend will auto-reload on code changes
# Database will be exposed on localhost:5432
```

### Run FAA Database Build Script

```bash
cd backend
python scripts/update_faa_data.py
# Creates backend/data/faa.db
```

### Access Database Directly

```bash
# Connect to running database
docker exec -it truehour-db-1 psql -U truehour truehour

# Run queries
SELECT COUNT(*) FROM aircraft;
SELECT * FROM expenses ORDER BY date DESC LIMIT 10;
```

## 💾 Backup & Restore

### Backup Database

```bash
docker exec truehour-db-1 pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup_20251201.sql | docker exec -i truehour-db-1 psql -U truehour truehour
```

### Reset Everything (⚠️ Destroys All Data)

```bash
docker-compose -f infrastructure/docker-compose.yml down -v
docker-compose -f infrastructure/docker-compose.yml up -d
```

## 📊 Database Schema

The PostgreSQL database includes:

- **aircraft** - Your aircraft list (owned, club, rental)
- **flights** - Flight log entries from ForeFlight or manual entry
- **expenses** - All aviation expenses (fuel, insurance, subscriptions, etc.)
- **budgets** - Budget definitions for expense tracking
- **budget_entries** - Monthly budget allocations
- **reminders** - Deadlines for medicals, flight reviews, currency
- **chat_history** - Conversation history with Claude AI

See `infrastructure/init.sql` for complete schema.

## 🔍 API Endpoints

### Current Endpoints (from tail-lookup)

```
GET  /api/aircraft/{tail}      # FAA aircraft lookup by N-number
GET  /api/aircraft/stats        # Database statistics
GET  /                          # API health check
```

### Coming in Phase 1

```
GET    /api/user/aircraft       # List user's aircraft
POST   /api/user/aircraft       # Add aircraft
PUT    /api/user/aircraft/{id}  # Update aircraft
DELETE /api/user/aircraft/{id}  # Remove aircraft

GET    /api/expenses            # List expenses
POST   /api/expenses            # Add expense
PUT    /api/expenses/{id}       # Update expense
DELETE /api/expenses/{id}       # Delete expense
```

## 📦 Data Import

### ForeFlight CSV Import (Coming in Phase 3)

Export your logbook from ForeFlight and import:

```bash
# Via API (Phase 3)
curl -X POST http://localhost:8000/api/flights/import \
  -F "file=@ForeFlight_Export.csv"
```

The importer handles:
- Multi-section CSV format
- Aircraft and flights
- Simulator vs aircraft distinction
- Deduplication on re-import

## 🚦 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose -f infrastructure/docker-compose.yml logs

# Restart services
docker-compose -f infrastructure/docker-compose.yml restart
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose -f infrastructure/docker-compose.yml ps

# Check database logs
docker-compose -f infrastructure/docker-compose.yml logs db
```

### Frontend Not Loading

```bash
# Rebuild frontend container
docker-compose -f infrastructure/docker-compose.yml up -d --build frontend
```

## 🗺️ Roadmap

### Phase 0: Repository Setup ✅
- Monorepo structure
- Docker Compose with 3 containers
- PostgreSQL schema
- Basic frontend/backend migration

### Phase 1: Backend Foundation (Next)
- Postgres connection in backend
- User aircraft CRUD endpoints
- Expenses CRUD endpoints
- Frontend → API migration (remove localStorage)

### Phase 2-9: Feature Development
See [PHASE_0_PLAN.md](PHASE_0_PLAN.md) for detailed roadmap.

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
- **Issues:** [Report bugs or request features](https://github.com/FliteAxis/TrueHour/issues)
- **Architecture Document:** `.claude/fliteaxis_architecture_final.md`

## ✈️ About

TrueHour is built for pilots who want to:
- Track actual costs of flying, not estimates
- Understand where every dollar goes
- Maintain their own data locally
- Have full control over their flight records

Built with:
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Backend:** Python FastAPI
- **Database:** PostgreSQL 16
- **Aircraft Data:** FAA Registry (nightly updates)
- **Deployment:** Docker Compose

---

**Questions?** Open an issue or check the [documentation](wiki/)

**Happy Flying!** 🛩️
