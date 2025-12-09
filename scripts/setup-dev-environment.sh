#!/bin/bash
# Development Environment Setup Script for TrueHour
# This script installs all required development tools and sets up pre-commit hooks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS"
    print_info "For Linux, adapt the Homebrew commands to your package manager"
fi

print_header "TrueHour Development Environment Setup"
echo "This script will:"
echo "  1. Create Python virtual environment (venv/)"
echo "  2. Install system tools via Homebrew (global: hadolint, gitleaks, etc.)"
echo "  3. Install Python tools in venv ONLY (black, flake8, pylint, etc.)"
echo "  4. Install Node.js tools globally (optional: htmlhint, markdownlint)"
echo "  5. Set up pre-commit hooks (optional)"
echo ""
print_warning "Python packages will ONLY be installed in venv/"
print_info "No changes to system Python will be made"
echo ""

# Get repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
VENV_PATH="$REPO_ROOT/venv"

# ============================================
# Check Prerequisites
# ============================================
print_header "1. Checking Prerequisites"

# Check Homebrew
if ! command -v brew &> /dev/null; then
    print_error "Homebrew not found"
    echo "Install Homebrew from: https://brew.sh"
    echo "Then run this script again"
    exit 1
else
    print_success "Homebrew installed"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 not found"
    echo "Install Python 3.12+ from: https://www.python.org/"
    exit 1
else
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION installed"
fi

# Check for Python development headers (needed for asyncpg)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: Check for Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        print_warning "Xcode Command Line Tools not found"
        print_info "asyncpg requires compilation - installing Command Line Tools..."
        xcode-select --install
        echo "Please complete the installation and run this script again"
        exit 1
    else
        print_success "Xcode Command Line Tools installed"
    fi
else
    # Linux: Check for python3-dev
    if ! dpkg -l | grep -q python3-dev 2>/dev/null; then
        print_warning "python3-dev not found (required for asyncpg)"
        print_info "Install with: sudo apt-get install python3-dev build-essential"
    fi
fi

# Check pip
if ! command -v pip3 &> /dev/null; then
    print_error "pip not found"
    exit 1
else
    print_success "pip installed"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found - frontend linting will be unavailable"
    read -p "Install Node.js? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install node
        print_success "Node.js installed"
    fi
else
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installed"
fi

# ============================================
# Create Python Virtual Environment
# ============================================
print_header "2. Setting Up Python Virtual Environment"

if [ -d "$VENV_PATH" ]; then
    print_info "Virtual environment already exists at: $VENV_PATH"
    read -p "Recreate virtual environment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing virtual environment..."
        rm -rf "$VENV_PATH"
    fi
fi

if [ ! -d "$VENV_PATH" ]; then
    echo "Creating virtual environment at: $VENV_PATH"
    python3 -m venv "$VENV_PATH"
    print_success "Virtual environment created"
fi

# Activate virtual environment
echo "Activating virtual environment..."
# shellcheck disable=SC1091
source "$VENV_PATH/bin/activate"
print_success "Virtual environment activated"

# Upgrade pip in venv
echo "Upgrading pip in virtual environment..."
pip install --upgrade pip --quiet
print_success "pip upgraded"

# ============================================
# Install Homebrew Packages
# ============================================
print_header "3. Installing Homebrew Packages"

BREW_PACKAGES=(
    "hadolint"      # Dockerfile linter
    "shellcheck"    # Shell script linter
    "yamllint"      # YAML linter
    "gitleaks"      # Secret scanner
    "trivy"         # Container scanner
    "checkov"       # IaC security scanner
)

for package in "${BREW_PACKAGES[@]}"; do
    if brew list "$package" &> /dev/null; then
        print_info "$package already installed"
    else
        echo "Installing $package..."
        brew install "$package"
        print_success "$package installed"
    fi
done

# Install Syft (different tap)
if ! command -v syft &> /dev/null; then
    echo "Installing Syft (SBOM generator)..."
    brew tap anchore/syft
    brew install syft
    print_success "Syft installed"
else
    print_info "Syft already installed"
fi

# ============================================
# Install Python Packages
# ============================================
print_header "4. Installing Python Development Tools"

# Verify venv is active
if [[ "$VIRTUAL_ENV" != "$VENV_PATH" ]]; then
    print_error "Virtual environment not properly activated"
    print_info "Expected: $VENV_PATH"
    print_info "Current: $VIRTUAL_ENV"
    exit 1
fi

echo "Installing Python development tools in virtual environment..."
echo "Target: $VIRTUAL_ENV"
echo ""

PYTHON_PACKAGES=(
    "black"             # Code formatter
    "isort"             # Import sorter
    "flake8"            # Style checker
    "pylint"            # Code analyzer
    "mypy"              # Type checker
    "safety"            # Dependency security
    "bandit"            # Security linter
    "pip-audit"         # Vulnerability scanner
    "cyclonedx-bom"     # SBOM generator
    "pip-licenses"      # License reporter
    "pre-commit"        # Git hooks framework
)

echo "Installing Python packages..."
for package in "${PYTHON_PACKAGES[@]}"; do
    if pip show "$package" &> /dev/null; then
        print_info "$package already installed"
    else
        pip install "$package" --quiet
        print_success "$package installed"
    fi
done

# ============================================
# Install Node.js Packages
# ============================================
if command -v npm &> /dev/null; then
    print_header "5. Installing Node.js Packages"

    NODE_PACKAGES=(
        "htmlhint"              # HTML linter
        "markdownlint-cli2"     # Markdown linter
    )

    for package in "${NODE_PACKAGES[@]}"; do
        if npm list -g "$package" &> /dev/null; then
            print_info "$package already installed"
        else
            echo "Installing $package..."
            npm install -g "$package"
            print_success "$package installed"
        fi
    done
