import { isKeyboardNavBlockedTarget } from "../../../utils/keyboard/keyboardNavUtils";
import { isBasicSettingsAppRoute } from "./basicSettingsPaths";

/**
 * Basic variant settings sidebar keyboard — recognizes `/setting/*` routes.
 */
const api = {
  navItemKeys: [],
  navItems: [],
  isTablet: false,
  pathname: "",
  keyboardNavKey: "",
  itemRefs: { current: {} },
  navigate: null,
  onUpFromFirst: null,
  onRightFromHome: null,
};

let attached = false;

export function isSettingsSidebarNavBlockedTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  if (target.closest?.(".settings-sidebar-nav-track")) return false;

  const typing = target.closest?.(
    'textarea, .ql-editor, [contenteditable="true"]'
  );
  if (typing) return true;

  const input = target.closest?.("input");
  if (!input) return false;

  const type = (input.getAttribute("type") || "text").toLowerCase();
  if (type === "checkbox" || type === "radio" || type === "button" || type === "submit") {
    return false;
  }
  return true;
}

function focusSidebarItem(label) {
  requestAnimationFrame(() => {
    api.itemRefs.current?.[label]?.focus({ preventScroll: true });
  });
}

export function activateSettingsSidebarItem(label) {
  if (!label || !api.navItemKeys.includes(label)) return;

  api.keyboardNavKey = label;
  const item = api.navItems.find((entry) => entry.label === label);
  if (item?.path && api.navigate) {
    api.navigate(item.path);
  }
  focusSidebarItem(label);
}

function getCurrentKey() {
  if (api.keyboardNavKey && api.navItemKeys.includes(api.keyboardNavKey)) {
    return api.keyboardNavKey;
  }
  return api.navItemKeys[0] || "";
}

function moveSidebar(step) {
  const currentKey = getCurrentKey();
  const currentIndex = api.navItemKeys.indexOf(currentKey);
  if (currentIndex < 0) return;

  const nextIndex = Math.max(0, Math.min(api.navItemKeys.length - 1, currentIndex + step));
  const nextKey = api.navItemKeys[nextIndex];
  if (!nextKey || nextKey === currentKey) return;

  activateSettingsSidebarItem(nextKey);
}

function handleSettingsSidebarWindowKeyDown(event) {
  if (!isBasicSettingsAppRoute(api.pathname)) return;

  const prevKey = api.isTablet ? "ArrowLeft" : "ArrowUp";
  const nextKey = api.isTablet ? "ArrowRight" : "ArrowDown";

  if (event.key !== prevKey && event.key !== nextKey) return;
  if (event.target?.closest?.(".settings-sidebar-nav-track")) return;
  if (isSettingsSidebarNavBlockedTarget(event.target)) return;
  if (event.target?.closest?.(".topbar-main-nav")) return;

  const currentLabel = getCurrentKey();
  if (!currentLabel || !api.navItemKeys.includes(currentLabel)) return;

  const firstLabel = api.navItemKeys[0];

  if (!api.isTablet && event.key === "ArrowUp" && currentLabel === firstLabel) {
    event.preventDefault();
    event.stopPropagation();
    api.onUpFromFirst?.();
    return;
  }

  if (api.isTablet && event.key === "ArrowLeft" && currentLabel === firstLabel) {
    event.preventDefault();
    event.stopPropagation();
    api.onUpFromFirst?.();
    return;
  }

  if (event.key === "ArrowRight" && currentLabel === "Home") {
    const normalizedPath = api.pathname.replace(/\/$/, "") || "/";
    if (normalizedPath === "/main" || normalizedPath === "/setting/main") {
      event.preventDefault();
      event.stopPropagation();
      api.onRightFromHome?.();
      return;
    }
  }

  event.preventDefault();
  event.stopPropagation();

  if (event.key === nextKey) {
    moveSidebar(1);
  } else {
    moveSidebar(-1);
  }
}

function attachListener() {
  if (attached) return;
  attached = true;
  window.addEventListener("keydown", handleSettingsSidebarWindowKeyDown, true);
}

export function syncSettingsSidebarKeyboardApi(partial) {
  Object.assign(api, partial);
  if (partial.keyboardNavKey) {
    api.keyboardNavKey = partial.keyboardNavKey;
  }
  attachListener();
}

export function getSettingsSidebarKeyboardNavKey() {
  return api.keyboardNavKey;
}
