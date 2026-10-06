import React, { memo } from 'react';
import { dashboardOperatorNoFloorsPanelPropsAreEqual } from './dashboardStatusMemoCompare';
import {
  DASHBOARD_OPERATOR_NO_FLOORS_BODY,
  DASHBOARD_OPERATOR_NO_FLOORS_BODY_STYLE,
  DASHBOARD_OPERATOR_NO_FLOORS_FOOTER,
  DASHBOARD_OPERATOR_NO_FLOORS_FOOTER_STYLE,
  DASHBOARD_OPERATOR_NO_FLOORS_PANEL_STYLE,
  DASHBOARD_OPERATOR_NO_FLOORS_TITLE,
  DASHBOARD_OPERATOR_NO_FLOORS_TITLE_STYLE,
} from './dashboardStatusTheme';

function DashboardOperatorNoFloorsPanelInner() {
  return (
    <div style={DASHBOARD_OPERATOR_NO_FLOORS_PANEL_STYLE} data-testid="dashboard-operator-no-floors-panel">
      <h3 style={DASHBOARD_OPERATOR_NO_FLOORS_TITLE_STYLE}>{DASHBOARD_OPERATOR_NO_FLOORS_TITLE}</h3>
      <p style={DASHBOARD_OPERATOR_NO_FLOORS_BODY_STYLE}>{DASHBOARD_OPERATOR_NO_FLOORS_BODY}</p>
      <div style={DASHBOARD_OPERATOR_NO_FLOORS_FOOTER_STYLE}>{DASHBOARD_OPERATOR_NO_FLOORS_FOOTER}</div>
    </div>
  );
}

const DashboardOperatorNoFloorsPanel = memo(
  DashboardOperatorNoFloorsPanelInner,
  dashboardOperatorNoFloorsPanelPropsAreEqual
);

DashboardOperatorNoFloorsPanel.displayName = 'DashboardOperatorNoFloorsPanel';

export default DashboardOperatorNoFloorsPanel;
