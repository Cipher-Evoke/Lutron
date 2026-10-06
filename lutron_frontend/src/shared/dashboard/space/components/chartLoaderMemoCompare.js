export function chartLoaderPropsAreEqual(prevProps, nextProps) {
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.message !== nextProps.message) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.fullWidth !== nextProps.fullWidth) return false;
  if (prevProps.minHeight !== nextProps.minHeight) return false;
  return true;
}
