import { Navigate, useLocation } from "react-router-dom";
import { UseAuth } from "./UseAuth";

// Usage:
// <AuthGuard>...</AuthGuard> → any authenticated user can access
// <AuthGuard allowedRoles={["Superadmin","Admin"]}>...</AuthGuard>
const AuthGuard = ({ children, allowedRoles }) => {
    const { isAuthenticated, role } = UseAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!role || !allowedRoles.includes(role)) {
            return <Navigate to="/dashboard" state={{ from: location }} replace />;
        }
    }
    return children;
};

export default AuthGuard;