import { Navigate, useLocation } from "react-router-dom";

/**
 * @param {{ children: import('react').ReactNode, allowedRoles?: string[], useAuth: () => object, deniedRedirect?: string }} props
 */
const AuthGuard = ({ children, allowedRoles, useAuth, deniedRedirect = "/dashboard/overview" }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={deniedRedirect} state={{ from: location }} replace />;
    }
  }
  return children;
};

export default AuthGuard;
