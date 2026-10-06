import { useState, useRef, useCallback } from 'react';
import {
  closeAllExportMenus,
  setExportMenuOpen,
  toggleExportMenuState,
} from '../helpers/exportMenuUtils';

export function buildExportLoadingKey(prefix, action) {
  return `${prefix}_${action}`;
}

export const DEFAULT_CONSUMPTION_EXPORT_KEYS = {
  menuCloseKey: 'Consumption',
  loadingPrefix: 'Consumption',
};

export const DEFAULT_SAVINGS_EXPORT_KEYS = {
  menuCloseKey: 'Savings',
  loadingPrefix: 'Savings',
};

export function createGroupExportKeys({ menuCloseKey, loadingPrefix }) {
  return { menuCloseKey, loadingPrefix };
}

export function createBasicGroupExportKeys(groupExportKey) {
  return createGroupExportKeys({
    menuCloseKey: groupExportKey,
    loadingPrefix: groupExportKey,
  });
}

export function createAdvancedGroupExportKeys() {
  return createGroupExportKeys({
    menuCloseKey: 'Consumption By Area Groups',
    loadingPrefix: 'Consumption by Group',
  });
}

export function toggleEnergyExportMenuState(setShowExportDropdown, menuKey, event) {
  if (event) {
    event.stopPropagation();
  }
  setShowExportDropdown((prev) => ({
    ...prev,
    [menuKey]: !prev[menuKey],
  }));
}

export function useExportMenuState() {
  const [showExportDropdown, setShowExportDropdown] = useState({});
  const [exportLoading, setExportLoading] = useState({});
  const exportDropdownRefs = useRef({});

  const closeExportMenu = useCallback((menuKey) => {
    setShowExportDropdown((prev) => setExportMenuOpen(prev, menuKey, false));
  }, []);

  const toggleExportMenu = useCallback((menuKey) => {
    setShowExportDropdown((prev) => toggleExportMenuState(prev, menuKey));
  }, []);

  const closeAllMenus = useCallback(() => {
    setShowExportDropdown(closeAllExportMenus());
  }, []);

  const beginExportAction = useCallback((menuKey, loadingKey) => {
    setExportLoading((prev) => ({ ...prev, [loadingKey]: true }));
    setShowExportDropdown((prev) => setExportMenuOpen(prev, menuKey, false));
  }, []);

  const endExportAction = useCallback((loadingKey) => {
    setExportLoading((prev) => ({ ...prev, [loadingKey]: false }));
  }, []);

  const isExportActionLoading = useCallback(
    (prefix, action) => Boolean(exportLoading[buildExportLoadingKey(prefix, action)]),
    [exportLoading]
  );

  return {
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    exportDropdownRefs,
    closeExportMenu,
    toggleExportMenu,
    closeAllMenus,
    beginExportAction,
    endExportAction,
    isExportActionLoading,
  };
}
