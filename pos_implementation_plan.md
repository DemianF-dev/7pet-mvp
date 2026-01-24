# Implementation Plan - POS (PDV) Module for 7Pet

This plan outlines the steps to implement a built-in Point of Sale (POS) system within the 7Pet platform, reducing dependency on external tools like MarketUP.

## 1. Database Schema Updates (Prisma) ✅

- [x] Add `CashSession` model to track register opening/closing.
- [x] Add `Order` and `OrderItem` models for front-counter sales.
- [x] Add `OrderPayment` to support multiple payment methods per order.
- [x] Add `InventoryMovement` for stock tracking.
- [x] Add `FiscalDocument` placeholder model for pluggable integration.
- [x] Update `Product` model to track stock more effectively (optional but recommended).
- [x] Add necessary enums (`OrderStatus`, `PaymentMethod`, `MovementType`, etc.).

## 2. Backend Implementation (Node.js/Express) ✅

- [x] **Services**:
  - `CashSessionService`: Logic for opening, closing, and reporting on cash registers.
  - `OrderService`: Logic for creating orders from counter or appointments, calculating totals, and handling stock.
  - `PaymentService`: Registering payments and updating order status.
  - `InventoryService`: Recording movements and updating `Product.stock`.
- [x] **Controllers & Routes**:
  - `GET /pos/session/active`: Check current open session.
  - `POST /pos/session/open`: Open a new session.
  - `POST /pos/session/close`: Close session with reconciliation.
  - `POST /pos/orders`: Create a new sale.
  - `GET /pos/checkout-appointment/:id`: Pull appointment data into a draft order.
  - `POST /pos/orders/:id/payments`: Add payments to an order.
  - `GET /pos/search`: Fast search for products/services.

## 3. Frontend Implementation (React/Tailwind) ✅

- [x] **POS Dashboard**:
  - Layout with Item Search (left/center) and Cart/Payment (right).
  - Quick search for Products and Services.
  - Customer search (or anonymous "Consumidor Final").
- [x] **Cart & Discounts**:
  - Add/Remove items, change quantities.
  - Apply discounts (with permission check).
- [x] **Payment Flow**:
  - Multi-payment modal (e.g., split between Pix and Cash).
  - Finishing sale transition.
- [x] **Cash Management**:
  - Open/Close session modals.
  - Daily summary view.
- [x] **Checkout from Appointment**:
  - integration in Appointment details or a dedicated "Pending Checkouts" list to pull services into POS.

## 4. Fiscal Integration (Plugin Architecture) ⏳

- [ ] Define `FiscalProvider` interface in backend.
- [ ] Create a `MockFiscalProvider` for testing.
- [ ] Documentation on how to plug in providers (Focus on NFC-e/NFS-e).

## 5. Testing & Validation

- [x] TypeScript validation passed (Front & Back).
- [ ] Unit tests for total calculations and stock deductions.
- [ ] Integration tests for full sale flow.
- [ ] Verification of Audit Logs for critical operations.
