# Release Process

This document describes the automated release process for flight-budget.

## Overview

Releases are automatically created when code is merged from `develop` to `main`. The process is fully automated and includes:

- Semantic versioning (MAJOR.MINOR.PATCH)
- Automatic version bump detection
- GitHub release creation with release notes
- Docker image tagging with version number
- Changelog extraction

## Branching Strategy

```
develop (active development)
    ↓
    PR → main (production releases)
    ↓
    Automatic release created
```

## Version Bump Detection

The release workflow automatically determines the version bump type based on commit messages:

### Major Version (x.0.0)
Triggered by commit messages containing:
- `breaking:`
- `major:`

**Example**: `breaking: Change authentication system`

### Minor Version (0.x.0)
Triggered by commit messages containing:
- `feat:`
- `feature:`
- `minor:`

**Example**: `feat: Add data source badges to aircraft UI`

### Patch Version (0.0.x)
All other commits (bug fixes, documentation, etc.)

**Example**: `fix: Update health check endpoint for tail-lookup`

## Release Workflow

### 1. Develop Branch Work

```bash
# Work on develop branch
git checkout develop
git pull origin develop

# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin develop
```

### 2. Create Pull Request

```bash
# Create PR from develop to main
gh pr create --base main --head develop \
  --title "Release: [Brief description]" \
  --body "$(cat <<'EOF'
## Summary
[Describe changes]

## Changes
- Feature 1
- Feature 2
- Bug fix 1

## Testing
- [ ] Local testing complete
- [ ] Docker build successful
- [ ] Integration tests passed

## Docker Images
- ryakel/flight-budget:latest
- ryakel/tail-lookup:latest (if applicable)
EOF
)"
```

### 3. Merge Pull Request

When the PR is merged to `main`:

1. **Docker Build Workflow** (`docker-build.yml`) runs:
   - Builds multi-architecture images (amd64, arm64)
   - Pushes to Docker Hub
   - Tags with `latest` and version number
   - Triggers Portainer webhook (if configured)

2. **Release Workflow** (`release.yml`) runs:
   - Analyzes commits since last release
   - Determines version bump (major/minor/patch)
   - Creates Git tag (e.g., `v1.2.3`)
   - Extracts changelog from `.claude/changelog.md`
   - Creates GitHub Release with release notes

### 4. Automatic Release Creation

The release includes:

- **Version tag** (e.g., `v1.2.3`)
- **Release notes** with:
  - What's New section (from changelog)
  - Docker pull commands
  - Quick links to documentation
  - Full commit list
  - Full changelog link
- **Docker images** automatically tagged:
  - `ryakel/flight-budget:latest`
  - `ryakel/flight-budget:v1.2.3`

## Commit Message Convention

Use semantic commit messages for proper version bumping:

```bash
# Major version bump (breaking changes)
git commit -m "breaking: Update API response format"

# Minor version bump (new features)
git commit -m "feat: Add FAA data source badges"
git commit -m "feature: Implement aircraft import validation"

# Patch version bump (bug fixes, docs, etc)
git commit -m "fix: Correct health check endpoint"
git commit -m "docs: Update deployment guide"
git commit -m "chore: Update dependencies"
```

## Maintaining Changelog

Keep `.claude/changelog.md` up to date with all changes. The release workflow extracts content from this file for release notes.

### Changelog Format

```markdown
# Changelog

## Features

### Feature Name
- Description of feature
- Implementation details
- Benefits

### Another Feature
- Description
- Details

## Bug Fixes

- **Issue**: Description of bug
- **Fix**: How it was fixed
- **Impact**: Who is affected

## CI/CD Improvements

### Performance Optimization
- Details of improvements
- Expected results
```

## Docker Hub Integration

After a release is created, Docker images are automatically available:

```bash
# Pull specific version
docker pull ryakel/flight-budget:v1.2.3

# Pull latest
docker pull ryakel/flight-budget:latest

# With tail-lookup integration
docker-compose --profile faa-lookup up -d
```

## Portainer Webhook

If configured, Portainer automatically deploys the new version when:
1. PR is merged to main
2. Docker build completes successfully
3. Images are pushed to Docker Hub
4. Webhook is triggered

See [Deployment Guide](Deployment.md) for Portainer webhook setup.

## Manual Release (Emergency)

If you need to create a manual release:

```bash
# Create and push tag
git checkout main
git pull origin main
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Create release via GitHub CLI
gh release create v1.2.3 \
  --title "Release v1.2.3" \
  --notes "Emergency release notes here"
```

## Troubleshooting

### Release workflow didn't trigger

**Check**:
- Workflow file exists: `.github/workflows/release.yml`
- Push was to `main` branch
- Changes weren't only to ignored paths (`.github/**`, `wiki/**`, `*.md`)

### Wrong version number generated

**Fix**:
- Delete the incorrect tag: `git push --delete origin v1.2.3`
- Update commit messages to follow convention
- Merge again

### Release notes are incomplete

**Fix**:
- Update `.claude/changelog.md` with missing information
- Create a new patch release with documentation updates

### Docker images not tagged correctly

**Check**:
- `docker-build.yml` workflow completed successfully
- Docker Hub credentials are configured
- Tags are being pushed correctly

## Best Practices

1. **Keep changelog updated** - Update `.claude/changelog.md` as you develop
2. **Use semantic commits** - Follow commit message conventions
3. **Test before merging** - Ensure all tests pass on develop
4. **Review Docker builds** - Verify images build successfully
5. **Monitor releases** - Check GitHub releases after merge
6. **Update documentation** - Keep wiki in sync with features

## Related Documentation

- [Branch Strategy](Branch-Strategy.md) - Git branching workflow
- [Deployment Guide](Deployment.md) - Production deployment procedures
- [GitHub Actions](GitHub-Actions.md) - CI/CD pipeline documentation
- [Docker Build Setup](Docker-Build-Setup.md) - Multi-architecture builds

## Questions?

- 🐛 [Open an Issue](https://github.com/ryakel/flight-budget/issues)
- 💬 [Start a Discussion](https://github.com/ryakel/flight-budget/discussions)
