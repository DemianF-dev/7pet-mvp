# Phase 1, 2, 3.5 Completion Report

## Summary of Changes

1. **Quote Alignment (Phase 1)**:
    * Strict segregation of UI for **SPA**, **Transporte**, and **Combo**.
    * **SPA_ONLY**: Hides transport fields.
    * **TRANSPORT_ONLY**: Hides SPA items & recurrence.
    * **COMBO**: Hides Transport recurrence (uses SPA rules).
    * Verified "20% Loja" button and removal of "Divisão Recorrente".

2. **Scheduling Wizard (Phase 2)**:
    * Verified "Grid" layout logic in `ScheduleWizard.tsx`.
    * Backend (`quoteService.ts`) now correctly creates SEPARATE appointments for `LEVA` and `TRAZ` legs (Category: LOGISTICA).

3. **Transport Pricing Snapshot (Phase 3.5)**:
    * **Schema**: Added `metadata` JSON field to both `Quote` and `Appointment` models.
    * **Frontend**: `QuoteEditor` now saves the full transport calculation snapshot to `Quote.metadata.transportSnapshot`. It also *loads* from this snapshot if it exists, ensuring price stability.
    * **Locking**: Inputs are `readOnly` when status is `AGENDADO` or `APROVADO`.
    * **Copy Logic**: Backend now copies `Quote.metadata.transportSnapshot` to the `Appointment.metadata` for every transport leg created.

4. **Invoice (Phase 4)**:
    * Created `backend/src/controllers/invoiceController.ts` skeleton to start the Billing implementation.

## Next Steps

* Implement `InvoiceController.create` logic.
* Implement Frontend Billing UI.
