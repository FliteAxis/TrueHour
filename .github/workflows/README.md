# GitHub Actions Workflows

This directory contains CI/CD workflows for TrueHour.

## Current Workflows (Phase 0)

These workflows were migrated from tail-lookup and will be updated in Phase 9:

- **build-develop.yml** - Build and test on develop branch
- **build-main.yml** - Build and deploy on main branch
- **nightly-build.yml** - Nightly FAA database rebuild
- **stale.yml** - Mark stale issues
- **sync-wiki.yml** - Sync wiki documentation

## Planned Workflows (Phase 9)

Will be refactored for monorepo structure:

- **nightly.yml** - Daily FAA database rebuild + Docker image push
- **build.yml** - Build frontend + backend on code changes
- **test.yml** - Run test suite
- **deploy.yml** - Deploy to production (if SaaS pivot occurs)

## Notes

Current workflows reference single-repo structure. They will be updated in Phase 9 to:
1. Build both frontend and backend containers
2. Use monorepo paths
3. Push to GHCR with proper tagging
4. Include FAA database in backend image
