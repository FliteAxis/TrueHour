"""Expense-to-budget-card linking endpoints."""

from typing import List

from app.models import ExpenseBudgetLinkCreate, ExpenseBudgetLinkResponse
from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/expense-budget-links", tags=["Expense Budget Links"])


@router.post("", response_model=ExpenseBudgetLinkResponse, status_code=201)
async def create_expense_budget_link(link: ExpenseBudgetLinkCreate):
    """
    Link an expense to a budget card.

    Allows splitting expenses across multiple budget cards by creating
    multiple links with different amounts.
    """
    try:
        # Verify expense exists
        expense = await postgres_db.get_expense_by_id(link.expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail=f"Expense {link.expense_id} not found")

        # Verify budget card exists
        budget_card = await postgres_db.get_budget_card(link.budget_card_id)
        if not budget_card:
            raise HTTPException(status_code=404, detail=f"Budget card {link.budget_card_id} not found")

        # Validate amount doesn't exceed expense amount
        if link.amount > expense["amount"]:
            raise HTTPException(
                status_code=400,
                detail=f"Link amount ${link.amount} exceeds expense amount ${expense['amount']}",
            )

        # Create the link
        link_id = await postgres_db.create_expense_budget_link(link.model_dump())

        # Get the created link
        created_link = await postgres_db.get_expense_budget_link(link_id)
        if not created_link:
            raise HTTPException(status_code=500, detail="Failed to retrieve created link")

        return ExpenseBudgetLinkResponse(**created_link)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/expense/{expense_id}", response_model=List[ExpenseBudgetLinkResponse])
async def get_expense_links(expense_id: int):
    """Get all budget card links for a specific expense."""
    try:
        async with postgres_db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, expense_id, budget_card_id, amount, created_at
                FROM expense_budget_links
                WHERE expense_id = $1
                ORDER BY created_at DESC
                """,
                expense_id,
            )
            return [ExpenseBudgetLinkResponse(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/budget-card/{budget_card_id}", response_model=List[dict])
async def get_budget_card_expenses(budget_card_id: int):
    """
    Get all expenses linked to a specific budget card.

    Returns expense details with link information.
    """
    try:
        async with postgres_db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    e.id as expense_id,
                    e.category,
                    e.subcategory,
                    e.description,
                    e.amount as expense_amount,
                    e.date as expense_date,
                    e.vendor,
                    ebl.id as link_id,
                    ebl.amount as linked_amount,
                    ebl.created_at as linked_at
                FROM expense_budget_links ebl
                JOIN expenses e ON e.id = ebl.expense_id
                WHERE ebl.budget_card_id = $1
                ORDER BY e.date DESC
                """,
                budget_card_id,
            )
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{link_id}", status_code=204)
async def delete_expense_budget_link(link_id: int):
    """
    Remove a link between an expense and budget card.

    This does NOT delete the expense itself, only the link.
    """
    try:
        # Get the link to verify it exists
        link = await postgres_db.get_expense_budget_link(link_id)
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")

        # Delete using the expense_id and budget_card_id
        success = await postgres_db.delete_expense_budget_link(link["expense_id"], link["budget_card_id"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete link")

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
