# Service Management Enhancements

## Features Added

### 1. Duplicate Service Functionality
- **Frontend (`ServiceManager.tsx`):**
    - Added a "Copy" (Duplicate) button to each service card using the `Copy` icon from Lucide.
    - Implemented `handleDuplicate(service)`:
        - Opens the modal in "Create" mode (clearing `editingService`).
        - Pre-fills the form with the original service's data.
        - Appends " (Cópia)" to the service name to distinguish it immediately.
- **Why:** Allows staff to quickly create variations of services (e.g., "Banho P", "Banho M") without re-typing descriptions and prices.

### 2. Duplicate Name Prevention (Validation)
- **Backend (`serviceRoutes.ts`):**
    - **Create (POST):** Added a check `prisma.service.findFirst({ where: { name } })`. If a service with the same name exists, it returns a `400 Bad Request` with the error: "Já existe um serviço com este nome."
    - **Update (PATCH):** Added a similar check, but uses `NOT: { id }` to ensure we don't block saving a service if it keeps its *own* name, only if it tries to take the name of *another* existing service.
- **Frontend Error Handling:**
    - Updated `handleSubmit` to display the specific error message from the backend (`error.response?.data?.error`) in the alert, instead of a generic "Error" message.

## Verification
- **Test Duplicate:** Click the copy icon. A modal opens with "Name (Cópia)". Click Save. It should work.
- **Test Rename Conflict:** Try to rename "Service A" to "Service B" (if Service B already exists). It should show an alert: "Já existe um serviço com este nome."
- **Test Create Conflict:** Try to create a new service with an existing name. It should show the same alert.
