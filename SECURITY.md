# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| develop | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via GitHub Security Advisories:

1. Navigate to the [Security Advisories](https://github.com/FliteAxis/TrueHour/security/advisories) page
2. Click "New draft security advisory"
3. Provide details about the vulnerability
4. We will respond within 48 hours

### What to Include

Please include the following information in your report:

- **Type of issue** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths** of source file(s) related to the issue
- **Location** of the affected source code (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Confirmation**: Within 5 business days
- **Fix Development**: Timeline depends on severity
- **Public Disclosure**: After fix is released and users have time to update

## Security Measures

TrueHour implements multiple layers of security:

### Automated Security Scanning

We use automated tools to continuously scan for vulnerabilities:

- **SAST**: Semgrep, CodeQL for static code analysis
- **SCA**: Safety, Bandit, pip-audit for dependency scanning
- **Container Scanning**: Trivy for Docker image vulnerabilities
- **Secret Scanning**: Gitleaks to prevent credential leaks
- **IaC Security**: Hadolint, Checkov for infrastructure code

See [Security CI/CD Pipeline](wiki/Security-CI-CD.md) for details.

### Software Bill of Materials (SBOM)

We generate and maintain SBOMs for:
- Python backend dependencies
- API container images
- Frontend container images

SBOMs are available:
- In CycloneDX and SPDX formats
- Attached to GitHub releases
- As container image attestations

### Dependency Management

- Automated updates via Renovate
- Security patches prioritized
- Weekly review of dependency health
- Transitive dependency monitoring

### Code Quality

- Comprehensive linting (Python, HTML, Docker)
- Type checking with mypy
- Code formatting standards (Black, isort)
- Security-focused code reviews

## Security Best Practices

When contributing to TrueHour:

### For Developers

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`
   - Use `.env.example` for templates

2. **Validate all inputs**
   - Sanitize user input
   - Use parameterized queries
   - Validate file uploads

3. **Follow secure coding practices**
   - Use HTTPS for all external connections
   - Implement proper authentication/authorization
   - Handle errors securely (no sensitive data in error messages)

4. **Keep dependencies updated**
   - Review Renovate PRs promptly
   - Test security patches
   - Don't ignore vulnerability warnings

5. **Run security checks locally**
   ```bash
   # Before committing
   bandit -r backend/app
   safety scan --target backend/requirements.txt
   gitleaks detect --source . --verbose
   ```

### For Operators

1. **Use strong passwords**
   - Change default PostgreSQL password in production
   - Use strong, unique passwords for all services
   - Consider using a secrets manager

2. **Secure your deployment**
   - Use HTTPS in production
   - Enable firewall rules
   - Restrict database access
   - Regular security updates

3. **Monitor security alerts**
   - Review GitHub Security tab weekly
   - Subscribe to security advisories
   - Keep informed of CVEs in dependencies

4. **Backup regularly**
   - Regular database backups
   - Test restore procedures
   - Secure backup storage

5. **Review logs**
   - Monitor for suspicious activity
   - Set up alerting for anomalies
   - Retain logs for audit purposes

## Security Contacts

- **Security Issues**: Use [GitHub Security Advisories](https://github.com/FliteAxis/TrueHour/security/advisories)
- **General Questions**: Open an [issue](https://github.com/FliteAxis/TrueHour/issues) with `security` label

## Disclosure Policy

- Security vulnerabilities are disclosed after a fix is available
- We credit security researchers (if desired)
- CVE IDs will be requested for qualifying vulnerabilities
- Public disclosure timeline: 90 days or when fix is released (whichever is sooner)

## Security Updates

Security updates are released as soon as possible:

- **Critical**: Immediate patch release
- **High**: Within 7 days
- **Medium**: Next minor release
- **Low**: Next major release

Users are notified via:
- GitHub Security Advisories
- Release notes
- Changelog

## Compliance

TrueHour security practices align with:

- **OWASP Top 10** (2021)
- **CWE Top 25** (2023)
- **NIST Cybersecurity Framework**
- **SBOM Standards** (NTIA minimum elements)
- **ISO/IEC 5962:2021** (SPDX)

## Acknowledgments

We thank the security research community for responsibly disclosing vulnerabilities and helping keep TrueHour secure.

### Security Researchers

<!-- List will be populated as researchers report vulnerabilities -->

*No security issues have been reported yet.*

## Security Resources

- [Security Setup Guide](wiki/Security-Setup.md)
- [Security CI/CD Documentation](wiki/Security-CI-CD.md)
- [OWASP Top 10](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Last Updated**: December 7, 2025
**Policy Version**: 1.0.0

For questions about this security policy, please open an issue with the `security` label.
