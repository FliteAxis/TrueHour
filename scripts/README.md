# TrueHour Scripts

This directory contains utility scripts for development, deployment, and maintenance.

## Development Scripts

### setup-dev-environment.sh
**Purpose**: One-command setup for development environment

Installs:
- Homebrew packages (hadolint, shellcheck, yamllint, gitleaks, trivy, checkov, syft)
- Python tools (black, isort, flake8, pylint, mypy, bandit, safety, pip-audit)
- Node.js tools (htmlhint, markdownlint-cli2)
- Pre-commit hooks (optional)
- Backend Python dependencies

**Usage**:
```bash
./scripts/setup-dev-environment.sh
```

**Interactive**: Prompts for optional components

---

### pre-commit.sh
**Purpose**: Manual pre-commit validation with detailed failure summary

Runs all checks:
- Python formatting (Black, isort)
- Python linting (Flake8, Pylint, mypy)
- Python security (Bandit, Safety, pip-audit)
- Dockerfile linting (hadolint)
- Docker Compose validation
- YAML linting (yamllint)
- Markdown linting (markdownlint)
- HTML linting (htmlhint)
- Shell script linting (shellcheck)
- Secret scanning (gitleaks)
- Git checks (merge conflicts, large files)

**Usage**:
```bash
./scripts/pre-commit.sh
```

**Output Features**:
- Real-time progress output as each check runs
- Color-coded results (✓ success, ✗ error, ⚠ warning)
- Condensed summary at the end showing:
  - All failures grouped by category
  - Quick-fix commands for common issues
  - File/line references in detailed output above

**Exit Codes**:
- 0: All checks passed
- 1: One or more checks failed

---

## Backend Scripts

### update_faa_data.py
**Purpose**: Download and build FAA aircraft registry database

Downloads:
- FAA Master database
- Aircraft reference data
- Registration data

Builds:
- SQLite database with aircraft information
- Indexed for fast lookups

**Usage**:
```bash
python backend/scripts/update_faa_data.py [output_path]
```

**Default Output**: `backend/data/aircraft.db`

**Schedule**: Runs nightly via GitHub Actions

---

## Pre-commit Hooks

TrueHour supports two methods for pre-commit validation:

### Method 1: pre-commit Framework (Recommended)

**Setup**:
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files (optional)
pre-commit run --all-files
```

**Configuration**: [`.pre-commit-config.yaml`](../.pre-commit-config.yaml)

**Benefits**:
- Automatic execution on `git commit`
- Auto-update via `pre-commit autoupdate`
- CI integration with pre-commit.ci
- Skip with `git commit --no-verify` if needed

**Hooks Included**:
- Black (Python formatting)
- isort (import sorting)
- Flake8 (Python linting)
- Bandit (Python security)
- yamllint (YAML validation)
- markdownlint (Markdown linting)
- ShellCheck (shell script linting)
- hadolint (Dockerfile linting)
- Gitleaks (secret scanning)
- General file checks (trailing whitespace, EOF, etc.)

### Method 2: Manual Shell Script

**Setup**:
```bash
# Make executable
chmod +x scripts/pre-commit.sh

# Optional: Install as git hook
ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
```

**Usage**:
```bash
# Run manually
./scripts/pre-commit.sh

# Or commit (if installed as hook)
git commit -m "message"
```

**Benefits**:
- No dependencies (besides the tools themselves)
- Full control over execution
- Detailed output with colors
- More verbose feedback

---

## Quick Commands

### Format Code
```bash
# Auto-fix Python formatting
black backend/
isort backend/
```

### Run Linting
```bash
# Python
flake8 backend/
pylint backend/app
mypy backend/app

# Dockerfile
hadolint backend/Dockerfile
hadolint infrastructure/Dockerfile.frontend

# YAML
yamllint .github/workflows/ infrastructure/

# Markdown
markdownlint-cli2 "**/*.md"

# HTML
htmlhint "frontend/**/*.html"
```

### Security Checks
```bash
# Python code security
bandit -r backend/app

# Dependency vulnerabilities
safety scan --target backend/requirements.txt
pip-audit --require backend/requirements.txt

# Secret scanning
gitleaks detect --source . --verbose

# Container scanning (requires built images)
trivy image truehour-api:test
trivy image truehour-frontend:test
```

### SBOM Generation
```bash
# Python dependencies
cyclonedx-py requirements \
  --input backend/requirements.txt \
  --output sbom.json

# License report
pip install -r backend/requirements.txt
pip-licenses --format=json --output-file=licenses.json

# Container SBOM (requires built image)
syft truehour-api:test -o cyclonedx-json
syft truehour-api:test -o spdx-json
```

### Docker Operations
```bash
# Validate compose file
docker-compose -f infrastructure/docker-compose.ghcr.yml config

# Build images
docker-compose -f infrastructure/docker-compose.ghcr.yml build

# Security scan with Checkov
checkov -f backend/Dockerfile
checkov -f infrastructure/docker-compose.ghcr.yml
```

---

## CI/CD Integration

These scripts complement the automated CI/CD workflows:

| Script | CI Workflow | Purpose |
|--------|-------------|---------|
| `pre-commit.sh` | `lint.yml` | Local validation before push |
| `update_faa_data.py` | `nightly-build.yml` | Keep FAA data current |
| N/A | `security-scan.yml` | Daily security monitoring |
| N/A | `sbom-generation.yml` | Weekly SBOM updates |

---

## Installation Requirements

### macOS (via Homebrew)
```bash
# Install Homebrew first
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then run setup script
./scripts/setup-dev-environment.sh
```

### Linux (manual)
```bash
# Python tools
pip3 install black isort flake8 pylint mypy bandit safety pip-audit pre-commit

# Node.js tools
npm install -g htmlhint markdownlint-cli2

# System tools (Ubuntu/Debian)
apt-get install yamllint shellcheck

# Gitleaks
brew install gitleaks  # or download from GitHub releases

# Trivy
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list
apt-get update && apt-get install trivy

# Hadolint
wget -O /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64
chmod +x /usr/local/bin/hadolint

# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Checkov
pip3 install checkov
```

---

## Troubleshooting

### "Command not found" errors
**Solution**: Run `./scripts/setup-dev-environment.sh` to install missing tools

### Pre-commit hooks not running
**Solution**:
```bash
pre-commit install
pre-commit run --all-files
```

### Black/isort formatting conflicts
**Solution**: Black takes precedence, isort is configured with `--profile black`

### Hadolint DL3008/DL3013 warnings
**Solution**: These are intentionally ignored (see `.pre-commit-config.yaml`)

### Gitleaks false positives
**Solution**: Add to `.gitleaksignore` with justification

### Permission denied
**Solution**:
```bash
chmod +x scripts/*.sh
```

---

## Documentation

- [Security Setup Guide](../wiki/Security-Setup.md) - Complete setup instructions
- [Security CI/CD Pipeline](../wiki/Security-CI-CD.md) - CI/CD documentation
- [Security Tools Reference](../.github/SECURITY_TOOLS.md) - Tool reference
- [Contributing Guide](../wiki/Contributing.md) - Development workflow

---

## Contributing

To add new scripts:
1. Place in appropriate subdirectory (or `scripts/` for general)
2. Make executable: `chmod +x script-name.sh`
3. Add documentation to this README
4. Update relevant wiki pages
5. Test thoroughly before committing

---

**Last Updated**: December 7, 2025
