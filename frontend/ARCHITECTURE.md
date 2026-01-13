# 7Pet Frontend Architecture

## Service Layer & Dependency Injection

The application uses a lightweight Dependency Injection (DI) system to decouple UI components from direct API calls. This improves testability, maintainability, and code organization.

### Structure

- **`src/services/api.ts`**: The core Axios instance with interceptors for Auth and Error handling.
- **`src/services/domains/`**: Domain-specific services (e.g., `AppointmentsService`, `CustomersService`).
- **`src/services/index.ts`**: Factory function (`createServices`) that instantiates all services with the core API dependency.
- **`src/context/ServicesContext.tsx`**: React Context Provider that exposes the service instances to the component tree.

### How to Use

Instead of importing `api` directly:

```tsx
// ❌ Avoid
import api from '../../services/api';
const response = await api.get('/users');

// ✅ Use Services
import { useServices } from '../../context/ServicesContext';

export default function MyComponent() {
    const { users: usersService } = useServices();

    useEffect(() => {
        usersService.list().then(setUsers);
    }, []);
}
```

### Adding a New Service

1. Create `src/services/domains/myDomain.service.ts`.
2. Define the class receiving `AxiosInstance` in constructor.
3. Add it to `Services` interface and `createServices` factory in `src/services/index.ts`.
4. Access it via `useServices()`.

### Principles

- **Thin Services**: Services should focus on API communication and data normalization logic.
- **No UI Logic**: Avoid handling toasts or navigation inside services (use hooks or components for that).
- **Typed Responses**: Always return strongly typed Promises (e.g., `Promise<User[]>`).
