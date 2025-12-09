#!/bin/bash
# Pre-commit validation script for TrueHour
# This script runs all linting and security checks before committing
# Usage: ./scripts/pre-commit.sh

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0
declare -a FAILURES

# Helper functions
add_failure() {
    local category="$1"
    local tool="$2"
    local message="$3"
    FAILURES+=("$category|$tool|$message")
}
print_header() {
    echo ""
    echo "================================================"
    echo "$1"
    echo "================================================"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    FAILED=1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_warning "$1 not found - skipping $2 checks"
        return 1
    fi
    return 0
}

# Check if running in git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

print_header "TrueHour Pre-Commit Validation"
echo "Running all linting and security checks..."

# ============================================
# Python Code Formatting
# ============================================
print_header "1. Python Code Formatting"

if check_command "black" "Black formatting"; then
    echo "Running Black..."
    if black --check backend/ 2>&1; then
        print_success "Black formatting check passed"
    else
        print_error "Black formatting check failed - run: black backend/"
        add_failure "Formatting" "Black" "Code formatting issues found|Fix: black backend/"
    fi
else
    echo "Install: pip install black"
fi

if check_command "isort" "import sorting"; then
    echo "Running isort..."
    if isort --check-only backend/ 2>&1; then
        print_success "isort check passed"
    else
        print_error "isort check failed - run: isort backend/"
        add_failure "Formatting" "isort" "Import sorting issues found|Fix: isort backend/"
    fi
else
    echo "Install: pip install isort"
fi

# ============================================
# Python Linting
# ============================================
print_header "2. Python Linting"

if check_command "flake8" "Flake8 linting"; then
    echo "Running Flake8..."
    if flake8 backend/app backend/scripts --max-line-length=120 --extend-ignore=E203,W503,C901 --exclude=__pycache__,.git,__init__.py,venv; then
        print_success "Flake8 passed"
    else
        print_error "Flake8 failed"
        add_failure "Linting" "Flake8" "Style violations found|Fix: Review flake8 output above"
    fi
else
    echo "Install: pip install flake8"
fi

if check_command "pylint" "Pylint"; then
    echo "Running Pylint..."
    if pylint backend/app --max-line-length=120 --disable=C0111,R0903,R0913,R0912,R0915,C0301 --fail-under=7.0 2>&1; then
        print_success "Pylint passed"
    else
        print_error "Pylint failed (score < 7.0)"
        add_failure "Linting" "Pylint" "Code quality score below 7.0|Fix: Review pylint output above"
    fi
else
    echo "Install: pip install pylint"
fi

if check_command "mypy" "mypy type checking"; then
    echo "Running mypy..."
    if mypy backend/app --ignore-missing-imports --no-strict-optional --disable-error-code=valid-type,call-arg,arg-type,no-any-return 2>&1; then
        print_success "mypy passed"
    else
        print_warning "mypy found issues (non-blocking for now)"
    fi
else
    echo "Install: pip install mypy"
fi

# ============================================
# Python Security
# ============================================
print_header "3. Python Security Checks"

if check_command "bandit" "Bandit security"; then
    echo "Running Bandit..."
    if bandit -r backend/app -ll 2>&1; then
        print_success "Bandit security check passed"
    else
        print_error "Bandit found security issues"
        add_failure "Security" "Bandit" "Security vulnerabilities detected|Fix: Review bandit output above"
    fi
else
    echo "Install: pip install bandit"
fi

if check_command "safety" "Safety dependency check"; then
    echo "Running Safety..."
    # Use new 'scan' command instead of deprecated 'check'
    if safety scan backend/requirements.txt 2>&1; then
        print_success "Safety scan passed"
    else
        print_warning "Safety found vulnerabilities (review required)"
    fi
else
    echo "Install: pip install safety"
fi

if check_command "pip-audit" "pip-audit"; then
    echo "Running pip-audit..."
    if pip-audit -r backend/requirements.txt 2>&1; then
        print_success "pip-audit passed"
    else
        print_warning "pip-audit found vulnerabilities (review required)"
    fi
else
    echo "Install: pip install pip-audit"
fi

# ============================================
# Dockerfile Linting
# ============================================
print_header "4. Dockerfile Linting"

if check_command "hadolint" "hadolint"; then
    echo "Checking backend/Dockerfile..."
    if hadolint backend/Dockerfile --ignore DL3008 --ignore DL3013; then
        print_success "Backend Dockerfile passed"
    else
        print_error "Backend Dockerfile linting failed"
        add_failure "Docker" "hadolint" "Backend Dockerfile issues|Fix: Review hadolint output above"
    fi

    echo "Checking infrastructure/Dockerfile.frontend..."
    if hadolint infrastructure/Dockerfile.frontend --ignore DL3008; then
        print_success "Frontend Dockerfile passed"
    else
        print_error "Frontend Dockerfile linting failed"
        add_failure "Docker" "hadolint" "Frontend Dockerfile issues|Fix: Review hadolint output above"
    fi
else
    echo "Install: brew install hadolint"
fi

# ============================================
# Docker Compose Validation
# ============================================
print_header "5. Docker Compose Validation"

if check_command "docker-compose" "Docker Compose"; then
    echo "Validating docker-compose.ghcr.yml..."
    if docker-compose -f infrastructure/docker-compose.ghcr.yml config > /dev/null 2>&1; then
        print_success "Docker Compose validation passed"
    else
        print_error "Docker Compose validation failed"
        add_failure "Docker" "docker-compose" "Compose file validation failed|Fix: docker-compose -f infrastructure/docker-compose.ghcr.yml config"
    fi
