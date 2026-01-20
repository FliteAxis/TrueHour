# Expense Tracking (Phase 4)

**Status:** ✅ Complete and Ready for Production Use
**Date Implemented:** December 14, 2025

---

## Overview

TrueHour's expense tracking system allows you to record aviation expenses and link them to budget cards. This enables you to answer questions
like "What did I spend this month?" and "Am I on track with my budget?"

## Quick Start

### 1. Add Your First Expense

1. Navigate to **Section 3: Expense Tracking**
2. Click **"Add Expense"**
3. Fill out the form:
   - **Category:** Fuel, Instructor, Rental, Insurance, etc.
   - **Amount:** Dollar amount
   - **Date:** When the expense occurred
   - **Description:** Optional details
   - **Vendor:** Optional (e.g., "Blue Sky Flight Club")
4. Click **"Save Expense"**

### 2. Link Expense to Budget Card

1. Find your expense in the list
2. Click the **🔗** (link) icon
3. Select a budget card from the dropdown
4. Enter amount to link (defaults to full expense amount)
5. Click **"Link to Budget Card"**

The budget card's **Actual** amount updates immediately!

### 3. Check Budget Status

Navigate to **Section 4: Budget Tracking** to see:
- **Budgeted:** Your planned amount
- **Actual:** Total of linked expenses
- **Remaining:** What's left
- **Progress bar:** Visual % used

---

## Features

### Expense Management
- ✅ Add, edit, delete expenses
- ✅ 9 expense categories (Fuel, Instructor, Rental, Insurance, Maintenance, Subscription, Membership, Supplies, Other)
- ✅ Recurring expense support (monthly, quarterly, annual)
- ✅ Tax deductible flag
- ✅ Vendor tracking
- ✅ Subcategory support

