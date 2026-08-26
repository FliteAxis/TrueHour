# TrueHour - Development Guide

## Project Overview

**TrueHour** by FliteAxis is an aviation expense tracking app that calculates
true hourly flying costs. Personal-first tool with potential SaaS expansion
(June 2026 checkpoint). Product positioning, copy tone, personas, and roadmap
posture: `wiki/Product-Notes.md` — read it before writing user-facing copy.

**Stack**: FastAPI (Python 3.12) + React 19 (TypeScript) + PostgreSQL 18 + Docker
**Repo**: Consolidated monorepo (backend, frontend-react, infrastructure)
**Tracking**: Work for this repo is ticketed in the `FATH` project in It's a Plan.

## Critical Constraints

- **Python must stay on 3.12** - asyncpg is incompatible with Python 3.13+
- **FastAPI + Uvicorn update together** - grouped in Renovate config
- **No major version bumps** for fastapi or pydantic without explicit approval
- The API container image (`python:3.12-slim`) does NOT have `curl` - use `python -c "import urllib.request; ..."` for healthchecks

## Architecture Decisions (settled — don't relitigate)

- Consolidated monorepo, not microservices
- Raw asyncpg with parameterized queries, no ORM; custom startup migrations
  (`backend/app/db_migrations.py`), not Alembic; schema in `infrastructure/init.sql`
- FAA aircraft data baked into nightly-rebuilt Docker images (SQLite, 308K+ aircraft)
- Single-user design (no user_id columns) - multi-tenancy deferred until SaaS validation

## Quick Reference

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest tests/unit --cov=app && pytest tests/integration --cov=app
```

### Frontend

```bash
cd frontend-react
npm install
npm run dev        # Dev server on :5173
npm run build      # tsc -b && vite build
npm test           # vitest run
```

**Key libs**: Zustand (state), React Query (data fetching), Tailwind CSS 3, Chart.js, React Router 7

### Docker (full stack)

```bash
cd infrastructure
cp .env.example .env
docker compose up -d
# Frontend: http://localhost:8181 | API: http://localhost:8000
```

Three containers: `frontend` (nginx), `api` (FastAPI), `db` (PostgreSQL 18 Alpine)

## Lint & CI

Pre-commit hooks enforce everything (`pre-commit install`; config in
`.pre-commit-config.yaml`): Black/isort/Flake8/Bandit (Python, 120-char lines),
ESLint/Prettier (frontend), hadolint/yamllint/shellcheck/markdownlint (infra).
CI workflows live in `.github/workflows/` (tests, lint, builds, security
scans, SBOM) — see `wiki/CI-CD-Pipeline.md` for detail.

## API Structure

- Health endpoint: `GET /api/v1/health`
- All user endpoints: `/api/user/...` (flights, aircraft, expenses, budget-cards, settings, etc.)

## Domain Notes

**Simulated Instrument Time** vs **Simulated Flight Time** - these are different and must never be conflated:
- Simulated Instrument = flying a real aircraft under a hood/foggles
- Simulated Flight = time in a simulator device (AATD/BATD), NOT actual flight time

ForeFlight CSV is the primary import source - preserve all columns during import.

**True Hourly Cost** = (Annual Fixed Costs / Annual Flight Hours) + Hourly Variable Costs

## Git Conventions

- Commit style: `fix:`, `feat:`, `chore(deps):` etc. Co-Authored-By tags for AI-assisted commits are expected.
- Branch naming: `feature/v{version}-description`, `fix/v{version}-description`
- PRs go `feature-branch` -> `develop` -> `main`; prefer merge commits; force pushes to `main`/`develop` require explicit confirmation
- Renovate handles dependency PRs (scheduled Mondays before 6am ET)
