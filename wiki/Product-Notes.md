# Product Notes

Product positioning, messaging, roadmap posture, and domain reference for TrueHour. (Moved from
`.claude/instructions.md` 2026-07-25 — read this when writing user-facing copy, planning features,
or discussing market viability; day-to-day dev guidance lives in `CLAUDE.md`.)

## Status & checkpoint

Personal-first tool with potential SaaS expansion. Market validation showed lukewarm interest, so
focus is on a functional personal tool that may expand based on organic interest.

**June 2026 checkpoint** — evaluate based on:

- Personal usage patterns (is it actually useful?)
- Any organic interest from other pilots
- Technical stability
- Time investment vs. value received

Decision: continue as personal tool, pursue SaaS expansion, or sunset.

**Core insight:** pilots significantly underestimate their true hourly flying costs by only counting rental rates while ignoring fixed expenses.

## Messaging & copy guidelines

**Key message:** "Know What Flying Actually Costs You"

**Tone:** direct and factual, not hyperbolic. Speak to pilots as peers (the founder is a pilot). Focus on the "true cost revelation."

**Avoid:** overpromising on market size or revenue potential; marketing buzzwords; claims about being "the only" or "the best."

**Financial projections:** when discussing market viability, use conservative estimates — assume
high churn (20–25%), low conversion (<1% of addressable market), and focus on profitability at small
scale (100–500 users).

## Role-based onboarding personas

Support different pilot types with appropriate defaults:

- **Student Pilot** — training-focused, certification tracking
- **Active Pilot** — ongoing expense management, currency tracking
- **Advancing Pilot** — additional ratings/certifications path
- **Owner/Operator** — aircraft-specific costs, maintenance reserves

## Certification tracking scope

- Medical certificate expiration
- Flight review (BFR) tracking
- Currency requirements (landings, night, IFR)
- Rating progression (PPL, IR, CPL, CFI)

## Data import

- ForeFlight CSV is the primary import source; preserve all columns during import. (The Simulated
Instrument vs. Simulated Flight distinction is a hard rule — see CLAUDE.md Domain Notes.)
- Planned future sources: Garmin Pilot, MyFlightBook.

## Domain reference — typical costs

**Fixed (annual):** ForeFlight/Garmin Pilot subscription ($100–200/yr), renter's insurance
($200–400/yr), flying club membership ($100–500/mo), medical exam ($100–200 every 2–5 yrs), flight
review ($200–400 every 2 yrs).

**Variable (hourly):** aircraft rental (wet $150–250/hr typical), fuel if separate, instructor ($50–100/hr), landing fees, tie-down/parking.

**Worked example:** $3,000 fixed / 50 hrs = $60/hr hidden cost. Add to a $180/hr rental = $240/hr true cost — 33% higher than perceived.
