export function spaceUtilizationContainerPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.activeTab !== nextProps.activeTab) return false;
  if (prevProps.adapter !== nextProps.adapter) return false;
  if (prevProps.runtime !== nextProps.runtime) return false;
  if (prevProps.orchestration !== nextProps.orchestration) return false;
  return true;
}
