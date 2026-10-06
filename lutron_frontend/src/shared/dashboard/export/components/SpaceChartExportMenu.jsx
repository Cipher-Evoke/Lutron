import React from 'react';
import ExportMenuPanel from './ExportMenuPanel';
import { buildEmailDownloadExportActions } from './ExportMenuActions';
import { resolveSpaceExportMenuPreset } from './exportMenuTheme';

export default function SpaceChartExportMenu({
  isOpen,
  chartTitle,
  dropdownKey,
  exportLoading,
  onExport,
  innerRef = null,
  shellVariant = 'basic',
  isLargeScreen = false,
}) {
  if (!isOpen) return null;

  const emailLoadingKey = `${chartTitle}_email`;
  const downloadLoadingKey = `${chartTitle}_download`;
  const preset = resolveSpaceExportMenuPreset(shellVariant, isLargeScreen);

  const actions = buildEmailDownloadExportActions({
    onEmail: () => onExport('email', chartTitle, dropdownKey),
    onDownload: () => onExport('download', chartTitle, dropdownKey),
    emailLoading: exportLoading[emailLoadingKey] || false,
    downloadLoading: exportLoading[downloadLoadingKey] || false,
  });

  return (
    <ExportMenuPanel
      innerRef={innerRef}
      className={preset.className}
      panelStyle={preset.panel}
      panelDataAttribute={preset.panelDataAttribute}
      actions={actions}
      itemDefaults={preset.item}
      useEmoji={preset.useEmoji}
    />
  );
}
