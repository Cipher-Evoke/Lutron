import { useCallback, useEffect } from 'react';
import { validateEmailExport } from '../../export/emailExportGate';
import { createExportMenuOutsideClickHandler } from '../helpers/exportMenuUtils';
import {
  buildGroupEnergyExportApiParams,
  buildStandardEnergyExportApiParams,
  ENERGY_EXPORT_SUCCESS_MESSAGES,
  ENERGY_EXPORT_WIDGET_KEYS,
  resolveBuiltInEnergyExportActions,
  runCustomGraphEnergyExport,
  runEnergyDownloadExport,
  runEnergyEmailExport,
} from './exportActionResolvers';
import {
  buildExportLoadingKey,
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
  useExportMenuState,
} from './exportMenuState';

function useBuiltInWidgetExportHandlers({
  dispatch,
  showSnackbar,
  userProfile,
  fetchEmailConfigs,
  selection,
  calculateDateParameters,
  thunks,
  keys,
  widgetKey,
  messages,
  buildApiParams,
  menuState,
}) {
  const { beginExportAction, endExportAction } = menuState;
  const actions = resolveBuiltInEnergyExportActions(widgetKey, thunks);

  const handleEmail = useCallback(async () => {
    const emailLoadingKey = buildExportLoadingKey(keys.loadingPrefix, 'email');

    try {
      if (!actions?.emailThunk) {
        showSnackbar('Export is not available for this chart.', 'error');
        return;
      }

      beginExportAction(keys.menuCloseKey, emailLoadingKey);

      const validation = await validateEmailExport({
        dispatch,
        fetchEmailConfigs,
        userProfile,
        showSnackbar,
      });
      if (!validation.ok) {
        return;
      }

      const apiParams = buildApiParams();
      await runEnergyEmailExport({
        dispatch,
        emailThunk: actions.emailThunk,
        toEmail: validation.email,
        apiParams,
        showSnackbar,
        successMessage: messages.email,
      });
    } catch (error) {
      showSnackbar('Failed to send email. Please try again.', 'error');
    } finally {
      endExportAction(emailLoadingKey);
    }
  }, [
    actions?.emailThunk,
    beginExportAction,
    buildApiParams,
    dispatch,
    endExportAction,
    fetchEmailConfigs,
    keys.loadingPrefix,
    keys.menuCloseKey,
    messages.email,
    showSnackbar,
    userProfile,
  ]);

  const handleDownload = useCallback(async () => {
    const downloadLoadingKey = buildExportLoadingKey(keys.loadingPrefix, 'download');

    try {
      if (!actions?.downloadThunk) {
        showSnackbar('Export is not available for this chart.', 'error');
        return;
      }

      beginExportAction(keys.menuCloseKey, downloadLoadingKey);

      const apiParams = buildApiParams();
      await runEnergyDownloadExport({
        dispatch,
        downloadThunk: actions.downloadThunk,
        apiParams,
        showSnackbar,
        successMessage: messages.download,
      });
    } catch (error) {
      showSnackbar('Failed to download report. Please try again.', 'error');
    } finally {
      endExportAction(downloadLoadingKey);
    }
  }, [
    actions?.downloadThunk,
    beginExportAction,
    buildApiParams,
    dispatch,
    endExportAction,
    keys.loadingPrefix,
    keys.menuCloseKey,
    messages.download,
    showSnackbar,
  ]);

  return { handleEmail, handleDownload };
}

export function useDashboardExports({
  dispatch,
  showSnackbar,
  userProfile,
  fetchEmailConfigs,
  selection,
  calculateDateParameters,
  thunks,
  keys = {},
  outsideClickProfile = null,
  enableCustomGraphExport = false,
}) {
  const menuState = useExportMenuState();
  const {
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    exportDropdownRefs,
    closeAllMenus,
  } = menuState;

  const consumptionKeys = keys.consumption || DEFAULT_CONSUMPTION_EXPORT_KEYS;
  const savingsKeys = keys.savings || DEFAULT_SAVINGS_EXPORT_KEYS;
  const groupKeys = keys.totalConsumptionByGroup;

  const standardApiParams = useCallback(
    () => buildStandardEnergyExportApiParams(selection),
    [selection]
  );

  const groupApiParams = useCallback(
    () => buildGroupEnergyExportApiParams(selection, calculateDateParameters),
    [calculateDateParameters, selection]
  );

  const consumptionHandlers = useBuiltInWidgetExportHandlers({
    dispatch,
    showSnackbar,
    userProfile,
    fetchEmailConfigs,
    selection,
    calculateDateParameters,
    thunks,
    keys: consumptionKeys,
    widgetKey: ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION,
    messages: ENERGY_EXPORT_SUCCESS_MESSAGES.consumption,
    buildApiParams: standardApiParams,
    menuState,
  });

  const savingsHandlers = useBuiltInWidgetExportHandlers({
    dispatch,
    showSnackbar,
    userProfile,
    fetchEmailConfigs,
    selection,
    calculateDateParameters,
    thunks,
    keys: savingsKeys,
    widgetKey: ENERGY_EXPORT_WIDGET_KEYS.SAVINGS,
    messages: ENERGY_EXPORT_SUCCESS_MESSAGES.savings,
    buildApiParams: standardApiParams,
    menuState,
  });

  const groupHandlers = useBuiltInWidgetExportHandlers({
    dispatch,
    showSnackbar,
    userProfile,
    fetchEmailConfigs,
    selection,
    calculateDateParameters,
    thunks,
    keys: groupKeys,
    widgetKey: ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP,
    messages: ENERGY_EXPORT_SUCCESS_MESSAGES.totalConsumptionByGroup,
    buildApiParams: groupApiParams,
    menuState,
  });

  const handleEnergyCustomGraphExport = useCallback(
    async (action, graph) => {
      if (!enableCustomGraphExport) return;

      try {
        const apiParams = buildStandardEnergyExportApiParams(selection);
        const toEmail = userProfile?.email?.trim();

        await runCustomGraphEnergyExport({
          dispatch,
          showSnackbar,
          action,
          graph,
          apiParams,
          toEmail,
          thunks,
        });
      } catch (error) {
        showSnackbar('Export failed. Please try again.', 'error');
      }
    },
    [dispatch, enableCustomGraphExport, selection, showSnackbar, thunks, userProfile]
  );

  const handleExport = useCallback(async () => {
    // Legacy stub retained for parity with variant Dashboard.jsx
  }, []);

  useEffect(() => {
    if (!outsideClickProfile) return undefined;

    const handleClickOutside = createExportMenuOutsideClickHandler(
      closeAllMenus,
      outsideClickProfile
    );

    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeAllMenus, outsideClickProfile]);

  return {
    exportDropdownRefs,
    showExportDropdown,
    setShowExportDropdown,
    exportLoading,
    setExportLoading,
    handleExport,
    handleConsumptionEmail: consumptionHandlers.handleEmail,
    handleConsumptionDownload: consumptionHandlers.handleDownload,
    handleSavingsEmail: savingsHandlers.handleEmail,
    handleSavingsDownload: savingsHandlers.handleDownload,
    handleConsumptionByGroupEmail: groupHandlers.handleEmail,
    handleConsumptionByGroupDownload: groupHandlers.handleDownload,
    handleEnergyCustomGraphExport: enableCustomGraphExport
      ? handleEnergyCustomGraphExport
      : undefined,
  };
}
