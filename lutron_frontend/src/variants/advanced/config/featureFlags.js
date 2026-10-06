// Feature flags - toggle these between `true` and `false` to enable/disable features.
//
// SHOW_OVERVIEW_TAB
//   true  -> Overview tab is visible in the dashboard tab strip and accessible at
//            /dashboard/overview. Default landing page is /dashboard/overview.
//   false -> Overview tab is hidden from the dashboard tab strip. Visiting
//            /dashboard or /dashboard/overview redirects to /dashboard/energy.
//            (No code is removed - just flip this back to `true` whenever you
//             want Overview back, no other changes required.)
export const SHOW_OVERVIEW_TAB = false;

// Advanced only: hide in-page pill strip (Overview / Energy / Space / Alerts).
// Routes and overview tile navigation still work. Set false to restore the strip.
export const HIDE_DASHBOARD_VIEW_TABS = false;

export const ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS = true;
