import React, { memo } from 'react';
import { Box } from '@mui/material';
import DashboardWidgetRenderer from '../DashboardWidgetRenderer';
import { WIDGET_SHELL_TYPES } from './layoutTypes';

function renderMetricHeader(shellProps) {
  const {
    headerTitle,
    headerTitleStyle,
    headerControl,
    headerMarginBottom = '20px',
    headerRowStyle,
    headerTrailing,
  } = shellProps;

  if (shellProps.renderHeader) {
    return shellProps.renderHeader;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: headerMarginBottom,
        ...headerRowStyle,
      }}
    >
      {typeof headerTitle === 'string' ? (
        <h3 style={headerTitleStyle}>{headerTitle}</h3>
      ) : (
        headerTitle
      )}
      {headerControl || headerTrailing || null}
    </div>
  );
}

function WidgetSlotRendererInner({
  widgetKey,
  context,
  variant,
  shellType = WIDGET_SHELL_TYPES.NONE,
  shellProps = {},
  children,
}) {
  const widget =
    children ||
    (widgetKey ? (
      <DashboardWidgetRenderer widgetKey={widgetKey} variant={variant} context={context} />
    ) : null);

  if (!shellType || shellType === WIDGET_SHELL_TYPES.NONE) {
    return widget;
  }

  const {
    outerStyle,
    outerSx,
    outerClassName,
    useBoxOuter,
    bodyContent,
    bodyStyle,
    bodySx,
    shellLayout,
    positionRelative,
  } = shellProps;

  const body = bodyContent !== undefined ? bodyContent : widget;

  if (useBoxOuter) {
    return (
      <Box
        sx={{
          ...outerSx,
          ...(positionRelative ? { position: 'relative' } : {}),
        }}
      >
        {renderMetricHeader(shellProps)}
        {shellLayout === 'header-body' ? body : (
          <Box sx={bodySx} style={bodyStyle}>
            {body}
          </Box>
        )}
      </Box>
    );
  }

  if (shellType === WIDGET_SHELL_TYPES.COMPACT_PANEL) {
    return (
      <div style={outerStyle} className={outerClassName}>
        {shellProps.renderHeader || (
          <div style={shellProps.headerRowStyle}>
            {typeof shellProps.headerTitle === 'string' ? (
              <h3 style={shellProps.headerTitleStyle}>{shellProps.headerTitle}</h3>
            ) : (
              shellProps.headerTitle
            )}
            {shellProps.headerControl}
          </div>
        )}
        <div style={shellProps.innerStyle}>{body}</div>
      </div>
    );
  }

  if (shellProps.skipInnerWrapper) {
    return (
      <div style={outerStyle} className={outerClassName}>
        {renderMetricHeader(shellProps)}
        {body}
      </div>
    );
  }

  return (
    <div style={outerStyle} className={outerClassName}>
      {renderMetricHeader(shellProps)}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          ...bodyStyle,
        }}
      >
        <Box sx={bodySx}>{body}</Box>
      </div>
    </div>
  );
}

const WidgetSlotRenderer = memo(WidgetSlotRendererInner);
WidgetSlotRenderer.displayName = 'WidgetSlotRenderer';

export default WidgetSlotRenderer;
