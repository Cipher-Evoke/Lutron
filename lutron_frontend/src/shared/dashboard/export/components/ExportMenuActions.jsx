import React from 'react';
import ExportMenuAction from './ExportMenuAction';
import { EXPORT_MENU_COPY, resolveExportMenuLoadingLabels } from './exportMenuTheme';

export function buildEmailDownloadExportActions({
  onEmail,
  onDownload,
  emailLoading = false,
  downloadLoading = false,
  emailLabel = EXPORT_MENU_COPY.email,
  downloadLabel = EXPORT_MENU_COPY.download,
}) {
  return [
    {
      key: 'email',
      label: emailLabel,
      loading: emailLoading,
      onClick: onEmail,
    },
    {
      key: 'download',
      label: downloadLabel,
      loading: downloadLoading,
      onClick: onDownload,
    },
  ];
}

export default function ExportMenuActions({
  onEmail,
  onDownload,
  emailLoading = false,
  downloadLoading = false,
  item = {},
  useEmoji = false,
  emailLabel = EXPORT_MENU_COPY.email,
  downloadLabel = EXPORT_MENU_COPY.download,
}) {
  const labels = resolveExportMenuLoadingLabels({ useEmoji });
  const {
    padding = '12px 16px',
    fontSize = '14px',
    textColor = 'rgba(0, 0, 0, 0.87)',
    mutedColor = 'rgba(0, 0, 0, 0.45)',
    dividerColor = 'rgba(0, 0, 0, 0.12)',
  } = item;

  const actionItem = { padding, fontSize, textColor, mutedColor, dividerColor };

  return (
    <>
      <ExportMenuAction
        label={emailLoading ? labels.sending : emailLabel}
        loading={emailLoading}
        onClick={onEmail}
        withDivider
        item={actionItem}
      />
      <ExportMenuAction
        label={downloadLoading ? labels.downloading : downloadLabel}
        loading={downloadLoading}
        onClick={onDownload}
        item={actionItem}
      />
    </>
  );
}
