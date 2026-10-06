let bindings = null;
export function bindScheduleSettingsModule(next) {
  bindings = next;
}
export function getScheduleSettingsBindings() {
  if (!bindings) throw new Error("bindScheduleSettingsModule must be called before using shared schedule settings screens");
  return bindings;
}
export function resetScheduleSettingsBindingsForTests() {
  bindings = null;
}
