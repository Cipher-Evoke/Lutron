export function spaceWidgetRendererPropsAreEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;
  if (prevProps.widgetKey !== nextProps.widgetKey) return false;
  if (prevProps.visible !== nextProps.visible) return false;
  if (prevProps.chartLoaderHeight !== nextProps.chartLoaderHeight) return false;
  if (prevProps.context !== nextProps.context) return false;
  if (prevProps.overrides !== nextProps.overrides) return false;
  return true;
}
