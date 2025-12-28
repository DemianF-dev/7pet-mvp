# Financial Management Update Summary

## Overview
Implemented a comprehensive financial management module for the staff area to track and manage invoices/quotes with granular status control.

## Database Changes
- **Updated `InvoiceStatus` Enum:**
  - Added: `MONITORAR`, `NEGOCIADO`, `ENCERRADO`.
  - Re-synced database with `prisma db push`.

## Backend (`invoiceRoutes.ts`)
- **Payment Processing:** Updated logic to accept partial payments and only auto-mark as `PAGO` if fully paid.
- **Status Update:** Added new `PATCH /invoices/:id/status` endpoint to allow manual status transitions (e.g., setting to `NEGOCIADO` or `ENCERRADO`).

## Frontend (`BillingManager.tsx`)
- **Revamped User Interface:**
  - Replaced simple table with a rich, interactive dashboard.
  - Added clickable rows to open detailed management view.
- **Detail Modal:**
  - **Status Control:** 6-button grid to instantly change invoice status.
  - **Payment Registration:** Form to log payments with Method, Amount, and Bank (visually captured, stored in backend).
  - **Financial Summary:** Real-time calculation of "Paid vs Reserved" amounts.
  - **History:** List of all recorded payments for that invoice.

## Usage
1. Navigate to **Gestão Financeira**.
2. Click on any invoice row.
3. Use the modal to:
   - Update status (e.g. "Monitorar Recebimento").
   - Register a partial or full payment via PIX/Card.
   - See the remaining balance instantly update.
