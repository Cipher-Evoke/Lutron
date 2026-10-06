import { useCallback, useState } from 'react';
import { setExportMenuOpen } from '../../container/helpers/exportMenuUtils';

export const DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC = {
  line: false,
  pie: false,
  table: false,
  peak: false,
  instant: false,
  instantCombined: false,
};

export const DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD = {
  line: false,
  pie: false,
  table: false,
  peak: false,
  instant: false,
};

export function buildSpaceExportLoadingKey(chartTitle, action) {
  return `${chartTitle}_${action}`;
}

export function createSpaceExportOutsideClickProfile(chartExportDropdownClass) {
  return {
    buttonSelector: '[data-chart-export="true"]',
    panelSelectors: [`.${chartExportDropdownClass}`, '.alerts-export-dropdown'],
    fallbackClosedState: { line: false, pie: false, table: false, peak: false },
  };
}

export const SPACE_EXPORT_OUTSIDE_CLICK_PROFILES = {
  basic: {
    buttonSelector: 'button[data-export-menu]',
    panelSelector: '[data-export-dropdown-panel]',
    closedState: DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC,
  },
  customized: {
    variant: 'space-customized',
    closedState: DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
  },
};

function isSpaceCustomizedExportTarget(event) {
  const exportButton = event.target.closest('button');
  const isExportButton =
    exportButton &&
    exportButton.textContent &&
    exportButton.textContent.includes('Export');

  const positioned = event.target.closest('div[style*="position: absolute"]');
  const isInsideDropdown =
    positioned &&
    positioned.style &&
    positioned.style.backgroundColor === 'rgb(205, 192, 160)';

  return Boolean(isExportButton || isInsideDropdown);
}

export function shouldCloseSpaceExportMenusOnOutsideClick(event, profile) {
  if (!event || !profile) return false;

  if (profile.variant === 'space-customized') {
    return !isSpaceCustomizedExportTarget(event);
  }

  const isExportButton = profile.buttonSelector
    ? Boolean(event.target.closest(profile.buttonSelector))
    : false;

  let isInsideDropdown = false;
  if (profile.panelSelector) {
    isInsideDropdown = Boolean(event.target.closest(profile.panelSelector));
  } else if (Array.isArray(profile.panelSelectors)) {
    isInsideDropdown = profile.panelSelectors.some((selector) =>
      Boolean(event.target.closest(selector))
    );
  }

  return !isExportButton && !isInsideDropdown;
}

export function useSpaceExportMenuState(initialClosedState = DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD) {
  const [showExportDropdown, setShowExportDropdown] = useState({ ...initialClosedState });
  const [exportLoading, setExportLoading] = useState({});

  const closeAllMenus = useCallback(() => {
    setShowExportDropdown({ ...initialClosedState });
  }, [initialClosedState]);

  const closeExportMenu = useCallback((dropdownKey) => {
    if (!dropdownKey) return;
    setShowExportDropdown((prev) => setExportMenuOpen(prev, dropdownKey, false));
  }, []);

  const setExportActionLoading = useCallback((chartTitle, action, isLoading) => {
    const key = buildSpaceExportLoadingKey(chartTitle, action);
    setExportLoading((prev) => ({ ...prev, [key]: isLoading }));
  }, []);

  const isChartExportLoading = useCallback(
    (chartTitle, action) => Boolean(exportLoading[buildSpaceExportLoadingKey(chartTitle, action)]),
    [exportLoading]
  );

  return {
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    closeAllMenus,
    closeExportMenu,
    setExportActionLoading,
    isChartExportLoading,
  };
}
