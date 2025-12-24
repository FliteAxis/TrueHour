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
        """Get list of user aircraft with total flight hours."""
        async with self.acquire() as conn:
            if is_active is None:
                query = """
                    SELECT
                        a.id, a.tail_number, a.type_code, a.year, a.make, a.model,
                        a.gear_type, a.engine_type, a.aircraft_class, a.is_complex,
                        a.is_taa, a.is_high_performance, a.is_simulator, a.category,
                        a.hourly_rate_wet, a.hourly_rate_dry, a.notes, a.is_active,
                        a.created_at, a.updated_at, a.fuel_price_per_gallon, a.fuel_burn_rate,
                        a.data_source, a.faa_last_checked,
                        CAST(COALESCE(
                            SUM(CASE WHEN a.is_simulator THEN f.simulated_flight_time ELSE f.total_time END),
                            0
                        ) AS NUMERIC(10,2)) as total_time
                    FROM aircraft a
                    LEFT JOIN flights f ON f.aircraft_id = a.id
                    GROUP BY a.id
                    ORDER BY a.tail_number
                """
                rows = await conn.fetch(query)
            else:
                query = """
                    SELECT
                        a.id, a.tail_number, a.type_code, a.year, a.make, a.model,
                        a.gear_type, a.engine_type, a.aircraft_class, a.is_complex,
                        a.is_taa, a.is_high_performance, a.is_simulator, a.category,
                        a.hourly_rate_wet, a.hourly_rate_dry, a.notes, a.is_active,
                        a.created_at, a.updated_at, a.fuel_price_per_gallon, a.fuel_burn_rate,
                        a.data_source, a.faa_last_checked,
                        CAST(COALESCE(
                            SUM(CASE WHEN a.is_simulator THEN f.simulated_flight_time ELSE f.total_time END),
                            0
                        ) AS NUMERIC(10,2)) as total_time
                    FROM aircraft a
                    LEFT JOIN flights f ON f.aircraft_id = a.id
                    WHERE a.is_active = $1
                    GROUP BY a.id
                    ORDER BY a.tail_number
                """
                rows = await conn.fetch(query, is_active)
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
            query = """
                SELECT
                    e.id, e.aircraft_id, e.category, e.subcategory, e.description,
                    e.amount, e.date, e.is_recurring, e.recurrence_interval,
                    e.recurrence_end_date, e.vendor, e.is_tax_deductible, e.tax_category,
                    e.created_at, e.updated_at,
                    ebl.budget_card_id
                FROM expenses e
                LEFT JOIN expense_budget_links ebl ON e.id = ebl.expense_id
                WHERE 1=1
            """
            params = []
            param_count = 0

            if aircraft_id is not None:
                param_count += 1
                query += f" AND e.aircraft_id = ${param_count}"
                params.append(aircraft_id)

            if category:
                param_count += 1
                query += f" AND e.category = ${param_count}"
                params.append(category)

            if start_date:
                param_count += 1
                query += f" AND e.date >= ${param_count}"
                params.append(start_date)

            if end_date:
                param_count += 1
                query += f" AND e.date <= ${param_count}"
                params.append(end_date)

            query += " ORDER BY e.date DESC"

            param_count += 1
            query += f" LIMIT ${param_count}"
            params.append(limit)

            param_count += 1
            query += f" OFFSET ${param_count}"
            params.append(offset)

            rows = await conn.fetch(query, *params)
            result = [dict(row) for row in rows]
            if result:
                print(f"[DEBUG] get_expenses returning {len(result)} expenses")
                print(f"[DEBUG] First expense keys: {list(result[0].keys())}")
                print(f"[DEBUG] First expense budget_card_id: {result[0].get('budget_card_id')}")
            return result

    async def get_expense_by_id(self, expense_id: int) -> Optional[Dict[str, Any]]:
        """Get single expense by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    e.id, e.aircraft_id, e.category, e.subcategory, e.description,
                    e.amount, e.date, e.is_recurring, e.recurrence_interval,
                    e.recurrence_end_date, e.vendor, e.is_tax_deductible, e.tax_category,
                    e.created_at, e.updated_at,
                    ebl.budget_card_id
                FROM expenses e
                LEFT JOIN expense_budget_links ebl ON e.id = ebl.expense_id
                WHERE e.id = $1
                """,
                expense_id,
            )
            return dict(row) if row else None

    async def create_expense(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new expense."""
        async with self.acquire() as conn:
            # Extract budget_card_id for separate handling
            budget_card_id = data.get("budget_card_id")

            # Insert expense without budget_card_id
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

            expense = dict(row)

            # If budget_card_id provided, create link
            if budget_card_id:
                await conn.execute(
                    """
                    INSERT INTO expense_budget_links (expense_id, budget_card_id, amount)
                    VALUES ($1, $2, $3)
                    """,
                    expense["id"],
                    budget_card_id,
                    expense["amount"],
                )
                expense["budget_card_id"] = budget_card_id

            return expense

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
            query = """
                SELECT *
                FROM flights
                WHERE 1=1
            """
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
                # Handle NULL integer fields with defaults
                for field in [
                    "day_takeoffs",
                    "day_landings_full_stop",
                    "night_takeoffs",
                    "night_landings_full_stop",
                    "all_landings",
                    "holds",
                ]:
                    if flight.get(field) is None:
                        flight[field] = 0
                # Handle NULL boolean fields with defaults
                for field in ["is_flight_review", "is_ipc", "is_checkride", "is_simulator_session"]:
                    if flight.get(field) is None:
                        flight[field] = False
                result.append(flight)
            return result

    async def get_flight_by_id(self, flight_id: int) -> Optional[Dict[str, Any]]:
        """Get single flight by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT *
                FROM flights
                WHERE id = $1
            """,
                flight_id,
            )
            if row:
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
                # Handle NULL integer fields with defaults
                for field in [
                    "day_takeoffs",
                    "day_landings_full_stop",
                    "night_takeoffs",
                    "night_landings_full_stop",
                    "all_landings",
                    "holds",
                ]:
                    if flight.get(field) is None:
                        flight[field] = 0
                # Handle NULL boolean fields with defaults
                for field in ["is_flight_review", "is_ipc", "is_checkride", "is_simulator_session"]:
                    if flight.get(field) is None:
                        flight[field] = False
                return flight
            return None

    async def create_flight(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new flight."""
        async with self.acquire() as conn:
            # Convert approaches dict to JSON if present
            approaches_json = json.dumps(data.get("approaches")) if data.get("approaches") else None

            row = await conn.fetchrow(
                """
                INSERT INTO flights (
                    aircraft_id, date, departure_airport, arrival_airport, route,
                    time_out, time_off, time_on, time_in,
                    total_time, pic_time, sic_time, night_time, solo_time,
                    cross_country_time, actual_instrument_time, simulated_instrument_time,
                    simulated_flight_time, dual_given_time, dual_received_time,
                    ground_training_time, complex_time, high_performance_time,
                    hobbs_start, hobbs_end, tach_start, tach_end,
                    day_takeoffs, day_landings_full_stop,
                    night_takeoffs, night_landings_full_stop, all_landings,
                    holds, approaches, instructor_name, instructor_comments, pilot_comments,
                    is_flight_review, is_ipc, is_checkride, is_simulator_session,
                    fuel_gallons, fuel_cost, landing_fees, instructor_cost, rental_cost, other_costs
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                    $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                    $41, $42, $43, $44, $45, $46, $47
                )
                RETURNING *
                """,
                data.get("aircraft_id"),
                data.get("date"),
                data.get("departure_airport"),
                data.get("arrival_airport"),
                data.get("route"),
                data.get("time_out"),
                data.get("time_off"),
                data.get("time_on"),
                data.get("time_in"),
                data.get("total_time"),
                data.get("pic_time"),
                data.get("sic_time"),
                data.get("night_time"),
                data.get("solo_time"),
                data.get("cross_country_time"),
                data.get("actual_instrument_time"),
                data.get("simulated_instrument_time"),
                data.get("simulated_flight_time"),
                data.get("dual_given_time"),
                data.get("dual_received_time"),
                data.get("ground_training_time"),
                data.get("complex_time"),
                data.get("high_performance_time"),
                data.get("hobbs_start"),
                data.get("hobbs_end"),
                data.get("tach_start"),
                data.get("tach_end"),
                data.get("day_takeoffs", 0),
                data.get("day_landings_full_stop", 0),
                data.get("night_takeoffs", 0),
                data.get("night_landings_full_stop", 0),
                data.get("all_landings", 0),
                data.get("holds", 0),
                approaches_json,
                data.get("instructor_name"),
                data.get("instructor_comments"),
                data.get("pilot_comments"),
                data.get("is_flight_review", False),
                data.get("is_ipc", False),
                data.get("is_checkride", False),
                data.get("is_simulator_session", False),
                data.get("fuel_gallons"),
                data.get("fuel_cost"),
                data.get("landing_fees"),
                data.get("instructor_cost"),
                data.get("rental_cost"),
                data.get("other_costs"),
            )
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
            return flight

    async def update_flight(self, flight_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update flight."""
        async with self.acquire() as conn:
            # Build dynamic UPDATE query
            set_clauses = []
            params = []
            param_count = 0

            # Convert approaches dict to JSON if present
            if "approaches" in data and data["approaches"] is not None:
                data["approaches"] = json.dumps(data["approaches"])

            for key, value in data.items():
                param_count += 1
                set_clauses.append(f"{key} = ${param_count}")
                params.append(value)

            if not set_clauses:
                return await self.get_flight_by_id(flight_id)

            param_count += 1
            query = f"""
                UPDATE flights
                SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE id = ${param_count}
                RETURNING *
            """
            params.append(flight_id)

            row = await conn.fetchrow(query, *params)
            if row:
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
                return flight
            return None

    async def delete_flight(self, flight_id: int) -> bool:
        """Delete flight."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM flights WHERE id = $1", flight_id)
            return result == "DELETE 1"

    async def get_flight_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get flight summary statistics."""
        async with self.acquire() as conn:
            query = """
                SELECT
                    COUNT(*) as total_flights,
                    COALESCE(SUM(total_time), 0) as total_hours,
                    COALESCE(SUM(pic_time), 0) as pic_hours,
                    COALESCE(SUM(sic_time), 0) as sic_hours,
                    COALESCE(SUM(night_time), 0) as night_hours,
                    COALESCE(SUM(cross_country_time), 0) as cross_country_hours,
                    COALESCE(SUM(actual_instrument_time), 0) as actual_instrument_hours,
                    COALESCE(SUM(simulated_instrument_time), 0) as simulated_instrument_hours,
                    COALESCE(SUM(simulated_flight_time), 0) as simulator_hours,
                    COALESCE(SUM(dual_received_time), 0) as dual_received_hours,
                    COALESCE(SUM(dual_given_time), 0) as dual_given_hours,
                    COALESCE(SUM(complex_time), 0) as complex_hours,
                    COALESCE(SUM(high_performance_time), 0) as high_performance_hours,
                    COALESCE(SUM(all_landings), 0) as total_landings,
                    COALESCE(SUM(night_landings_full_stop), 0) as night_landings
                FROM flights
                WHERE 1=1
            """
            params = []

            if start_date:
                params.append(start_date)
                query += f" AND date >= ${len(params)}"

            if end_date:
                params.append(end_date)
                query += f" AND date <= ${len(params)}"

            row = await conn.fetchrow(query, *params)
            return dict(row) if row else {}

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

    # Budget Card Operations

    async def get_budget_cards(
        self, status: Optional[str] = None, category: Optional[str] = None, month: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get list of budget cards with optional filtering."""
        async with self.acquire() as conn:
            query = """
                SELECT
                    bc.*,
                    COALESCE(SUM(ebl.amount), 0) as actual_amount,
                    bc.budgeted_amount - COALESCE(SUM(ebl.amount), 0) as remaining_amount
                FROM budget_cards bc
                LEFT JOIN expense_budget_links ebl ON bc.id = ebl.budget_card_id
                WHERE 1=1
            """
            params = []
            param_count = 1

            if status:
                query += f" AND bc.status = ${param_count}"
                params.append(status)
                param_count += 1

            if category:
                query += f" AND bc.category = ${param_count}"
                params.append(category)
                param_count += 1

            if month:
                query += f" AND DATE_TRUNC('month', bc.when_date) = DATE_TRUNC('month', ${param_count}::date)"
                params.append(month)
                param_count += 1

            query += " GROUP BY bc.id ORDER BY bc.when_date DESC, bc.id"

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_budget_card(self, card_id: int) -> Optional[Dict[str, Any]]:
        """Get single budget card by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    bc.*,
                    COALESCE(SUM(ebl.amount), 0) as actual_amount,
                    bc.budgeted_amount - COALESCE(SUM(ebl.amount), 0) as remaining_amount
                FROM budget_cards bc
                LEFT JOIN expense_budget_links ebl ON bc.id = ebl.budget_card_id
                WHERE bc.id = $1
                GROUP BY bc.id
            """,
                card_id,
            )
            return dict(row) if row else None

    async def create_budget_card(self, data: Dict[str, Any]) -> int:
        """Create new budget card and return its ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO budget_cards (
                    name, category, frequency, when_date, budgeted_amount,
                    notes, associated_hours, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """,
                data["name"],
                data["category"],
                data["frequency"],
                data["when_date"],
                data["budgeted_amount"],
                data.get("notes"),
                data.get("associated_hours"),
                data.get("status", "active"),
            )
            return row["id"]

    async def update_budget_card(self, card_id: int, data: Dict[str, Any]) -> bool:
        """Update budget card."""
        if not data:
            return False

        async with self.acquire() as conn:
            # Build dynamic UPDATE query
            set_clauses = []
            params = []
            param_count = 1

            for field in [
                "name",
                "category",
                "frequency",
                "when_date",
                "budgeted_amount",
                "notes",
                "associated_hours",
                "status",
            ]:
                if field in data:
                    set_clauses.append(f"{field} = ${param_count}")
                    params.append(data[field])
                    param_count += 1

            if not set_clauses:
                return False

            set_clauses.append("updated_at = NOW()")
            params.append(card_id)

            query = f"""
                UPDATE budget_cards
                SET {", ".join(set_clauses)}
                WHERE id = ${param_count}
            """

            result = await conn.execute(query, *params)
            return result == "UPDATE 1"

    async def delete_budget_card(self, card_id: int) -> bool:
        """Delete budget card."""
        async with self.acquire() as conn:
            result = await conn.execute("DELETE FROM budget_cards WHERE id = $1", card_id)
            return result == "DELETE 1"

    async def get_monthly_budget_summary(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get monthly budget summary."""
        async with self.acquire() as conn:
            query = """
                SELECT
                    DATE_TRUNC('month', bc.when_date)::date as month,
                    SUM(bc.budgeted_amount) as total_budgeted,
                    SUM(COALESCE(ebl_sum.actual, 0)) as total_actual,
                    SUM(bc.budgeted_amount - COALESCE(ebl_sum.actual, 0)) as total_remaining
                FROM budget_cards bc
                LEFT JOIN (
                    SELECT budget_card_id, SUM(amount) as actual
                    FROM expense_budget_links
                    GROUP BY budget_card_id
                ) ebl_sum ON bc.id = ebl_sum.budget_card_id
                WHERE bc.status = 'active'
            """
            params = []
            if year:
                query += " AND EXTRACT(YEAR FROM bc.when_date) = $1"
                params.append(year)

            query += " GROUP BY DATE_TRUNC('month', bc.when_date) ORDER BY month"

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_category_budget_summary(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get budget summary by category."""
        async with self.acquire() as conn:
            query = """
                SELECT
                    bc.category,
                    SUM(bc.budgeted_amount) as total_budgeted,
                    SUM(COALESCE(ebl_sum.actual, 0)) as total_actual,
                    SUM(bc.budgeted_amount - COALESCE(ebl_sum.actual, 0)) as total_remaining,
                    COUNT(bc.id) as card_count
                FROM budget_cards bc
                LEFT JOIN (
                    SELECT budget_card_id, SUM(amount) as actual
                    FROM expense_budget_links
                    GROUP BY budget_card_id
                ) ebl_sum ON bc.id = ebl_sum.budget_card_id
                WHERE bc.status = 'active'
            """
            params = []
            if year:
                query += " AND EXTRACT(YEAR FROM bc.when_date) = $1"
                params.append(year)

            query += " GROUP BY bc.category ORDER BY total_budgeted DESC"

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_annual_budget_summary(self, year: int) -> Dict[str, Any]:
        """Get complete annual budget summary."""
        monthly = await self.get_monthly_budget_summary(year)
        by_category = await self.get_category_budget_summary(year)

        total_budgeted = sum(m["total_budgeted"] for m in monthly)
        total_actual = sum(m["total_actual"] for m in monthly)

        # Get cards for each month
        for month_summary in monthly:
            cards = await self.get_budget_cards(month=month_summary["month"])
            month_summary["cards"] = cards

        return {
            "year": year,
            "total_budgeted": total_budgeted,
            "total_actual": total_actual,
            "total_remaining": total_budgeted - total_actual,
            "by_month": monthly,
            "by_category": by_category,
        }

    # Expense-Budget Card Links

    async def create_expense_budget_link(self, data: Dict[str, Any]) -> int:
        """Create expense-budget card link and return its ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO expense_budget_links (expense_id, budget_card_id, amount)
                VALUES ($1, $2, $3)
                RETURNING id
            """,
                data["expense_id"],
                data["budget_card_id"],
                data["amount"],
            )
            return row["id"]

    async def get_expense_budget_link(self, link_id: int) -> Optional[Dict[str, Any]]:
        """Get expense-budget link by ID."""
        async with self.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM expense_budget_links WHERE id = $1",
                link_id,
            )
            return dict(row) if row else None

    async def delete_expense_budget_link(self, expense_id: int, budget_card_id: int) -> bool:
        """Delete expense-budget card link."""
        async with self.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM expense_budget_links WHERE expense_id = $1 AND budget_card_id = $2",
                expense_id,
                budget_card_id,
            )
            return result == "DELETE 1"


# Global database instance
postgres_db = PostgresDatabase()
