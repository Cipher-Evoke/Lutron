import { useCallback, useEffect } from 'react';
import { validateEmailExport } from '../../export/emailExportGate';
import {
  buildSpaceExportApiParams,
  resolveSpaceExportActions,
  resolveSpaceExportMessages,
  runSpaceDownloadExport,
  runSpaceEmailExport,
} from './spaceExportResolvers';
import {
  buildSpaceExportLoadingKey,
  DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
  shouldCloseSpaceExportMenusOnOutsideClick,
  useSpaceExportMenuState,
} from './spaceExportMenuState';

export function useSpaceExports({
  dispatch,
  showSnackbar,
  userProfile,
  fetchEmailConfigs,
  showChartsTab = false,
  selection = {},
  thunks = {},
  messagePreset = 'basic',
  defaultDropdownState = DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
  outsideClickProfile = null,
  outsideClickEvent = 'mousedown',
}) {
  const messages = resolveSpaceExportMessages(messagePreset);
  const menuState = useSpaceExportMenuState(defaultDropdownState);
  const {
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    closeAllMenus,
    closeExportMenu,
    setExportActionLoading,
    isChartExportLoading,
  } = menuState;

  const handleExport = useCallback(
    async (action, chartTitle, dropdownKey = null) => {
      try {
        if (dropdownKey) {
          closeExportMenu(dropdownKey);
        }

        setExportActionLoading(chartTitle, action, true);

        const apiParams = buildSpaceExportApiParams(selection);
        const resolved = resolveSpaceExportActions(
          { showChartsTab, dropdownKey, chartTitle },
          thunks
        );

        if (action === 'email') {
          const validation = await validateEmailExport({
            dispatch,
            fetchEmailConfigs,
            userProfile,
            showSnackbar,
          });

          if (!validation.ok) {
            setExportActionLoading(chartTitle, 'email', false);
            return;
          }

          try {
            await runSpaceEmailExport({
              dispatch,
              emailThunk: resolved?.emailThunk,
              toEmail: validation.email,
              apiParams,
              showSnackbar,
              successMessage: messages.emailSuccess(chartTitle),
            });
          } catch (error) {
            showSnackbar('Failed to send email. Please try again.', 'error');
          } finally {
            setExportActionLoading(chartTitle, 'email', false);
          }
        } else if (action === 'download') {
          try {
            await runSpaceDownloadExport({
              dispatch,
              downloadThunk: resolved?.downloadThunk,
              apiParams,
              showSnackbar,
              successMessage: messages.downloadSuccess(chartTitle),
              rejectedFallback: messages.downloadRejected,
              catchMessage: messages.downloadCatch,
            });
          } finally {
            setExportActionLoading(chartTitle, 'download', false);
          }
        }
      } catch (error) {
        showSnackbar('Export failed. Please try again.', 'error');
        setExportActionLoading(chartTitle, action, false);
      }
    },
    [
      closeExportMenu,
      dispatch,
      fetchEmailConfigs,
      messages,
      selection,
      setExportActionLoading,
      showChartsTab,
      showSnackbar,
      thunks,
      userProfile,
    ]
  );

  useEffect(() => {
    if (!outsideClickProfile) return undefined;

    const handleClickOutside = (event) => {
      try {
        if (shouldCloseSpaceExportMenusOnOutsideClick(event, outsideClickProfile)) {
          closeAllMenus();
        }
      } catch (error) {
        const fallback =
          outsideClickProfile.closedState ||
          outsideClickProfile.fallbackClosedState ||
          defaultDropdownState;
        setShowExportDropdown({ ...fallback });
      }
    };

    document.addEventListener(outsideClickEvent, handleClickOutside);
    return () => {
      document.removeEventListener(outsideClickEvent, handleClickOutside);
    };
  }, [
    closeAllMenus,
    defaultDropdownState,
    outsideClickEvent,
    outsideClickProfile,
    setShowExportDropdown,
  ]);

  return {
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    handleExport,
    buildSpaceExportLoadingKey,
    isChartExportLoading,
    isEmailExportLoading: (chartTitle) => isChartExportLoading(chartTitle, 'email'),
    isDownloadExportLoading: (chartTitle) => isChartExportLoading(chartTitle, 'download'),
  };
}

export default useSpaceExports;
