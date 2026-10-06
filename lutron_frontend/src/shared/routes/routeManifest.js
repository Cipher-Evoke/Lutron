/**
 * Route metadata manifest — Phase 5.1
 * Generated from variant App.js files. Does not drive routing yet.
 */
export const ROUTE_MANIFEST = [
  {
    "path": "/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/activity-report",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/alerts",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/area-calculation/:floorId",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/area-size-load/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/auth/change_password",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/correct-coordinate/:floorId",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/create-area-group/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/create-area-groups/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/create-area-model",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/create-help/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/createfloor",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/createusers",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/dashboard",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/dashboard/alerts",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/dashboard/energy",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/dashboard/overview",
    "basic": true,
    "advanced": true,
    "customized": false,
    "shared": false
  },
  {
    "path": "/dashboard/space-utilization",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/dashboard/spaceutilization",
    "basic": true,
    "advanced": true,
    "customized": false,
    "shared": false
  },
  {
    "path": "/editfloor/:floorId",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/email-server/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/floor",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/fofp",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/get-help/",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/heatmap",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/login",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/lutron",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/main",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/manage-area-groups",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/manage-modules",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/manage-sensors",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/processors",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/quickcontrols",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/quickcontrols/:id",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/quickcontrols/create",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/rename-widget/",
    "basic": true,
    "advanced": true,
    "customized": false,
    "shared": false
  },
  {
    "path": "/schedule/add-event",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/schedule/details/:id",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/theme-change",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/update-area-group/:id",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/update-area-groups/:id",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/users",
    "basic": true,
    "advanced": true,
    "customized": true,
    "shared": true
  },
  {
    "path": "/widgets/",
    "basic": false,
    "advanced": false,
    "customized": true,
    "shared": false
  }
];

export const VARIANT_ROUTE_DIFFS = {
  dashboardLanding: {
    basic: "/dashboard/overview",
    advanced: "/dashboard/overview",
    customized: "conditional (dashboardLanding.js)",
  },
  widgetSettings: {
    basic: "/rename-widget/",
    advanced: "/rename-widget/",
    customized: "/widgets/",
  },
  themeSettings: {
    basic: "ThemeChangeWithFofp",
    advanced: "ThemeChangeWithFofp",
    customized: "ThemeChange",
  },
  lutronHome: {
    basic: "LutronWebsiteComponent",
    advanced: "LutronPublicHome",
    customized: "LutronWebsiteComponent",
  },
  spaceUtilizationPath: {
    basic: "/dashboard/spaceutilization",
    advanced: "/dashboard/spaceutilization",
    customized: "/dashboard/space-utilization",
  },
};

export function getSharedRoutes() {
  return ROUTE_MANIFEST.filter((r) => r.shared);
}

export function getVariantOnlyRoutes(variant) {
  return ROUTE_MANIFEST.filter((r) => r[variant] && !r.shared);
}
