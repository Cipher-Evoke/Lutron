import React from 'react';

function PeakMinLoader({ theme }) {
  return (
    <div
      style={{
        ...theme.loaderSpinnerStyle,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
      }}
    />
  );
}

function MetricPanel({
  label,
  isLoading,
  display,
  theme,
  isLargeScreen,
}) {
  const labelFontSize = isLargeScreen ? '14px' : '13px';
  const valueFontSize = isLargeScreen ? '20px' : '18px';
  const timeFontSize = isLargeScreen ? '12px' : '11px';
  const isBasicStretch = theme.panelLayout === 'basic-stretch';

  const panelStyle = {
    flex: 1,
    height: isBasicStretch ? '100%' : undefined,
    alignSelf: isBasicStretch ? 'stretch' : undefined,
    backgroundColor: theme.panelBg,
    borderRadius: '12px',
    padding: isBasicStretch ? '14px 16px' : '16px 14px',
    textAlign: 'center',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: isLoading ? 'center' : isBasicStretch ? 'flex-start' : 'center',
    boxSizing: 'border-box',
    minHeight: isBasicStretch ? 0 : undefined,
    ...(theme.panelBorder ? { border: theme.panelBorder } : {}),
  };

  const valueStyle = isBasicStretch
    ? {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: isLargeScreen ? '52px' : '48px',
        fontSize: valueFontSize,
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.4,
        wordWrap: 'break-word',
        overflow: 'visible',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        paddingTop: '4px',
        paddingBottom: '4px',
      }
    : {
        fontSize: valueFontSize,
        fontWeight: 700,
        color: '#fff',
        marginBottom: '6px',
        lineHeight: 1.25,
        wordWrap: 'break-word',
        overflow: 'hidden',
        fontFamily: 'inherit',
      };

  const timeStyle = {
    flexShrink: 0,
    fontSize: timeFontSize,
    color: theme.timeColor,
    fontWeight: 500,
    fontFamily: 'inherit',
    minHeight: isBasicStretch ? '1.25em' : '1em',
    lineHeight: isBasicStretch ? 1.35 : undefined,
  };

  return (
    <div style={panelStyle}>
      <div
        style={{
          flexShrink: 0,
          margin: isBasicStretch ? '0 0 6px 0' : undefined,
          fontSize: labelFontSize,
          color: '#fff',
          fontWeight: 600,
          fontFamily: 'inherit',
          lineHeight: 1.3,
          ...(isBasicStretch ? {} : { marginBottom: '8px' }),
        }}
      >
        {label}
      </div>
      <div style={valueStyle}>
        {isLoading ? <PeakMinLoader theme={theme} /> : display?.valueText}
      </div>
      <div style={timeStyle}>{isLoading ? '' : display?.timeText}</div>
    </div>
  );
}

export function PeakMinConsumptionCard({
  isLoading = false,
  peakDisplay = null,
  minDisplay = null,
  theme,
  isLargeScreen = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: theme.rowGap,
        flex: 1,
        minHeight: 0,
        width: '100%',
        alignItems: 'stretch',
      }}
    >
      <MetricPanel
        label="Peak Load"
        isLoading={isLoading}
        display={peakDisplay}
        theme={theme}
        isLargeScreen={isLargeScreen}
      />
      <MetricPanel
        label="Min Load"
        isLoading={isLoading}
        display={minDisplay}
        theme={theme}
        isLargeScreen={isLargeScreen}
      />
    </div>
  );
}

export default PeakMinConsumptionCard;
