# Project Structure

```
flight_budget/
│
├── 📁 .github/                          GitHub configurations
│   └── workflows/
│       ├── docker-build.yml             Build & deploy on push to main
│       └── update-dependencies.yml      Weekly CDN dependency updates
│
├── 📁 data/                             Persistent data directory
│   └── .gitkeep                         Keep directory in git
│
├── 📁 libs/                             Vendored JavaScript libraries
│   ├── papaparse.min.js                 CSV parsing (19KB)
│   ├── chart.umd.min.js                 Chart visualization (200KB)
│   └── html2pdf.bundle.min.js           PDF export (885KB)
│
├── 📁 nginx/                            Nginx web server config
│   └── nginx.conf                       Custom nginx configuration
│
├── 📄 .dockerignore                     Docker build exclusions
├── 📄 .env.example                      Environment variables template
├── 📄 .gitignore                        Git exclusions
├── 📄 CONTAINER_SETUP.md                Complete setup documentation
├── 📄 DEPLOYMENT.md                     Portainer deployment guide
├── 📄 docker-compose.yml                Docker Compose stack definition
├── 📄 Dockerfile                        Container image definition
├── 📄 index.html                        Main application (SPA)
├── 📄 PROJECT_STRUCTURE.md              This file
├── 📄 QUICK_START.md                    Quick start guide
├── 📄 README.md                         Main documentation
└── 📄 TODO.md                           Task tracking & roadmap
```

## File Descriptions

### Configuration Files

| File | Purpose | Notes |
|------|---------|-------|
| `Dockerfile` | Defines container image | nginx:alpine base, ~30MB final size |
| `docker-compose.yml` | Stack definition for Portainer | Port 8181, volume persistence |
| `.dockerignore` | Excludes files from build | Reduces build context size |
| `.env.example` | Environment variable template | Copy to `.env` for local dev |
| `nginx/nginx.conf` | Web server configuration | Security headers, gzip, caching |
| `.gitignore` | Git exclusions | Excludes .env, logs, temp files |

### Application Files

| File | Purpose | Size |
|------|---------|------|
| `index.html` | Main application (SPA) | ~37KB |
| `libs/papaparse.min.js` | CSV parsing library | 19KB |
| `libs/chart.umd.min.js` | Chart visualization | 200KB |
| `libs/html2pdf.bundle.min.js` | PDF export | 885KB |

### Documentation

| File | Audience | Purpose |
|------|----------|---------|
| `README.md` | All users | Main documentation, features, usage |
| `QUICK_START.md` | New users | Get up and running in 5 minutes |
| `DEPLOYMENT.md` | DevOps | Detailed Portainer setup guide |
| `CONTAINER_SETUP.md` | Technical | Complete containerization overview |
| `PROJECT_STRUCTURE.md` | Developers | This file - project layout |
| `TODO.md` | Maintainers | Task tracking and roadmap |

### Automation

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/docker-build.yml` | Push to main | Build & deploy |
| `.github/workflows/update-dependencies.yml` | Weekly (Sun 2AM) | Update JS libs |

## Directory Purposes

### `/data/` - Persistent Storage
- **Purpose**: Store aircraft defaults and configurations
- **Mount Point**: Mapped to Docker volume `flight-budget-data`
- **Persistence**: Survives container restarts and updates
- **Contents**: JSON files for aircraft configurations (to be implemented)

### `/libs/` - JavaScript Dependencies
- **Purpose**: Vendored JavaScript libraries (no CDN dependencies)
- **Update**: Automated via GitHub Actions (weekly)
- **Size**: ~1.1MB total
- **Libraries**: PapaParse, Chart.js, html2pdf.js

### `/nginx/` - Web Server Config
- **Purpose**: Custom nginx configuration
- **Features**: Security headers, gzip compression, caching policies
- **Health Check**: `/health` endpoint
- **Data API**: `/data/` endpoint for aircraft configs

### `/.github/workflows/` - CI/CD
- **Purpose**: Automated build and deployment
- **Triggers**: Push to main, weekly schedule, manual
- **Outputs**: Docker image, Portainer webhook trigger

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser                                               │
│  ─────────────                                              │
│                                                             │
│  1. User visits http://budget.domain.com                    │
│  2. Loads index.html + JS libraries                         │
│  3. Fetches aircraft defaults from /data/                   │
│  4. User imports CSV, calculates budget                     │
│  5. Saves configuration (localStorage or download JSON)     │
│  6. Exports PDF report                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│  Nginx Reverse Proxy (Host)                                │
│  ───────────────────────────                                │
│                                                             │
│  • SSL termination                                          │
│  • Reverse proxy to :8181                                   │
│  • Rate limiting                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│  Docker Container (nginx:alpine)                            │
│  ────────────────────────────────                           │
│                                                             │
│  /usr/share/nginx/html/                                     │
│  ├── index.html           ← Main application                │
│  ├── libs/                ← JavaScript libraries            │
│  │   ├── papaparse.min.js                                   │
│  │   ├── chart.umd.min.js                                   │
│  │   └── html2pdf.bundle.min.js                             │
│  └── data/                ← Persistent volume mount         │
│      └── aircraft-defaults.json (TODO)                      │
│                                                             │
│  nginx.conf:                                                │
│  • Security headers                                         │
│  • Gzip compression                                         │
│  • /health endpoint                                         │
│  • /data/ endpoint                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────────┐
│  Docker Volume                                              │
│  ─────────────                                              │
│                                                             │
│  flight-budget-data                                         │
│  • Persists across container updates                        │
│  • Stores aircraft configurations                           │
│  • Backed up via docker volume commands                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Build & Deploy Flow

```
Developer
    ↓ git push
