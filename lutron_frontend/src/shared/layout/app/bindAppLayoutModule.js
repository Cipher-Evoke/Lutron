let bindings = null;

export function bindAppLayoutModule(next) {
  bindings = next;
}

export function getAppLayoutBindings() {
  if (!bindings) {
    throw new Error("bindAppLayoutModule must be called before using shared app layout");
  }
  return bindings;
}

export function resetAppLayoutBindingsForTests() {
  bindings = null;
}
