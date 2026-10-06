function shallowEqualPanelStyle(a = {}, b = {}) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

export function areExportMenuActionsEqual(prev = [], next = []) {
  if (prev.length !== next.length) return false;
  return prev.every((action, index) => {
    const other = next[index];
    return (
      action.key === other.key &&
      action.label === other.label &&
      action.loadingLabel === other.loadingLabel &&
      action.loading === other.loading &&
      action.disabled === other.disabled &&
      action.onClick === other.onClick
    );
  });
}

export function areExportMenuPanelPropsEqual(prev, next) {
  return (
    prev.className === next.className &&
    prev.panelDataAttribute === next.panelDataAttribute &&
    prev.innerRef === next.innerRef &&
    prev.useEmoji === next.useEmoji &&
    shallowEqualPanelStyle(prev.panelStyle, next.panelStyle) &&
    shallowEqualPanelStyle(prev.itemDefaults, next.itemDefaults) &&
    areExportMenuActionsEqual(prev.actions, next.actions) &&
    prev.children === next.children
  );
}
