import React from 'react';
import ExportMenuPanel from './ExportMenuPanel';
import { buildEmailDownloadExportActions } from './ExportMenuActions';
import { EXPORT_MENU_COPY } from './exportMenuTheme';

export default function EnergyExportMenu({
  menuKey,
  loadingPrefix,
  isOpen,
  exportLoading,
  onEmail,
  onDownload,
  innerRef = null,
  preset,
  className,
  emailLabel,
  downloadLabel,
}) {
  if (!isOpen) return null;

  const loadingKeyPrefix = loadingPrefix ?? menuKey;

  const actions = buildEmailDownloadExportActions({
    onEmail,
    onDownload,
    emailLoading: exportLoading[`${loadingKeyPrefix}_email`],
    downloadLoading: exportLoading[`${loadingKeyPrefix}_download`],
    emailLabel: emailLabel ?? EXPORT_MENU_COPY.email,
    downloadLabel: downloadLabel ?? EXPORT_MENU_COPY.download,
  });

  return (
    <ExportMenuPanel
      innerRef={innerRef}
      className={className ?? preset?.className}
      panelStyle={preset.panel}
      panelDataAttribute={preset.panelDataAttribute}
      actions={actions}
      itemDefaults={preset.item}
      useEmoji={preset.useEmoji}
    />
  );
}
