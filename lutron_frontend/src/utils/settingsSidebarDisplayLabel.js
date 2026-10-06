/** Display-only settings sidebar labels (canonical RBAC keys stay unchanged). */
export function getSettingsSidebarDisplayLabel(label) {
  if (label == null) return label;
  const key = String(label);
  if (key === 'Floor') return 'Floors';
  return label;
}
