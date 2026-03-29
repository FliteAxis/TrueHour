<p align="center">
  <img src="logo.png" alt="TrueHour by FliteAxis" width="150">
</p>

# TrueHour Wiki

Welcome to the TrueHour documentation! TrueHour is a personal aviation expense tracking and flight management application.

## Current Status: v2.0 - Production Ready 🚀

**TrueHour v2.0** is a complete rewrite featuring:
- **Modern React Frontend** - React 18 + Vite + Tailwind CSS + TypeScript
- **PostgreSQL Database** - Full data persistence with async connection pooling
- **Budget Card System** - Outcome-based budgeting with real-time calculations
- **Flight Logging** - ForeFlight CSV import with 100+ logbook fields
- **Aircraft Management** - FAA database with 308K+ aircraft, enriched data (complex, high-performance)
- **Expense Tracking** - Multi-category expenses with budget card linking
- **Training Progress** - Certification tracking (PPL, IR, CPL, CFI, etc.)
- **Docker Deployment** - Multi-platform containers (amd64/arm64) on port 8181
- **Automated Testing** - 14-test smoke test suite with test data generator
- **Data Privacy** - Local-first, no cloud dependencies, data never leaves your machine

## 🚀 Quick Start

- [Getting Started](Getting-Started.md) - Installation and setup
- [Development Guide](Development-Guide.md) - Local development workflow
- [Architecture Overview](Architecture-Overview.md) - System design and structure

## 📖 Documentation

### User Guides
- [Aircraft Management](Aircraft-Management.md) - Managing your aircraft list
- [ForeFlight Import](ForeFlight-Import.md) - Importing flight logs (coming soon)

### Development
- [Development Guide](Development-Guide.md) - Setting up your environment
- [Contributing](Contributing.md) - How to contribute
- [Branch Strategy](Branch-Strategy.md) - Git workflow and branching

### Technical Documentation
- [Architecture Overview](Architecture-Overview.md) - System architecture
- [API Documentation](API-Documentation.md) - REST API reference
- [Database Design](Database-Design.md) - Database schema
- [Deployment Guide](Deployment-Guide.md) - Deployment instructions

### DevOps & Infrastructure
- [CI/CD Pipeline](CI-CD-Pipeline.md) - Automated builds and deployments
- [Dependency Management](Dependency-Management.md) - Managing dependencies
- [Release Process](Release-Process.md) - How releases are created
- [Container Setup](Container-Setup.md) - Docker configuration

## 📦 Project Structure

```
truehour/
├── frontend-react/    # React 18 + Vite + TypeScript frontend
├── backend/           # Python FastAPI application
├── infrastructure/    # Docker configs, Dockerfiles, .env
├── tests/             # Smoke test suite and test data generator
├── data/             # Local config.json (gitignored)
├── archive/          # Legacy v1 code (gitignored)
└── wiki/             # Documentation source
```

## 🔗 Links

- **GitHub Repository:** [FliteAxis/TrueHour](https://github.com/FliteAxis/TrueHour)
- **Issues:** [Report bugs or request features](https://github.com/FliteAxis/TrueHour/issues)
- **Changelog:** [View release history](Changelog.md)

## 📝 Migration Notice

This project consolidates:
- **ryakel/flight-budget** → Frontend and expense tracking
- **ryakel/tail-lookup** → FAA aircraft registry backend

Both repositories are now archived. All future development happens here.

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](Contributing.md) for details.

## 📜 License

MIT License - See [LICENSE](https://github.com/FliteAxis/TrueHour/blob/main/LICENSE) for details
