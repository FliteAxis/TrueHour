# Quick Start Guide

Get TrueHour running in 5 minutes!

## Using Pre-Built Images (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour

# 2. Pull and start latest stable images
docker compose -f infrastructure/docker-compose.ghcr.yml pull
docker compose -f infrastructure/docker-compose.ghcr.yml up -d

# 3. Access the application
open http://localhost:8181
```

The database schema will be automatically initialized on first run.

---

## Building from Source

```bash
# 1. Clone repository
git clone https://github.com/FliteAxis/TrueHour.git
cd TrueHour

# 2. Build and start all services
docker compose -f infrastructure/docker-compose.yml up -d --build

# 3. Access the application
open http://localhost:8181
```

---

## Testing Develop Branch

```bash
# Pull and run latest develop builds
docker compose -f infrastructure/docker-compose.ghcr-develop.yml pull
docker compose -f infrastructure/docker-compose.ghcr-develop.yml up -d
```

## Architecture

TrueHour uses a three-container architecture:

| Container | Purpose | Port |
|-----------|---------|------|
| **frontend** | nginx serving static files | 8181 |
| **api** | FastAPI backend with FAA data | 8000 |
| **db** | PostgreSQL 16 | 5432 (internal) |

**Total RAM Usage:** ~100-150MB

## Access Your App

- **Frontend**: http://localhost:8181
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Quick Commands

```bash
# View logs
docker compose -f infrastructure/docker-compose.yml logs -f

# Restart containers
docker compose -f infrastructure/docker-compose.yml restart

# Update from GHCR
docker compose -f infrastructure/docker-compose.ghcr.yml pull
docker compose -f infrastructure/docker-compose.ghcr.yml up -d

# Check API health
curl http://localhost:8000/api/v1/health

# Check database
docker exec -it infrastructure-db-1 psql -U truehour truehour

# Backup database
docker exec infrastructure-db-1 pg_dump -U truehour truehour > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20251203.sql | docker exec -i infrastructure-db-1 psql -U truehour truehour
```

## Verify Installation

```bash
# Test FAA lookup
curl http://localhost:8000/api/v1/aircraft/N172SP

# Test user aircraft API
curl http://localhost:8000/api/user/aircraft

# Test expenses API
curl http://localhost:8000/api/expenses
```

## Need Help?

- 📖 Full documentation: [Home](Home)
- 🚀 API documentation: [API Documentation](API-Documentation)
- 🏗️ Architecture: [Architecture Overview](Architecture-Overview)
- 🐛 Issues: [GitHub Issues](https://github.com/FliteAxis/TrueHour/issues)

## Troubleshooting

Having issues? Check:
1. Container logs: `docker compose -f infrastructure/docker-compose.yml logs`
2. Health endpoint: `curl http://localhost:8000/api/v1/health`
3. Port availability: `lsof -i :8181 && lsof -i :8000`
4. Database connection: `docker exec -it infrastructure-db-1 psql -U truehour truehour`
5. GitHub Actions: Check workflow runs for latest builds

---

**That's it!** Your TrueHour is now running. 🎉
