# Real-time Financial Synchronization Update

## Changes Implemented

### 1. Quote <-> Invoice Synchronization (`quoteController.ts`)
- **Automatic Sync:** Updated the `update` method in `QuoteController`.
- **Logic:** Whenever a quote's `totalAmount` is updated, the system now checks if there is a linked Invoice.
- **Action:** If a linked invoice exists and is NOT in a final state (`PAGO` or `ENCERRADO`), the invoice `amount` is automatically updated to match the new quote total.
- **Logging:** Added server-side logging `[SYNC]` to confirm when this synchronization occurs.

### 2. Auto-Refresh on Focus (`BillingManager.tsx`)
- **Focus Listener:** Added a `window` event listener for the `focus` event in the main `BillingManager` component.
- **Behavior:** Whenever the user switches tabs (e.g., from "Orçamentos" back to "Financeiro"), the invoice list automatically refreshes (`fetchInvoices`).
- **Benefit:** This ensures the user always sees the latest data without needing to manually refresh the page after making changes in other tabs.

## Verification
1.  **Test Sync:**
    - Go to **Orçamentos**.
    - Edit an approved quote (change item price).
    - Save.
    - Go to **Financeiro**.
    - Verify the amount has updated automatically.

2.  **Test Auto-Refresh:**
    - Open **Financeiro** in one tab.
    - Open **Orçamentos** in another tab.
    - Change a status or amount in Orçamentos.
    - Click back to the Financeiro tab.
    - The list should blink/update instantly.
