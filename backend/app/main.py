"""TrueHour: Aviation Expense Tracking and Flight Management API"""

import os
from contextlib import asynccontextmanager
from typing import List, Optional

from app.database import Database
from app.models import AircraftResponse, BulkRequest, BulkResponse, BulkResult, HealthResponse, StatsResponse
from app.postgres_database import postgres_db
from app.routers import aircraft, budget_cards, budgets, expenses, import_history, user_data
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import FileResponse, HTMLResponse

DB_PATH = os.getenv("DB_PATH", "/app/data/aircraft.db")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

db: Optional[Database] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db

    # Initialize Postgres connection
    await postgres_db.connect()
    print("✅ PostgreSQL connection pool initialized")

    # Phase 0: Allow startup without FAA database
    if os.path.exists(DB_PATH):
        db = Database(DB_PATH)
        print(f"✅ FAA database loaded from {DB_PATH}")
    else:
        print(f"⚠️  FAA database not found at {DB_PATH} - aircraft lookup disabled")
        print("   Run: python backend/scripts/update_faa_data.py to build it")

    yield

    # Cleanup
    await postgres_db.close()
    print("✅ PostgreSQL connection pool closed")
    if db:
        db.close()


app = FastAPI(
    title="TrueHour",
    description="Aviation Expense Tracking and Flight Management API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8181",
        "https://truehour.app",
        "https://www.truehour.app",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-ID"],
    allow_credentials=True,
)

# Include routers
app.include_router(aircraft.router)
app.include_router(budget_cards.router)
app.include_router(budgets.router)
app.include_router(expenses.router)
app.include_router(import_history.router)
app.include_router(user_data.router)


def normalize_tail(tail: str) -> str:
    """Normalize N-number: uppercase, strip N prefix and dashes."""
    t = tail.upper().strip()
    if t.startswith("N"):
        t = t[1:]
    return t.replace("-", "").replace(" ", "")


@app.get("/", include_in_schema=False)
async def root():
    """Serve the UI."""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with footer."""
    footer_html = """
    <style>
        .api-footer {
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
            padding: 2rem 0;
            margin-top: 4rem;
            font-size: 0.9rem;
            color: #6b7280;
        }
        .api-footer-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .api-footer-right {
            display: flex;
            gap: 1.5rem;
        }
        .api-footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .api-footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .api-footer-container {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
    <div class="api-footer">
        <div class="api-footer-container">
            <div class="api-footer-left">
                <span>© <span id="currentYear"></span> FliteAxis. All Rights Reserved.</span>
            </div>
            <div class="api-footer-right">
                <a href="https://fliteaxis.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                <a href="https://fliteaxis.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    </script>
    """

    swagger_html = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - API Documentation",
    )

    html_content = swagger_html.body.decode("utf-8")
    html_with_footer = html_content.replace("</body>", f"{footer_html}</body>")

    return HTMLResponse(content=html_with_footer)


@app.get("/redoc", include_in_schema=False)
async def custom_redoc_html():
    """Custom ReDoc with footer."""
    footer_html = """
    <style>
        .api-footer {
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
            padding: 2rem 0;
            margin-top: 4rem;
            font-size: 0.9rem;
            color: #6b7280;
        }
        .api-footer-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .api-footer-right {
            display: flex;
            gap: 1.5rem;
        }
        .api-footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .api-footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .api-footer-container {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
    <div class="api-footer">
        <div class="api-footer-container">
            <div class="api-footer-left">
                <span>© <span id="currentYear"></span> FliteAxis. All Rights Reserved.</span>
            </div>
            <div class="api-footer-right">
                <a href="https://fliteaxis.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                <a href="https://fliteaxis.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    </script>
    """

    redoc_html = get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - API Documentation",
    )

    html_content = redoc_html.body.decode("utf-8")
    html_with_footer = html_content.replace("</body>", f"{footer_html}</body>")

    return HTMLResponse(content=html_with_footer)


@app.get("/api/v1/aircraft/{tail}", response_model=AircraftResponse)
async def get_aircraft(tail: str):
    """Lookup aircraft by N-number (e.g., N172SP, 172SP, N-172SP)."""
    if db is None:
        raise HTTPException(503, "FAA database not available. Run update_faa_data.py to build it.")

    normalized = normalize_tail(tail)
    if not normalized:
        raise HTTPException(400, "Invalid tail number")

    aircraft = db.lookup(normalized)
    if not aircraft:
        raise HTTPException(404, f"Aircraft N{normalized} not found")

    return aircraft


@app.post("/api/v1/aircraft/bulk", response_model=BulkResponse)
async def bulk_lookup(request: BulkRequest):
    """Lookup multiple aircraft by N-number. Maximum 50 per request."""
    if db is None:
        raise HTTPException(503, "FAA database not available. Run update_faa_data.py to build it.")

    if len(request.tail_numbers) > 50:
        raise HTTPException(400, "Maximum 50 tail numbers per request")

    results: List[BulkResult] = []
    found = 0

    for tail in request.tail_numbers:
        normalized = normalize_tail(tail)
        if not normalized:
            results.append(BulkResult(tail_number=tail.upper(), error="Invalid tail number"))
            continue

        aircraft = db.lookup(normalized)
        if aircraft:
            found += 1
            results.append(
                BulkResult(
                    tail_number=aircraft.tail_number,
                    manufacturer=aircraft.manufacturer,
                    model=aircraft.model,
                    series=aircraft.series,
                    aircraft_type=aircraft.aircraft_type,
                    engine_type=aircraft.engine_type,
                    num_engines=aircraft.num_engines,
                    num_seats=aircraft.num_seats,
                    year_mfr=aircraft.year_mfr,
                )
            )
        else:
            results.append(BulkResult(tail_number=f"N{normalized}", error="Not found"))

    return BulkResponse(total=len(request.tail_numbers), found=found, results=results)


@app.get("/api/v1/health", response_model=HealthResponse)
async def health():
    """Health check with database status."""
    if db is None:
        return HealthResponse(status="degraded", database_exists=False, record_count=0, last_updated=None)

    stats = db.get_stats()
    return HealthResponse(
        status="healthy" if stats.record_count > 0 else "degraded",
        database_exists=os.path.exists(DB_PATH),
        record_count=stats.record_count,
        last_updated=stats.last_updated,
    )


@app.get("/api/v1/stats", response_model=StatsResponse)
async def stats():
    """Database statistics."""
    if db is None:
        raise HTTPException(503, "FAA database not available. Run update_faa_data.py to build it.")
    return db.get_stats()
