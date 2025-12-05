# Troubleshooting Guide

Common issues and solutions for TrueHour development.

## Installation Issues

### Understanding Installation Locations

**IMPORTANT**: The setup script installs tools in different locations:

| Tool Type | Location | Scope |
|-----------|----------|-------|
| **Python packages** | `venv/` | Isolated, venv-only |
| **System tools** | Homebrew (`/opt/homebrew/bin/` or `/usr/local/bin/`) | Global |
| **Node.js packages** | npm global (`~/.npm-global/bin/` or `/usr/local/bin/`) | Global |

**Key Point**: All Python packages (black, flake8, pylint, etc.) are installed **ONLY** in the virtual environment. No changes are made to your system Python.

**To verify isolation**:
```bash
# Outside venv - should fail
deactivate
black --version
# Error: command not found

# Inside venv - should work
source venv/bin/activate
black --version
# black, 24.x.x
```

---

### asyncpg Installation Failure

**Symptom**:
```
ERROR: Failed building wheel for asyncpg
× Failed to build installable wheels for some pyproject.toml based projects
```

**Cause**: `asyncpg` is a Python PostgreSQL driver that requires C extensions to be compiled. It needs a C compiler and Python development headers.

**Solutions**:

#### macOS

1. **Install Xcode Command Line Tools** (required):
   ```bash
   xcode-select --install
   ```

   Follow the GUI prompts to complete installation.

2. **Verify installation**:
   ```bash
   xcode-select -p
   # Should output: /Library/Developer/CommandLineTools
   ```

3. **If you installed Python from python.org**, consider switching to Homebrew Python:
   ```bash
   brew install python@3.12
   ```

   Then recreate your venv:
   ```bash
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

4. **Alternative: Use pre-compiled wheels**:
   ```bash
   # Upgrade pip first
   pip install --upgrade pip setuptools wheel

   # Try installing again
   pip install asyncpg
   ```

#### Linux (Ubuntu/Debian)

1. **Install build dependencies**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     python3-dev \
     build-essential \
     libpq-dev \
     gcc
   ```

2. **Install asyncpg**:
   ```bash
   source venv/bin/activate
   pip install asyncpg
   ```

#### Linux (RHEL/CentOS/Fedora)

1. **Install build dependencies**:
   ```bash
   sudo dnf install -y \
     python3-devel \
     gcc \
     postgresql-devel
   ```

2. **Install asyncpg**:
   ```bash
   source venv/bin/activate
   pip install asyncpg
   ```

---

## Virtual Environment Issues

### "Command not found" after venv activation

**Symptom**:
```bash
source venv/bin/activate
black --version
# bash: black: command not found
```

**Cause**: Tools installed in venv, but venv not properly activated or PATH issue.

**Solution**:
```bash
# Deactivate and reactivate
deactivate
source venv/bin/activate

# Verify venv is active
which python
# Should show: /path/to/truehour/venv/bin/python

# Reinstall tools if needed
pip install black isort flake8
```

---

### Multiple Python versions causing issues

**Symptom**: Tools installed but using wrong Python version

**Solution**:
```bash
# Always use python3 explicitly
python3 -m venv venv

# Activate
source venv/bin/activate

# Verify version inside venv
python --version  # Should be 3.12+

# Use pip from venv
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

---

## Pre-commit Hook Issues

### Pre-commit hooks not running

**Symptom**: Commit succeeds without running checks

**Cause**: Hooks not installed

**Solution**:
```bash
# Install pre-commit framework
pip install pre-commit

# Install hooks
pre-commit install

# Test
pre-commit run --all-files
```

---

### Pre-commit fails with "command not found"

**Symptom**:
```
[INFO] Installing environment for https://github.com/psf/black.
[ERROR] An unexpected error has occurred: CalledProcessError: command: ('/usr/bin/python3', '-mvirtualenv', ...)
```

**Cause**: Pre-commit trying to use system Python instead of venv

**Solution**:
```bash
# Ensure venv is activated
source venv/bin/activate

# Reinstall pre-commit in venv
pip install --force-reinstall pre-commit

# Reinstall hooks
pre-commit clean
pre-commit install
```

---

### Can't skip pre-commit hooks

**Symptom**: Need to commit without running hooks

**Solution**:
```bash
# Skip all hooks for one commit
git commit --no-verify -m "message"

# Or use environment variable
SKIP=black,isort git commit -m "message"
```

---

## Linting Issues

### Black and Flake8 conflicts

**Symptom**: Black formats code that Flake8 rejects

**Cause**: Configuration mismatch

**Solution**: Already configured correctly in `.flake8`:
```ini
[flake8]
max-line-length = 120
extend-ignore = E203, W503
```

If still having issues:
```bash
# Format with Black first
black backend/

# Then check with Flake8
flake8 backend/
```

---

### isort changing imports that Black reformats

**Symptom**: Infinite loop of formatting changes

**Cause**: isort and Black have different opinions

**Solution**: Already configured with `--profile black` in `.pre-commit-config.yaml`.

If still having issues:
```bash
# Run in correct order
isort backend/
black backend/
```

---

### Pylint score too low

**Symptom**: `pylint` fails with score < 8.0

**Solution**:
```bash
# See detailed report
pylint backend/app --max-line-length=120

