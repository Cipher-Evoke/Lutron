export const DASHBOARD_ERROR_BANNER_STYLE = {
  padding: '20px',
  textAlign: 'center',
  color: '#d32f2f',
  backgroundColor: '#ffebee',
  borderRadius: '4px',
};

export const DASHBOARD_OPERATOR_NO_FLOORS_PANEL_STYLE = {
  padding: '40px 20px',
  textAlign: 'center',
  backgroundColor: 'rgba(255, 235, 238, 0.8)',
  borderRadius: '8px',
  border: '1px solid #ffcdd2',
  margin: '20px 0',
};

export const DASHBOARD_OPERATOR_NO_FLOORS_TITLE_STYLE = {
  color: '#d32f2f',
  margin: '0 0 16px 0',
};

export const DASHBOARD_OPERATOR_NO_FLOORS_BODY_STYLE = {
  color: '#d32f2f',
  margin: '0 0 16px 0',
  fontSize: '16px',
};

export const DASHBOARD_OPERATOR_NO_FLOORS_FOOTER_STYLE = {
  fontSize: '14px',
  color: '#666',
};

export const DASHBOARD_AREA_TREE_INLINE_BASE_STYLE = {
  padding: '10px',
  textAlign: 'center',
};

export const DASHBOARD_AREA_TREE_ERROR_COLOR = 'red';

export const DASHBOARD_AREA_TREE_EMPTY_DEFAULT_COLOR = '#666';

export const DASHBOARD_AREA_TREE_LOADING_MESSAGE = 'Loading floors...';

export const DASHBOARD_AREA_TREE_ERROR_MESSAGE = 'Error loading data. Please try again.';

export const DASHBOARD_AREA_TREE_OPERATOR_EMPTY_MESSAGE =
  'No floors assigned to your operator account. Please contact your administrator.';

export const DASHBOARD_AREA_TREE_DEFAULT_EMPTY_MESSAGE = 'No floors available';

export const DASHBOARD_OPERATOR_NO_FLOORS_TITLE = 'No Floors Available';

export const DASHBOARD_OPERATOR_NO_FLOORS_BODY =
  'Your operator account does not have access to any floors. Please contact your administrator to assign floors to your account.';

export const DASHBOARD_OPERATOR_NO_FLOORS_FOOTER =
  'This ensures you can only view and manage areas within your assigned scope.';

export function resolveDashboardAreaTreeEmptyMessage(isOperator, floorStatus) {
  return isOperator && floorStatus === 'succeeded'
    ? DASHBOARD_AREA_TREE_OPERATOR_EMPTY_MESSAGE
    : DASHBOARD_AREA_TREE_DEFAULT_EMPTY_MESSAGE;
}
