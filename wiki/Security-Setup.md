# Security Setup Guide

This guide walks you through setting up and configuring TrueHour's comprehensive security infrastructure.

## 📋 What Was Implemented

### 1. Renovate Dependency Management
**File**: [`renovate.json`](../renovate.json)

**Features**:
- Automated dependency updates for Python, Docker, GitHub Actions
- Weekly schedule (Mondays before 6 AM EST)
- Auto-merge for patch updates
- Security updates with high priority
- Grouped updates by ecosystem
- 3-day stability period before updates

### 2. Security Scanning Workflow
**File**: [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml)

**Scans Implemented**:
- **Semgrep** - SAST for OWASP Top 10, Python security issues
- **CodeQL** - Deep semantic code analysis
- **Safety** - Python dependency vulnerability checking
- **Bandit** - Python code security analysis
- **pip-audit** - Python package auditing
- **Trivy** - Container image vulnerability scanning
- **Hadolint** - Dockerfile security linting
- **Gitleaks** - Secret detection in code and git history
- **OWASP Dependency-Check** - Comprehensive dependency CVE scanning

**Schedule**: Daily at 2 AM EST, on push/PR, manual

**Reports**: Available in GitHub Security tab (SARIF format)

### 3. SBOM Generation Workflow
**File**: [`.github/workflows/sbom-generation.yml`](../.github/workflows/sbom-generation.yml)

**Generates**:
- Python backend SBOM (CycloneDX, SPDX)
- API container SBOM (CycloneDX, SPDX)
- Frontend container SBOM (CycloneDX, SPDX)
- License reports (JSON, Markdown)
- Cryptographic attestations (on release)

**Schedule**: Weekly on Sundays at 3 AM EST, on dependency changes, on releases

**Standards**: CycloneDX 1.5, SPDX 2.3 (ISO/IEC 5962:2021)

**Retention**: 90 days (artifacts), permanent (releases)

### 4. Linting Workflow
**File**: [`.github/workflows/lint.yml`](../.github/workflows/lint.yml)

**Linters**:
- **Python**: Black, isort, Flake8, Pylint, mypy
- **Frontend**: HTMLHint, HTML5 Validator
- **Dockerfile**: hadolint, Checkov
- **Docker Compose**: validation, Checkov
- **YAML**: yamllint
- **Markdown**: markdownlint-cli2
- **Shell**: ShellCheck

**Schedule**: On push/PR to main and develop

### 5. Configuration Files

| File | Purpose |
|------|---------|
| [`.flake8`](../.flake8) | Python style guide (Flake8) |
| [`pyproject.toml`](../pyproject.toml) | Black, isort, Pylint, mypy config |
| [`.htmlhintrc`](../.htmlhintrc) | HTML linting rules |
| [`.markdownlint.json`](../.markdownlint.json) | Markdown linting rules |
| [`renovate.json`](../renovate.json) | Dependency update automation |

### 6. Documentation

| Document | Purpose |
|----------|---------|
| [Security CI/CD Pipeline](Security-CI-CD.md) | Comprehensive security documentation |
| [Security Tools Reference](../.github/SECURITY_TOOLS.md) | Quick reference for all tools |
| [Security Policy](../SECURITY.md) | Vulnerability reporting and security policy |

---

## 🔧 Setup Instructions

### Step 1: Enable Renovate
1. Go to: https://github.com/apps/renovate
2. Click "Install" or "Configure"
3. Select "FliteAxis" organization
4. Grant access to "TrueHour" repository
5. Renovate will detect `renovate.json` and start automatically

### Step 2: Enable GitHub Code Scanning
Already configured! Results appear in:
- **Security** > **Code scanning alerts**
- **Security** > **Dependabot alerts** (if Dependabot also enabled)

### Step 3: Configure GitHub Actions Secrets (Optional)
For advanced features, add these secrets:

| Secret | Purpose | Required? |
|--------|---------|-----------|
| `GITLEAKS_LICENSE` | Gitleaks Pro features | Optional |

Navigate to: Settings > Secrets and variables > Actions

### Step 4: Enable Branch Protection (Recommended)
1. Go to: Settings > Branches
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select required checks:
     - `Python Linting`
     - `Frontend Linting`
     - `Dockerfile Linting`
     - `Docker Compose Linting`
     - `Semgrep SAST`
     - `CodeQL Analysis`
3. Repeat for `develop` branch

### Step 5: First Run
Push the security implementation to `develop` branch:

```bash
git add .
git commit -m "feat: Add comprehensive security CI/CD pipeline

Implements:
- Renovate for dependency management
- Multi-tool security scanning (Semgrep, CodeQL, Trivy, etc.)
- SBOM generation (CycloneDX, SPDX)
- Comprehensive linting (Python, Docker, YAML, Markdown)
- Security documentation"

git push origin develop
```

Then create a PR to `main` to see all checks in action.

---

## 📊 What to Expect

### Immediate Effects
1. **Renovate PRs**: Within 24 hours, Renovate will create initial dependency update PRs
2. **Security Scans**: First scan runs on next push, then daily at 2 AM EST
3. **Linting**: Runs on every push and PR
4. **SBOM**: Generated weekly on Sundays at 3 AM EST

### Ongoing Maintenance
- **Weekly**: Review Renovate PRs (Mondays)
- **Daily**: Monitor security alerts in Security tab
- **Per PR**: Review linting and security scan results
- **Monthly**: Review SBOM for compliance/audit needs

