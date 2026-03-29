# Build stage: Install build dependencies and compile extensions
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for asyncpg and other compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage: Minimal image with only runtime dependencies
FROM python:3.12-slim AS base

WORKDIR /app

# Install only runtime dependencies (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder into system path (world-readable, no /root traversal issue)
COPY --from=builder /root/.local /usr/local

# Copy application code
COPY app/ ./app/

# Copy scripts directory
COPY scripts/ ./scripts/

# Copy data directory (includes FAA database if built)
COPY data/ ./data/

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health').read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Development target with additional tools
FROM base AS development
RUN pip install --no-cache-dir watchdog
