/** True when arrow-key nav should not hijack keys (forms, menus, switches, etc.). */
export function isKeyboardNavBlockedTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest?.(
      [
        'input',
        'textarea',
        'select',
        '[contenteditable="true"]',
        '.ql-editor',
        '.MuiSelect-select',
        '.MuiInputBase-input',
        '.MuiSwitch-input',
        '[role="switch"]',
        '.MuiPopover-root',
        '.MuiMenu-root',
        '.MuiDialog-root',
        '.MuiModal-root',
      ].join(', ')
    )
  );
}
