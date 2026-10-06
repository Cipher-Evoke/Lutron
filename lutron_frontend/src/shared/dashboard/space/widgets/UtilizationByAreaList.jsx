import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { processUtilizationByAreaRows } from '../transforms/processUtilizationByAreaRows';
import { UtilizationByAreaRow } from './UtilizationByAreaRow';
import {
  resolveUtilizationByAreaListShellSx,
  resolveUtilizationByAreaShellSx,
  resolveUtilizationByAreaTheme,
  resolveUtilizationByAreaViewState,
  UTILIZATION_BY_AREA_LAYOUT_MODES,
  UTILIZATION_BY_AREA_THEME_PRESETS,
} from './utilizationByAreaTheme';
import { utilizationByAreaListPropsAreEqual } from './utilizationByAreaMemoCompare';

function ListSpinner({ theme }) {
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        border: `3px solid ${theme.spinOuter}`,
        borderTop: `3px solid ${theme.spinTop}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

function UtilizationByAreaListInner({
  payload,
  processOptions = {},
  dataLoading = false,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
  shellVariant = UTILIZATION_BY_AREA_THEME_PRESETS.basic,
  chartSurface = 'dark',
  customizedTheme = 'default',
  layoutMode = UTILIZATION_BY_AREA_LAYOUT_MODES.scroll,
  emptyMessage = 'No data available for Utilization By Area',
  isLargeScreen = false,
}) {
  const theme = useMemo(
    () =>
      resolveUtilizationByAreaTheme({
        preset: shellVariant,
        chartSurface,
        customizedTheme,
      }),
    [shellVariant, chartSurface, customizedTheme]
  );

  const rows = useMemo(
    () => processUtilizationByAreaRows(payload, processOptions),
    [payload, processOptions]
  );

  const viewState = useMemo(
    () =>
      resolveUtilizationByAreaViewState({
        payload,
        rows,
        dataLoading,
        anyLoading,
        isLoading,
        globalLoadingProp,
      }),
    [payload, rows, dataLoading, anyLoading, isLoading, globalLoadingProp]
  );

  const shellSx = useMemo(
    () => resolveUtilizationByAreaShellSx(layoutMode, theme),
    [layoutMode, theme]
  );

  const listShellSx = useMemo(
    () => resolveUtilizationByAreaListShellSx(layoutMode, { preset: shellVariant }),
    [layoutMode, shellVariant]
  );

  const messageFontSx = {
    color: theme.textColor,
    fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
  };

  if (viewState === 'loading' || viewState === 'pending') {
    return (
      <Box sx={shellSx}>
        <ListSpinner theme={theme} />
      </Box>
    );
  }

  if (viewState === 'empty' || viewState === 'no-rows') {
    return (
      <Box sx={{ ...shellSx, ...messageFontSx }}>
        {emptyMessage}
      </Box>
    );
  }

  const listBody = (
    <Box sx={listShellSx}>
      {rows.map((area, index) => (
        <UtilizationByAreaRow
          key={`${area.name}-${index}`}
          area={area}
          theme={theme}
          isLargeScreen={isLargeScreen}
        />
      ))}
    </Box>
  );

  if (shellVariant !== UTILIZATION_BY_AREA_THEME_PRESETS.advanced) {
    return listBody;
  }

  return (
    <Box
      sx={{
        ...shellSx,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      }}
    >
      {listBody}
    </Box>
  );
}

export const UtilizationByAreaList = React.memo(
  UtilizationByAreaListInner,
  utilizationByAreaListPropsAreEqual
);

export default UtilizationByAreaList;
