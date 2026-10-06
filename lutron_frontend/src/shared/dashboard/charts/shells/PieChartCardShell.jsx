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
 * Loading / empty / error / ready card chrome for consumption pie charts.
 */
export function PieChartCardShell({
  status,
  shellVariant,
  theme,
  title,
  emptyMessage,
  errorMessage,
  zeroSegmentsMessage,
  exportControl = null,
  children,
  loaderLight = false,
  loaderHeight = '100%',
  loaderMessage,
  LoaderComponent,
  outerStyleOverride = {},
  titleStyleOverride = {},
  plotStyleOverride = {},
  cardShellStyle = {},
  cardHeaderStyle = {},
}) {
  if (shellVariant === 'basic-energy') {
    const outerStyle = {
      ...BASIC_ENERGY_SLOT,
      ...(theme.outerBg != null ? { backgroundColor: theme.outerBg, border: theme.outerBorder } : {}),
      ...outerStyleOverride,
    };
    const titleStyle = { margin: 0, color: theme.header, ...titleStyleOverride };
    const plotStyle = {
      ...BASIC_PLOT_FLEX,
      ...(theme.plotBg != null ? { backgroundColor: theme.plotBg, border: theme.plotBorder } : {}),
      ...plotStyleOverride,
    };

    if (status === 'loading') {
      return (
        <div style={outerStyle}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyle}>{title}</h3>
            <div style={{ position: 'relative' }}>{exportControl}</div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {LoaderComponent ? (
              <LoaderComponent height={loaderHeight} message={loaderMessage} light={loaderLight} />
            ) : null}
          </div>
        </div>
      );
    }

    if (status === 'empty' || status === 'error' || status === 'zero-segments') {
      const message =
        status === 'error'
          ? errorMessage
          : status === 'zero-segments'
            ? zeroSegmentsMessage
            : emptyMessage;
      return (
        <div style={outerStyle}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyle}>{title}</h3>
            <div style={{ position: 'relative' }}>{exportControl}</div>
          </div>
          <div
            style={{
              ...plotStyle,
              alignItems: 'center',
              justifyContent: 'center',
              color: status === 'error' ? theme.errorText || theme.emptyText : theme.emptyText,
              fontSize: '14px',
            }}
          >
            {message}
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
        <div
          style={{ ...plotStyle, padding: '24px 24px 16px', position: 'relative' }}
          {...PLOT_EVENT_HANDLERS}
        >
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
        <div className="chart-card-animated" style={cardStyle}>
          <div style={BASIC_HEADER_ROW}>
            <h3 style={titleStyleOverride}>{title}</h3>
            <div style={{ position: 'relative' }}>{exportControl}</div>
          </div>
          {LoaderComponent ? (
            <LoaderComponent height="300px" message={loaderMessage} />
          ) : null}
        </div>
      );
    }

    if (status === 'empty' || status === 'error' || status === 'zero-segments') {
      const message =
        status === 'error'
          ? errorMessage
          : status === 'zero-segments'
            ? zeroSegmentsMessage
            : emptyMessage;
      return (
        <div className="chart-card-animated" style={cardStyle}>
          <div style={{ ...BASIC_HEADER_ROW, marginBottom: '10px' }}>
            <h3 style={titleStyleOverride}>{title}</h3>
            <div style={{ position: 'relative' }}>{exportControl}</div>
          </div>
          <div
            style={{
              height: '300px',
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
            {message}
          </div>
        </div>
      );
    }

    return (
      <div className="chart-card-animated" style={cardStyle}>
        <div style={BASIC_HEADER_ROW}>
          <h3 style={titleStyleOverride}>{title}</h3>
          <div style={{ position: 'relative' }}>{exportControl}</div>
        </div>
        <div
          style={{
            height: '360px',
            border: theme.plotBorder,
            borderRadius: '4px',
            backgroundColor: theme.plotBg,
            padding: '24px 24px 16px',
            position: 'relative',
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
  const cardStyle = { ...cardShellStyle, ...outerStyleOverride };
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
    return (
      <div className="chart-card-animated" style={cardStyle}>
        <div style={headerRowStyle}>
          <h3 style={titleTextStyle}>{title}</h3>
          <div style={{ position: 'relative' }}>{exportControl}</div>
        </div>
        {LoaderComponent ? (
          <LoaderComponent height={loaderHeight} message={loaderMessage} />
        ) : null}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="chart-card-animated" style={cardStyle}>
        <h3 style={titleTextStyle}>{title}</h3>
        <div
          style={{
            ...plotStyleOverride,
            color: theme.errorText || '#ffeb3b',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          {errorMessage}
        </div>
      </div>
    );
  }

  if (status === 'empty' || status === 'zero-segments') {
    const message = status === 'zero-segments' ? zeroSegmentsMessage : emptyMessage;
    return (
      <div className="chart-card-animated" style={cardStyle}>
        <div style={{ ...headerRowStyle, marginBottom: '10px' }}>
          <h3 style={titleTextStyle}>{title}</h3>
          <div style={{ position: 'relative' }}>{exportControl}</div>
        </div>
        <div style={plotStyleOverride}>{message}</div>
      </div>
    );
  }

  return (
    <div className="chart-card-animated" style={cardStyle}>
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
