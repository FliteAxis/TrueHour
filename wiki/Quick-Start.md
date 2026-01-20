# Quick Start Guide

Get TrueHour v2.0 running in 5 minutes with Docker!

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- 500MB RAM available
- 1GB disk space

[Install Docker](https://docs.docker.com/get-docker/) if you haven't already.

---

## Quick Start (Docker)

### 1. Clone Repository

```bash
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour
```

### 2. Configure Environment

```bash
cd infrastructure
cp .env.example .env
```

**Important**: Edit `.env` and change the default password:

```bash
POSTGRES_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://truehour:your_secure_password_here@db:5432/truehour
```

### 3. Start TrueHour

```bash
# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 4. Access TrueHour

Open your browser:
- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Verify Installation

Check that all three containers are running:

```bash
docker-compose ps
```

You should see:
- `truehour-frontend` - React frontend (port 8181)
- `truehour-api` - FastAPI backend (port 8000)
- `truehour-db` - PostgreSQL database (port 5432)

All should have status **"Up"**.

---

## What's New in v2.0

TrueHour v2.0 is a complete rewrite featuring:

- ✨ **Modern React Frontend** - Fast, responsive UI with Tailwind CSS
- 💰 **Budget Cards v2.0** - Smart budget tracking with aircraft linkage
- 📊 **Certification Progress** - Track PPL, IR, and CPL requirements
- ✈️ **FAA Aircraft Lookup** - 308K+ aircraft database integration
- 📁 **Export System** - CSV and PDF reports
- 🎯 **Training Settings** - Customize rates and goals
- 💸 **Expense Tracking** - Link expenses to budget cards

---

## First-Time Setup

After installation, configure TrueHour:

### 1. Import Your Logbook (Optional)

If you use ForeFlight:
1. Export CSV from ForeFlight
2. Click hamburger menu → "Import Logbook"
3. Select your CSV file
4. Review aircraft mapping
5. Confirm import

### 2. Add Aircraft

**US Aircraft with FAA Lookup:**
1. Go to Aircraft section
2. Click "Add Aircraft"
3. Enter N-number (e.g., N12345)
4. Click "Lookup FAA Data"
5. Add rates (wet/dry, fuel)
6. Save

**Manual Entry:**
1. Fill in all fields manually
2. Add rates and characteristics
3. Save

### 3. Configure Settings

1. Go to Settings (gear icon)
2. Set target certification (PPL, IR, CPL, CFI)
3. Configure training rates
4. Set training pace
5. Define budget categories
6. Save

### 4. Create Budget Cards

1. Go to Budget section
2. Click "Add Budget Card"
3. Use Quick Start templates or create custom
4. Link to aircraft for automatic calculations
5. Save

### 5. Track Expenses

1. Go to Expenses section
2. Click "Add Expense"
3. Fill in details
4. Link to budget card(s)
5. Save

---

## Architecture

TrueHour v2.0 uses a three-container architecture:

| Container | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **frontend** | React 18 + Vite | 3000 | Modern web UI |
| **backend** | FastAPI + Python | 8000 | REST API + FAA data |
| **db** | PostgreSQL 16 | 5432 | Primary database |

**Total RAM Usage:** ~500MB
**FAA Database:** 308K+ aircraft (SQLite)

---

## Quick Commands

### Container Management

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop services (preserves data)
docker-compose down

# Stop and remove data (⚠️ deletes everything)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

### Database Management

```bash
# Connect to database
docker exec -it truehour-db psql -U truehour truehour

# Backup database
docker exec truehour-db pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20260103.sql | docker exec -i truehour-db psql -U truehour truehour

# View tables
docker exec -it truehour-db psql -U truehour truehour -c "\dt"
```

### API Testing

```bash
# Check backend health
curl http://localhost:8000/api/v1/health

# Test FAA lookup
curl http://localhost:8000/api/v1/aircraft/N172SP

# Get flights
curl http://localhost:8000/api/flights/

# Get user aircraft
curl http://localhost:8000/api/user/aircraft

# Get budget cards
curl http://localhost:8000/api/budget-cards/
```

---

## Development Mode

For local development without Docker:

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://truehour:password@localhost:5432/truehour"
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend-react
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Frontend: http://localhost:5173 (Vite dev server)

---

## Troubleshooting

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Change ports in infrastructure/.env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### Containers Won't Start

```bash
# Check container status
docker-compose ps

# View logs for errors
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Full restart
docker-compose down -v
docker-compose up -d --build
```

### Database Connection Failed

```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec -it infrastructure-db-1 psql -U truehour truehour -c "SELECT 1;"

# Verify DATABASE_URL
docker exec -it infrastructure-backend-1 env | grep DATABASE_URL
```

### Frontend Not Loading

```bash
# Check frontend container logs
docker-compose logs frontend

# Check VITE_API_URL
cat infrastructure/.env | grep VITE_API_URL

# Verify backend is responding
curl http://localhost:8000/api/flights
```

---

## Need Help?

**Documentation:**
- 📖 [Full Documentation](../docs/)
- 📘 [Installation Guide](../docs/INSTALLATION.md)
- 📗 [User Guide](../docs/USER_GUIDE.md)
- 📙 [Changelog](../docs/CHANGELOG.md)

**Support:**
- 🐛 [GitHub Issues](https://github.com/FliteAxis/TrueHour/issues)
- 💬 [GitHub Discussions](https://github.com/FliteAxis/TrueHour/discussions)
- 🚀 [API Documentation](http://localhost:8000/docs) (when running)

**Wiki:**
- 🏗️ [Architecture Overview](Architecture-Overview)
- 🔧 [API Documentation](API-Documentation)
- 🛠️ [Troubleshooting Guide](Troubleshooting)

---

## Next Steps

1. ✅ Complete [First-Time Setup](#first-time-setup)
2. ✅ Read the [User Guide](../docs/USER_GUIDE.md)
3. ✅ Import your logbook or add first flight
4. ✅ Configure your aircraft with rates
5. ✅ Create budget cards for training costs
6. ✅ Start tracking expenses

---

**That's it!** Your TrueHour v2.0 is now running. Happy Flying! 🛩️
