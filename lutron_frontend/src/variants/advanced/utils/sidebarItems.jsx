import { SETTINGS_SIDEBAR_ITEM_ORDER, sortSettingsSidebarNavItems } from "./settingsSidebarTabStyles";

export const SidebarItems = [...SETTINGS_SIDEBAR_ITEM_ORDER];

export const getVisibleSidebarItems = (role, userProfile = null) => {
  let visible;

  // Check if role is Superadmin (case-insensitive)
  if (role && (role === 'Superadmin' || role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin')) {
    // Superadmin can see all items except Manage Sensors and Manage Modules
    visible = SidebarItems.filter((i) => i !== 'Manage Sensors' && i !== 'Manage Modules');
  } else if (role === 'Admin') {
    // Admin can see Home, Theme, Manage Area Groups, Area Size & Load, Email Server, Users
    // Cannot see: Rename Widget, Floor, Help, FOFP, Manage Sensors, Manage Modules, Alerts
    visible = SidebarItems.filter((i) => 
      i !== 'Widgets' && 
      i !== 'Floor' && 
      i !== 'Help' &&
      i !== 'Alerts' &&
      i !== 'Processors' &&
      i !== 'Maintenance' &&
      i !== 'Application Monitoring' &&
      i !== 'FOFP' &&
      i !== 'Manage Sensors' &&
      i !== 'Manage Modules'
    );
  } else if (role === 'Operator') {
    // For Operators, check if they have monitor_control_edit permission
    const hasMonitorControlEdit = userProfile && userProfile.floors && 
      userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
    
    if (hasMonitorControlEdit) {
      // Operator-Monitor-Control-and-Edit: Can see Manage Area Groups, Area Size & Load, Users
      visible = SidebarItems.filter((i) => 
        i !== 'Home' && 
        i !== 'Theme' && 
        i !== 'Widgets' && 
        i !== 'Email Server' && 
        i !== 'Floor' && 
        i !== 'Help' &&
        i !== 'Alerts' &&
        i !== 'Processors' &&
        i !== 'Maintenance' &&
        i !== 'Application Monitoring' &&
        i !== 'FOFP' &&
        i !== 'Manage Sensors' &&
        i !== 'Manage Modules'
      );
    } else {
      // Other Operators: Can only see Manage Area Groups, Area Size & Load, Users
      visible = SidebarItems.filter((i) => 
        i !== 'Home' && 
        i !== 'Theme' && 
        i !== 'Widgets' && 
        i !== 'Email Server' && 
        i !== 'Floor' && 
        i !== 'Help' &&
        i !== 'Alerts' &&
        i !== 'Processors' &&
        i !== 'Maintenance' &&
        i !== 'Application Monitoring' &&
        i !== 'FOFP' &&
        i !== 'Manage Sensors' &&
        i !== 'Manage Modules'
      );
    }
  } else {
    // Default: Operator (any type) can only see restricted items
    visible = SidebarItems.filter((i) => 
      i !== 'Home' && 
      i !== 'Theme' && 
      i !== 'Widgets' && 
      i !== 'Email Server' && 
      i !== 'Floor' && 
      i !== 'Help' &&
      i !== 'Alerts' &&
      i !== 'Processors' &&
      i !== 'Maintenance' &&
      i !== 'Application Monitoring' &&
      i !== 'FOFP' &&
      i !== 'Manage Sensors' &&
      i !== 'Manage Modules'
    );
  }

  return sortSettingsSidebarNavItems(visible);
};
