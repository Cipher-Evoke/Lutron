let bindings = null;
export function bindUsersSettingsModule(next) {
  bindings = next;
}
export function getUsersSettingsBindings() {
  if (!bindings) throw new Error("bindUsersSettingsModule must be called before using shared users settings screens");
  return bindings;
}
export function resetUsersSettingsBindingsForTests() {
  bindings = null;
}