else
    print_warning "Skipping Node.js packages (Node.js not installed)"
fi

# ============================================
# Setup Pre-commit Hooks
# ============================================
print_header "6. Setting Up Pre-commit Hooks"

echo "You have two options for pre-commit hooks:"
echo ""
echo "Option 1: pre-commit framework (recommended)"
echo "  - Automatic execution on git commit"
echo "  - Auto-update capabilities"
echo "  - CI integration support"
echo ""
echo "Option 2: Manual shell script"
echo "  - Run manually: ./scripts/pre-commit.sh"
echo "  - More control over execution"
echo ""

read -p "Install pre-commit framework hooks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Install pre-commit hooks
    echo "Installing pre-commit hooks..."
    cd "$(git rev-parse --show-toplevel)"
    pre-commit install
    print_success "Pre-commit hooks installed"

    # Run initial check
    echo ""
    read -p "Run pre-commit on all files now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pre-commit run --all-files || true
    fi
else
    print_info "Pre-commit framework not installed"
    print_info "You can run checks manually: ./scripts/pre-commit.sh"
    chmod +x scripts/pre-commit.sh
fi

# ============================================
# Install Backend Dependencies
# ============================================
print_header "7. Installing Backend Dependencies"

if [ -f "$REPO_ROOT/backend/requirements.txt" ]; then
    read -p "Install backend Python dependencies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing backend dependencies..."
        echo "Note: asyncpg requires C extensions and may take a moment to compile"

        # Try to install, capture any errors
        if pip install -r "$REPO_ROOT/backend/requirements.txt" 2>&1 | tee /tmp/pip-install.log; then
            print_success "Backend dependencies installed"
        else
            print_error "Failed to install some backend dependencies"

            # Check for asyncpg-specific error
            if grep -q "asyncpg" /tmp/pip-install.log; then
                echo ""
                print_warning "asyncpg installation failed"
                echo "This package requires compilation. Common fixes:"
                echo ""
                echo "macOS:"
                echo "  1. Install Xcode Command Line Tools:"
                echo "     xcode-select --install"
                echo "  2. Reinstall Python via Homebrew:"
                echo "     brew reinstall python@3.12"
                echo ""
                echo "Linux:"
                echo "  1. Install build dependencies:"
                echo "     sudo apt-get install python3-dev build-essential libpq-dev"
                echo ""
                echo "After fixing, try again:"
                echo "  source venv/bin/activate"
                echo "  pip install -r backend/requirements.txt"
            fi

            rm -f /tmp/pip-install.log
        fi
    fi
else
    print_warning "backend/requirements.txt not found"
fi

# ============================================
# Verify Installation
# ============================================
print_header "8. Verifying Installation"

echo "Checking installed tools..."
echo ""

check_tool() {
    if command -v "$1" &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n 1 || echo "installed")
        print_success "$1: $VERSION"
        return 0
    else
        print_error "$1: not found"
        return 1
    fi
}

# Check all tools
TOOLS=(
    "black"
    "isort"
    "flake8"
    "pylint"
    "mypy"
    "bandit"
    "safety"
    "pip-audit"
    "hadolint"
    "shellcheck"
    "yamllint"
    "gitleaks"
    "trivy"
    "checkov"
    "syft"
    "pre-commit"
)

OPTIONAL_TOOLS=(
    "htmlhint"
    "markdownlint-cli2"
)

ALL_FOUND=true
for tool in "${TOOLS[@]}"; do
    if ! check_tool "$tool"; then
        ALL_FOUND=false
    fi
done

echo ""
echo "Optional tools:"
for tool in "${OPTIONAL_TOOLS[@]}"; do
    check_tool "$tool" || true
done

# ============================================
# Summary
# ============================================
print_header "Setup Complete!"

if [ "$ALL_FOUND" = true ]; then
    print_success "All required tools installed successfully!"
else
    print_warning "Some tools failed to install - check errors above"
fi

echo ""
echo "============================================"
echo "Installation Locations"
echo "============================================"
print_info "Virtual environment: $VENV_PATH"
print_info "System tools (Homebrew): $(brew --prefix)/bin/"
print_info "Node.js global packages: $(npm config get prefix)/bin/"
echo ""
echo "Python packages installed in venv ONLY:"
echo "  $(pip list | wc -l) packages in $VENV_PATH"
echo ""
echo "To verify isolation:"
echo "  deactivate                    # Exit venv"
echo "  black --version               # Should fail"
echo "  source venv/bin/activate      # Enter venv"
echo "  black --version               # Should work"
echo ""
echo "To activate the virtual environment in new terminal sessions:"
echo "  source venv/bin/activate"
echo ""
echo "Next steps:"
echo "  1. Activate venv (already active in this session):"
echo "     source venv/bin/activate"
echo ""
echo "  2. Run pre-commit checks:"
if command -v pre-commit &> /dev/null && [ -f ".git/hooks/pre-commit" ]; then
    echo "     pre-commit run --all-files"
else
    echo "     ./scripts/pre-commit.sh"
fi
echo ""
echo "  3. Format Python code:"
echo "     black backend/ && isort backend/"
echo ""
echo "  4. Run security checks:"
echo "     bandit -r backend/app"
echo "     safety scan --target backend/requirements.txt"
echo ""
echo "  5. Build and test Docker images:"
echo "     docker-compose -f infrastructure/docker-compose.ghcr.yml build"
echo ""

print_info "For more information, see: wiki/Security-Setup.md"
echo ""
