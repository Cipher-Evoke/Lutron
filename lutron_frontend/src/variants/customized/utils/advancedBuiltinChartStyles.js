/**
 * Visual layout for built-in Energy dashboard charts — aligned with the Advanced variant.
 * Used only by default builtin renders in customized Dashboard (not custom graph overrides).
 */

export const BUILTIN_CHART_CARD = {
  backgroundColor: 'rgba(128, 120, 100, 0.6)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px',
  border: '1px solid #ccc',
};

export const BUILTIN_CHART_LOADER_HEIGHT = '300px';
export const BUILTIN_CHART_EMPTY_HEIGHT = '300px';
export const BUILTIN_PIE_PLOT_HEIGHT = '360px';
/** Custom energy graphs: match built-in Savings By Strategy donut plot area */
export const BUILTIN_CUSTOM_GRAPH_PLOT_HEIGHT = BUILTIN_PIE_PLOT_HEIGHT;
export const BUILTIN_LINE_PLOT_HEIGHT = '420px';
export const BUILTIN_COMPACT_PANEL_HEIGHT = '200px';

export const BUILTIN_CHART_HEADER_ROW = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

export const BUILTIN_CHART_EMPTY_BOX = {
  height: BUILTIN_CHART_EMPTY_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  color: '#fff',
  fontSize: '14px',
};

export const BUILTIN_PIE_PLOT_BOX = {
  height: BUILTIN_PIE_PLOT_HEIGHT,
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  padding: '24px 24px 16px',
  position: 'relative',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

export const BUILTIN_LINE_PLOT_BOX = {
  height: BUILTIN_LINE_PLOT_HEIGHT,
  minHeight: '380px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  padding: '10px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

export const BUILTIN_COMPACT_PANEL = {
  backgroundColor: 'rgba(128, 120, 100, 0.6)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  height: BUILTIN_COMPACT_PANEL_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #ccc',
};

export const BUILTIN_COMPACT_INNER = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  backgroundColor: '#232323',
  border: 'none',
  borderRadius: '12px',
};
