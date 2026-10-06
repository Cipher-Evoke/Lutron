import React from 'react';

function Spinner({ theme }) {
  return (
    <div
      style={{
        ...theme.spinnerStyle,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

export function LightPowerDensityCard({ status, display, theme, isLargeScreen = false }) {
  const basePanelStyle = {
    backgroundColor: theme.panelBg,
    borderRadius: status === 'loading' ? theme.loadingBorderRadius : theme.readyBorderRadius,
    padding: status === 'loading' ? theme.loadingPadding : theme.readyPadding,
    textAlign: 'center',
    boxSizing: 'border-box',
    ...(theme.panelBorder ? { border: theme.panelBorder } : {}),
    ...(theme.fillContainer
      ? {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      : {}),
  };

  if (status === 'loading') {
    return (
      <div style={basePanelStyle}>
        <Spinner theme={theme} />
      </div>
    );
  }

  const valueFontSize = isLargeScreen ? '20px' : '18px';
  const subtitleFontSize = isLargeScreen ? '12px' : '11px';

  return (
    <div
      style={{
        ...basePanelStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: theme.fillContainer ? '100%' : '100%',
      }}
    >
      <div
        style={{
          fontSize: valueFontSize,
          fontWeight: 700,
          color: theme.valueColor,
          marginBottom: '6px',
          lineHeight: 1.25,
          wordWrap: 'break-word',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {display.value} {display.unit}
      </div>
      {theme.showUnitSubtitle && display.unit ? (
        <div
          style={{
            fontSize: subtitleFontSize,
            color: theme.subtitleColor,
            fontWeight: 500,
            fontFamily: 'inherit',
            minHeight: '1em',
          }}
        >
          {display.unit}
        </div>
      ) : (
        <div
          style={{
            fontSize: subtitleFontSize,
            color: theme.subtitleColor,
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        />
      )}
    </div>
  );
}

export default LightPowerDensityCard;