---

## 🎯 Benefits

### Security
✅ Automated vulnerability detection in code and dependencies
✅ Container image security scanning
✅ Secret detection preventing credential leaks
✅ OWASP Top 10 coverage
✅ Daily security monitoring

### Compliance
✅ SBOM generation (NTIA minimum elements)
✅ Cryptographic attestations
✅ CycloneDX and SPDX standards
✅ License tracking
✅ Audit trail via GitHub Security tab

### Code Quality
✅ Consistent code formatting (Black, isort)
✅ Style guide enforcement (Flake8, Pylint)
✅ Type safety (mypy)
✅ Dockerfile best practices (hadolint)
✅ Infrastructure security (Checkov)

### Developer Experience
✅ Automated dependency updates
✅ Auto-merge for safe updates
✅ Clear PR descriptions from Renovate
✅ Pre-commit guidance via linting
✅ Comprehensive documentation

---

## 🚨 Important Notes

### Security Findings
- First scan may produce many findings - **this is expected**
- Prioritize: CRITICAL > HIGH > MEDIUM > LOW
- Many findings may be false positives - review carefully
- Use inline comments to suppress false positives with justification

### Renovate PRs
- **DO NOT** blindly merge all PRs
- Review changelogs for breaking changes
- Major version updates require testing
- Auto-merge only applies to passing patch updates

### Linting Failures
- Fix formatting issues first (Black, isort)
- Then address style issues (Flake8)
- Finally address code quality (Pylint)
- Type hints are encouraged but not required (mypy)

### SBOM Usage
- SBOMs are for transparency and compliance
- Use for supply chain security verification
- Share with customers/auditors as needed
- Attestations prove SBOM authenticity

---

## 📈 Metrics to Monitor

### GitHub Security Tab
- **Code scanning alerts**: Should trend downward
- **Dependabot alerts**: Address within SLA
- **Secret scanning alerts**: Address immediately

### Workflow Success Rates
- **Target**: >95% success rate for linting
- **Target**: >90% success rate for security scans
- **Target**: 100% success rate for SBOM generation

### Dependency Freshness
- **Target**: <30 days behind latest stable versions
- **Target**: Zero known vulnerabilities in dependencies
- **Target**: All dependencies with active maintenance

---

## 🔄 Recommended Workflows

### For Regular Development

1. **Before committing**:
   ```bash
   black backend/ && isort backend/
   flake8 backend/
   ```

2. **Create PR**: Automated checks run

3. **Address findings**: Fix linting and security issues

4. **Merge when green**: All checks pass

### For Dependency Updates (Renovate PRs)

1. **Review changelog**: Check for breaking changes

2. **Review test results**: CI must pass

3. **For patch updates**: Auto-merge is safe

4. **For minor updates**: Review changes, test locally if needed

5. **For major updates**:
   - Read migration guide
   - Test thoroughly locally
   - Update code as needed
   - Merge after validation

### For Security Findings

1. **Triage**: Determine if real or false positive

2. **If real**:
   - Assess severity and exploitability
   - Plan remediation
   - Apply fix or upgrade dependency
   - Verify fix resolves issue

3. **If false positive**:
   - Add suppression comment with justification
   - Document in code review

---

## 🛠️ Customization

### Adjusting Security Scan Frequency
Edit [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml):

```yaml
schedule:
  - cron: '0 7 * * *'  # Daily at 2 AM EST (7 AM UTC)
```

Change to weekly: `'0 7 * * 1'` (Mondays only)

### Adjusting Renovate Schedule
Edit [`renovate.json`](../renovate.json):

```json
"schedule": ["before 6am on monday"]
```

Change to: `"at any time"` for continuous updates

### Customizing Linting Rules
- **Python**: Edit [`pyproject.toml`](../pyproject.toml) and [`.flake8`](../.flake8)
- **HTML**: Edit [`.htmlhintrc`](../.htmlhintrc)
- **Markdown**: Edit [`.markdownlint.json`](../.markdownlint.json)

### Adding More Security Scans
See [Security CI/CD Pipeline](Security-CI-CD.md#future-enhancements) for ideas.

---

## 📚 Additional Resources

### Documentation
- [Security CI/CD Pipeline](Security-CI-CD.md) - Detailed technical documentation
- [Security Tools Reference](../.github/SECURITY_TOOLS.md) - Quick reference
- [Security Policy](../SECURITY.md) - Vulnerability reporting
- [Renovate Docs](https://docs.renovatebot.com/)
- [Semgrep Rules](https://semgrep.dev/docs/rules/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)

### GitHub Features
- [Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [SBOM Attestation](https://docs.github.com/en/actions/security-guides/using-artifact-attestations)

---

## ✅ Next Steps

1. ✅ **Enable Renovate**: Install GitHub App
2. ✅ **Push to develop**: Commit this implementation
3. ✅ **Create PR to main**: Test all workflows
4. ✅ **Review first scan results**: Triage findings
5. ✅ **Enable branch protection**: Require checks to pass
6. ✅ **Document team process**: Update Contributing guide
7. ✅ **Set up notifications**: Configure GitHub notifications for security alerts

---

## 🤝 Contributing

For questions or improvements to the security pipeline:
- Open an issue: https://github.com/FliteAxis/TrueHour/issues
- See: [Contributing Guide](Contributing.md)

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
