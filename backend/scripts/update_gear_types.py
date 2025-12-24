#!/usr/bin/env python3
"""
Update existing aircraft records with inferred gear types.

This script runs the gear inference logic on all aircraft in the database
and updates their gear_type, is_complex, and is_high_performance fields.
"""
import asyncio
import os
import sys

# Add parent directory to path so we can import app modules
# noqa: E402 (module level imports not at top of file - required for path setup)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.postgres_database import PostgresDatabase  # noqa: E402
from app.utils.gear_inference import infer_gear_type, should_be_complex, should_be_high_performance  # noqa: E402


async def update_aircraft_gear_types():
    """Update all aircraft with inferred gear types."""
    db = PostgresDatabase()
    await db.connect()

    try:
        async with db.acquire() as conn:
            # Get all aircraft with make/model
            aircraft_list = await conn.fetch(
                """
                SELECT id, tail_number, make, model, gear_type
                FROM aircraft
                WHERE make IS NOT NULL AND model IS NOT NULL
                ORDER BY id
                """
            )

            print(f"Found {len(aircraft_list)} aircraft to update")
            updated_count = 0

            for aircraft in aircraft_list:
                aircraft_id = aircraft["id"]
                tail = aircraft["tail_number"]
                make = aircraft["make"]
                model = aircraft["model"]
                current_gear = aircraft["gear_type"]

                # Infer gear type and characteristics
                inferred_gear = infer_gear_type(make, model)
                is_complex = should_be_complex(make, model, inferred_gear or current_gear)
                is_hp = should_be_high_performance(make, model)

                # Always update characteristics, update gear_type only if we have inference
                if inferred_gear:
                    await conn.execute(
                        """
                        UPDATE aircraft
                        SET gear_type = $1, is_complex = $2, is_high_performance = $3
                        WHERE id = $4
                        """,
                        inferred_gear,
                        is_complex,
                        is_hp,
                        aircraft_id,
                    )
                    print(f"✓ {tail} ({make} {model}): gear_type={inferred_gear}, complex={is_complex}, hp={is_hp}")
                    updated_count += 1
                elif current_gear:
                    # Update characteristics even if we can't infer gear type
                    await conn.execute(
                        """
                        UPDATE aircraft
                        SET is_complex = $1, is_high_performance = $2
                        WHERE id = $3
                        """,
                        is_complex,
                        is_hp,
                        aircraft_id,
                    )
                    print(
                        f"✓ {tail} ({make} {model}): gear_type={current_gear} (kept), complex={is_complex}, hp={is_hp}"
                    )
                    updated_count += 1
                else:
                    print(f"  {tail} ({make} {model}): Could not infer gear type")

            print(f"\nUpdated {updated_count} aircraft records")

    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(update_aircraft_gear_types())
