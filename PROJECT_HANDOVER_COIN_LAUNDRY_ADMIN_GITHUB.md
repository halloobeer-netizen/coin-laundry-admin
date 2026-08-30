# PROJECT HANDOVER — CLEAN WASH COIN LAUNDRY ADMIN (GITHUB-BASED)

## Repository
- Repository: `halloobeer-netizen/coin-laundry-admin`
- Branch: `main`
- Package: `coin-laundry-admin`
- Current package version: 3.1.0
- Type: Static admin frontend + Vercel serverless API + Neon PostgreSQL

## Source of Truth
This handover is based on the current GitHub repository.

Do not assume this is a Next.js project. It is currently a lightweight static JavaScript application with API endpoints.

## Verified Current Architecture

### Frontend
- `index.html`
- `styles.css`
- `app.js`
- `auth-ui.js`
- `db-sync.js`
- `pdf-report.js`

### Backend/API
Vercel serverless-style files under `api/`:
- `_auth.js`
- `_db.js`
- `auth.js`
- `bootstrap.js`
- `machines.js`
- `page.js`
- `services.js`
- `settings.js`
- `transactions.js`

### Database
Package dependency:
- `@neondatabase/serverless`

This confirms Neon PostgreSQL is used directly from the serverless API layer.

### Deployment
- `vercel.json` exists

## Product Name
README title:
`Clean Wash Coin Laundry Admin`

## Operational Flow
Current README defines:

Customer weighs laundry
→ admin selects machine/service
→ customer pays Cash/QRIS
→ admin confirms
→ admin gives coin/token
→ customer inserts coin/token into machine

## Payment Flow

### Cash
- input cash received
- automatic change calculation

### QRIS
- checkbox/confirmation that payment was received

Transaction save should only be enabled if payment is valid.

## Pages / Navigation
The app has separate operational areas.

Current README explicitly establishes:
- Dashboard
- Operations
- Transaction History
- Reports
- Machines
- Pricing & Services

Hash navigation is used for major sections such as:
- `#dashboard`
- `#operations`
- `#transactions`
- `#reports`

Do not merge these back into one giant page.

## Dashboard
Dashboard is intentionally a summary-only page.

It must NOT display all operational and historical data.

## Operations
Operations is a separate page containing:
- machine status
- active operations
- new transactions
- latest operational activity

## Transaction History
Separate archive/history page with:
- search
- Cash/QRIS filter
- status filter
- machine filter

## Reports
Existing direction includes:
- revenue statistics
- transaction statistics
- payment method analysis
- machine usage
- CSV export

`pdf-report.js` also exists, so audit current PDF reporting behavior before changing reporting.

## Machine Management
README V2.6 confirms:
- machine summary
- search/filter
- add machine
- edit type
- edit capacity
- edit status
- edit default duration
- notes
- mark completed
- maintenance
- reactivate
- delete only if not currently in use

Changes sync to Dashboard and Operations.

## Machine Timer
README V2.7 confirms:
- countdown runs automatically per second
- finish time is calculated from machine default duration
- when timer reaches 00:00:
  - machine status becomes Finished
  - active transaction becomes Finished
- machine does NOT immediately become Available
- admin clicks `Tersedia Lagi` after laundry is picked up

Preserve this workflow.

## Service Pricing — CRITICAL CURRENT RULE
README V3.0 corrects earlier pricing.

Current rule:

### Cuci + Dryer
`Rp35.000 per maximum 7 kg package`

Pricing:
- 1–7 kg = Rp35.000
- 8–14 kg = Rp70.000
- 15–21 kg = Rp105.000

Token/coin quantity automatically follows the number of 7 kg packages.

IMPORTANT:
Earlier README versions mention Rp35.000/kg, but V3.0 explicitly corrects that. The package-of-7kg rule is the current rule.

Do not revert to per-kg pricing.

## Pricing & Services Page
Existing features:
- edit primary service
- add new service
- edit name
- price
- unit
- machine type
- duration
- active status
- notes
- deactivate without deleting
- inactive services should not appear in cashier transaction form
- search/filter

## Authentication
The repository now contains:
- `auth-ui.js`
- `api/_auth.js`
- `api/auth.js`

Recent commit history includes:
- admin login UI
- loading admin auth before app scripts
- protecting transactions API with admin session

Authentication is therefore a real current feature, not a future idea.

Do not remove API session protection.

## Neon Database
`api/_db.js` exists and package uses `@neondatabase/serverless`.

Before changing DB logic:
- audit bootstrap schema
- inspect queries in machines/services/transactions/settings
- identify environment variable used for Neon connection

Never expose DB credentials to frontend code.

## Data Synchronization
`db-sync.js` exists.

Audit whether it:
- loads server data to frontend
- mirrors local state
- writes mutations back to API
- handles fallback/offline/local state

Do not assume all data is still frontend-only because older README text said so; current repo already includes Neon API integration.

## API Safety
Important API modules:
- machines
- services
- transactions
- settings

Mutating endpoints should remain admin-protected.

Do not move DB write logic into browser JavaScript.

## Responsive UI
README confirms responsiveness for:
- desktop
- tablet
- mobile

A prior bug involved transaction modal scrolling.

Preserve:
- vertical scroll
- viewport-aware modal height
- mobile sticky modal header

## Database Safety
Never:
- drop Neon tables
- reset transaction history
- delete all machines
- delete all services
- expose connection string
- bypass admin session for writes

## Current Development Priority
1. Audit auth/session
2. Audit Neon schema/bootstrap
3. Verify machine API
4. Verify service API
5. Verify transaction API
6. Verify db-sync frontend integration
7. Verify timer persistence across refresh
8. Verify 7kg package pricing
9. Verify reports / CSV / PDF
10. Verify mobile behavior

## Mandatory Audit for Next
Before coding, report:

1. Static frontend structure
2. Current app state model
3. Auth/session implementation
4. Neon connection
5. Bootstrap/database schema
6. Machines API
7. Services API
8. Transactions API
9. Settings API
10. db-sync behavior
11. Timer persistence behavior
12. Cash payment validation
13. QRIS validation
14. 7kg pricing logic
15. token calculation
16. reports/CSV/PDF
17. responsive/mobile issues
18. security risks
19. data integrity risks
20. smallest safe next task

## Locked Principles
- This is an admin/operator web app.
- Current architecture is static frontend + serverless API.
- Neon is the database backend.
- Admin login/session protection exists.
- Dashboard, Operations, Transactions, Reports, Machines, Services remain separate functional areas.
- Cuci + Dryer pricing is Rp35.000 per maximum 7 kg package.
- Timer automatically counts down.
- Reaching zero marks machine/transaction Finished, not immediately Available.
- Admin manually sets `Tersedia Lagi`.
- Cash and QRIS flows must remain validated.
- Do not rebuild as Next.js unless explicitly requested.
- Do not destroy transaction history.

## Correct Continuation Flow

READ REPO
→ AUDIT FRONTEND
→ AUDIT AUTH
→ AUDIT API
→ AUDIT NEON
→ VERIFY MACHINES
→ VERIFY SERVICES
→ VERIFY TRANSACTIONS
→ VERIFY TIMER
→ VERIFY 7KG PRICING
→ VERIFY REPORTS
→ FIX SMALLEST ISSUE
→ TEST MOBILE
→ COMMIT
→ DEPLOY
