# Security CI/CD Pipeline

This document describes TrueHour's comprehensive security and code quality CI/CD pipeline.

## Overview

TrueHour implements a multi-layered security approach with automated scanning, linting, and SBOM generation to ensure code quality and security compliance.

## Table of Contents

- [Security Scanning](#security-scanning)
- [SBOM Generation](#sbom-generation)
- [Code Linting](#code-linting)
- [Dependency Management](#dependency-management)
- [Configuration Files](#configuration-files)

---

## Security Scanning

**Workflow**: [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml)

**Schedule**:
- On push to `main` and `develop` branches
- On pull requests
- Daily at 2 AM EST (7 AM UTC)
- Manual dispatch

### Tools Implemented

#### 1. Semgrep SAST
**Purpose**: Static Application Security Testing

Scans for:
- Security vulnerabilities
- OWASP Top 10 issues
- Python-specific security issues
- Dockerfile security issues

**Rulesets**:
- `p/security-audit`
- `p/owasp-top-ten`
- `p/python`
- `p/dockerfile`

**Output**: SARIF format uploaded to GitHub Security tab

#### 2. CodeQL Analysis
**Purpose**: Deep semantic code analysis

Scans for:
- Security vulnerabilities
- Code quality issues
- Common programming errors

**Languages**: Python

**Queries**: `security-extended`, `security-and-quality`

**Output**: SARIF format uploaded to GitHub Security tab

#### 3. Python Security Tools

##### Safety
Checks Python dependencies against known security vulnerabilities database.

```bash
safety check --file backend/requirements.txt
```

##### Bandit
Scans Python code for common security issues.

```bash
bandit -r backend/app -ll
```

##### pip-audit
Audits Python packages for known vulnerabilities.

```bash
pip-audit --require backend/requirements.txt
```

**Outputs**: JSON reports retained for 30 days

#### 4. Trivy Container Scanning
**Purpose**: Container image vulnerability scanning

Scans for:
- OS package vulnerabilities
- Application library vulnerabilities
- Container configuration issues

**Severity Levels**: CRITICAL, HIGH, MEDIUM

**Images Scanned**:
- `truehour-api` (backend)
- `truehour-frontend` (frontend)

**Output**: SARIF format uploaded to GitHub Security tab

#### 5. Hadolint
**Purpose**: Dockerfile best practices linting

Checks for:
- Dockerfile best practices
- Security issues
- Build optimization opportunities

**Severity**: Warning threshold

**Output**: SARIF format uploaded to GitHub Security tab

#### 6. Gitleaks
**Purpose**: Secret scanning

Scans for:
- API keys
- Passwords
- Tokens
- Private keys
- Credentials in code and git history

**Scope**: Full git history (fetch-depth: 0)

#### 7. OWASP Dependency-Check
**Purpose**: Comprehensive dependency vulnerability scanning

Features:
- Known CVE detection
- Experimental analyzers enabled
- Fails on CVSS >= 7

**Output**: Multiple formats (HTML, XML, JSON, SARIF)

**Retention**: 30 days

### Security Reports

All security findings are:
1. Uploaded to GitHub Security tab (SARIF format)
2. Available as workflow artifacts
3. Summarized in workflow summary

### Viewing Results

1. **GitHub Security Tab**: Navigate to `Security > Code scanning alerts`
2. **Workflow Artifacts**: Download from Actions run
3. **Workflow Summary**: View summary in Actions run page

---

## SBOM Generation

**Workflow**: [`.github/workflows/sbom-generation.yml`](../.github/workflows/sbom-generation.yml)

**Schedule**:
- On push to `main` and `develop` branches (when dependencies change)
- On pull requests
- On releases
- Weekly on Sundays at 3 AM EST (8 AM UTC)
- Manual dispatch

### SBOM Standards

TrueHour generates SBOMs in two industry-standard formats:

1. **CycloneDX** - OWASP standard, optimized for security use cases
2. **SPDX** - ISO/IEC 5962:2021 standard

### SBOM Components

#### 1. Python Backend SBOM

**Tools**: `cyclonedx-bom`, `syft`, `pip-licenses`

**Generated Files**:
- `backend-sbom-cyclonedx.json` - CycloneDX format
- `backend-sbom-spdx.json` - SPDX format
- `backend-licenses.json` - License information (JSON)
- `backend-licenses.md` - License information (Markdown)

#### 2. Container SBOMs

**Tool**: Anchore Syft

**Generated Files** (per container):
- `{container}-sbom-cyclonedx.json` - CycloneDX format
- `{container}-sbom-spdx.json` - SPDX format
- `{container}-sbom.txt` - Human-readable table

**Containers**:
- `truehour-api`
- `truehour-frontend`

#### 3. SBOM Attestation

**When**: On release events

**What**: Cryptographically signs SBOMs and attaches them to container images

**Tool**: GitHub Attestation (`actions/attest-sbom@v1`)

**Purpose**: Provides verifiable proof of SBOM authenticity

#### 4. SBOM Vulnerability Scanning

**Tool**: Grype (by Anchore)

Scans generated SBOMs for vulnerabilities:
- Severity cutoff: HIGH
- Non-blocking (informational)

### SBOM Retention

- **Artifacts**: 90 days
- **Release Attachments**: Permanent
- **Container Attestations**: Permanent (attached to image)

### Accessing SBOMs

#### During Development
Download from workflow artifacts:
```bash
gh run download <run-id> -n python-sbom
gh run download <run-id> -n truehour-api-sbom
gh run download <run-id> -n truehour-frontend-sbom
```

#### From Releases
```bash
# Download SBOM archive from latest release
curl -LO https://github.com/FliteAxis/TrueHour/releases/latest/download/truehour-sbom-v*.tar.gz
tar -xzf truehour-sbom-v*.tar.gz
```

#### Container Attestations
```bash
# Verify SBOM attestation for container image
gh attestation verify oci://ghcr.io/fliteaxis/truehour-api:latest
```

---

## Code Linting

**Workflow**: [`.github/workflows/lint.yml`](../.github/workflows/lint.yml)

**Schedule**:
- On push to `main` and `develop` branches
- On pull requests
- Manual dispatch

### Python Linting

#### Tools

1. **Black** - Code formatter
   - Line length: 120
   - Target: Python 3.12
   - Config: [`pyproject.toml`](../pyproject.toml)

2. **isort** - Import sorting
   - Profile: black
   - Config: [`pyproject.toml`](../pyproject.toml)

3. **Flake8** - Style guide enforcement
   - Max line length: 120
   - Config: [`.flake8`](../.flake8)

4. **Pylint** - Code quality analysis
   - Fail threshold: 8.0/10
   - Config: [`pyproject.toml`](../pyproject.toml)

5. **mypy** - Static type checking
   - Python version: 3.12
   - Config: [`pyproject.toml`](../pyproject.toml)

#### Running Locally

```bash
# Format code
black backend/
isort backend/

# Lint
flake8 backend/
pylint backend/app
mypy backend/app
```

### Frontend Linting

#### Tools

1. **HTMLHint** - HTML linting
   - Config: [`.htmlhintrc`](../.htmlhintrc)

2. **HTML5 Validator** - HTML validation
   - Standard: W3C HTML5

#### Running Locally

```bash
# Install
npm install -g htmlhint

# Lint
htmlhint frontend/**/*.html
```

### Dockerfile Linting

#### Tools

1. **hadolint** - Dockerfile linter
   - Severity: warning
   - Ignored rules: DL3008, DL3013

2. **Checkov** - Infrastructure as Code scanner
   - Framework: dockerfile

#### Running Locally

```bash
# hadolint (via Docker)
docker run --rm -i hadolint/hadolint < backend/Dockerfile

# Checkov
pip install checkov
checkov -f backend/Dockerfile
```

### Docker Compose Linting

#### Tools

1. **docker-compose validation**
   ```bash
   docker-compose -f infrastructure/docker-compose.ghcr.yml config
   ```

2. **Checkov** - IaC scanner
   - Framework: docker_compose

#### Running Locally

```bash
docker-compose -f infrastructure/docker-compose.ghcr.yml config
checkov -f infrastructure/docker-compose.ghcr.yml
```

### YAML Linting

#### Tool: yamllint

**Config**: Inline in workflow

**Rules**:
- Max line length: 120
- Document start: disabled
- Truthy values: true, false, on, off

#### Running Locally

```bash
pip install yamllint
yamllint .github/workflows/ infrastructure/
```

### Markdown Linting

#### Tool: markdownlint-cli2

**Config**: [`.markdownlint.json`](../.markdownlint.json)

**Rules**:
- Line length: 120 (code blocks and tables exempted)
- HTML allowed
- Sibling duplicate headers allowed

#### Running Locally

```bash
npm install -g markdownlint-cli2
markdownlint-cli2 "**/*.md"
```

### Shell Script Linting

#### Tool: ShellCheck

**Severity**: Warning

#### Running Locally

```bash
# Via package manager
apt-get install shellcheck  # Debian/Ubuntu
brew install shellcheck     # macOS

# Lint all shell scripts
find . -name "*.sh" -exec shellcheck {} \;
```

---

## Dependency Management

**Configuration**: [`renovate.json`](../renovate.json)

**Platform**: Renovate Bot

**Schedule**: Weekly on Mondays before 6 AM EST

### Features

#### Automated Updates

- Python packages (`requirements.txt`)
- Docker base images
- GitHub Actions
- Docker Compose service images

#### Update Grouping

1. **Docker base images** - Monthly schedule
2. **Python dependencies (non-major)** - Weekly, grouped
3. **Python dependencies (major)** - Monthly, separate PRs
4. **GitHub Actions** - Weekly, grouped, auto-merge
5. **FastAPI ecosystem** - Updated together

#### Auto-merge Rules

Auto-merge enabled for:
- Patch updates for Python dependencies
- Patch updates for GitHub Actions
- Non-major updates passing all checks

**Conditions**:
- All CI checks pass
- Minimum release age: 3 days
- Stability days: 3

#### Security Updates

**Priority**: High (10)

**Labels**: `security`, `dependencies`

**Schedule**: At any time (not restricted)

**Auto-merge**: Enabled for patch versions

**Semantic commit**: `fix(deps): ... [security]`

### Configuration Highlights

```json
{
  "schedule": ["before 6am on monday"],
  "timezone": "America/New_York",
  "prConcurrentLimit": 10,
  "stabilityDays": 3,
  "minimumReleaseAge": "3 days"
}
```

### Renovate Dashboard

Navigate to **Issues** tab to find the Renovate Dependency Dashboard issue, which provides:
- Pending updates
- Rate-limited updates
- Errored updates
- Manual merge required updates

---

## Configuration Files

### Security

| File | Purpose | Tool |
|------|---------|------|
| N/A | Semgrep uses cloud rulesets | Semgrep |
| N/A | CodeQL uses built-in queries | CodeQL |

### Linting

| File | Purpose | Tool |
|------|---------|------|
| [`.flake8`](../.flake8) | Flake8 configuration | Flake8 |
| [`pyproject.toml`](../pyproject.toml) | Black, isort, Pylint, mypy | Multiple |
| [`.htmlhintrc`](../.htmlhintrc) | HTML linting rules | HTMLHint |
| [`.markdownlint.json`](../.markdownlint.json) | Markdown linting | markdownlint |

### Dependency Management

| File | Purpose | Tool |
|------|---------|------|
| [`renovate.json`](../renovate.json) | Dependency updates | Renovate |

### Ignored Rules

#### Dockerfile (hadolint)
- `DL3008` - Pin versions in apt-get (acceptable for base images)
- `DL3013` - Pin versions in pip (using requirements.txt)

#### Python (Pylint)
- `C0111` - Missing docstring (acceptable for small functions)
- `R0903` - Too few public methods (acceptable for models)
- `R0913` - Too many arguments (acceptable for FastAPI endpoints)

---

## Best Practices

### For Developers

1. **Run linters locally** before committing:
   ```bash
   black backend/ && isort backend/
   flake8 backend/
   pylint backend/app
   ```

2. **Review security findings** in pull requests

3. **Update dependencies** promptly when Renovate creates PRs

4. **Address vulnerabilities** flagged by security scans

5. **Test SBOM generation** for significant dependency changes

### For Maintainers

1. **Review Renovate PRs** weekly

2. **Monitor security alerts** in GitHub Security tab

3. **Update security policies** as threats evolve

4. **Verify SBOM attestations** on releases

5. **Archive security reports** for compliance

---

## Compliance

### Standards Met

- **OWASP Top 10** - Covered by Semgrep and CodeQL
- **CWE** - Common Weakness Enumeration checks via multiple tools
- **NIST SP 800-53** - Security controls via SAST/DAST
- **SBOM Standards** - CycloneDX 1.5, SPDX 2.3 (ISO/IEC 5962:2021)

### Audit Trail

All security scans produce:
1. **SARIF files** - Machine-readable results
2. **JSON reports** - Detailed findings
3. **GitHub Security alerts** - Centralized dashboard
4. **Workflow artifacts** - Historical records (30-90 days)

---

## Troubleshooting

### Common Issues

#### Security Scan Failures

**Issue**: False positives in security scans

**Solution**:
1. Review the specific finding
2. If legitimate, add exception in code with justification
3. If tool error, update `.github/workflows/security-scan.yml` to exclude

#### Lint Failures

**Issue**: Code doesn't pass linting

**Solution**:
```bash
# Auto-fix formatting
black backend/
isort backend/

# Review remaining issues
flake8 backend/
```

#### SBOM Generation Failures

**Issue**: SBOM generation fails

**Solution**:
1. Check if all dependencies are properly specified
2. Verify container builds successfully
3. Review Syft/CycloneDX versions in workflow

#### Renovate Not Creating PRs

**Issue**: No Renovate PRs appearing

**Solution**:
1. Check Renovate Dashboard issue
2. Verify `renovate.json` syntax
3. Review Renovate logs in Actions tab

---

## Future Enhancements

### Planned

- [ ] DAST (Dynamic Application Security Testing) with OWASP ZAP
- [ ] Container runtime security monitoring
- [ ] License compliance automation
- [ ] Security metrics dashboard
- [ ] Automated vulnerability remediation
- [ ] Supply chain security attestations (SLSA)

### Under Consideration

- [ ] Fuzzing tests for API endpoints
- [ ] Penetration testing automation
- [ ] Chaos engineering for security
- [ ] Red team automation

---

## Resources

### Documentation

- [Semgrep Rules](https://semgrep.dev/docs/rules/)
- [CodeQL Query Help](https://codeql.github.com/docs/codeql-language-guides/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [SPDX Specification](https://spdx.dev/specifications/)
- [Renovate Docs](https://docs.renovatebot.com/)

### External Links

- [OWASP Top 10](https://owasp.org/Top10/)
- [CWE List](https://cwe.mitre.org/)
- [NIST NVD](https://nvd.nist.gov/)
- [GitHub Security Lab](https://securitylab.github.com/)

---

## Contact

For security concerns or questions about the CI/CD pipeline:

- **Security Issues**: Create a [Security Advisory](https://github.com/FliteAxis/TrueHour/security/advisories/new)
- **General Questions**: Open an [Issue](https://github.com/FliteAxis/TrueHour/issues)
- **Contribution**: See [Contributing Guide](Contributing.md)
