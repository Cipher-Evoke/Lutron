/**
 * Shared export dropdown styles — Alerts page look via CSS variables (gold theme).
 */

export const CHART_EXPORT_DROPDOWN_CLASS = 'chart-export-dropdown';

export const chartExportMenuPanelStyle = {
  position: 'absolute',
  top: '100%',
  right: 0,
  backgroundColor: 'var(--alerts-export-menu-bg, #d6dde8)',
  border: '1px solid var(--alerts-export-menu-border, #444)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  zIndex: 1000,
  minWidth: '180px',
  padding: '8px 0',
  marginTop: '4px',
};

/** @param {{ disabled?: boolean, withDivider?: boolean }} opts */
export const chartExportMenuItemStyle = ({
  disabled = false,
  withDivider = false,
} = {}) => ({
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  background: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  textAlign: 'left',
  fontSize: '14px',
  color: disabled
    ? 'rgba(44, 40, 32, 0.45)'
    : 'var(--alerts-export-menu-text, #000)',
  fontWeight: '500',
  ...(withDivider
    ? { borderBottom: '1px solid var(--alerts-export-menu-border, #444)' }
    : {}),
  opacity: disabled ? 0.6 : 1,
});
