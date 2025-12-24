"""Database migrations and schema verification.

This module ensures the database schema is always up-to-date by checking
for missing tables, columns, and indexes on startup.
"""

import logging
from typing import List

logger = logging.getLogger(__name__)


async def verify_and_migrate_schema(db) -> List[str]:
    """
    Verify database schema and apply any missing migrations.

    Returns a list of migration messages that were applied.
    """
    migrations_applied = []

    async with db.acquire() as conn:
        # Check if expense_budget_links table exists
        result = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'expense_budget_links'
            )
            """
        )

        if not result:
            logger.warning("expense_budget_links table missing - creating it")
            await conn.execute(
                """
                CREATE TABLE expense_budget_links (
                    id SERIAL PRIMARY KEY,
                    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
                    budget_card_id INTEGER REFERENCES budget_cards(id) ON DELETE CASCADE,
                    amount DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(expense_id, budget_card_id)
                );

                CREATE INDEX idx_expense_budget_links_expense ON expense_budget_links(expense_id);
                CREATE INDEX idx_expense_budget_links_budget_card ON expense_budget_links(budget_card_id);

                COMMENT ON TABLE expense_budget_links IS
                    'Links expenses to budget cards for tracking actual spending against budgets';
                """
            )
            migrations_applied.append("Created expense_budget_links table with indexes")

        # Check if flights.tail_number column exists
        result = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'flights'
                AND column_name = 'tail_number'
            )
            """
        )

        if not result:
            logger.warning("flights.tail_number column missing - adding it")
            await conn.execute(
                """
                ALTER TABLE flights ADD COLUMN tail_number VARCHAR(20);
                COMMENT ON COLUMN flights.tail_number IS 'Tail number stored directly from CSV for simulator sessions';
                """
            )
            migrations_applied.append("Added tail_number column to flights table")

        # Check if aircraft fuel columns exist
        fuel_price_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'aircraft'
                AND column_name = 'fuel_price_per_gallon'
            )
            """
        )

        fuel_burn_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'aircraft'
                AND column_name = 'fuel_burn_rate'
            )
            """
        )

        if not fuel_price_exists or not fuel_burn_exists:
            logger.warning("aircraft fuel columns missing - adding them")
            if not fuel_price_exists:
                await conn.execute("ALTER TABLE aircraft ADD COLUMN fuel_price_per_gallon NUMERIC(10,2);")
            if not fuel_burn_exists:
                await conn.execute("ALTER TABLE aircraft ADD COLUMN fuel_burn_rate NUMERIC(10,2);")
            migrations_applied.append("Added fuel_price_per_gallon and fuel_burn_rate columns to aircraft table")

        # Verify critical indexes exist
        indexes_to_check = [
            (
                "idx_expense_budget_links_expense",
                "expense_budget_links",
                "CREATE INDEX idx_expense_budget_links_expense ON expense_budget_links(expense_id)",
            ),
            (
                "idx_expense_budget_links_budget_card",
                "expense_budget_links",
                "CREATE INDEX idx_expense_budget_links_budget_card ON expense_budget_links(budget_card_id)",
            ),
            (
                "idx_budget_cards_when_date",
                "budget_cards",
                "CREATE INDEX idx_budget_cards_when_date ON budget_cards(when_date DESC)",
            ),
            (
                "idx_budget_cards_category",
                "budget_cards",
                "CREATE INDEX idx_budget_cards_category ON budget_cards(category)",
            ),
        ]

        for index_name, table_name, create_sql in indexes_to_check:
            result = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM pg_indexes
                    WHERE schemaname = 'public'
                    AND tablename = $1
                    AND indexname = $2
                )
                """,
                table_name,
                index_name,
            )

            if not result:
                logger.warning(f"Index {index_name} missing - creating it")
                await conn.execute(create_sql)
                migrations_applied.append(f"Created index {index_name} on {table_name}")

        # Check if aircraft.data_source column exists
        data_source_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'aircraft'
                AND column_name = 'data_source'
            )
            """
        )

        if not data_source_exists:
            logger.warning("aircraft.data_source column missing - adding it")
            await conn.execute(
                """
                ALTER TABLE aircraft
                ADD COLUMN data_source VARCHAR(20) DEFAULT 'manual';

                ALTER TABLE aircraft
                ADD COLUMN faa_last_checked TIMESTAMPTZ;

                COMMENT ON COLUMN aircraft.data_source IS
                    'Source of aircraft data: faa, foreflight, or manual';
                COMMENT ON COLUMN aircraft.faa_last_checked IS
                    'Last time FAA data was checked/refreshed';
                """
            )
            migrations_applied.append("Added data_source and faa_last_checked columns to aircraft")

        # Check if user_settings.enable_faa_lookup column exists
        enable_faa_lookup_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'user_settings'
                AND column_name = 'enable_faa_lookup'
            )
            """
        )

        if not enable_faa_lookup_exists:
            logger.warning("user_settings.enable_faa_lookup column missing - adding it")
            await conn.execute(
                """
                ALTER TABLE user_settings
                ADD COLUMN enable_faa_lookup BOOLEAN DEFAULT true;

                COMMENT ON COLUMN user_settings.enable_faa_lookup IS
                    'Enable/disable FAA aircraft lookup during imports. '
                    'If disabled, only ForeFlight data will be used.';
                """
            )
            migrations_applied.append("Added enable_faa_lookup column to user_settings")

    if migrations_applied:
        logger.info(f"Applied {len(migrations_applied)} migrations:")
        for msg in migrations_applied:
            logger.info(f"  - {msg}")
    else:
        logger.info("Database schema is up-to-date")

    return migrations_applied


async def get_schema_status(db) -> dict:
    """
    Get the current status of the database schema.

    Returns a dict with table counts, column checks, and index status.
    """
    status = {
        "tables": {},
        "missing_columns": [],
        "missing_indexes": [],
    }

    async with db.acquire() as conn:
        # Check table counts
        tables_to_check = [
            "aircraft",
            "flights",
            "expenses",
            "budget_cards",
            "expense_budget_links",
            "budgets",
            "reminders",
        ]

        for table in tables_to_check:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            status["tables"][table] = count

        # Check for missing columns
        columns_to_check = [
            ("flights", "tail_number"),
            ("aircraft", "fuel_price_per_gallon"),
            ("aircraft", "fuel_burn_rate"),
        ]

        for table, column in columns_to_check:
            exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = $1
                    AND column_name = $2
                )
                """,
                table,
                column,
            )
            if not exists:
                status["missing_columns"].append(f"{table}.{column}")

        # Check for missing indexes
        indexes_to_check = [
            "idx_expense_budget_links_expense",
            "idx_expense_budget_links_budget_card",
            "idx_budget_cards_when_date",
            "idx_budget_cards_category",
        ]

        for index_name in indexes_to_check:
            exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM pg_indexes
                    WHERE schemaname = 'public'
                    AND indexname = $1
                )
                """,
                index_name,
            )
            if not exists:
                status["missing_indexes"].append(index_name)

    return status


async def get_detailed_schema_status(db) -> dict:
    """
    Get detailed status of database schema.

    Returns a dictionary with information about missing tables, columns, and indexes.
    """
    status = {"missing_tables": [], "missing_columns": [], "missing_indexes": []}

    async with db.acquire() as conn:
        # Check critical tables
        tables_to_check = [
            "flights",
            "user_aircraft",
            "expenses",
            "budget_cards",
            "expense_budget_links",
            "import_history",
            "user_settings",
            "user_sessions",
        ]

        for table_name in tables_to_check:
            exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                )
                """,
                table_name,
            )
            if not exists:
                status["missing_tables"].append(table_name)

        # Check critical indexes
        indexes_to_check = [
            "idx_expense_budget_links_expense",
            "idx_expense_budget_links_budget_card",
        ]

        for index_name in indexes_to_check:
            exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM pg_indexes
                    WHERE schemaname = 'public'
                    AND indexname = $1
                )
                """,
                index_name,
            )
            if not exists:
                status["missing_indexes"].append(index_name)

    return status
