export function spaceLayoutRendererPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.activeTab !== nextProps.activeTab) return false;
  if (prevProps.layoutContext !== nextProps.layoutContext) return false;
  if (prevProps.adapter !== nextProps.adapter) return false;
  if (prevProps.runtime !== nextProps.runtime) return false;
  return true;
}
