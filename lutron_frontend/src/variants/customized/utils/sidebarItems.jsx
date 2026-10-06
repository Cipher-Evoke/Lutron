export const SidebarItems = [
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

export const getVisibleSidebarItems = (role, userProfile = null) => {
  // Check if role is Superadmin (case-insensitive)
  if (role && (role === 'Superadmin' || role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin')) {
    // Superadmin can see all items except Manage Sensors and Manage Modules
    return SidebarItems.filter((i) => i !== 'Manage Sensors' && i !== 'Manage Modules');
  } else if (role === 'Admin') {
    // Admin can see Home, Theme, Manage Area Groups, Area Size & Load, Email Server, Users
    // Cannot see: Widgets, Floor, Help, Manage Sensors, Manage Modules, Alerts, Processors
    return SidebarItems.filter((i) => 
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
      // Hidden: Home, Theme, Widgets, Email Server, Floor, Help, Manage Sensors, Manage Modules, Alerts
      return SidebarItems.filter((i) => 
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
      // Hidden: Home, Theme, Widgets, Email Server, Floor, Help, Manage Sensors, Manage Modules, Alerts
      return SidebarItems.filter((i) => 
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
    // Hidden: Home, Theme, Widgets, Email Server, Floor, Help, Manage Sensors, Manage Modules, Alerts
    return SidebarItems.filter((i) => 
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
};
