import { getVisibleSidebarItems } from "../utils/sidebarItems";
import { BASIC_SETTINGS_SIDEBAR_PATHS } from "../utils/basicSettingsPaths";

/** Phase 5.1 — core auth in shared, sidebar RBAC variant-specific */
export { UseAuth, isSuperadminRole, getOverallPermissionLevel } from "../../../shared/auth/useAuthCore";

export const getVisibleSidebarItemsWithPaths = (role, userProfile = null) =>
    getVisibleSidebarItems(role, userProfile).map((label) => ({
        label,
        path: BASIC_SETTINGS_SIDEBAR_PATHS[label],
    }));

