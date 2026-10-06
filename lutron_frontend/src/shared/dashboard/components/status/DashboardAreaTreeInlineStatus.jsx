import React, { memo } from 'react';
import { dashboardAreaTreeInlineStatusPropsAreEqual } from './dashboardStatusMemoCompare';
import {
  DASHBOARD_AREA_TREE_EMPTY_DEFAULT_COLOR,
  DASHBOARD_AREA_TREE_ERROR_COLOR,
  DASHBOARD_AREA_TREE_ERROR_MESSAGE,
  DASHBOARD_AREA_TREE_INLINE_BASE_STYLE,
  DASHBOARD_AREA_TREE_LOADING_MESSAGE,
  resolveDashboardAreaTreeEmptyMessage,
} from './dashboardStatusTheme';

function DashboardAreaTreeInlineStatusInner({
  mode,
  textColor,
  isOperator = false,
  floorStatus,
}) {
  if (mode === 'loading') {
    return (
      <div
        style={{
          ...DASHBOARD_AREA_TREE_INLINE_BASE_STYLE,
          ...(textColor ? { color: textColor } : null),
        }}
        data-testid="dashboard-area-tree-inline-status"
        data-mode="loading"
      >
        {DASHBOARD_AREA_TREE_LOADING_MESSAGE}
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div
        style={{
          ...DASHBOARD_AREA_TREE_INLINE_BASE_STYLE,
          color: DASHBOARD_AREA_TREE_ERROR_COLOR,
        }}
        data-testid="dashboard-area-tree-inline-status"
        data-mode="error"
      >
        {DASHBOARD_AREA_TREE_ERROR_MESSAGE}
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div
        style={{
          ...DASHBOARD_AREA_TREE_INLINE_BASE_STYLE,
          color: textColor || DASHBOARD_AREA_TREE_EMPTY_DEFAULT_COLOR,
        }}
        data-testid="dashboard-area-tree-inline-status"
        data-mode="empty"
      >
        {resolveDashboardAreaTreeEmptyMessage(isOperator, floorStatus)}
      </div>
    );
  }

  return null;
}

const DashboardAreaTreeInlineStatus = memo(
  DashboardAreaTreeInlineStatusInner,
  dashboardAreaTreeInlineStatusPropsAreEqual
);

DashboardAreaTreeInlineStatus.displayName = 'DashboardAreaTreeInlineStatus';

export default DashboardAreaTreeInlineStatus;
