# TrueHour - Development Guide

## Project Overview

**TrueHour** by FliteAxis is an aviation expense tracking app that calculates
true hourly flying costs. Personal-first tool with potential SaaS expansion
(June 2026 checkpoint).

**Stack**: FastAPI (Python 3.12) + React 19 (TypeScript) + PostgreSQL 18 + Docker
**Repo**: Consolidated monorepo (backend, frontend-react, infrastructure)

## Critical Constraints

- **Python must stay on 3.12** - asyncpg is incompatible with Python 3.13+
- **FastAPI + Uvicorn update together** - grouped in Renovate config
- **No major version bumps** for fastapi or pydantic without explicit approval
- The API container image (`python:3.12-slim`) does NOT have `curl` - use `python -c "import urllib.request; ..."` for healthchecks

## Quick Reference

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Tests:**
```bash
pytest tests/unit --cov=app
pytest tests/integration --cov=app
```

**Lint (all enforced by pre-commit):**
- Black (120 char lines, target py312)
- isort (black-compatible profile)
- Flake8 (120 chars, ignores E203/W503/C901)
- Bandit (security, excludes tests)

### Frontend

```bash
cd frontend-react
npm install
npm run dev        # Dev server on :5173
npm run build      # tsc -b && vite build
npm test           # vitest run
npm run lint       # eslint
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

## Pre-commit Hooks

Installed via `pre-commit install`. Runs on every commit:

**Python**: Black, isort, Flake8, Bandit
**Frontend**: ESLint (--fix), Prettier (--write)
**Infra**: hadolint (Dockerfiles), yamllint, shellcheck, markdownlint
**General**: trailing whitespace, EOF fixes, YAML/JSON validation, large file check, merge conflict detection, private key detection

## CI Workflows

| Workflow | Trigger | Key Jobs |
|----------|---------|----------|
| `tests.yml` | push main/develop, PRs | Backend pytest (unit + integration), Frontend vitest |
| `lint.yml` | push main/develop, PRs | Python lint, Frontend lint, Dockerfile lint, YAML/MD/Shell lint |
| `build-develop.yml` | push develop | Multi-arch Docker build, push to GHCR, smoke tests |
| `build-main.yml` | push main | Multi-arch Docker build, push to GHCR, GitHub release |
| `security-scan.yml` | push main/develop, PRs | Semgrep, CodeQL, Trivy, OWASP dependency check, Gitleaks |
| `sbom-generation.yml` | push main/develop, PRs | SBOM generation, attestation |

## API Structure

- Health endpoint: `GET /api/v1/health`
- All user endpoints: `/api/user/...` (flights, aircraft, expenses, budget-cards, settings, etc.)
- Database schema initialized via `infrastructure/init.sql`
- Startup migrations in `backend/app/db_migrations.py`

## Domain Notes

**Simulated Instrument Time** vs **Simulated Flight Time** - these are different:
- Simulated Instrument = flying a real aircraft under a hood/foggles
- Simulated Flight = time in a simulator device (AATD/BATD), NOT actual flight time

**True Hourly Cost** = (Annual Fixed Costs / Annual Flight Hours) + Hourly Variable Costs

## Git Conventions

- Commit style: `fix:`, `feat:`, `chore(deps):` etc.
- Branch naming: `feature/v{version}-description`, `fix/v{version}-description`
- PRs go `feature-branch` -> `develop` -> `main`
- Renovate handles dependency PRs (scheduled Mondays before 6am ET)
