export function createVisibilityOrderSignature(visibleOrder) {
  return Array.isArray(visibleOrder) ? visibleOrder.join(',') : '';
}

export function hasVisibilityOrderSignatureChanged(previousSignature, visibleOrder) {
  const nextSignature = createVisibilityOrderSignature(visibleOrder);
  return Boolean(previousSignature) && previousSignature !== nextSignature;
}
