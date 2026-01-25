import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';


interface ProtectedRouteProps {
    allowedRoles?: string[];
    redirectTo?: string;
}

const ProtectedRoute = ({ allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) => {
    const { user, token } = useAuthStore();

    if (!token || !user) {
        return <Navigate to={redirectTo} replace />;
    }

    const userRole = (user.role || '').toUpperCase().trim();
    const userDivision = (user.division || '').toUpperCase().trim();
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to their respective dashboard if they try to access a route they don't have permission for
        const homePath = userRole === 'CLIENTE' ? '/client/dashboard' : '/staff/dashboard';
        return <Navigate to={homePath} replace />;
    }

    // Additional check for division-specific routes (like LOGISTICA)
    if (allowedRoles && !allowedRoles.includes(userRole) && !allowedRoles.includes(userDivision)) {
        const homePath = userDivision === 'CLIENTE' ? '/client/dashboard' : '/staff/dashboard';
        return <Navigate to={homePath} replace />;
    }

    return (
        <>
            <Outlet />
        </>
    );
};

export default ProtectedRoute;
