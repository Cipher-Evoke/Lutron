import React from 'react';
import {
  CHART_EXPORT_DROPDOWN_CLASS,
  chartExportMenuPanelStyle,
} from '../utils/chartExportMenuStyles';
import ExportMenuPanel from '../../../shared/dashboard/export/components/ExportMenuPanel';
import { buildEmailDownloadExportActions } from '../../../shared/dashboard/export/components/ExportMenuActions';

/**
 * Send By Email / Download To PC menu — matches Alerts export dropdown.
 */
export default function ChartExportDropdown({
  onEmail,
  onDownload,
  emailLoading = false,
  downloadLoading = false,
  emailLabel = 'Send By Email',
  downloadLabel = 'Download To PC',
  panelStyle = {},
  innerRef = null,
  className = CHART_EXPORT_DROPDOWN_CLASS,
}) {
  const actions = buildEmailDownloadExportActions({
    onEmail,
    onDownload,
    emailLoading,
    downloadLoading,
    emailLabel,
    downloadLabel,
  });

  return (
    <ExportMenuPanel
      innerRef={innerRef}
      className={className}
      panelStyle={{ ...chartExportMenuPanelStyle, ...panelStyle }}
      actions={actions}
      itemDefaults={{
        padding: '12px 16px',
        fontSize: '14px',
        textColor: 'var(--alerts-export-menu-text, #000)',
        mutedColor: 'rgba(44, 40, 32, 0.45)',
        dividerColor: 'var(--alerts-export-menu-border, #444)',
      }}
    />
  );
}
