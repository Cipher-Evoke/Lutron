import { jwtDecode } from "jwt-decode";

// Returns a consistent auth info object for use across the app
// { isAuthenticated, userId, name, role }
export const UseAuth = () => {
    const token = localStorage.getItem("lutron");
    const storedRole = localStorage.getItem("role");


    if (!token) {
        return { isAuthenticated: false, userId: null, name: null, email: null, role: null };
    }

    try {
        const decoded = jwtDecode(token);
        const { id, name, role: roleFromToken, permission, sub } = decoded || {};
        const role = storedRole || roleFromToken || null;
        const storedPermission = localStorage.getItem("permission");
        const userPermission = storedPermission || permission || null;
        
        
        return {
            isAuthenticated: true,
            userId: id || null,
            name: name || null,
            email: sub || null, // Extract email from 'sub' field
            role,
            permission: userPermission,
        };
    } catch (error) {
        // If decoding fails, clear invalid token and return unauthenticated
        localStorage.removeItem("lutron");
        return { isAuthenticated: false, userId: null, name: null, email: null, role: null };
    }
};

// Helper function to determine overall permission level from floor permissions
export const getOverallPermissionLevel = (userProfile) => {
    if (!userProfile || !userProfile.floors || userProfile.floors.length === 0) {
        return null;
    }
    
    // Check for highest permission level across all floors
    const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
    if (hasMonitorControlEdit) {
        return 'Monitoring, edit and control';
    }
    
    const hasMonitorControl = userProfile.floors.some(f => f.floor_permission === 'monitor_control');
    if (hasMonitorControl) {
        return 'Monitoring and control';
    }
    
    const hasMonitor = userProfile.floors.some(f => f.floor_permission === 'monitor');
    if (hasMonitor) {
        return 'Monitoring Only';
    }
    
    return null;
};

// Helper function to get visible sidebar items with their paths based on user role
export const getVisibleSidebarItemsWithPaths = (role, userProfile = null) => {
    const allSidebarItems = [
        "Home",
        "Theme", 
        "Rename Widget",
        "Manage Area Groups",
        "Area Size & Load",
        "Email Server",
        "Users",
        "Floor",
        "Manage Sensors",
        "Manage Modules",
        "Alerts",
        "Help",
    ];

    const allPaths = {
        "Home": "/main",
        "Theme": "/theme-change",
        "Rename Widget": "/rename-widget/",
        "Manage Area Groups": "/manage-area-groups",
        "Area Size & Load": "/area-size-load",
        "Email Server": "/email-server/",
        "Users": "/users",
        "Floor": "/floor",
        "Manage Sensors": "/manage-sensors",
        "Manage Modules": "/manage-modules",
        "Alerts": "/alerts",
        "Help": "/create-help/",
    };

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
        // Cannot see: Rename Widget, Floor, Help, Manage Sensors, Manage Modules, Alerts
        const adminItems = allSidebarItems.filter(item => 
            item !== 'Rename Widget' && 
            item !== 'Floor' && 
            item !== 'Help' &&
            item !== 'Alerts' &&
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
            // Hidden: Home, Theme, Rename Widget, Email Server, Floor, Help, Manage Sensors, Manage Modules, Alerts
            const operatorItems = allSidebarItems.filter(item => 
                item !== 'Home' && 
                item !== 'Theme' && 
                item !== 'Rename Widget' && 
                item !== 'Email Server' && 
                item !== 'Floor' && 
                item !== 'Help' &&
                item !== 'Alerts' &&
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
            // Hidden: Home, Theme, Rename Widget, Email Server, Floor, Help, Manage Sensors, Manage Modules, Alerts
            const operatorItems = allSidebarItems.filter(item => 
                item !== 'Home' && 
                item !== 'Theme' && 
                item !== 'Rename Widget' && 
                item !== 'Email Server' && 
                item !== 'Floor' && 
                item !== 'Help' &&
                item !== 'Alerts' &&
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
        // Hidden: Home, Theme, Rename Widget, Email Server, Floor, Manage Sensors, Manage Modules, Alerts
        const operatorItems = allSidebarItems.filter(item => 
            item !== 'Home' && 
            item !== 'Theme' && 
            item !== 'Rename Widget' && 
            item !== 'Email Server' && 
            item !== 'Floor' &&
            item !== 'Help' &&
            item !== 'Alerts' &&
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
