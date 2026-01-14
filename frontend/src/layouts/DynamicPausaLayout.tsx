import { useAuthStore } from '../store/authStore';
import AppShell from './AppShell';
import ClientAppShell from './ClientAppShell';

/**
 * Dynamic layout that chooses the correct shell (Client vs Staff)
 * based on the current user's role.
 * Useful for shared routes like /pausa that need to persist navigation.
 */
export default function DynamicPausaLayout() {
    const { user } = useAuthStore();
    const isClient = user?.role === 'CLIENTE';

    if (isClient) {
        return <ClientAppShell />;
    }

    return <AppShell />;
}
