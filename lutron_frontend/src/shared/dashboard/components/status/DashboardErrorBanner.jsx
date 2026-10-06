import React, { memo } from 'react';
import { dashboardErrorBannerPropsAreEqual } from './dashboardStatusMemoCompare';
import { DASHBOARD_ERROR_BANNER_STYLE } from './dashboardStatusTheme';

function DashboardErrorBannerInner({ error }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : 'An error occurred';

  return (
    <div style={DASHBOARD_ERROR_BANNER_STYLE} data-testid="dashboard-error-banner">
      Error: {message}
    </div>
  );
}

const DashboardErrorBanner = memo(DashboardErrorBannerInner, dashboardErrorBannerPropsAreEqual);

DashboardErrorBanner.displayName = 'DashboardErrorBanner';

export default DashboardErrorBanner;
