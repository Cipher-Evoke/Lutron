export function dashboardLayoutRendererPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.activeTab !== nextProps.activeTab) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.sections !== nextProps.sections) return false;
  if (prevProps.adapter !== nextProps.adapter) return false;
  return true;
}
