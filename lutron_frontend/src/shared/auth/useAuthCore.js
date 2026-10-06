import { jwtDecode } from "jwt-decode";

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
      email: sub || null,
      role,
      permission: userPermission,
    };
  } catch (error) {
    localStorage.removeItem("lutron");
    return { isAuthenticated: false, userId: null, name: null, email: null, role: null };
  }
};

export const isSuperadminRole = (role) => {
  if (!role) return false;
  return role === "Superadmin" || role.toLowerCase() === "superadmin" || role.toLowerCase() === "super admin";
};

export const getOverallPermissionLevel = (userProfile) => {
  if (!userProfile || !userProfile.floors || userProfile.floors.length === 0) return null;
  const hasMonitorControlEdit = userProfile.floors.some((f) => f.floor_permission === "monitor_control_edit");
  if (hasMonitorControlEdit) return "Monitoring, edit and control";
  const hasMonitorControl = userProfile.floors.some((f) => f.floor_permission === "monitor_control");
  if (hasMonitorControl) return "Monitoring and control";
  const hasMonitor = userProfile.floors.some((f) => f.floor_permission === "monitor");
  if (hasMonitor) return "Monitoring Only";
  return null;
};
