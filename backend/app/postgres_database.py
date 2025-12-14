"""PostgreSQL database operations for user data."""

import json
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Any, Dict, List, Optional

import asyncpg


class PostgresDatabase:
    """Async PostgreSQL database connection pool manager."""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv("DATABASE_URL", "postgresql://truehour:truehour@db:5432/truehour")

    async def connect(self):
        """Create connection pool."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.database_url, min_size=2, max_size=10, command_timeout=60)

    async def close(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None

    @asynccontextmanager
    async def acquire(self):
        """Get a connection from the pool."""
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            yield conn

    # Aircraft CRUD Operations

    async def get_user_aircraft(self, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Get list of user aircraft."""
        async with self.acquire() as conn:
            if is_active is None:
                rows = await conn.fetch("SELECT * FROM aircraft ORDER BY tail_number")
            else:
                rows = await conn.fetch("SELECT * FROM aircraft WHERE is_active = $1 ORDER BY tail_number", is_active)
            return [dict(row) for row in rows]

    async def get_aircraft_by_id(self, aircraft_id: int) -> Optional[Dict[str, Any]]:
        """Get single aircraft by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM aircraft WHERE id = $1", aircraft_id)
            return dict(row) if row else None

    async def get_aircraft_by_tail(self, tail_number: str) -> Optional[Dict[str, Any]]:
        """Get aircraft by tail number."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM aircraft WHERE tail_number = $1", tail_number.upper())
            return dict(row) if row else None

    async def create_aircraft(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new aircraft."""
        data["tail_number"] = data["tail_number"].upper()

        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO aircraft (
                    tail_number, type_code, year, make, model, gear_type, engine_type,
                    aircraft_class, is_complex, is_taa, is_high_performance, is_simulator,
                    category, hourly_rate_wet, hourly_rate_dry, notes, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            """,
                data.get("tail_number"),
                data.get("type_code"),
                data.get("year"),
                data.get("make"),
                data.get("model"),
                data.get("gear_type"),
                data.get("engine_type"),
                data.get("aircraft_class"),
                data.get("is_complex", False),
                data.get("is_taa", False),
                data.get("is_high_performance", False),
                data.get("is_simulator", False),
                data.get("category"),
                data.get("hourly_rate_wet"),
                data.get("hourly_rate_dry"),
                data.get("notes"),
                data.get("is_active", True),
            )
            return dict(row)

    async def update_aircraft(self, aircraft_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update aircraft."""
        if "tail_number" in data:
            data["tail_number"] = data["tail_number"].upper()

        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE aircraft
                SET
                    tail_number = COALESCE($2, tail_number),
                    type_code = COALESCE($3, type_code),
                    year = COALESCE($4, year),
                    make = COALESCE($5, make),
                    model = COALESCE($6, model),
                    gear_type = COALESCE($7, gear_type),
                    engine_type = COALESCE($8, engine_type),
                    aircraft_class = COALESCE($9, aircraft_class),
                    is_complex = COALESCE($10, is_complex),
                    is_taa = COALESCE($11, is_taa),
                    is_high_performance = COALESCE($12, is_high_performance),
                    is_simulator = COALESCE($13, is_simulator),
                    category = COALESCE($14, category),
                    hourly_rate_wet = COALESCE($15, hourly_rate_wet),
                    hourly_rate_dry = COALESCE($16, hourly_rate_dry),
                    notes = COALESCE($17, notes),
                    is_active = COALESCE($18, is_active),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """,
                aircraft_id,
                data.get("tail_number"),
                data.get("type_code"),
                data.get("year"),
                data.get("make"),
                data.get("model"),
                data.get("gear_type"),
                data.get("engine_type"),
                data.get("aircraft_class"),
                data.get("is_complex"),
                data.get("is_taa"),
                data.get("is_high_performance"),
                data.get("is_simulator"),
                data.get("category"),
                data.get("hourly_rate_wet"),
                data.get("hourly_rate_dry"),
                data.get("notes"),
                data.get("is_active"),
            )
            return dict(row) if row else None

    async def delete_aircraft(self, aircraft_id: int) -> bool:
        """Delete aircraft."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM aircraft WHERE id = $1", aircraft_id)
            return result == "DELETE 1"

    # Expense CRUD Operations

    async def get_expenses(
        self,
        aircraft_id: Optional[int] = None,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get list of expenses with filters."""
        async with self.acquire() as conn:
            query = "SELECT * FROM expenses WHERE 1=1"
            params = []
            param_count = 0

            if aircraft_id is not None:
                param_count += 1
                query += f" AND aircraft_id = ${param_count}"
                params.append(aircraft_id)

            if category:
                param_count += 1
                query += f" AND category = ${param_count}"
                params.append(category)

            if start_date:
                param_count += 1
                query += f" AND date >= ${param_count}"
                params.append(start_date)

            if end_date:
                param_count += 1
                query += f" AND date <= ${param_count}"
                params.append(end_date)

            query += " ORDER BY date DESC"

            param_count += 1
            query += f" LIMIT ${param_count}"
            params.append(limit)

            param_count += 1
            query += f" OFFSET ${param_count}"
            params.append(offset)

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_expense_by_id(self, expense_id: int) -> Optional[Dict[str, Any]]:
        """Get single expense by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM expenses WHERE id = $1", expense_id)
            return dict(row) if row else None

    async def create_expense(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new expense."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO expenses (
                    aircraft_id, category, subcategory, description, amount, date,
                    is_recurring, recurrence_interval, recurrence_end_date,
                    vendor, is_tax_deductible, tax_category
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            """,
                data.get("aircraft_id"),
                data["category"],
                data.get("subcategory"),
                data.get("description"),
                data["amount"],
                data["date"],
                data.get("is_recurring", False),
                data.get("recurrence_interval"),
                data.get("recurrence_end_date"),
                data.get("vendor"),
                data.get("is_tax_deductible", False),
                data.get("tax_category"),
            )
            return dict(row)

    async def update_expense(self, expense_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update expense."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE expenses
                SET
                    aircraft_id = COALESCE($2, aircraft_id),
                    category = COALESCE($3, category),
                    subcategory = COALESCE($4, subcategory),
                    description = COALESCE($5, description),
                    amount = COALESCE($6, amount),
                    date = COALESCE($7, date),
                    is_recurring = COALESCE($8, is_recurring),
                    recurrence_interval = COALESCE($9, recurrence_interval),
                    recurrence_end_date = COALESCE($10, recurrence_end_date),
                    vendor = COALESCE($11, vendor),
                    is_tax_deductible = COALESCE($12, is_tax_deductible),
                    tax_category = COALESCE($13, tax_category),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """,
                expense_id,
                data.get("aircraft_id"),
                data.get("category"),
                data.get("subcategory"),
                data.get("description"),
                data.get("amount"),
                data.get("date"),
                data.get("is_recurring"),
                data.get("recurrence_interval"),
                data.get("recurrence_end_date"),
                data.get("vendor"),
                data.get("is_tax_deductible"),
                data.get("tax_category"),
            )
            return dict(row) if row else None

    async def delete_expense(self, expense_id: int) -> bool:
        """Delete expense."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM expenses WHERE id = $1", expense_id)
            return result == "DELETE 1"

    async def get_expense_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None, group_by: str = "category"
    ) -> List[Dict[str, Any]]:
        """Get expense summary grouped by category or subcategory."""
        async with self.acquire() as conn:
            # group_field is validated to be either 'category' or 'subcategory'
            group_field = "category" if group_by == "category" else "subcategory"
            query = f"""
                SELECT
                    {group_field} as group_name,
                    COUNT(*) as count,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_amount,
                    MIN(amount) as min_amount,
                    MAX(amount) as max_amount
                FROM expenses
                WHERE 1=1
            """  # nosec B608
            params = []
            param_count = 0

            if start_date:
                param_count += 1
                query += f" AND date >= ${param_count}"
                params.append(start_date)

            if end_date:
                param_count += 1
                query += f" AND date <= ${param_count}"
                params.append(end_date)

            query += f" GROUP BY {group_field} ORDER BY total_amount DESC"

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    # Flight/Logbook Operations

    async def get_flights(
        self,
        aircraft_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get list of flights with filters."""
        async with self.acquire() as conn:
            query = "SELECT * FROM flights WHERE 1=1"
            params = []
            param_count = 0

            if aircraft_id is not None:
                param_count += 1
                query += f" AND aircraft_id = ${param_count}"
                params.append(aircraft_id)

            if start_date:
                param_count += 1
                query += f" AND date >= ${param_count}"
                params.append(start_date)

            if end_date:
                param_count += 1
                query += f" AND date <= ${param_count}"
                params.append(end_date)

            query += " ORDER BY date DESC, time_out DESC"

            param_count += 1
            query += f" LIMIT ${param_count}"
            params.append(limit)

            param_count += 1
            query += f" OFFSET ${param_count}"
            params.append(offset)

            rows = await conn.fetch(query, *params)
            # Convert to dict and handle date/time serialization
            result = []
            for row in rows:
                flight = dict(row)
                # Convert date to ISO string
                if flight.get("date"):
                    flight["date"] = flight["date"].isoformat()
                # Convert time fields to string
                for field in ["time_out", "time_off", "time_on", "time_in"]:
                    if flight.get(field):
                        flight[field] = str(flight[field])
                # Convert timestamps
                for field in ["created_at", "updated_at"]:
                    if flight.get(field):
                        flight[field] = flight[field].isoformat()
                result.append(flight)
            return result

    # Budget CRUD Operations

    async def get_budgets(self, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Get list of budgets."""
        async with self.acquire() as conn:
            if is_active is None:
                rows = await conn.fetch("SELECT * FROM budgets ORDER BY is_active DESC, created_at DESC")
            else:
                rows = await conn.fetch(
                    "SELECT * FROM budgets WHERE is_active = $1 ORDER BY created_at DESC", is_active
                )
            # Parse categories JSON field
            result = []
            for row in rows:
                budget = dict(row)
                if budget.get("categories"):
                    budget["categories"] = json.loads(budget["categories"])
                result.append(budget)
            return result

    async def get_budget_by_id(self, budget_id: int) -> Optional[Dict[str, Any]]:
        """Get single budget by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM budgets WHERE id = $1", budget_id)
            if row:
                budget = dict(row)
                if budget.get("categories"):
                    budget["categories"] = json.loads(budget["categories"])
                return budget
            return None

    async def create_budget(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new budget."""
        async with self.acquire() as conn:
            categories_json = json.dumps(data.get("categories")) if data.get("categories") else None
            row = await conn.fetchrow(
                """
                INSERT INTO budgets (
                    name, budget_type, amount, start_date, end_date,
                    categories, notes, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            """,
                data["name"],
                data["budget_type"],
                data["amount"],
                data.get("start_date"),
                data.get("end_date"),
                categories_json,
                data.get("notes"),
                data.get("is_active", True),
            )
            budget = dict(row)
            if budget.get("categories"):
                budget["categories"] = json.loads(budget["categories"])
            return budget

    async def update_budget(self, budget_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update budget."""
        async with self.acquire() as conn:
            categories_json = json.dumps(data.get("categories")) if "categories" in data else None
            row = await conn.fetchrow(
                """
                UPDATE budgets
                SET
                    name = COALESCE($2, name),
                    budget_type = COALESCE($3, budget_type),
                    amount = COALESCE($4, amount),
                    start_date = COALESCE($5, start_date),
                    end_date = COALESCE($6, end_date),
                    categories = COALESCE($7, categories),
                    notes = COALESCE($8, notes),
                    is_active = COALESCE($9, is_active),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """,
                budget_id,
                data.get("name"),
                data.get("budget_type"),
                data.get("amount"),
                data.get("start_date"),
                data.get("end_date"),
                categories_json,
                data.get("notes"),
                data.get("is_active"),
            )
            if row:
                budget = dict(row)
                if budget.get("categories"):
                    budget["categories"] = json.loads(budget["categories"])
                return budget
            return None

    async def delete_budget(self, budget_id: int) -> bool:
        """Delete budget (cascade deletes entries)."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM budgets WHERE id = $1", budget_id)
            return result == "DELETE 1"

    # Budget Entry CRUD Operations

    async def get_budget_entries(self, budget_id: int) -> List[Dict[str, Any]]:
        """Get all entries for a budget."""
        async with self.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM budget_entries WHERE budget_id = $1 ORDER BY month DESC", budget_id)
            return [dict(row) for row in rows]

    async def get_budget_entry(self, budget_id: int, month: date) -> Optional[Dict[str, Any]]:
        """Get single budget entry by budget ID and month."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM budget_entries WHERE budget_id = $1 AND month = $2", budget_id, month
            )
            return dict(row) if row else None

    async def create_or_update_budget_entry(self, budget_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update budget entry (upsert)."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO budget_entries (budget_id, month, allocated_amount, notes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (budget_id, month)
                DO UPDATE SET
                    allocated_amount = EXCLUDED.allocated_amount,
                    notes = EXCLUDED.notes
                RETURNING *
            """,
                budget_id,
                data["month"],
                data["allocated_amount"],
                data.get("notes"),
            )
            return dict(row)

    async def delete_budget_entry(self, entry_id: int) -> bool:
        """Delete budget entry."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM budget_entries WHERE id = $1", entry_id)
            return result == "DELETE 1"


# Global database instance
postgres_db = PostgresDatabase()