# Disable specific checks if needed (in pyproject.toml)
# But fix real issues first!
```

**Common issues**:
- Missing docstrings: Add docstrings to public functions/classes
- Too many arguments: Refactor or use dataclasses
- Too complex: Break down large functions

---

## Security Scanning Issues

### Bandit false positives

**Symptom**: Bandit reports issues that aren't security risks

**Solution**: Use `# nosec` comments with justification:
```python
# This is safe because we control the input
password = input("Enter password: ")  # nosec B105
```

**Better**: Add to configuration to skip globally:
```yaml
# In .pre-commit-config.yaml
- id: bandit
  args: ["-ll", "-r", "backend/app", "--skip", "B105,B106"]
```

---

### Gitleaks false positives

**Symptom**: Gitleaks detects fake secrets in test data

**Solution**: Create `.gitleaksignore`:
```
# Test data - not real secrets
backend/tests/fixtures/fake_keys.py:25
backend/tests/test_api.py:42:fake_api_key
```

**Note**: Add comment explaining why it's safe!

---

### Safety/pip-audit finding vulnerabilities

**Symptom**: Security tools report CVEs in dependencies

**Solution**:
1. **Check if vulnerability applies to your usage**
2. **Update the affected package**:
   ```bash
   pip install --upgrade package-name
   pip freeze > backend/requirements.txt
   ```
3. **If no fix available**, document decision in `SECURITY.md`

---

## Docker Issues

### Hadolint warnings about DL3008/DL3013

**Symptom**:
```
DL3008: Pin versions in apt get install
DL3013: Pin versions in pip
```

**Solution**: These are intentionally ignored (configured in `.pre-commit-config.yaml`):
- DL3008: Acceptable for base images
- DL3013: We use requirements.txt for pinning

---

### Docker Compose validation fails

**Symptom**:
```
ERROR: yaml.scanner.ScannerError: mapping values are not allowed here
```

**Cause**: YAML syntax error in `docker-compose.ghcr.yml`

**Solution**:
```bash
# Check YAML syntax
yamllint infrastructure/docker-compose.ghcr.yml

# Validate structure
docker-compose -f infrastructure/docker-compose.ghcr.yml config
```

---

## Tool Installation Issues

### Homebrew package fails to install

**Symptom**: `Error: No available formula for <package>`

**Solution**:
```bash
# Update Homebrew
brew update

# Try installing again
brew install <package>

# For Syft specifically
brew tap anchore/syft
brew install syft
```

---

### Node.js package permission error

**Symptom**:
```
npm ERR! Error: EACCES: permission denied
```

**Solution**:
```bash
# Don't use sudo! Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to ~/.zshrc or ~/.bashrc:
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.zshrc  # or ~/.bashrc

# Install packages
npm install -g htmlhint markdownlint-cli2
```

---

## Runtime Issues

### Import errors when running backend

**Symptom**:
```python
ModuleNotFoundError: No module named 'fastapi'
```

**Cause**: Not running in virtual environment

**Solution**:
```bash
# Always activate venv first
source venv/bin/activate

# Verify
which python  # Should show venv path

# Run application
uvicorn app.main:app --reload
```

---

### Database connection errors

**Symptom**:
```
asyncpg.exceptions.ConnectionDoesNotExistError
```

**Cause**: PostgreSQL not running or wrong connection string

**Solution**:
```bash
# Start database
docker-compose -f infrastructure/docker-compose.ghcr.yml up -d db

# Check connection
docker-compose -f infrastructure/docker-compose.ghcr.yml ps

# Check logs
docker-compose -f infrastructure/docker-compose.ghcr.yml logs db
```

---

## Platform-Specific Issues

### macOS: "xcrun: error: invalid active developer path"

**Symptom**: Git or command-line tools fail after macOS update

**Solution**:
```bash
xcode-select --install
```

---

### macOS: Python SSL certificate errors

**Symptom**: `pip` fails with SSL certificate verification errors

**Solution**:
```bash
# Run the install certificates script
cd /Applications/Python\ 3.12/
./Install\ Certificates.command

# Or use Homebrew Python
brew install python@3.12
```

---

### Linux: "pg_config not found"

**Symptom**: asyncpg installation fails with pg_config error

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install libpq-dev

# RHEL/CentOS
sudo dnf install postgresql-devel
```

---

## Getting Help

If you're still having issues:

1. **Check tool versions**:
   ```bash
   python3 --version
   pip --version
   black --version
   ```

2. **Check your environment**:
   ```bash
   # Are you in venv?
   which python

   # What's your OS?
   uname -a

   # What's installed?
   pip list
   ```

3. **Clean slate**:
   ```bash
   # Remove venv
   deactivate
   rm -rf venv

   # Recreate
   python3 -m venv venv
   source venv/bin/activate

   # Run setup script
   ./scripts/setup-dev-environment.sh
   ```

4. **Open an issue**:
   - Go to: https://github.com/FliteAxis/TrueHour/issues
   - Include:
     - Error message (full output)
     - OS version
     - Python version
     - Steps to reproduce

---

## Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| asyncpg won't install | `xcode-select --install` (macOS) or `apt-get install python3-dev` (Linux) |
| Command not found | `source venv/bin/activate` |
| Pre-commit not running | `pre-commit install` |
| Black/Flake8 conflict | Already fixed in config, run `black` first |
| Permission denied | `chmod +x scripts/*.sh` |
| Docker compose error | `docker-compose config` to validate YAML |
| Import error in Python | Activate venv: `source venv/bin/activate` |
| Homebrew formula missing | `brew update && brew install <package>` |

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
