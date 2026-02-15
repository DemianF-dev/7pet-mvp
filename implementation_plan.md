# Implementation Plan - Client Chat & Feed Stability

## Billing V2 Implementation Plan (Sprint 1)

> [!CAUTION]
> **Status: BLOCKED**
> Database migrations failed due to environment configuration issues (`P1001` Connection Refused / `Validation Error`).
> Schema changes are defined but not applied to the database.
> Frontend and Backend code is implemented but will fail at runtime until DB is migrated.

## Goal Description

solve stability issues on the Feed/Mural pages.

## Objective

Implement a simplified chat interface for clients to communicate with support staff and resolve stability issues on the Feed/Mural pages.

## Phase 1: Stability Fixes (Completed)

- **Problem**: 500 Internal Server Error on Feed/Mural.
- **Root Cause**: Incorrect access to user ID in controllers (`req.user.userId` instead of `req.user.id`).
- **Resolution**: Updated `feedController.ts` and `chatController.ts` to use `req.user.id`, aligning with the `authMiddleware` which attaches the full user object to `req.user`.

## Phase 2: Client Chat Interface (Refining)

- **Backend Refinements**:
  - [x] Exposed `GET /chat/agents` endpoint.
  - [ ] **[NEW]** Ensure `getSupportAgents` returns appropriate users for "Atendimento" and "Financeiro" or create logic to route to these departments.
- **Frontend Implementation**:
  - [x] `ClientChatPage.tsx` created.
  - [ ] **[NEW]** Implement "Novo Chat" button on Client Chat page.
  - [ ] **[NEW]** Create `NewChatModal` for Clients:
    - Options: "Atendimento" (Support) and "Financeiro" (Financial).
    - Logic: "Atendimento" -> select random or specific Support Agent. "Financeiro" -> select Admin or Finance specific role.
  - [x] Link from Client Dashboard.

## Phase 3: Staff Chat Interface (New)

- **Objective**: Allow staff to start chats with ANY user.
- **Frontend Implementation**:
  - [ ] Update `StaffChatPage.tsx` (to be identified/created) with "Novo Chat".
  - [ ] Create `UserSelectModal` for Staff:
    - Search capability (by name/email).
    - List all users (Clients + Staff).
  - [ ] Backend: Ensure an endpoint exists to search/list all users for staff (e.g. `GET /users?search=...`).

## Phase 4: Verification & Deployment

- **Verification**:
  - Test Client -> Support flow.
  - Test Client -> Finance flow.
  - Test Staff -> Any User flow.
  - Verify Feed page functionality.
- **Deployment**:
  - Ensure backend is running! (Currently detected as down).
