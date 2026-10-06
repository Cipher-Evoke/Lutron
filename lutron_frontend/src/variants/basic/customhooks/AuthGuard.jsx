/** Phase 5.1 re-export wrapper */
import AuthGuardBase from "../../../shared/auth/AuthGuard";
import { UseAuth } from "./UseAuth";

const AuthGuard = ({ children, allowedRoles }) => (
  <AuthGuardBase
    useAuth={UseAuth}
    allowedRoles={allowedRoles}
    deniedRedirect={"/dashboard/overview"}
  >
    {children}
  </AuthGuardBase>
);

export default AuthGuard;
