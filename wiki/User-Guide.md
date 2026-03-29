# TrueHour v2.0 User Guide

Complete guide to using TrueHour for flight training management, expense tracking, and certification progress.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Flight Logging](#flight-logging)
4. [Aircraft Management](#aircraft-management)
5. [Budget Cards](#budget-cards)
6. [Expense Tracking](#expense-tracking)
7. [Certification Progress](#certification-progress)
8. [Reports & Exports](#reports--exports)
9. [Settings & Configuration](#settings--configuration)
10. [Tips & Best Practices](#tips--best-practices)
11. [FAQ](#faq)

---

## Getting Started

### First Login

When you first open TrueHour, you'll see an empty dashboard. Let's set everything up!

### Recommended Setup Order

1. **Configure Settings** - Set your target certification and training rates
2. **Import Logbook** (if using ForeFlight) - Or add flights manually
3. **Add Aircraft** - Use FAA lookup for US aircraft
4. **Create Budget Cards** - Plan your training budget
5. **Track Expenses** - Link spending to budget cards

---

## Dashboard Overview

The dashboard is your command center, showing:

### Summary Cards

**Flight Hours**
- Total logged hours
- Quick view of your flying time

**Budget Overview**
- Total budgeted amount
- Total spent (actual expenses)
- Remaining budget

**Active Budget Cards**
- Count of active budget cards
- Cards in planning status

**Certification Progress**
- Your target certification (PPL, IR, CPL, CFI)
- Hours toward completion
- Change target by clicking

### Budget Donut Chart

Visual breakdown of your budget by category:
- **Flight Hours** - Aircraft rental/ownership costs
- **Instruction** - Flight instructor fees
- **Training** - Ground school, simulator
- **Fees & Testing** - Written exams, checkride, DPE
- **Equipment** - Headset, charts, iPad, apps
- **Medical** - Medical certificate exams
- **Insurance** - Renter's or pilot insurance
- **Other** - Everything else

### Navigation

Use the hamburger menu (top-left) to access:
- Dashboard
- Flights
- Aircraft
- Budget
- Expenses
- Certification Progress
- Reports
- Settings
- Import Logbook

---

## Flight Logging

### Importing from ForeFlight

The fastest way to populate your logbook:

1. **Export from ForeFlight**:
   - Open ForeFlight app
   - Go to Logbook
   - Tap Share button
   - Export as CSV
   - Email or AirDrop to yourself

2. **Import into TrueHour**:
   - Click hamburger menu → "Import Logbook"
   - Click "Choose File" and select CSV
   - Review aircraft mapping (TrueHour matches tail numbers)
   - Click "Confirm Import"

**What Gets Imported:**
- Date, tail number, route
- All time fields (total, PIC, dual, night, XC, etc.)
- Takeoffs and landings
- Approaches and holds
- Distance (if included)
- Instructor name
- Comments

**After Import:**
- Check "Import History" to see what was imported
- Review flights in Flights view
- Add aircraft details (rates, specifications)

### Adding Flights Manually

1. Go to **Flights** view
2. Click **"Add Flight"**
3. Fill in flight details:

**Required Fields:**
- **Date** - Flight date
- **Aircraft** - Select from your aircraft list
- **From** - Departure airport (ICAO/IATA)
- **To** - Arrival airport

**Time Fields:**
- **Total Time** - Hobbs or tach time
- **PIC** - Pilot in command time
- **SIC** - Second in command time (multi-crew)
- **Night** - Night time (as defined by FAR)
- **Solo** - Solo time
- **Cross Country** - XC time (>50nm from departure)

**Instrument Time:**
- **Actual Instrument** - Actual IMC conditions
- **Simulated Instrument** - Under hood/foggles
- **Simulator** - Approved flight simulator

**Instruction:**
- **Dual Given** - Time given as instructor
- **Dual Received** - Time received as student
- **Instructor Name** - Name of CFI

**Aircraft Characteristics:**
- **Complex** - Retractable gear, flaps, constant-speed prop
- **High Performance** - >200hp

**Takeoffs & Landings:**
- **Day Takeoffs**
- **Day Full-Stop Landings**
- **Night Takeoffs**
- **Night Full-Stop Landings**
- **All Landings** - Total landings (including touch-and-go)

**Instrument Operations:**
- **Holds** - Holding patterns
- **Approaches** - Comma-separated (e.g., "ILS, VOR, RNAV")

**Additional:**
- **Route** - Full route of flight
- **Distance** - Nautical miles
- **Comments** - Notes, squawks, lessons learned

4. Click **"Save Flight"**

### Editing Flights

1. Click the **pencil icon** next to any flight
2. Update fields as needed
3. Click **"Update Flight"**

### Deleting Flights

1. Click the **trash icon** next to a flight
2. Confirm deletion

**Warning**: Deleted flights cannot be recovered!

### Filtering Flights

Use the filters at the top of the Flights view:

- **Search** - Search by route, airports, instructor, comments
- **Date Range** - Filter by start/end date
- **Aircraft** - Filter by tail number

### Flight Hour Totals

TrueHour automatically calculates totals for:
- Total Time
- PIC, SIC, Solo
- Night
- Cross-Country
- Instrument (actual + simulated)
- Dual Given, Dual Received
- Complex, High Performance
- Takeoffs & Landings

These totals feed into your certification progress tracking.

---

## Aircraft Management

### Adding Aircraft with FAA Lookup

For US-registered aircraft (N-numbers):

1. Go to **Aircraft** view
2. Click **"Add Aircraft"**
3. Enter **Tail Number** (e.g., N12345)
4. Click **"Lookup FAA Data"**

TrueHour will automatically fill in:
- Make (e.g., Cessna)
- Model (e.g., 172S)
- Year
- Category/Class (e.g., Airplane SEL)
- Gear Type (Tricycle, Tailwheel, etc.)
- Engine Type (Reciprocating, Turboprop, Jet)
- Data source marked as "FAA"

5. **Add Rate Information**:
   - **Wet Rate** - Hourly rate including fuel ($/hr)
   - **Dry Rate** - Hourly rate excluding fuel ($/hr)
   - **Fuel Price** - Cost per gallon
   - **Fuel Burn Rate** - Gallons per hour

6. **Set Aircraft Characteristics**:
   - **Complex** - Retractable gear + constant-speed prop + flaps
   - **High Performance** - Engine >200 horsepower
   - **TAA** - Technically Advanced Aircraft (glass cockpit)
   - **Simulator** - Approved flight training device

7. **Add Notes** (optional)

8. Click **"Save Aircraft"**

### Adding Aircraft Manually

For non-US aircraft or aircraft not in FAA database:

1. Go to **Aircraft** view
2. Click **"Add Aircraft"**
3. **Don't use FAA lookup** - Fill in all fields manually:
   - Tail Number
   - Make
   - Model
   - Year
   - Category/Class
   - Gear Type
   - Engine Type
   - Rates
   - Characteristics

4. Click **"Save Aircraft"**

### Editing Aircraft

1. Click **pencil icon** next to aircraft
2. Update any fields (rates, characteristics, notes)
3. Click **"Update Aircraft"**

**Note**: Changes to rates will affect budget card calculations if cards are linked to this aircraft.

### Marking Aircraft Inactive

If you stop flying an aircraft:

1. Edit the aircraft
2. Uncheck **"Active"** checkbox
3. Save

Inactive aircraft:
- Still appear in your aircraft list (filtered)
- Show in historical flight logs
- Don't appear in "Add Flight" dropdown
- Don't show in budget card aircraft selector

### Aircraft Sorting

Sort aircraft by:
- **Tail Number** (A-Z or Z-A)
- **Active Status** (active first)
- **Type** (Complex, High Performance, TAA, Simulator)

### Aircraft Types

**Complex Aircraft**:
- Retractable landing gear
- Flaps
- Constant-speed propeller
- Required for commercial pilot training
- Examples: Piper Arrow, Cessna 182RG, Mooney M20

**High Performance Aircraft**:
- Engine with >200 horsepower
- Requires endorsement
- Examples: Cessna 182, Cirrus SR22, Piper Dakota

**Technically Advanced Aircraft (TAA)**:
- Primary flight display (PFD)
- Multi-function display (MFD)
- Two-axis autopilot or approved equivalent
- Examples: Cessna 172S G1000, Diamond DA40, Cirrus SR20

**Simulator**:
- FAA-approved flight training device
- Counts toward certification requirements (with limits)

---

## Budget Cards

Budget Cards are TrueHour's smart budgeting system. Each card represents a budget line item.

### Budget Card Concepts

**Category** - What type of expense:
- Flight Hours
- Instruction
- Training
- Fees & Testing
- Equipment
- Medical
- Insurance
- Other

**Name** - Descriptive name (e.g., "Primary Training Flight Hours")

**Amount** - Budget amount:
- **Manual Entry** - Fixed dollar amount
- **Aircraft-Linked** - Calculated from hours × aircraft rate

**When** - Date for planning (monthly, quarterly, yearly)

**Status**:
- **Active** - Currently in use
- **Completed** - Finished or achieved
- **Archived** - No longer relevant

### Creating Budget Cards with Quick Start

Use templates for common budget items:

1. Go to **Budget** view
2. Click **"Add Budget Card"**
3. Click **"Quick Start"** tab
4. Select a template:

**Flight Hours Templates:**
- PPL Primary Training (40 hours)
- PPL Additional Hours (60 hours)
- IR Training (40 hours)
- CPL Training (250 hours total)
- Time Building (50/100 hours)

**Instruction Templates:**
- PPL Instruction (40 hours)
- IR Instruction (25 hours)
- CPL Instruction (20 hours)
- Flight Review (1-2 hours)

**Testing Templates:**
- Written Exam ($175)
- Checkride/DPE Fee ($800-1000)
- Oral Exam ($400)

**Equipment Templates:**
- Headset ($200-1000)
- iPad/EFB ($500-1000)
- ForeFlight Subscription ($100-300/year)
- Pilot Supplies ($200)

**Other Templates:**
- Medical Certificate ($150)
- Ground School ($500)
- Books & Materials ($200)

5. Customize the template
6. Click **"Create from Template"**

### Creating Custom Budget Cards

For unique budget items:

1. Go to **Budget** view
2. Click **"Add Budget Card"**
3. Click **"Custom"** tab
4. Fill in:
   - **Category** - Select from dropdown
   - **Name** - Descriptive name
   - **Amount Option**:
     - **Manual Amount** - Enter dollar amount
     - **Calculate from Aircraft** - Select aircraft, enter hours, choose rate type
   - **When** - Date for this budget item
   - **Status** - Active, Completed, or Archived
   - **Notes** - Additional details

5. Click **"Create Budget Card"**

### Aircraft-Linked Budget Cards

Link budget cards to aircraft for automatic cost calculations:

**Example**: "Primary Training Flight Hours"
- Category: Flight Hours
- Name: Primary Training Flight Hours
- Aircraft: N12345 (Cessna 172S)
- Hours: 40
- Rate Type: Wet Rate ($165/hr)
- **Calculated Amount**: $6,600

**Benefits**:
- Auto-updates when aircraft rates change
- Accurate cost projections
- Easy to adjust planned hours
- Compares wet vs dry rates

**Rate Types**:
- **Wet Rate** - Includes fuel (most common for rentals)
- **Dry Rate** - Excludes fuel (ownership, some clubs)
- **Fuel Cost** - Calculate from fuel price × burn rate × hours

### Editing Budget Cards

1. Click **pencil icon** on any budget card
2. Update fields
3. Click **"Update Budget Card"**

### Budget Card Status

**Active**:
- Currently relevant
- Counts toward total budget
- Shows in dashboard

**Completed**:
- Achieved or finished
- Still counts in totals
- Good for tracking milestones

**Archived**:
- No longer relevant
- Excluded from totals
- Hidden by default (can be shown with filter)

### Budget vs Actual

Each budget card shows:
- **Budgeted Amount** - Planned spending
- **Actual Spent** - Linked expenses
- **Remaining** - Budget minus actual

Track your spending against plans in real-time!

### Budget Summary by Category

View total budgeted and spent for each category:

1. Go to **Budget** view
2. Scroll to "Budget Summary by Category"
3. See totals for:
   - Flight Hours
   - Instruction
   - Training
   - Fees & Testing
   - Equipment
   - Medical
   - Insurance
   - Other

---

## Expense Tracking

Track every aviation dollar you spend.

### Adding Expenses

1. Go to **Expenses** view
2. Click **"Add Expense"**
3. Fill in:
   - **Date** - When you spent the money
   - **Category** - Type of expense (matches budget categories)
   - **Description** - What you bought/paid for
   - **Amount** - Dollar amount
   - **Payment Method** - Cash, Credit, Check, etc.
   - **Vendor** - Who you paid (optional)
   - **Notes** - Additional details (optional)

4. **Link to Budget Cards** (optional but recommended):
   - Check boxes next to relevant budget cards
   - One expense can link to multiple cards
   - Example: A flight might link to "Flight Hours" and "Instruction" cards

5. Click **"Save Expense"**

### Expense Categories

Match your budget card categories:
- **Flight Hours** - Aircraft rental, ownership costs
- **Instruction** - Flight instructor fees
- **Training** - Ground school, simulator
- **Fees & Testing** - Written exams, checkride, DPE
- **Equipment** - Headset, iPad, charts, subscriptions
- **Medical** - Medical certificate
- **Insurance** - Renter's or pilot insurance
- **Other** - Miscellaneous aviation expenses

### Payment Methods

Track how you paid:
- Cash
- Credit Card
- Debit Card
- Check
- Bank Transfer
- PayPal/Venmo
- Other

### Linking Expenses to Budget Cards

**Why Link?**
- Track actual spending against budget
- See remaining budget in real-time
- Identify where money is going
- Generate accurate reports

**How to Link:**

Option 1: When adding expense
- Check budget card boxes during expense creation

Option 2: After expense is created
- Edit expense
- Check/uncheck budget card boxes
- Save

**Multiple Cards:**
- Link one expense to multiple budget cards
- Example: $200 flight might be:
  - 50% Flight Hours ($100)
  - 50% Instruction ($100)
- TrueHour counts full amount toward each card

### Editing Expenses

1. Click **pencil icon** next to expense
2. Update any fields
3. Update budget card links
4. Click **"Update Expense"**

### Deleting Expenses

1. Click **trash icon** next to expense
2. Confirm deletion

**Warning**: This removes the expense and unlinks it from all budget cards!

### Filtering Expenses

- **Date Range** - Filter by start/end date
- **Category** - Filter by expense category
- **Search** - Search description, vendor, notes

### Expense Summary by Category

View total spending by category:
- See where your money is going
- Compare to budget allocations
- Identify overspending

---

## Certification Progress

Track your progress toward PPL, IR, and CPL certifications.

### Setting Target Certification

1. Go to **Settings**
2. Find "Target Certification"
3. Select: PPL, IR, CPL, or CFI
4. Click **"Save Settings"**

Your dashboard will now show progress toward this goal.

### Viewing Certification Progress

1. Go to **Certification Progress** view (hamburger menu)
2. Select certification tab: **PPL**, **IR**, or **CPL**
3. View detailed requirements breakdown

### Private Pilot License (PPL)

**Requirements Tracked** (FAR 61.109):

1. **Total Time**: 40 hours minimum
2. **Dual Received**: 20 hours with instructor
3. **Solo Time**: 10 hours solo
4. **Solo Cross-Country**: 5 hours solo XC
5. **Solo Long XC**: 1 flight, 150nm+ with 3 full-stop landings at 3 different airports
6. **Night Dual**: 3 hours night dual with instructor
7. **Night Solo**: 10 takeoffs and landings solo at night
8. **Instrument Training**: 3 hours instrument dual
9. **Checkride Prep**: 3 hours within 2 months of checkride

**Qualifying Flights**:
- TrueHour identifies which flights satisfy specific requirements
- Click "View Qualifying Flights" to see them
- Solo Long XC shows route and distance

### Instrument Rating (IR)

**Requirements Tracked** (FAR 61.65):

1. **Total Time**: 50 hours minimum
2. **Cross-Country PIC**: 50 hours XC as PIC
3. **Instrument Time**: 40 hours actual or simulated
4. **Instrument with Instructor**: 15 hours with CFII
5. **Instrument Cross-Country**: 1 flight, 250nm with 3 different approaches
6. **Approaches**: 50 approaches total

**Qualifying Flights**:
- 250nm Instrument XC detected automatically
- Must have ≥3 approaches logged
- Shows which flights qualify

### Commercial Pilot License (CPL)

**Requirements Tracked** (FAR 61.129):

1. **Total Time**: 250 hours minimum
2. **PIC Time**: 100 hours as pilot in command
3. **Cross-Country PIC**: 50 hours XC as PIC
4. **Night Time**: 5 hours night
5. **Night Operations**: 10 takeoffs and full-stop landings at towered airport
6. **Solo/PIC Time**: 10 hours in complex or TAA
7. **Instrument Time**: 10 hours instrument training
8. **Complex/TAA Training**: 10 hours in complex or TAA
9. **Solo 2-Hour Day XC**: 1 flight, 100nm straight-line distance, day VFR
10. **Solo 2-Hour Night XC**: 1 flight, 100nm straight-line distance
11. **Solo Long XC**: 1 flight, 300nm+ with landings at 3 airports, one 250nm+ from departure

**Qualifying Flights**:
- Specific XC flights detected based on distance and conditions
- Shows route, distance, and which requirement satisfied

### How Qualifying Flights Work

TrueHour automatically detects qualifying flights based on:
- **Distance** - Calculated from route or manually entered
- **Time** - Flight duration
- **Conditions** - Day/night, solo/dual
- **Approaches** - Instrument approaches logged
- **Airports** - Number of stops
- **Aircraft Type** - Complex, TAA, etc.

**Example**: PPL Solo Long XC
- Must be solo flight
- ≥150nm total distance
- ≥3 full-stop landings
- ≥3 different airports

TrueHour scans all your flights and marks the ones that match!

### Progress Bars

Each requirement shows:
- **Green Progress Bar** - Hours/operations completed
- **Required Amount** - Minimum needed
- **Current Amount** - What you have
- **Percentage** - % complete

### Detailed Hour Breakdowns

Click **"View Details"** to see:
- Breakdown by requirement
- Which flights contribute
- Gaps to address

---

## Reports & Exports

Export your data for backup, analysis, or sharing.

### CSV Exports

Export to spreadsheet format (Excel, Google Sheets, Numbers):

1. Go to **Reports** view
2. Find "Data Exports (CSV)" section
3. Click export button for:

**Flight Log CSV**:
- All flights with complete details
- Includes totals row
- All time fields, approaches, routes, comments

**Budget Cards CSV**:
- All budget cards
- Amounts, categories, aircraft linkage
- Status and dates

**Expenses CSV**:
- All expenses
- Date, category, amount, vendor
- Payment methods

**Aircraft CSV**:
- All aircraft
- Specifications, rates, characteristics
- Active status

4. File downloads automatically
5. Open in your spreadsheet app

### PDF Reports

Professional formatted reports:

1. Go to **Reports** view
2. Select **Report Year** (dropdown in top-right)
3. Choose report type:

**Budget Summary Report**:
- Budget by category
- Budget vs actual comparison
- Visual donut chart
- Detailed breakdowns

**Certification Progress Report**:
- Select certification (PPL, IR, CPL)
- Requirements checklist
- Progress bars
- Hour totals
- Qualifying flights

**Flight Log Report**:
- All flights in table format
- Sorted by date
- Totals at bottom
- Ready for printing or FAA

**Annual Budget Report**:
- Year-end summary
- Budget vs actual for the year
- Category breakdowns
- Spending analysis

4. Click **"Generate PDF"**
5. PDF downloads automatically
6. Print or save

### Report Year Selection

PDFs are year-based:
- Select year from dropdown (current year and 5 years back)
- Only data from that year included
- Budget cards filtered by "when" date
- Expenses filtered by date

### Export Tips

- **Backup Regularly** - Export CSV files monthly for backup
- **Filters Apply** - If you filter flights/expenses, CSV includes filtered data
- **Year Matters** - PDFs respect the selected year
- **Fresh Data** - Exports always use current database (no cache)

---

## Settings & Configuration

Customize TrueHour for your training goals.

### Accessing Settings

Click **gear icon** or hamburger menu → **Settings**

### Target Certification

Set your current certification goal:
- **Private Pilot (PPL)**
- **Instrument Rating (IR)**
- **Commercial Pilot (CPL)**
- **Certified Flight Instructor (CFI)**

This determines:
- Dashboard certification progress display
- Which requirements to emphasize
- Default budget templates

### Training Settings

**Instructor Rate**:
- Hourly rate for flight instructor
- Used in budget calculations
- Example: $65/hour

**Simulator Rate**:
- Hourly rate for simulator/FTD
- Example: $45/hour

**Training Pace**:
- Lessons per week
- Used for planning (future feature)
- Example: 2-3 lessons/week

**Weekly Buffer Percentage**:
- Extra time for weather cancellations
- Example: 25% buffer
- Used for planning (future feature)

### Budget Categories

Define your own budget categories or use defaults:

**Default Categories**:
- Flight Hours
- Instruction
- Training
- Fees & Testing
- Equipment
- Medical
- Insurance
- Other

**Custom Categories**:
1. Click **"Add Category"**
2. Enter category name
3. Click **"Add"**
4. Remove categories with **X** button

**Note**: Categories are used in:
- Budget cards
- Expense tracking
- Reports
- Dashboard donut chart

### Saving Settings

Click **"Save Settings"** at bottom of page.

Settings are saved to database and persist across sessions.

---

## Tips & Best Practices

### Flight Logging Best Practices

**Log Flights Promptly**:
- Enter flights same day or next day
- Details are fresh in memory
- Approaches, routes, lessons learned

**Be Consistent**:
- Use same format for routes (e.g., "KBFI-KSEA-KPAE-KBFI")
- Standardize airport identifiers (ICAO or IATA)
- Consistent instructor name spelling

**Track Everything**:
- Even short flights count
- Ground instruction (if logged)
- Simulator sessions
- Discovery flights

**Use Comments**:
- Note what you learned
- Record maneuvers practiced
- Document squawks or issues
- Track progress on skills

### Budget Management Tips

**Start with Templates**:
- Use Quick Start templates for common items
- Customize after creation
- Add your own as you learn costs

**Link Aircraft to Cards**:
- Auto-calculate from hours and rates
- Easy to adjust when rates change
- Compare wet vs dry rates

**Review Monthly**:
- Check budget vs actual
- Adjust future budget cards
- Identify overspending areas

**Set Realistic Amounts**:
- Research local costs
- Add 15-20% buffer
- Account for checkride failures (2-3 attempts)

**Plan by Category**:
- Break down certification into categories
- Track each type of spending separately
- See where money is going

### Expense Tracking Tips

**Enter Immediately**:
- Log expenses same day
- Take photos of receipts
- Use notes field for details

**Always Link to Budget Cards**:
- Shows actual spending vs budget
- Tracks remaining budget
- Identifies overspending

**Use Correct Categories**:
- Match budget card categories
- Consistent categorization = better reports

**Track Payment Methods**:
- Know which card you used
- Useful for credit card reconciliation
- Tax purposes (if applicable)

### Aircraft Management Tips

**Use FAA Lookup**:
- Faster and more accurate
- Auto-fills make/model
- Standardizes data

**Keep Rates Updated**:
- Update when flight school changes rates
- Affects budget calculations
- Historical flights unaffected

**Mark Aircraft Inactive**:
- When you stop flying it
- Keeps aircraft list clean
- Preserves historical data

**Add Detailed Notes**:
- Avionics (G1000, G430, etc.)
- Club or school name
- Special characteristics

### Certification Planning Tips

**Set Target Certification**:
- Focus on one at a time
- Dashboard shows your progress
- Helps with budgeting

**Track Qualifying Flights**:
- Review required XC flights early
- Plan long XCs strategically
- Verify distances are logged

**Check Progress Regularly**:
- Weekly review of hours
- Identify gaps early
- Plan flights to fill gaps

**Plan Checkride Timing**:
- Recent hours matter (2 months for PPL)
- Don't log too far ahead
- Schedule DPE early

---

## FAQ

### General Questions

**Q: Is my data secure?**
A: Yes. TrueHour runs locally on your machine. Data never leaves your computer unless you explicitly export it.

**Q: Can I use TrueHour on multiple computers?**
A: Currently, TrueHour is local-only. You can export CSV files and import on another machine, but native sync is not yet available (planned for v2.2).

**Q: Do I need an internet connection?**
A: After installation, TrueHour works offline. FAA aircraft lookups require internet, but all other features work offline.

**Q: Can multiple people use TrueHour?**
A: v2.0 is single-user. Multi-user support is planned for v2.2.

### Flight Logging Questions

**Q: Can I import from ForeFlight?**
A: Yes! Export CSV from ForeFlight and import via hamburger menu → Import Logbook.

**Q: Will ForeFlight import duplicate flights?**
A: TrueHour detects duplicates by date + tail number + total time. Duplicates are skipped.

**Q: Can I edit imported flights?**
A: Yes. All flights can be edited after import.

**Q: What if I import a CSV and find mistakes?**
A: Delete individual flights or clear all data and re-import. Always backup before large imports!

**Q: Can I track simulator time?**
A: Yes. Create an aircraft marked as "Simulator" and log flights to it.

**Q: How does TrueHour detect qualifying flights?**
A: Based on distance, duration, conditions (day/night), solo/dual status, and airports visited. Distance must be logged!

### Aircraft Questions

**Q: What if my aircraft isn't in the FAA database?**
A: Enter all details manually. This works for experimental, foreign, or ultra-light aircraft.

**Q: Can I track multiple aircraft?**
A: Yes! Add as many as you fly. Mark inactive ones when you stop flying them.

**Q: Do I need to enter rates?**
A: Rates are optional but needed for aircraft-linked budget cards.

**Q: What's the difference between wet and dry rate?**
A: Wet rate includes fuel. Dry rate is hourly only (you pay fuel separately).

**Q: Can I change rates later?**
A: Yes. Updated rates affect future budget card calculations, not historical flights.

### Budget Questions

**Q: What's the difference between budget cards and expenses?**
A: Budget cards are **planned spending**. Expenses are **actual spending**. Link them to track budget vs actual.

**Q: Can I have multiple budget cards for the same category?**
A: Yes! Example: "Primary Training" and "Solo Time Building" are both "Flight Hours" category.

**Q: What if my actual spending exceeds budget?**
A: TrueHour will show negative "Remaining" amount. Adjust budget card amount or create new card.

**Q: Do archived budget cards count in totals?**
A: No. Only "Active" and "Completed" cards count. Archive old or irrelevant cards.

**Q: Can I link one expense to multiple budget cards?**
A: Yes! Useful when a flight covers multiple budget categories (flight hours + instruction).

### Certification Questions

**Q: Why isn't my solo long XC showing as qualifying?**
A: Check that:
- Flight is marked as solo
- Distance is ≥150nm (PPL) or ≥250nm (IR) or ≥300nm (CPL)
- ≥3 full-stop landings logged
- Route has ≥3 different airports

**Q: How does TrueHour calculate distance?**
A: From the "Distance" field in flight log. If blank, TrueHour cannot detect qualifying XC flights.

**Q: What if I'm between certifications?**
A: Set target to what you're **currently working on**. You can change it anytime.

**Q: Does TrueHour track instrument currency?**
A: Not yet. Currency tracking (6 approaches, holds, etc.) is planned for v2.2.

**Q: Can I see all three certifications at once?**
A: Yes. Go to Certification Progress view and tab between PPL, IR, and CPL.

### Export Questions

**Q: What format are CSV files?**
A: Standard CSV (comma-separated values), compatible with Excel, Google Sheets, Numbers, etc.

**Q: Can I import CSV back into TrueHour?**
A: Currently only ForeFlight CSV import is supported. General CSV import is planned for future versions.

**Q: Why are PDF fonts hard to read?**
A: This was a known bug in early v2.0 builds. Update to latest version.

**Q: Can I customize PDF reports?**
A: Not currently. Custom PDF templates are planned for v2.1.

**Q: How do I backup my data?**
A: Export all CSV files monthly. Also backup database:
```bash
docker exec infrastructure-db-1 pg_dump -U truehour truehour > backup.sql
```

---

## Getting Help

**Documentation:**
- [Installation Guide](INSTALLATION.md)
- [README](README.md)
- [API Documentation](http://localhost:8000/docs)

**Support:**
- [GitHub Issues](https://github.com/FliteAxis/TrueHour/issues)
- [GitHub Discussions](https://github.com/FliteAxis/TrueHour/discussions)

**Quick Checks:**
- Check browser console for errors (F12)
- Check backend logs: `docker-compose logs backend`
- Verify backend is running: `curl http://localhost:8000/api/flights`

---

**Happy Flying!** 🛩️

*TrueHour v2.0 - Built by a pilot, for pilots who want control over their training data.*
