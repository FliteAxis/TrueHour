# GitHub Actions Workflows

This directory contains CI/CD workflows for TrueHour.

## Active Workflows (Phase 1 Complete)

All workflows now push to GitHub Container Registry (GHCR) under the `ghcr.io/fliteaxis/*` namespace.

### Build Workflows

- **build-main.yml** - Build and deploy on main branch
  - Builds both frontend and backend containers
  - Multi-platform: linux/amd64, linux/arm64
  - Tags: `latest`, `YYYY-MM-DD`, semantic versions
  - Pushes to `ghcr.io/fliteaxis/truehour-api:latest` and `ghcr.io/fliteaxis/truehour-frontend:latest`

- **build-develop.yml** - Build and test on develop branch
  - Builds both frontend and backend containers
  - Multi-platform: linux/amd64, linux/arm64
  - Tags: `develop`, `develop-YYYY-MM-DD`, `develop-SHA`
  - Pushes to `ghcr.io/fliteaxis/truehour-api:develop` and `ghcr.io/fliteaxis/truehour-frontend:develop`

- **nightly-build.yml** - Nightly FAA database rebuild
  - Runs daily at 6:00 AM UTC (after FAA updates)
  - Downloads latest FAA data and builds SQLite database
  - Builds API image with fresh database
  - Multi-platform: linux/amd64, linux/arm64
  - Tags: `nightly`, `nightly-YYYY-MM-DD`
  - Creates GitHub release with database artifact
  - Pushes to `ghcr.io/fliteaxis/truehour-api:nightly`

### Maintenance Workflows

- **stale.yml** - Mark stale issues and PRs
- **sync-wiki.yml** - Sync wiki documentation

## Docker Image Strategy

### Image Tags

**Main Branch (Stable Releases)**:
- `ghcr.io/fliteaxis/truehour-api:latest`
- `ghcr.io/fliteaxis/truehour-api:YYYY-MM-DD`
- `ghcr.io/fliteaxis/truehour-api:vX.Y.Z`
- `ghcr.io/fliteaxis/truehour-frontend:latest`
- `ghcr.io/fliteaxis/truehour-frontend:YYYY-MM-DD`
- `ghcr.io/fliteaxis/truehour-frontend:vX.Y.Z`

**Develop Branch (Development Builds)**:
- `ghcr.io/fliteaxis/truehour-api:develop`
- `ghcr.io/fliteaxis/truehour-api:develop-YYYY-MM-DD`
- `ghcr.io/fliteaxis/truehour-api:develop-SHA`
- `ghcr.io/fliteaxis/truehour-frontend:develop`
- `ghcr.io/fliteaxis/truehour-frontend:develop-YYYY-MM-DD`
- `ghcr.io/fliteaxis/truehour-frontend:develop-SHA`

**Nightly Builds (Latest FAA Data)**:
- `ghcr.io/fliteaxis/truehour-api:nightly`
- `ghcr.io/fliteaxis/truehour-api:nightly-YYYY-MM-DD`

### Platform Support

All images are built for:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/v8)

## Workflow Architecture

### Parallel Multi-Platform Builds

All build workflows use a matrix strategy for optimal performance:

1. **Prepare Job** - Sets up metadata and versioning
2. **Build Jobs** (Parallel) - Each platform builds independently
   - Uses push-by-digest strategy
   - Per-platform cache scoping
   - ~15 minutes total (3x speedup vs sequential)
3. **Merge Job** - Combines platform images into multi-platform manifest
4. **Release Job** (main branch only) - Creates GitHub releases

### Database Nightly Build

The nightly workflow:
1. Downloads latest FAA aircraft registry data
2. Builds SQLite database with Python script
3. Uploads database artifact for builds
4. Builds API image with fresh database (parallel per platform)
5. Creates GitHub release with downloadable database file

## Migration Notes

**Phase 0 → Phase 1 Migration (Complete)**:
- Migrated all workflows from Docker Hub to GHCR
- Updated paths for monorepo structure (`backend/**`, `frontend/**`)
- Fixed nightly build paths (`backend/scripts/`, `backend/data/`)
- Archived old Docker Hub workflows in `.github/workflows/archive/`

**Docker Hub Deprecation**:
- Old images: `docker.io/ryakel/tail-lookup` (deprecated)
- New images: `ghcr.io/fliteaxis/truehour-*` (active)

## Testing Workflows

### Test Develop Build Locally

```bash
cd infrastructure
docker compose -f docker-compose.ghcr-develop.yml pull
docker compose -f docker-compose.ghcr-develop.yml up -d
```

### Manually Trigger Workflows

```bash
# Trigger nightly build
gh workflow run nightly-build.yml

# Trigger develop build
git push origin develop
```

## Future Enhancements (Phase 9)

- **test.yml** - Automated test suite execution
- **deploy.yml** - Production deployment workflow (if SaaS pivot occurs)
- Automated integration testing
- Performance benchmarking