### Budget Card Linking
- ✅ Link one expense to multiple budget cards (expense splitting)
- ✅ Visual linking modal showing existing links
- ✅ Remaining unlinked amount tracking
- ✅ Prevents over-linking (can't exceed expense amount)
- ✅ Real-time budget updates

### Display & Filtering
- ✅ Group by month with totals
- ✅ Color-coded category badges
- ✅ Filter by month
- ✅ Filter by category
- ✅ Summary statistics (count, total, average)
- ✅ Responsive design

---

## Use Cases

### After a Flight

**Track Rental + Instructor:**
```
1. Add expense: "Rental N12345" - $225 (1.5 hours @ $150/hr)
2. Link to "Training" budget card
3. Add expense: "CFI lesson" - $90 (1.5 hours @ $60/hr)
4. Link to "Training" budget card
```

Your Training budget card now shows $315 actual spending.

### Fixed Monthly Costs

**Track Club Membership:**
```
1. Add expense: "Blue Sky Flight Club" - $250
2. Check "Recurring" → Select "Monthly"
3. Link to "Administrative" budget card
```

### Splitting Expenses

**Flight with Mixed Purpose:**
```
1. Add expense: "Family flight + training" - $300
2. Link $200 to "Training" budget
3. Link $100 to "Family" budget
```

Both budgets update proportionally.

---

## API Endpoints

### Expense CRUD

```http
GET    /api/expenses              # List all expenses
GET    /api/expenses/{id}         # Get single expense
POST   /api/expenses              # Create expense
PUT    /api/expenses/{id}         # Update expense
DELETE /api/expenses/{id}         # Delete expense
GET    /api/expenses/summary      # Get expense summary
```

### Expense-Budget Linking

```http
POST   /api/expense-budget-links                 # Create link
GET    /api/expense-budget-links/expense/{id}    # Get links for expense
GET    /api/expense-budget-links/budget-card/{id} # Get expenses for budget
DELETE /api/expense-budget-links/{id}            # Remove link
```

See [API Documentation](API-Documentation.md) for full details.

---

## Database Schema

### expenses table
```sql
id                  SERIAL PRIMARY KEY
aircraft_id         INT (nullable, FK to aircraft)
category            TEXT NOT NULL
subcategory         TEXT
description         TEXT
amount              DECIMAL(10,2) NOT NULL
date                DATE NOT NULL
is_recurring        BOOLEAN DEFAULT FALSE
recurrence_interval TEXT (monthly, quarterly, annual)
recurrence_end_date DATE
vendor              TEXT
is_tax_deductible   BOOLEAN DEFAULT FALSE
tax_category        TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### expense_budget_links table
```sql
id              SERIAL PRIMARY KEY
expense_id      INT NOT NULL (FK to expenses)
budget_card_id  INT NOT NULL (FK to budget_cards)
amount          DECIMAL(10,2) NOT NULL
created_at      TIMESTAMP

UNIQUE (expense_id, budget_card_id)
```

---

## Data Flow

### Creating an Expense

```
User fills form → ExpenseManager.saveExpense()
    ↓
POST /api/expenses
    ↓
postgres_db.create_expense()
    ↓
INSERT INTO expenses
    ↓
Returns created expense
    ↓
Reload expense list
    ↓
Trigger auto-save
```

### Linking Expense to Budget

```
User clicks 🔗 → ExpenseManager.linkToBudget()
    ↓
GET /api/expense-budget-links/expense/{id}
    ↓
Show modal with budget card selector
    ↓
POST /api/expense-budget-links
    ↓
Validates: expense exists, budget exists, amount ≤ expense amount
    ↓
INSERT INTO expense_budget_links
    ↓
Budget card query recalculates actual_amount:
  SELECT bc.*, COALESCE(SUM(ebl.amount), 0) as actual_amount
  FROM budget_cards bc
  LEFT JOIN expense_budget_links ebl ON bc.id = ebl.budget_card_id
    ↓
Reload budget cards (actual_amount updated)
```

---

## Frontend Components

### ExpenseManager (expenses.js)

**Main Functions:**
- `init()` - Initialize and load data
- `loadExpenses()` - Fetch from API
- `renderExpenses()` - Display with month grouping
- `showCreateModal()` - Open expense form
- `saveExpense()` - Create/update expense
- `deleteExpense()` - Remove expense
- `linkToBudget()` - Open budget link modal
- `saveBudgetLink()` - Create expense-budget link
- `applyFilters()` - Filter by month/category

**Integration:**
- Auto-reloads budget cards after changes
- Triggers UserDataManager.triggerAutoSave()
- Updates summary statistics

---

## Troubleshooting

### "I don't see my expense"
- Check month filter (might be filtering it out)
- Check category filter
- Try "All Months" + "All Categories"

### "Budget card not updating"
- Make sure you **linked** the expense (click 🔗)
- Creating an expense doesn't auto-link it
- Must explicitly select budget card(s)

### "Can't link to budget"
- Create a budget card first
- Ensure budget card status is "active"

### "Link amount exceeds expense"
- Total linked amounts can't exceed expense amount
- Check existing links first
- Remove links if needed

---

## What's Next

### Priority 2: Budget Dashboard (4-6 hours)
- Month-over-month comparison charts
- Spending trends visualization
- Export to CSV for tax purposes
- Category breakdown pie charts

### Priority 3: Training Goals Integration (4-6 hours)
- Link budget cards to certification goals
- Show hours progress vs budget burn rate
- Calculate cost per hour
- Answer: "Can I afford to finish my rating?"

---

## Files Modified

### Backend
- `backend/app/routers/expense_budget_links.py` (NEW - 135 lines)
- `backend/app/main.py` (added expense_budget_links router)

### Frontend
- `frontend/js/expenses.js` (NEW - 650 lines)
- `frontend/index.html` (added expense section + modals)
- `frontend/css/styles.css` (added expense styles)

### Existing Components Leveraged
- Expense CRUD endpoints already complete
- Database schema already in place
- Budget cards query already calculates actual_amount

---

## Performance Notes

- Budget cards use LEFT JOIN to calculate actual_amount in SQL
- No N+1 queries
- Efficient single-query loading
- Indexes on expense_date and category for fast filtering

## Data Integrity

- Foreign key constraints ensure expense and budget exist before linking
- Unique constraint on (expense_id, budget_card_id) prevents duplicates
- Cascade delete: removing expense removes all its links automatically

---

## Related Documentation

- [Budget Cards](Budget-Cards.md) - Budget tracking system
- [API Documentation](API-Documentation.md) - Full API reference
- [Database Design](Database-Design.md) - Schema details
- [Architecture Overview](Architecture-Overview.md) - System architecture
