import {
  SETTINGS_SIDEBAR_ITEM_ORDER,
  sortSettingsSidebarNavItems,
} from "../utils/settingsSidebarTabStyles";
import { ADVANCED_SETTINGS_SIDEBAR_PATHS } from "../utils/advancedSettingsPaths";

/** Phase 5.1 — core auth in shared, sidebar RBAC variant-specific */
export { UseAuth, isSuperadminRole, getOverallPermissionLevel } from "../../../shared/auth/useAuthCore";

export const getVisibleSidebarItemsWithPaths = (role, userProfile = null) => {
    const allSidebarItems = [
        "Home",
        "Theme", 
        "Widgets",
        "Manage Area Groups",
        "Area Size & Load",
        "Email Server",
        "Users",
        "Floor",
        "Manage Sensors",
        "Manage Modules",
        "Alerts",
        "Processors",
        "Maintenance",
        "Application Monitoring",
        "FOFP",
        "Help",
    ];

    const allPaths = ADVANCED_SETTINGS_SIDEBAR_PATHS;

    // Check if role is Superadmin (case-insensitive)
    if (role && (role === 'Superadmin' || role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin')) {
        // Superadmin can see all items except Manage Sensors and Manage Modules
        const superadminItems = allSidebarItems.filter(item => 
            item !== 'Manage Sensors' &&
            item !== 'Manage Modules'
        );
        const result = superadminItems.map(item => ({
            label: item,
            path: allPaths[item]
        }));
        return result;
    } else if (role === 'Admin') {
        // Admin can see Home, Theme, Manage Area Groups, Area Size & Load, Email Server, Users
        // Cannot see: Rename Widget, Floor, Help, FOFP, Manage Sensors, Manage Modules, Alerts
        const adminItems = allSidebarItems.filter(item => 
            item !== 'Widgets' && 
            item !== 'Floor' && 
            item !== 'Help' &&
            item !== 'Alerts' &&
            item !== 'Processors' &&
            item !== 'Maintenance' &&
            item !== 'Application Monitoring' &&
            item !== 'FOFP' &&
            item !== 'Manage Sensors' &&
            item !== 'Manage Modules'
        );
        const result = adminItems.map(item => ({
            label: item,
            path: allPaths[item]
        }));
        return result;
    } else if (role === 'Operator') {
        // For Operators, check if they have monitor_control_edit permission
        const hasMonitorControlEdit = userProfile && userProfile.floors && 
          userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
        
        if (hasMonitorControlEdit) {
            // Operator-Monitor-Control-and-Edit: Can see Manage Area Groups, Area Size & Load, Users
            // Hidden: Home, Theme, Rename Widget, Email Server, Floor, Help, FOFP, Manage Sensors, Manage Modules, Alerts
            const operatorItems = allSidebarItems.filter(item => 
                item !== 'Home' && 
                item !== 'Theme' && 
                item !== 'Widgets' && 
                item !== 'Email Server' && 
                item !== 'Floor' && 
                item !== 'Help' &&
                item !== 'Alerts' &&
                item !== 'Processors' &&
                item !== 'Maintenance' &&
                item !== 'Application Monitoring' &&
                item !== 'FOFP' &&
                item !== 'Manage Sensors' &&
                item !== 'Manage Modules'
            );
            const result = operatorItems.map(item => ({
                label: item,
                path: allPaths[item]
            }));
            return result;
        } else {
            // Other Operators: Can only see Manage Area Groups, Area Size & Load, Users
            // Hidden: Home, Theme, Rename Widget, Email Server, Floor, Help, FOFP, Manage Sensors, Manage Modules, Alerts
            const operatorItems = allSidebarItems.filter(item => 
                item !== 'Home' && 
                item !== 'Theme' && 
                item !== 'Widgets' && 
                item !== 'Email Server' && 
                item !== 'Floor' && 
                item !== 'Help' &&
                item !== 'Alerts' &&
                item !== 'Processors' &&
                item !== 'Maintenance' &&
                item !== 'Application Monitoring' &&
                item !== 'FOFP' &&
                item !== 'Manage Sensors' &&
                item !== 'Manage Modules'
            );
            const result = operatorItems.map(item => ({
                label: item,
                path: allPaths[item]
            }));
            return result;
        }
    } else {
        // Default: Operator (any type) can only see restricted items based on RBAC definitions
        // From image: Operators can see Manage Area Groups, Area Size & Load, Users, Help
        // Hidden: Home, Theme, Rename Widget, Email Server, Floor, FOFP, Manage Sensors, Manage Modules, Alerts
        const operatorItems = allSidebarItems.filter(item => 
            item !== 'Home' && 
            item !== 'Theme' && 
            item !== 'Widgets' && 
            item !== 'Email Server' && 
            item !== 'Floor' &&
            item !== 'Help' &&
            item !== 'Alerts' &&
            item !== 'Processors' &&
            item !== 'Maintenance' &&
            item !== 'Application Monitoring' &&
            item !== 'FOFP' &&
            item !== 'Manage Sensors' &&
            item !== 'Manage Modules'
        );
        const result = operatorItems.map(item => ({
            label: item,
            path: allPaths[item]
        }));
        return result;
    }
};

