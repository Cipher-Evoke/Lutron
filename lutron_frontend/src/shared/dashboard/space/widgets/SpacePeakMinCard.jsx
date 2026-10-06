import React from 'react';
import { Box } from '@mui/material';

function PeakMinSpinner({ theme }) {
  return (
    <div
      style={{
        ...theme.loaderSpinnerStyle,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

export function SpacePeakMinCard({
  variant,
  label,
  isLoading = false,
  valueText = '',
  timeText = '',
  theme,
  isLargeScreen = false,
}) {
  const isPeak = variant === 'peak';
  const resolvedLabel = label || (isPeak ? 'Peak Occupancy' : 'Min Occupancy');
  const isBasicStretch = theme.panelLayout === 'basic-stretch';
  const isCenteredFixed = theme.panelLayout === 'centered-fixed';

  const labelSx = isBasicStretch
    ? {
        flexShrink: 0,
        margin: '0 0 6px 0',
        fontSize: isLargeScreen ? '14px' : '13px',
        color: '#fff',
        fontWeight: 600,
        fontFamily: 'inherit',
        lineHeight: 1.3,
      }
    : {
        margin: '0 0 8px 0',
        fontSize: isLargeScreen ? '14px' : '13px',
        color: '#fff',
        fontWeight: 600,
        fontFamily: 'inherit',
      };

  const valueSx = isBasicStretch
    ? {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: isLargeScreen ? '52px' : '48px',
        fontSize: isLargeScreen ? '20px' : '18px',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.4,
        wordWrap: 'break-word',
        overflow: 'visible',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        py: 0.5,
      }
    : {
        fontSize: isLargeScreen ? '20px' : '18px',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '6px',
        lineHeight: 1.25,
        wordWrap: 'break-word',
        overflow: 'hidden',
        fontFamily: 'inherit',
      };

  const timeSx = isBasicStretch
    ? {
        flexShrink: 0,
        fontSize: isLargeScreen ? '12px' : '11px',
        color: theme.timeColor,
        fontWeight: 500,
        fontFamily: 'inherit',
        minHeight: '1.25em',
        lineHeight: 1.35,
      }
    : {
        fontSize: isLargeScreen ? '12px' : '11px',
        color: theme.timeColor,
        fontWeight: 500,
        fontFamily: 'inherit',
      };

  const panelSx = {
    flex: isCenteredFixed ? '1 1 0' : 1,
    minWidth: isCenteredFixed ? 0 : undefined,
    height: isCenteredFixed ? '100%' : isBasicStretch ? '100%' : undefined,
    alignSelf: isBasicStretch ? 'stretch' : undefined,
    backgroundColor: theme.panelBg,
    borderRadius: '12px',
    padding: theme.panelPadding,
    textAlign: 'center',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: isLoading
      ? 'center'
      : isBasicStretch
        ? 'flex-start'
        : 'center',
    boxSizing: 'border-box',
    minHeight: isLoading && theme.loadingMinHeight ? theme.loadingMinHeight : isBasicStretch ? 0 : undefined,
    ...(theme.panelBorder ? { border: theme.panelBorder } : {}),
  };

  return (
    <Box sx={panelSx}>
      <Box component="h4" sx={labelSx}>
        {resolvedLabel}
      </Box>
      {isLoading ? (
        <PeakMinSpinner theme={theme} />
      ) : (
        <>
          <Box sx={valueSx}>{valueText}</Box>
          <Box sx={timeSx}>{timeText}</Box>
        </>
      )}
    </Box>
  );
}

export default SpacePeakMinCard;
