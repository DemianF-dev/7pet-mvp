# Agenda Module Architecture (Refactored)

This module uses a **Service - ViewModel - UI** architecture to separate concerns and improve maintainability.

## Structure

- **`domain/`**: Contains pure TypeScript types and constants.
  - `types.ts`: Defines `AgendaItem`, `AgendaDomain`, etc.
  
- **`services/`**: Contains the API logic.
  - `appointments.service.ts`: Handles all HTTP requests to `/appointments`. It is agnostic of the UI.
  
- **`viewmodels/`**: Contains the state management and business logic.
  - `useAgendaViewModel.ts`: A custom hook that provides:
    - **State**: `appointments`, `isLoading`, `view`, `selectedDate`, `filters`.
    - **Actions**: `refresh`, `setView`, `nextDate`, `bulkDelete`, `openCreateModal`, etc.
    - Handles logic for both **SPA** and **LOGISTICA** domains via the `domain` prop.

- **UI Components (Pages)**:
  - `AgendaSPA.tsx`: Consumes `useAgendaViewModel({ domain: 'SPA' })`.
  - `AgendaLOG.tsx`: Consumes `useAgendaViewModel({ domain: 'LOG' })`.
  - These components are now "dumb" containers that pass data from the VM to layout components like `WebAgendaLayout` and `MobileCalendarCompactView`.

## How to add a new feature?

1. **Data/API**: If it involves new data, update `appointments.service.ts`.
2. **Logic/State**: Add the state or handler in `useAgendaViewModel.ts`.
    - If it's specific to SPA or LOG, check `domain` inside the hook.
3. **UI**: Consume the new state/action in `AgendaSPA` or `AgendaLOG` and pass it to the render functions.

## Mobile vs Desktop

- The ViewModel handles mobile detection and sets the view to `COMPACT` automatically on small screens.
- `MobileCalendarCompactView` is the dedicated mobile UI component.

## Debug Panel (DEV ONLY)

A built-in debug panel is available to diagnose state, filters, and API performance. It is **only included in development builds**.

**How to enable:**

1. **System Settings (Recommended)**: Go to **Meu Perfil** (as `oidemianf@gmail.com`) > **Developer Settings** section and use the toggle switch.
2. **Keyboard Shortcut**: Press `Ctrl + Shift + D` (Windows/Linux) or `Cmd + Shift + D` (Mac) to toggle visibility. State is persisted in `localStorage`.
3. **Environment Variable**: Set `VITE_AGENDA_DEBUG=true` in `.env.local` to force it open by default.

**Features:**

- View current state (View, Loading, Date, Filters).
- Analyze data metrics (Total items, Visible items).
- Monitor API requests (Timestamp, Duration, Errors).
