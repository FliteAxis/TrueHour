# TrueHour v2.0 Installation Guide

Complete installation instructions for TrueHour, a personal aviation flight training management and expense tracking application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Development Installation](#development-installation)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [First-Time Setup](#first-time-setup)
7. [Platform-Specific Instructions](#platform-specific-instructions)
8. [Troubleshooting](#troubleshooting)
9. [Upgrading](#upgrading)

---

## Prerequisites

### Option 1: Docker Installation (Recommended)

**Minimum Requirements:**
- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- 500MB RAM
- 1GB disk space (more with extensive flight logs)

**Install Docker:**

- **macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

### Option 2: Local Development

**Minimum Requirements:**
- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Git
- 1GB RAM
- 1GB disk space

**Check Versions:**

```bash
python3 --version   # Should be 3.11+
node --version      # Should be v18+
psql --version      # Should be 14+
git --version
```

---

## Quick Start (Docker)

The fastest way to get TrueHour running is with Docker Compose.

### 1. Clone the Repository

```bash
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour
```

### 2. Configure Environment

```bash
cd infrastructure
cp .env.example .env
```

Edit `.env` with your preferences:

```bash
# Database Configuration
POSTGRES_USER=truehour
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=truehour

# Backend Configuration
DATABASE_URL=postgresql://truehour:your_secure_password_here@db:5432/truehour

# Frontend Configuration
VITE_API_URL=http://localhost:8000

# Features
ENABLE_FAA_LOOKUP=true

# Port Configuration (change if needed)
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

**Important**: Change `your_secure_password_here` to a strong password!

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 4. Access TrueHour

Open your browser to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Verify Installation

```bash
# Check all containers are running
docker-compose ps

# Should see:
# - infrastructure-db-1        (postgres)
# - infrastructure-backend-1   (fastapi)
# - infrastructure-frontend-1  (react)
```

All three containers should have status "Up".

### 6. Stop the Application

```bash
# Stop containers (preserves data)
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

---

## Development Installation

For local development without Docker.

### 1. Clone Repository

```bash
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour
```

### 2. Setup PostgreSQL Database

#### macOS (with Homebrew):

```bash
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb truehour

# Create user
psql postgres -c "CREATE USER truehour WITH PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE truehour TO truehour;"
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql-16

# Create database and user
sudo -u postgres psql
> CREATE DATABASE truehour;
> CREATE USER truehour WITH PASSWORD 'your_password';
> GRANT ALL PRIVILEGES ON DATABASE truehour TO truehour;
> \q
```

#### Windows:

Download and install [PostgreSQL](https://www.postgresql.org/download/windows/)

Use pgAdmin or psql to create:
- Database: `truehour`
- User: `truehour` with password

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
export DATABASE_URL="postgresql://truehour:your_password@localhost:5432/truehour"
export ENABLE_FAA_LOOKUP=true

# Run database migrations (auto-creates tables)
python -c "from app.db_migrations import run_migrations; import asyncio; asyncio.run(run_migrations())"

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should start at http://localhost:8000

### 4. Setup Frontend

Open a **new terminal** window:

```bash
cd frontend-react

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Frontend should start at http://localhost:5173 (Vite dev server)

### 5. Verify Development Setup

- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

---

## Environment Configuration

### Backend Environment Variables

Located at `backend/.env` (or export in shell):

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
ENABLE_FAA_LOOKUP=true                    # Enable FAA N-number lookups
LOG_LEVEL=INFO                            # DEBUG, INFO, WARNING, ERROR
CORS_ORIGINS=http://localhost:3000        # Allowed frontend origins
```

### Frontend Environment Variables

Located at `frontend-react/.env`:

```bash
# Required
VITE_API_URL=http://localhost:8000        # Backend API URL

# For production build
VITE_API_URL=                             # Empty = same origin
```

### Docker Compose Environment

Located at `infrastructure/.env`:

```bash
# Database
POSTGRES_USER=truehour
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=truehour

# Backend
DATABASE_URL=postgresql://truehour:strong_password_here@db:5432/truehour

# Frontend
VITE_API_URL=http://localhost:8000

# Ports (change if conflicts)
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
```

---

## Database Setup

### Automatic Schema Migration

TrueHour automatically creates/updates database tables on startup. No manual SQL needed!

**What Gets Created:**
- `flights` - Flight log entries
- `aircraft` - User aircraft fleet
- `budget_cards` - Budget planning cards
- `expenses` - Expense tracking
- `expense_budget_links` - Many-to-many expense/budget relationships
- `import_history` - ForeFlight CSV import tracking
- `user_data` - Settings and preferences

### Manual Database Initialization (Docker)

```bash
# Connect to database container
docker exec -it infrastructure-db-1 psql -U truehour truehour

# List tables
\dt

# Check schema
\d flights

# Exit
\q
```

### FAA Aircraft Database

The FAA aircraft database (308K+ aircraft) is automatically included in the backend:

**Location**: `backend/data/aircraft.db` (SQLite)

**Contents**:
- N-number registrations
- Make/Model information
- Year of manufacture
- Aircraft category/class
- Engine type
- Gear type

**Updating FAA Database**:

```bash
cd backend/scripts
python download_faa_data.py  # Downloads latest from FAA
python build_aircraft_db.py  # Rebuilds SQLite database
```

---

## First-Time Setup

After installation, configure TrueHour for your use:

### 1. Import Your Logbook (Optional)

If you use ForeFlight:

1. Export CSV from ForeFlight:
   - Open ForeFlight → Logbook
   - Tap Share → Export CSV
   - Email or AirDrop to yourself

2. In TrueHour:
   - Click hamburger menu (top-left)
   - Click "Import Logbook"
   - Select your ForeFlight CSV file
   - Review aircraft mapping
   - Click "Confirm Import"

### 2. Add Aircraft

**Option A: FAA Lookup (US Aircraft)**

1. Go to "Aircraft" section
2. Click "Add Aircraft"
3. Enter N-number (e.g., N12345)
4. Click "Lookup FAA Data"
5. Review pre-filled information
6. Add rates (wet/dry, fuel price, burn rate)
7. Save

**Option B: Manual Entry**

1. Go to "Aircraft" section
2. Click "Add Aircraft"
3. Fill in all details manually
4. Save

### 3. Configure Settings

1. Go to Settings (gear icon)
2. Set **Target Certification** (PPL, IR, CPL, CFI)
3. Configure **Training Rates**:
   - Instructor hourly rate
   - Simulator hourly rate
   - Ground training rate
4. Set **Training Pace** (lessons per week)
5. Define **Budget Categories** (or use defaults)
6. Save settings

### 4. Create Budget Cards

**Option A: Quick Start Templates**

1. Go to "Budget" section
2. Click "Add Budget Card"
3. Click "Quick Start" tab
4. Select template (Flight Hours, Written Exam, etc.)
5. Customize as needed
6. Save

**Option B: Custom Budget Card**

1. Go to "Budget" section
2. Click "Add Budget Card"
3. Fill in:
   - Category
   - Name
   - Amount (or link aircraft + hours)
   - Date ("when")
   - Status
4. Save

### 5. Track Expenses

1. Go to "Expenses" section
2. Click "Add Expense"
3. Fill in:
   - Date
   - Category
   - Description
   - Amount
   - Payment method
   - Vendor (optional)
4. Link to budget card(s) if applicable
5. Save

---

## Platform-Specific Instructions

### macOS

**Installation Notes:**

- Use Homebrew for dependencies:
  ```bash
  brew install python@3.11 node@18 postgresql@16
  ```

- Docker Desktop requires macOS 11+ (Big Sur or later)

**Port Conflicts:**

- AirPlay Receiver uses port 5000 (no conflict with TrueHour)
- If port 3000 or 8000 conflicts, change in `infrastructure/.env`

### Linux

**Ubuntu/Debian:**

```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip nodejs npm postgresql-16

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin
```

**Fedora/RHEL:**

```bash
sudo dnf install python3.11 nodejs postgresql-server
sudo dnf install docker docker-compose
```

**Arch Linux:**

```bash
sudo pacman -S python nodejs postgresql docker docker-compose
```

### Windows

**Installation Notes:**

1. **Install WSL2** (Windows Subsystem for Linux):
   ```powershell
   wsl --install
   ```

2. **Install Docker Desktop for Windows** (includes WSL2 integration)

3. **Use WSL2 terminal** for all commands (not Command Prompt)

4. Clone repository in WSL2 home directory:
   ```bash
   cd ~
   git clone https://github.com/FliteAxis/TrueHour.git
   ```

**Path Issues:**

- Use forward slashes `/` not backslashes `\`
- Keep project in WSL2 filesystem (not `/mnt/c/`)

---

## Troubleshooting

### Docker Issues

**Problem: Port already in use**

```bash
# Find what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in infrastructure/.env
FRONTEND_PORT=3001
```

**Problem: Containers won't start**

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart

# Full rebuild
docker-compose down -v
docker-compose up -d --build
```

**Problem: Database connection failed**

```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Connect to database
docker exec -it infrastructure-db-1 psql -U truehour truehour

# Verify DATABASE_URL in backend container
docker exec -it infrastructure-backend-1 env | grep DATABASE_URL
```

### Backend Issues

**Problem: Module not found**

```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python3 --version  # Should be 3.11+
```

**Problem: Database migration failed**

```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Run migrations manually
python -c "from app.db_migrations import run_migrations; import asyncio; asyncio.run(run_migrations())"
```

**Problem: FAA lookup not working**

```bash
# Check aircraft.db exists
ls -lh backend/data/aircraft.db

# Verify ENABLE_FAA_LOOKUP=true
echo $ENABLE_FAA_LOOKUP
```

### Frontend Issues

**Problem: Cannot connect to backend**

```bash
# Check VITE_API_URL
cat frontend-react/.env

# Verify backend is running
curl http://localhost:8000/api/flights

# Check CORS configuration in backend
```

**Problem: Build failed**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be v18+
```

**Problem: Blank page after build**

```bash
# Check browser console for errors
# Verify VITE_API_URL for production

# For production (same origin):
VITE_API_URL=

# For development:
VITE_API_URL=http://localhost:8000
```

### Database Issues

**Problem: Permission denied**

```bash
# Grant privileges
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE truehour TO truehour;"
psql postgres -c "GRANT ALL ON SCHEMA public TO truehour;"
```

**Problem: Database doesn't exist**

```bash
# Create database
createdb truehour

# Or in psql
psql postgres -c "CREATE DATABASE truehour;"
```

### Common Errors

**Error: "EADDRINUSE: address already in use"**

→ Port conflict. Change port in `.env` or stop conflicting service.

**Error: "Failed to connect to database"**

→ Check DATABASE_URL format, database is running, and credentials are correct.

**Error: "Cannot find module"**

→ Run `npm install` (frontend) or `pip install -r requirements.txt` (backend).

**Error: "CORS policy blocked"**

→ Check VITE_API_URL matches backend URL and CORS_ORIGINS in backend allows frontend origin.

---

## Upgrading

### From v1.x to v2.0

⚠️ **Breaking Changes**: v2.0 is a complete rewrite. Migration path:

1. **Export data from v1.x**:
   - Export flights as CSV from v1.x
   - Save any important notes/data

2. **Install v2.0** (fresh installation)

3. **Import data into v2.0**:
   - Use ForeFlight CSV import in v2.0
   - Or manually re-enter aircraft and budget data

### Upgrading v2.0.x

```bash
# With Docker
cd infrastructure
docker-compose down
git pull origin main
docker-compose up -d --build

# Development mode
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
uvicorn app.main:app --reload

# Frontend
cd frontend-react
npm install
npm run dev
```

Database migrations run automatically on startup.

### Backup Before Upgrading

```bash
# Backup database (Docker)
docker exec infrastructure-db-1 pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql

# Backup database (Local)
pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql

# Backup environment files
cp infrastructure/.env infrastructure/.env.backup
```

### Restore from Backup

```bash
# Restore (Docker)
cat backup_20260103.sql | docker exec -i infrastructure-db-1 psql -U truehour truehour

# Restore (Local)
psql -U truehour truehour < backup_20260103.sql
```

---

## Getting Help

**Documentation:**
- [User Guide](USER_GUIDE.md)
- [FAQ](docs/FAQ.md)
- [API Documentation](http://localhost:8000/docs)

**Support:**
- [GitHub Issues](https://github.com/FliteAxis/TrueHour/issues)
- [GitHub Discussions](https://github.com/FliteAxis/TrueHour/discussions)

**Quick Checks:**

1. All containers running? `docker-compose ps`
2. Backend responding? `curl http://localhost:8000/api/flights`
3. Frontend loading? Open http://localhost:3000
4. Check logs: `docker-compose logs -f`

---

## Next Steps

After installation:

1. ✅ Read the [User Guide](USER_GUIDE.md)
2. ✅ Import your logbook or add first flight
3. ✅ Add aircraft with FAA lookup
4. ✅ Configure settings and target certification
5. ✅ Create budget cards
6. ✅ Start tracking expenses

**Happy Flying!** 🛩️
