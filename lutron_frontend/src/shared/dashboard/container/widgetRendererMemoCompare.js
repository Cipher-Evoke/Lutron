export function dashboardWidgetRendererPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.widgetKey !== nextProps.widgetKey) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.visible !== nextProps.visible) return false;
  if (prevProps.context !== nextProps.context) return false;
  return true;
}
