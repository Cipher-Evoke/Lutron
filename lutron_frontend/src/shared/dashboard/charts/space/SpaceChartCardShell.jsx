import React from 'react';
import {
  SPACE_LINE_EMPTY_MESSAGE,
  SPACE_LINE_ERROR_MESSAGE,
} from './spaceLineChartConfig';

function Spinner({ theme }) {
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

function shellFrameStyle(theme, plotHeightStyle) {
  const heightStyle =
    plotHeightStyle === 'flexFill'
      ? { height: '100%', minHeight: 0 }
      : plotHeightStyle === 'basicFixed280'
        ? { height: '320px' }
        : { height: '350px' };

  return {
    ...heightStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: theme.plotBorder,
    borderRadius: '4px',
    backgroundColor: theme.emptyBg,
    background: theme.emptyBg,
    color: theme.emptyColor,
    fontSize: '14px',
    ...(theme.shellStyle || {}),
  };
}

export function SpaceChartCardShell({ status, theme, plotHeightStyle, children }) {
  if (status === 'loading') {
    return (
      <div style={shellFrameStyle(theme, plotHeightStyle)}>
        <Spinner theme={theme} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={shellFrameStyle(theme, plotHeightStyle)}>{SPACE_LINE_ERROR_MESSAGE}</div>
    );
  }

  if (status === 'empty') {
    return (
      <div style={shellFrameStyle(theme, plotHeightStyle)}>{SPACE_LINE_EMPTY_MESSAGE}</div>
    );
  }

  return children;
}

export default SpaceChartCardShell;
