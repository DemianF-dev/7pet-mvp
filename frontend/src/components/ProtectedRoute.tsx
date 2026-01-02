import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ClientTutorial from './client/ClientTutorial';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    redirectTo?: string;
}

const ProtectedRoute = ({ allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) => {
    const { user, token } = useAuthStore();

    if (!token || !user) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access a route they don't have permission for
        const homePath = user.role === 'CLIENTE' ? '/client/dashboard' : '/staff/dashboard';
        return <Navigate to={homePath} replace />;
    }

    return (
        <>
            {user.role === 'CLIENTE' && <ClientTutorial />}
            <Outlet />
        </>
    );
};

export default ProtectedRoute;
