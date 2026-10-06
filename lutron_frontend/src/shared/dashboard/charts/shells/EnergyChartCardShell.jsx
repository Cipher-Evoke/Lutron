import React from 'react';

const PLOT_EVENT_HANDLERS = {
  onMouseDown: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onMouseUp: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onClick: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onDoubleClick: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onContextMenu: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
};

const BASIC_ENERGY_SLOT = {
  width: '100%',
  minHeight: 360,
  height: 360,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: 0,
};

const BASIC_HEADER_ROW = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  flexShrink: 0,
};

const BASIC_PLOT_FLEX = {
  flex: 1,
  minHeight: 0,
  borderRadius: '4px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

/**
 * Loading / empty / ready card chrome for energy line charts.
 */
export function EnergyChartCardShell({
  status,
  shellVariant,
  theme,
  title,
  dynamicUnit = '',
  emptyMessage,
  emptyStateVariant = 'message',
  emptyStateExtras = null,
  exportControl = null,
  children,
  loaderLight = false,
  loaderHeight = '100%',
  outerStyleOverride = {},
  titleStyleOverride = {},
  plotStyleOverride = {},
  loaderMessage,
  blankChartPreview = null,
  LoaderComponent,
  cardClassName,
  cardHeaderStyle = {},
}) {
  if (shellVariant === 'basic-energy') {
    const outerStyle = {
      ...BASIC_ENERGY_SLOT,
      backgroundColor: theme.outerBg,
      border: theme.outerBorder,
      ...outerStyleOverride,
    };
    const titleStyle = {
      margin: 0,
      color: theme.header,
      ...titleStyleOverride,
    };
    const plotStyle = {
      ...BASIC_PLOT_FLEX,
      backgroundColor: theme.plotBg,
      border: theme.plotBorder,
      ...plotStyleOverride,
    };

    if (status === 'loading') {
      return (
        <div style={outerStyle}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyle}>{title}</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {LoaderComponent ? (
              <LoaderComponent height={loaderHeight} message={loaderMessage} light={loaderLight} />
            ) : null}
          </div>
        </div>
      );
    }

    if (status === 'empty') {
      const blank = emptyStateVariant === 'blank';
      return (
        <div style={{ ...outerStyle, textAlign: 'center', color: theme.emptyText }}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyle}>{title}</h3>
          </div>
          {emptyStateExtras}
          <div
            style={{
              ...plotStyle,
              alignItems: blank ? 'stretch' : 'center',
              justifyContent: blank ? 'stretch' : 'center',
              fontSize: '14px',
            }}
          >
            {blank ? blankChartPreview : emptyMessage}
          </div>
        </div>
      );
    }

    return (
      <div style={outerStyle}>
        <div style={BASIC_HEADER_ROW}>
          <h3 style={titleStyle}>{title}</h3>
          <div style={{ position: 'relative' }}>{exportControl}</div>
        </div>
        <div style={{ ...plotStyle, padding: '10px' }} {...PLOT_EVENT_HANDLERS}>
          {children}
        </div>
      </div>
    );
  }

  if (shellVariant === 'advanced-card') {
    const cardStyle = {
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      ...outerStyleOverride,
    };

    if (status === 'loading') {
      return (
        <div className={cardClassName || 'chart-card-animated'} style={cardStyle}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyleOverride}>{title}</h3>
          </div>
          {LoaderComponent ? (
            <LoaderComponent height="300px" message={loaderMessage} />
          ) : null}
        </div>
      );
    }

    if (status === 'empty') {
      return (
        <div className={cardClassName || 'chart-card-animated'} style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyleOverride}>{title}</h3>
          </div>
          <div
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: theme.emptyText,
              fontSize: '14px',
            }}
          >
            {emptyMessage}
          </div>
        </div>
      );
    }

    return (
      <div className={cardClassName || 'chart-card-animated'} style={cardStyle}>
        <div style={BASIC_HEADER_ROW}>
          <h3 style={titleStyleOverride}>{title}</h3>
          <div style={{ position: 'relative' }}>{exportControl}</div>
        </div>
        <div
          style={{
            height: '420px',
            minHeight: '380px',
            border: theme.plotBorder,
            borderRadius: '4px',
            backgroundColor: theme.plotBg,
            padding: '10px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            ...plotStyleOverride,
          }}
          {...PLOT_EVENT_HANDLERS}
        >
          {children}
        </div>
      </div>
    );
  }

  // customized-builtin
  const cardStyle = outerStyleOverride;
  const headerRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    ...cardHeaderStyle,
  };
  const titleTextStyle = {
    margin: 0,
    color: theme.header,
    ...titleStyleOverride,
  };

  if (status === 'loading') {
    const titleText = dynamicUnit ? `${title} (${dynamicUnit})` : title;
    return (
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <h3 style={titleTextStyle}>{titleText}</h3>
        </div>
        {LoaderComponent ? (
          <LoaderComponent height={loaderHeight} message={loaderMessage} />
        ) : null}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <h3 style={titleTextStyle}>{title}</h3>
        </div>
        <div style={plotStyleOverride}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <h3 style={titleTextStyle}>{title}</h3>
        <div style={{ position: 'relative' }}>{exportControl}</div>
      </div>
      <div style={plotStyleOverride} {...PLOT_EVENT_HANDLERS}>
        {children}
      </div>
    </div>
  );
}
