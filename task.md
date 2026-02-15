# Current Task: Client Chat Interface & Feed Fixes

- [x] Fix "No Connection" Error (Backend Restarted)
- [x] Client Chat Enhancements
  - [x] Add "Novo Chat" button
  - [x] Implement "New Chat" Modal with Support/Finance tabs
- [x] Staff Chat Enhancements
  - [x] Add "Novo Chat" button
  - [x] Implement "User Select" Modal (Search all users)
  - [x] Update `ChatPage.tsx`
- [x] Fix 500 Internal Server Error on Feed/Mural pages
- [x] Implement Client Chat Interface (Basic)
- [x] Verify Functionality (Code Review)
- [x] Manual Verification (User)
  - [x] Login as Client -> "Fale com Equipe" -> Test "Atendimento" and "Financeiro" tabs.
  - [x] Login as Staff -> "Bate-papo" -> "Nova Conversa" -> Search for a client or staff member.

# Premium Notification System

- [x] Backend: Notification Controller (Unified Helper)
- [x] Backend: Chat Notifications
- [x] Backend: Quote Notifications
- [x] Frontend: Notification Context (Socket.io)
- [x] Frontend: Notification Bell Component
- [x] Frontend: Sound Effects & Toasts
- [x] Backend: Create `billingRoutes.ts`
- [x] Backend: Create `billingController.ts`
- [x] Backend: Register routes in `index.ts`
- [x] Frontend: Create `BillingManagerV2.tsx`
- [x] Frontend: Create substructure (`NewInvoice`, `InvoicesList`, `LedgerView`)
- [x] Frontend: Update `App.tsx` routes
- [x] Frontend: Update `StaffSidebar`
- [/] Database: Run Migration (BLOCKED: Prisma Validation/Connection Error)

# Production Readiness

- [x] System Audit & Optimizations (Cron Logic, Build Chunks)

# Phase 3: Data Migration (Legacy System)

- [x] Receive & Analyze Legacy Data (Bitrix24)
- [x] Update Database Schema (New Fields)
- [x] Create Import Script/Feature
- [x] Dry Run Import & Validation (134 records successfully imported)

# Phase 4: UI Integration & Dual-System Transition

- [x] Update Customer Detail/Edit Views with migration fields
- [x] Update Pet Detail/Edit Views with migration fields
- [x] Implement Search/Filter by Bitrix ID (Legacy ID)
- [x] Final Verification of Imported Data in UI
- [x] Team Training & Feedback loop setup

# Phase 5: Appreciations System & UI Refactor (Bitrix-Style)

- [x] Design and implement `Appreciation` database model
- [x] Refactor `CustomerDetail.tsx` / `UserView` layout to match high-premium Bitrix-style
- [x] Implement "Appreciations" (Badges) UI and assignment logic
- [x] Build automated Notification & Social Post logic for badges
- [x] Verification and testing of the new recognition flow

# Phase 6: Production Deployment & Stabilization

- [x] Fix `npm ci` failures on Railway (package-lock.json mismatch)
- [x] Resolve cross-platform binary dependencies (@rollup/linux)
- [x] Fix TypeScript build errors in `BrainController` (AI SDK version mismatch)

- [/] Verify Production Deployment (Frontend & Backend)
- [x] Investigate "Tenant or user not found" error on Production
  - **Findings**: User `oidemianf@gmail.com` exists in DB (`MASTER`). Error likely from Cloudflare/Infrastructure on Railway.
- [ ] **Action Required**: Switch Frontend to Local Backend to bypass infrastructure error.

- [x] Investigate "Tenant or user not found" error on Production
  - **Findings**: User `oidemianf@gmail.com` exists in DB (`MASTER`). Error is coming from Supabase/Railway infrastructure intercepting the `/auth` route.
- [x] **Conflict Resolution**: Renamed `/auth` to `/system-auth` to avoid infrastructure interception.
- [ ] Post-Deploy Smoke Test (Health, Login, AI Chat)
