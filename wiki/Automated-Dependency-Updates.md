# Automated Dependency Updates

## Overview

TrueHour uses [Renovate Bot](https://docs.renovatebot.com/) for automated
dependency management across all package ecosystems.

**Configuration**: [`renovate.json`](../renovate.json)

---

## What Renovate Manages

| Ecosystem | Files | Examples |
|-----------|-------|---------|
| **npm** | `frontend-react/package.json`, `package.json` | React, Vite, Tailwind, ESLint |
| **pip** | `backend/requirements.txt` | FastAPI, uvicorn, asyncpg |
| **Docker** | `backend/Dockerfile`, `infrastructure/Dockerfile.frontend-react` | Python, Node, PostgreSQL base images |
| **GitHub Actions** | `.github/workflows/*.yml` | actions/checkout, docker/build-push-action |

---

## Schedule & Behavior

- **When**: Mondays before 6am ET
- **Grouping**: Minor/patch updates grouped by ecosystem
- **Automerge**: Patch updates for Python deps and GitHub Actions
- **Stability**: 3-day minimum release age before adoption
- **Dashboard**: [Issue #7](https://github.com/FliteAxis/TrueHour/issues/7)

---

## Key Constraints

### Python 3.12 Pinned

asyncpg is incompatible with Python 3.13+. Renovate is configured to block
Python upgrades beyond 3.12:

```json
{
  "matchPackageNames": ["python"],
  "allowedVersions": "3.12"
}
```

### FastAPI + Uvicorn Grouped

These packages must be updated together to avoid compatibility issues:

```json
{
  "groupName": "FastAPI ecosystem",
  "matchPackageNames": ["fastapi", "uvicorn"]
}
```

### Major Version Updates

Major updates for `fastapi` and `pydantic` are disabled by default and
require manual review. Other major updates are grouped separately and
scheduled for the first of the month.

---

## Package Rules Summary

| Rule | Behavior |
|------|----------|
| Python patches | Automerge via squash PR |
| GitHub Actions patches | Automerge via squash PR |
| Python minor/patch | Grouped as "Python dependencies (non-major)" |
| GitHub Actions minor/patch | Grouped as "GitHub Actions" |
| Major updates | Monthly schedule, separate PRs |
| Docker base images | Monthly schedule, grouped |
| fastapi/pydantic major | Disabled |

---

## Handling Renovate PRs

### Patch/Minor Updates

1. Check CI passes
2. Review changelog if concerned
3. Merge (or let automerge handle patches)

### Major Updates

1. Read the migration guide
2. Check for breaking changes
3. Test locally if significant
4. Merge or defer

---

## Monitoring

- **Dependency Dashboard**: Check
  [Issue #7](https://github.com/FliteAxis/TrueHour/issues/7) for pending
  updates, rate-limited PRs, and detected dependencies
- **Renovate Logs**:
  [Mend.io Portal](https://developer.mend.io/github/FliteAxis/TrueHour)

---

## Further Reading

- [Renovate Documentation](https://docs.renovatebot.com/)
- [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/)
