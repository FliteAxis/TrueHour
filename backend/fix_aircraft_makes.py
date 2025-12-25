#!/usr/bin/env python3
"""
One-time script to normalize aircraft manufacturer names in the database.

This script:
1. Replaces "AICSA" with "Piper"
2. Removes " Aircraft" suffix from manufacturer names

Run with: python3 backend/fix_aircraft_makes.py
"""

import asyncio
import os

import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def normalize_make(make: str) -> str:
    """Normalize aircraft manufacturer name."""
    if not make:
        return make

    normalized = make.strip()

    # Replace AICSA with Piper
    if normalized.upper() == "AICSA":
        normalized = "Piper"

    # Remove common suffixes
    suffixes_to_remove = [" aircraft", " powermatic"]
    for suffix in suffixes_to_remove:
        if normalized.lower().endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()

    return normalized


async def normalize_model(model: str) -> str:
    """Normalize aircraft model name."""
    if not model:
        return model

    normalized = model.strip()

    # Remove "Powermatic" anywhere in the model name
    normalized = normalized.replace(" Powermatic", "").replace(" powermatic", "").replace(" POWERMATIC", "")

    # Clean up any double spaces
    while "  " in normalized:
        normalized = normalized.replace("  ", " ")

    return normalized.strip()


async def fix_aircraft_makes():
    """Update all aircraft makes and models in the database."""
    database_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(database_url)

    try:
        # Get all aircraft
        rows = await conn.fetch("SELECT id, make, model FROM aircraft")

        print(f"Found {len(rows)} aircraft")

        make_updates = 0
        model_updates = 0

        for row in rows:
            updates_needed = []

            # Check make
            if row["make"]:
                original_make = row["make"]
                normalized_make = await normalize_make(original_make)
                if original_make != normalized_make:
                    updates_needed.append(("make", original_make, normalized_make))
                    await conn.execute(
                        "UPDATE aircraft SET make = $1, updated_at = NOW() WHERE id = $2", normalized_make, row["id"]
                    )
                    make_updates += 1

            # Check model
            if row["model"]:
                original_model = row["model"]
                normalized_model = await normalize_model(original_model)
                if original_model != normalized_model:
                    updates_needed.append(("model", original_model, normalized_model))
                    await conn.execute(
                        "UPDATE aircraft SET model = $1, updated_at = NOW() WHERE id = $2", normalized_model, row["id"]
                    )
                    model_updates += 1

            # Print updates
            for field, orig, norm in updates_needed:
                print(f"  Aircraft {row['id']} {field}: '{orig}' → '{norm}'")

        print(f"\nUpdated {make_updates} manufacturer names and {model_updates} model names")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(fix_aircraft_makes())
