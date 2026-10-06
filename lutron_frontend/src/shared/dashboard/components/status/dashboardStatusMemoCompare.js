export function dashboardErrorBannerPropsAreEqual(prevProps, nextProps) {
  if (prevProps.error !== nextProps.error) return false;
  return true;
}

export function dashboardOperatorNoFloorsPanelPropsAreEqual() {
  return true;
}

export function dashboardAreaTreeInlineStatusPropsAreEqual(prevProps, nextProps) {
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.textColor !== nextProps.textColor) return false;
  if (prevProps.isOperator !== nextProps.isOperator) return false;
  if (prevProps.floorStatus !== nextProps.floorStatus) return false;
  return true;
}
