const pageHandlers = {};
let topbarFocusHandler = null;

export function registerPageSubNavHandler(pageId, handler) {
  pageHandlers[pageId] = handler;
  return () => {
    if (pageHandlers[pageId] === handler) {
      delete pageHandlers[pageId];
    }
  };
}

export function registerTopbarNavFocusHandler(handler) {
  topbarFocusHandler = handler;
  return () => {
    if (topbarFocusHandler === handler) {
      topbarFocusHandler = null;
    }
  };
}

export function requestTopbarNavFocus(label) {
  topbarFocusHandler?.(label);
}

export function focusPageSubNav(pageId, options) {
  pageHandlers[pageId]?.(options);
}

let settingsSidebarFocusHandler = null;
let settingsHomeTabFocusHandler = null;

export function registerSettingsSidebarFocusHandler(handler) {
  settingsSidebarFocusHandler = handler;
  return () => {
    if (settingsSidebarFocusHandler === handler) {
      settingsSidebarFocusHandler = null;
    }
  };
}

export function requestSettingsSidebarFocus(label) {
  settingsSidebarFocusHandler?.(label);
}

export function registerSettingsHomeTabFocusHandler(handler) {
  settingsHomeTabFocusHandler = handler;
  return () => {
    if (settingsHomeTabFocusHandler === handler) {
      settingsHomeTabFocusHandler = null;
    }
  };
}

export function focusSettingsHomeTab(tabKey) {
  settingsHomeTabFocusHandler?.(tabKey);
}
