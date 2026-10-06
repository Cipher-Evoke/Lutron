export function spaceStatusPanelPropsAreEqual(prevProps, nextProps) {
  if (prevProps.tone !== nextProps.tone) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.subtitle !== nextProps.subtitle) return false;
  if (prevProps.children !== nextProps.children) return false;
  return true;
}

export function spaceErrorPanelPropsAreEqual(prevProps, nextProps) {
  if (prevProps.message !== nextProps.message) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.subtitle !== nextProps.subtitle) return false;
  return true;
}

export function spaceEmptyPanelPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.subtitle !== nextProps.subtitle) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  return true;
}