GitHub Repository (ryakel/flight-budget)
    ↓ webhook
GitHub Actions
    ├─→ Download CDN dependencies (if needed)
    ├─→ Build Docker image (multi-arch)
    │   └─→ nginx:alpine + app files + libs
    ├─→ Push to Docker Hub
    │   └─→ ryakel/flight-budget:latest
    └─→ Trigger Portainer webhook
         ↓
Portainer
    ├─→ Pull latest image from Docker Hub
    ├─→ Stop old container (graceful)
    ├─→ Start new container
    │   └─→ Mount persistent volume
    └─→ Health check (wait for /health)
         ↓
Production (Live!)
```

## Image Layers (Dockerfile)

```
┌─────────────────────────────────────────┐
│ Layer 1: nginx:alpine (~23MB)          │ ← Base image
├─────────────────────────────────────────┤
│ Layer 2: wget package (~1MB)           │ ← Health checks
├─────────────────────────────────────────┤
│ Layer 3: nginx.conf (~2KB)             │ ← Custom config
├─────────────────────────────────────────┤
│ Layer 4: Application files (~37KB)     │ ← index.html
├─────────────────────────────────────────┤
│ Layer 5: JS libraries (~1.1MB)         │ ← libs/
├─────────────────────────────────────────┤
│ Layer 6: Data directory setup          │ ← /data/
└─────────────────────────────────────────┘
Total: ~25-30MB (compressed: ~12MB)
```

## Port Mapping

```
External World
      ↓
   Port 443 (HTTPS)
      ↓
Nginx Reverse Proxy (Host)
      ↓
   Port 8181 (HTTP)
      ↓
Docker Container
      ↓
   Port 80 (nginx)
      ↓
Application
```

## Volume Mount Points

```
Host                                Container
────────────────────────────────    ──────────────────────────────────
Docker Volume:                      /usr/share/nginx/html/data/
flight-budget-data          →       ├── aircraft-defaults.json (TODO)
                                    └── [user configurations]
```

## Resource Limits

| Resource | Reservation | Limit | Notes |
|----------|-------------|-------|-------|
| **CPU** | 0.1 cores | 0.5 cores | Prevents resource hogging |
| **Memory** | 32MB | 128MB | Plenty for static site |
| **Storage** | - | - | Volume only (tiny) |
| **Network** | - | - | Unlimited |

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Internet (Untrusted)                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ HTTPS (SSL/TLS)
┌─────────────────────────────────────────────────────────────┐
│  Nginx Reverse Proxy (Host)                                │
│  • SSL termination                                          │
│  • Rate limiting                                            │
│  • IP filtering (optional)                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ HTTP (localhost only)
┌─────────────────────────────────────────────────────────────┐
│  Docker Container (Isolated)                                │
│  • Non-root user (nginx)                                    │
│  • Security headers                                         │
│  • No outbound network (optional)                           │
│  • Read-only filesystem (optional)                          │
└─────────────────────────────────────────────────────────────┘
```

## File Sizes

| Component | Size (Uncompressed) | Size (Compressed) |
|-----------|---------------------|-------------------|
| **Base Image** | 23MB | 8MB |
| **Application** | 37KB | 12KB |
| **JS Libraries** | 1.1MB | 400KB |
| **Config Files** | 5KB | 2KB |
| **Total Image** | ~25-30MB | ~12MB |
| **Volume Data** | <1MB | - |

## Update Frequency

| Component | Update Method | Frequency |
|-----------|---------------|-----------|
| **Base Image** | Rebuild on push | On commits |
| **Application** | Git push → CI/CD | As needed |
| **JS Libraries** | GitHub Action | Weekly (automated) |
| **nginx Config** | Git push → CI/CD | As needed |
| **Documentation** | Git push | As needed |

## Health & Monitoring

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/` | Main application | HTML page |
| `/health` | Health check | `healthy` (200 OK) |
| `/data/` | Persistent data | JSON files |
| `/libs/` | JavaScript libraries | JS files |

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Protocol** | HTTP | HTTPS |
| **Port** | 8181 | 443 (via proxy) |
| **Domain** | localhost | budget.domain.com |
| **SSL** | None | Let's Encrypt |
| **Volume** | Local dir | Docker volume |
| **Logs** | Console | Persistent logs |
| **Updates** | Manual | Automated |

---

**Maintained by**: ryakel
**Last Updated**: 2025-11-27
**Version**: 1.0
