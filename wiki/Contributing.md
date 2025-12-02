# Contributing to Flight Budget

Thank you for your interest in contributing to Flight Budget! We welcome contributions from the community.

## Development Setup

### Prerequisites
- Git
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (optional, for running local server)
- Docker (optional, for testing containerized deployments)

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/ryakel/flight-budget.git
   cd flight-budget
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Edit files in the `app/` directory for frontend changes
   - Update `wiki/` files for documentation changes

4. **Test Locally**
   ```bash
   # Simple: Open in browser
   open app/index.html

   # With server:
   python3 -m http.server 8000 --directory app
   # Then visit http://localhost:8000
   ```

5. **Test with Docker (Optional)**
   ```bash
   cd infrastructure
   docker-compose up -d
   # Visit http://localhost:8181
   ```

## Commit Conventions

We follow semantic commit messages for automatic versioning:

### Format
```
<type>(<scope>): <subject>
<blank line>
<body>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, dependencies, or tooling changes
- **ci**: CI/CD configuration changes
- **breaking**: Breaking changes (triggers major version bump)

### Examples
```bash
# Minor version bump (new feature)
git commit -m "feat: Add dark mode toggle to settings"

# Patch version bump (bug fix)
git commit -m "fix: Correct aircraft lookup validation logic"

# Major version bump (breaking change)
git commit -m "breaking: Replace ARLA API with tail-lookup service"

# Documentation
git commit -m "docs: Update deployment guide with new setup steps"
```

## Pull Request Process

1. **Create a Pull Request**
   - Title: Clear description of changes
   - Description: Include what changed and why
   - Link related issues if applicable

2. **Wait for Review**
   - At least one maintainer review required
   - Address feedback and update PR
   - All checks must pass (if applicable)

3. **Merge**
   - Use "Squash and merge" for clarity (unless PR has logical commits)
   - Delete branch after merge

## Code Style Guidelines

- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions focused and modular
- Test changes in multiple browsers
- Ensure responsive design for mobile

## Documentation

- Update `README.md` if adding user-facing features
- Update `wiki/` files for documentation changes
- Add inline code comments for complex logic
- Keep commit messages clear and descriptive

## License

By contributing to Flight Budget, you agree that your contributions will be licensed under the MIT License (same as the project).

---

**Happy contributing! We appreciate your help making Flight Budget better.**
