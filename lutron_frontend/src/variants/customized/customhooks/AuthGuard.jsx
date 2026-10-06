/** Phase 5.1 re-export wrapper */
import AuthGuardBase from "../../../shared/auth/AuthGuard";
import { UseAuth } from "./UseAuth";
import { DASHBOARD_DEFAULT_PATH } from "../utils/dashboardLanding";

const AuthGuard = ({ children, allowedRoles }) => (
  <AuthGuardBase
    useAuth={UseAuth}
    allowedRoles={allowedRoles}
    deniedRedirect={DASHBOARD_DEFAULT_PATH}
  >
    {children}
  </AuthGuardBase>
);

export default AuthGuard;
