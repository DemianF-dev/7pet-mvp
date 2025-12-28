# Staff Dashboard Metrics Fix

## Issue
The user reported that the numbers on the "Dashboard do Colaborador" (Staff Dashboard) were not updating.

## Root Cause Analysis
- **Quotes Count:** The controller `staffController.getDashboardMetrics` was querying the database for quotes with `status: 'SOLICITACAO'`.
- **Data Mismatch:** The database schema and creation logic create quotes with status `'SOLICITADO'`. 
- **Result:** The query returned 0 or static results because no quote matched the invalid status string, causing the "Orçamentos" card to show incorrect or non-updating data.

## Resolution
- **Fixed Typo:** Updated `backend/src/controllers/staffController.ts` to query for `status: 'SOLICITADO'` (matching the Prisma Schema Enum).

## Verification
- The "Orçamentos" (Quotes) count on the Staff Dashboard should now correctly reflect the number of quotes with `'SOLICITADO'` status.
- Other metrics (`todayAppointments`, `activeTransports`) appeared correct in code review but should also be verified by the user.
