"""PostgreSQL database operations for user data."""
import os
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import asyncpg
from datetime import datetime, date
from decimal import Decimal


class PostgresDatabase:
    """Async PostgreSQL database connection pool manager."""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://truehour:truehour@db:5432/truehour"
        )

    async def connect(self):
        """Create connection pool."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )

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
                rows = await conn.fetch(
                    "SELECT * FROM aircraft ORDER BY tail_number"
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM aircraft WHERE is_active = $1 ORDER BY tail_number",
                    is_active
                )
            return [dict(row) for row in rows]

    async def get_aircraft_by_id(self, aircraft_id: int) -> Optional[Dict[str, Any]]:
        """Get single aircraft by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM aircraft WHERE id = $1",
                aircraft_id
            )
            return dict(row) if row else None

    async def get_aircraft_by_tail(self, tail_number: str) -> Optional[Dict[str, Any]]:
        """Get aircraft by tail number."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM aircraft WHERE tail_number = $1",
                tail_number.upper()
            )
            return dict(row) if row else None

    async def create_aircraft(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new aircraft."""
        data['tail_number'] = data['tail_number'].upper()

        async with self.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO aircraft (
                    tail_number, type_code, year, make, model, gear_type, engine_type,
                    aircraft_class, is_complex, is_taa, is_high_performance, is_simulator,
                    category, hourly_rate_wet, hourly_rate_dry, notes, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            """,
                data.get('tail_number'),
                data.get('type_code'),
                data.get('year'),
                data.get('make'),
                data.get('model'),
                data.get('gear_type'),
                data.get('engine_type'),
                data.get('aircraft_class'),
                data.get('is_complex', False),
                data.get('is_taa', False),
                data.get('is_high_performance', False),
                data.get('is_simulator', False),
                data.get('category'),
                data.get('hourly_rate_wet'),
                data.get('hourly_rate_dry'),
                data.get('notes'),
                data.get('is_active', True)
            )
            return dict(row)

    async def update_aircraft(self, aircraft_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update aircraft."""
        if 'tail_number' in data:
            data['tail_number'] = data['tail_number'].upper()

        async with self.acquire() as conn:
            row = await conn.fetchrow("""
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
                data.get('tail_number'),
                data.get('type_code'),
                data.get('year'),
                data.get('make'),
                data.get('model'),
                data.get('gear_type'),
                data.get('engine_type'),
                data.get('aircraft_class'),
                data.get('is_complex'),
                data.get('is_taa'),
                data.get('is_high_performance'),
                data.get('is_simulator'),
                data.get('category'),
                data.get('hourly_rate_wet'),
                data.get('hourly_rate_dry'),
                data.get('notes'),
                data.get('is_active')
            )
            return dict(row) if row else None

    async def delete_aircraft(self, aircraft_id: int) -> bool:
        """Delete aircraft."""
        async with self.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM aircraft WHERE id = $1",
                aircraft_id
            )
            return result == "DELETE 1"

    # Expense CRUD Operations

    async def get_expenses(
        self,
        aircraft_id: Optional[int] = None,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
        offset: int = 0
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
            row = await conn.fetchrow(
                "SELECT * FROM expenses WHERE id = $1",
                expense_id
            )
            return dict(row) if row else None

    async def create_expense(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new expense."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO expenses (
                    aircraft_id, category, subcategory, description, amount, date,
                    is_recurring, recurrence_interval, recurrence_end_date,
                    vendor, is_tax_deductible, tax_category
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            """,
                data.get('aircraft_id'),
                data['category'],
                data.get('subcategory'),
                data.get('description'),
                data['amount'],
                data['date'],
                data.get('is_recurring', False),
                data.get('recurrence_interval'),
                data.get('recurrence_end_date'),
                data.get('vendor'),
                data.get('is_tax_deductible', False),
                data.get('tax_category')
            )
            return dict(row)

    async def update_expense(self, expense_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update expense."""
        async with self.acquire() as conn:
            row = await conn.fetchrow("""
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
                data.get('aircraft_id'),
                data.get('category'),
                data.get('subcategory'),
                data.get('description'),
                data.get('amount'),
                data.get('date'),
                data.get('is_recurring'),
                data.get('recurrence_interval'),
                data.get('recurrence_end_date'),
                data.get('vendor'),
                data.get('is_tax_deductible'),
                data.get('tax_category')
            )
            return dict(row) if row else None

    async def delete_expense(self, expense_id: int) -> bool:
        """Delete expense."""
        async with self.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM expenses WHERE id = $1",
                expense_id
            )
            return result == "DELETE 1"

    async def get_expense_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        group_by: str = "category"
    ) -> List[Dict[str, Any]]:
        """Get expense summary grouped by category or subcategory."""
        async with self.acquire() as conn:
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
            """
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


# Global database instance
postgres_db = PostgresDatabase()
