# Release Workflow Architecture

This document explains how the Docker build and release workflows work together.

## Workflow Overview

When code is pushed to `main`, **two workflows run in parallel**:

### 1. docker-build.yml - Docker Image Build
**Purpose**: Build and publish multi-architecture Docker images

**Triggers on**:
- Push to `main` branch
- Paths: `app/**`, `infrastructure/**`

**What it does**:
1. Checks out code
2. Gets latest version tag (from previous releases)
3. Builds multi-architecture Docker images (amd64, arm64)
4. Pushes to Docker Hub with tags:
   - `ryakel/flight-budget:latest`
   - `ryakel/flight-budget:v1.2.3` (from latest git tag)
5. Updates Docker Hub repository description
6. Triggers Portainer webhook (if configured)

### 2. release.yml - GitHub Release Creation
**Purpose**: Create GitHub releases with comprehensive release notes

**Triggers on**:
- Push to `main` branch
- Paths: `app/**`, `infrastructure/**` (same as docker-build)

**What it does**:
1. Analyzes commits since last release
2. Determines version bump based on commit messages:
   - `breaking:` or `major:` → Major (x.0.0)
   - `feat:` or `feature:` → Minor (0.x.0)
   - Other → Patch (0.0.x)
3. Creates new Git tag (e.g., `v1.2.3`)
4. Extracts changelog from `wiki/Changelog.md`
5. Generates commit list
6. Creates GitHub Release with:
   - Version tag
   - Release notes from changelog
   - Docker pull commands
   - Links to documentation
   - Full commit list

## Why Two Workflows?

### Separation of Concerns
- **docker-build.yml**: Focused on building and deploying containers
- **release.yml**: Focused on version management and release notes

### Benefits
1. **Clear responsibilities**: Each workflow has a single, well-defined purpose
2. **Independent failures**: If release creation fails, Docker images still deploy
3. **Flexibility**: Can trigger Docker builds without creating releases (via workflow_dispatch)
4. **Better logging**: Separate logs make troubleshooting easier

## Workflow Execution Order

Both workflows run in parallel, but they coordinate through Git tags:

```
Push to main
    ↓
    ├─→ docker-build.yml (parallel)
    │   ├─ Get latest tag (v1.2.2)
    │   ├─ Build images
    │   └─ Push with tag v1.2.2
    │
    └─→ release.yml (parallel)
        ├─ Analyze commits
        ├─ Create new tag (v1.2.3)
        └─ Create release
```

**Note**: The first time docker-build runs, it uses the old tag. Subsequent builds will use the new tag created by release.yml.

## Handling Version Tags

### First Push (Initial Release)
1. `release.yml` creates tag `v1.0.0`
2. `docker-build.yml` falls back to `v1.0.0`
3. Images tagged: `latest` and `v1.0.0`

### Subsequent Pushes
1. `release.yml` reads last tag (e.g., `v1.2.2`)
2. `release.yml` creates new tag (e.g., `v1.2.3`)
3. `docker-build.yml` reads last tag (still `v1.2.2` during this build)
4. Images initially tagged: `latest` and `v1.2.2`
5. **Next build** will use `v1.2.3`

### Solution: Sequential Tagging
To ensure Docker images get the correct version tag immediately, we could make them sequential:

```yaml
# Option: Make docker-build depend on release
jobs:
  release:
    # ... release job ...

  docker:
    needs: release  # Wait for release to complete
    # ... docker build job ...
```

However, we chose parallel execution because:
- Docker images are primarily accessed via `latest` tag
- Version-specific tags are for historical reference
- One build delay is acceptable (next build corrects it)
- Parallel execution is faster

## Commit Message Convention

For proper version bumping, use semantic commit prefixes:

### Major Version (Breaking Changes)
```bash
git commit -m "breaking: Replace ARLA API with tail-lookup service"
git commit -m "major: Change API response structure"
```

### Minor Version (New Features)
```bash
git commit -m "feat: Add data source badges to aircraft UI"
git commit -m "feature: Implement aircraft import validation"
```

### Patch Version (Bug Fixes, Docs)
```bash
git commit -m "fix: Correct health check endpoint"
git commit -m "docs: Update deployment guide"
git commit -m "chore: Update dependencies"
```

## Workflow Permissions

### docker-build.yml
```yaml
permissions:
  contents: write   # For tagging (legacy, but kept for safety)
  packages: write   # For Docker Hub pushes
  actions: write    # For cache operations
```

### release.yml
```yaml
permissions:
  contents: write   # For creating tags and releases
```

## Maintaining the Changelog

The `release.yml` workflow extracts release notes from `wiki/Changelog.md`:

### Changelog Structure
```markdown
# Changelog

## Latest Changes

### Feature Name (Date)
- Description of changes
- Implementation details

### Another Feature (Date)
- More changes

## Core Features
...
```

### Extraction Logic
The workflow extracts everything between:
- Start: `## Latest Changes`
- End: `## Core Features` (or next major section)

### Best Practices
1. **Keep "Latest Changes" up to date** - Add entries as you develop
2. **Use clear descriptions** - These become release notes
3. **Group related changes** - Use subsections (###)
4. **Move to appropriate section after release** - Keep "Latest Changes" focused on unreleased work

## Troubleshooting

### Both workflows didn't trigger
**Check**:
- Are changes in `app/**` or `infrastructure/**`?
- Changes to only `wiki/**` or `.github/**` won't trigger
- Check GitHub Actions tab for errors

### Release created but Docker images not tagged correctly
**Expected**: First build uses previous tag
**Wait**: Next build will use new tag
**Workaround**: Trigger manual workflow_dispatch after release

### Version bump is wrong
**Cause**: Commit messages don't follow convention
**Fix**:
1. Delete incorrect tag: `git push --delete origin v1.2.3`
2. Update commit messages: `git commit --amend`
3. Force push or create new commit

### Release notes are incomplete
**Cause**: `wiki/Changelog.md` not updated
**Fix**:
1. Update changelog
2. Create new patch release or edit release manually

## Related Documentation

- [Release Process](Release-Process) - Complete release guide
- [Branch Strategy](Branch-Strategy) - Git workflow
- [GitHub Actions](GitHub-Actions) - CI/CD overview
- [Changelog](Changelog) - Project changes

---

**Last Updated**: 2025-11-28
