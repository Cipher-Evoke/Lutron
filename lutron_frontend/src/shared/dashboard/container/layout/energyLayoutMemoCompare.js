export function energyLayoutRendererPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.layoutMode !== nextProps.layoutMode) return false;
  if (prevProps.rows !== nextProps.rows) return false;
  if (prevProps.cards !== nextProps.cards) return false;
  if (prevProps.context !== nextProps.context) return false;
  if (prevProps.adapter !== nextProps.adapter) return false;
  if (prevProps.adapterRuntime !== nextProps.adapterRuntime) return false;
  if (prevProps.theme !== nextProps.theme) return false;
  if (prevProps.gridOptions !== nextProps.gridOptions) return false;
  return true;
}
