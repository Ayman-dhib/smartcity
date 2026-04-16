import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api.types';

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Option 1: Show access denied page (current behavior)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Your role: {user.role.replace('_', ' ')}
                    </p>
                </div>
            </div>
        );

        // Option 2: Redirect to role-specific dashboard (uncomment if preferred)
        /*
        let redirectPath = '/';
        switch (user.role) {
            case 'CITIZEN':
                redirectPath = '/';
                break;
            case 'TECHNICIAN':
                redirectPath = '/technician-dashboard';
                break;
            case 'USER_ADMIN':
                redirectPath = '/user-admin-dashboard';
                break;
            case 'MAINTENANCE_ADMIN':
                redirectPath = '/maintenance-admin-dashboard';
                break;
        }
        return <Navigate to={redirectPath} replace />;
        */
    }

    return <>{children}</>;
}