else
    echo "Install Docker Desktop or docker-compose"
fi

# ============================================
# YAML Linting
# ============================================
print_header "6. YAML Linting"

if check_command "yamllint" "yamllint"; then
    echo "Checking YAML files..."
    if yamllint -d '{extends: default, rules: {line-length: {max: 200}, document-start: disable, truthy: {allowed-values: ["true", "false", "on", "off"]}, comments: disable, comments-indentation: disable, trailing-spaces: disable}}' .github/workflows/ infrastructure/ 2>&1; then
        print_success "YAML linting passed"
    else
        print_warning "YAML linting found issues (non-blocking)"
    fi
else
    echo "Install: pip install yamllint"
fi

# ============================================
# Markdown Linting
# ============================================
print_header "7. Markdown Linting"

if check_command "markdownlint-cli2" "Markdown linting"; then
    echo "Checking Markdown files..."
    if markdownlint-cli2 "**/*.md" 2>&1; then
        print_success "Markdown linting passed"
    else
        print_warning "Markdown linting issues found (non-blocking)"
    fi
else
    echo "Install: npm install -g markdownlint-cli2"
fi

# ============================================
# HTML Linting
# ============================================
print_header "8. HTML Linting"

if check_command "htmlhint" "HTML linting"; then
    echo "Checking HTML files..."
    if htmlhint "frontend/**/*.html" 2>&1; then
        print_success "HTML linting passed"
    else
        print_warning "HTML linting found issues (non-blocking)"
    fi
else
    echo "Install: npm install -g htmlhint"
fi

# ============================================
# Shell Script Linting
# ============================================
print_header "9. Shell Script Linting"

if check_command "shellcheck" "ShellCheck"; then
    echo "Checking shell scripts..."
    SHELL_FILES=$(find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./venv/*" -not -path "./.venv/*")
    if [ -n "$SHELL_FILES" ]; then
        if echo "$SHELL_FILES" | xargs shellcheck; then
            print_success "ShellCheck passed"
        else
            print_error "ShellCheck found issues"
            add_failure "Scripts" "shellcheck" "Shell script issues found|Fix: Review shellcheck output above"
        fi
    else
        print_warning "No shell scripts found"
    fi
else
    echo "Install: brew install shellcheck"
fi

# ============================================
# Secret Scanning
# ============================================
print_header "10. Secret Scanning"

if check_command "gitleaks" "Gitleaks"; then
    echo "Scanning for secrets..."
    if gitleaks detect --source . --verbose --no-git 2>&1; then
        print_success "No secrets detected"
    else
        print_error "Gitleaks found potential secrets!"
        add_failure "Security" "gitleaks" "Potential secrets detected|Fix: Remove secrets or add to .gitleaksignore"
    fi
else
    echo "Install: brew install gitleaks"
fi

# ============================================
# Git Checks
# ============================================
print_header "11. Git Checks"

echo "Checking for merge conflicts..."
if git diff --check; then
    print_success "No merge conflict markers"
else
    print_error "Merge conflict markers found"
    add_failure "Git" "git-diff" "Merge conflict markers present|Fix: Resolve conflicts in files"
fi

echo "Checking for large files..."
LARGE_FILES=$(find . -type f -size +1M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./*.db" 2>/dev/null || true)
if [ -z "$LARGE_FILES" ]; then
    print_success "No large files (>1MB) to commit"
else
    print_warning "Large files found:"
    echo "$LARGE_FILES"
fi

# ============================================
# Summary
# ============================================
print_header "Validation Summary"

if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ Pre-commit validation FAILED${NC}"
    echo ""

    if [ ${#FAILURES[@]} -gt 0 ]; then
        echo -e "${YELLOW}Failed Checks Summary:${NC}"
        echo ""

        # Group failures by category - bash 3.2 compatible
        current_category=""
        category_count=0

        # First pass: print all failures grouped by category
        for failure in "${FAILURES[@]}"; do
            IFS='|' read -r category tool message fix <<< "$failure"

            # Print category header if changed
            if [ "$category" != "$current_category" ]; then
                # Count items in this category
                category_count=$(printf '%s\n' "${FAILURES[@]}" | grep -c "^$category|")
                echo -e "${YELLOW}[$category] ($category_count issue(s))${NC}"
                current_category="$category"
            fi

            # Print failure details
            echo -e "  ${RED}✗${NC} $tool: $message"
            echo -e "     $fix"
            echo ""
        done

        # Quick fix commands
        echo -e "${YELLOW}Quick Fix Commands:${NC}"
        echo ""

        # Check if formatting failures exist
        has_black=false
        has_isort=false
        for failure in "${FAILURES[@]}"; do
            if [[ $failure == *"Black"* ]]; then has_black=true; fi
            if [[ $failure == *"isort"* ]]; then has_isort=true; fi
        done

        if [ "$has_black" = true ] || [ "$has_isort" = true ]; then
            echo "  Auto-fix formatting:"
            if [ "$has_black" = true ] && [ "$has_isort" = true ]; then
                echo -e "    ${GREEN}isort backend/ && black backend/${NC}"
            elif [ "$has_black" = true ]; then
                echo -e "    ${GREEN}black backend/${NC}"
            elif [ "$has_isort" = true ]; then
                echo -e "    ${GREEN}isort backend/${NC}"
            fi
            echo ""
        fi

        echo "  Review detailed output above for specific file locations and line numbers."
        echo ""
    fi

    echo -e "${RED}Please fix these issues before committing.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All checks PASSED!${NC}"
    echo ""
    echo "Ready to commit!"
    exit 0
fi
