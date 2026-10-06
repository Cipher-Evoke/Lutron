import React from 'react';
import { Box } from '@mui/material';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import { EnergyExportMenu } from '../../../../shared/dashboard/export/components';

function resolveExportButtonHoverBg(exportBtnColor) {
  if (exportBtnColor === '#1565C0' || exportBtnColor === '#1565c0') {
    return 'rgba(21, 101, 192, 0.08)';
  }
  return 'rgba(255, 255, 255, 0.1)';
}

export function BasicEnergyExportDropdown({
  isOpen,
  exportMenuKey,
  loadingPrefix,
  exportLoading,
  onEmail,
  onDownload,
  preset,
  innerRef,
  emailLabel,
  downloadLabel,
}) {
  return (
    <EnergyExportMenu
      menuKey={exportMenuKey}
      loadingPrefix={loadingPrefix}
      isOpen={isOpen}
      exportLoading={exportLoading}
      onEmail={onEmail}
      onDownload={onDownload}
      innerRef={innerRef}
      preset={preset}
      emailLabel={emailLabel}
      downloadLabel={downloadLabel}
    />
  );
}

/**
 * Basic energy chart export — same interaction model as Space Utilization
 * (`basicSpaceLayoutSlots`): relative wrapper, inline menu toggle, EnergyExportMenu panel.
 */
export function BasicEnergyExportControl({
  exportMenuKey,
  loadingPrefix,
  showExportDropdown,
  setShowExportDropdown,
  exportLoading,
  exportDropdownRefs,
  onEmail,
  onDownload,
  preset,
  exportBtnColor = '#fff',
  isLargeScreen = false,
  emailLabel,
  downloadLabel,
}) {
  const isOpen = Boolean(showExportDropdown?.[exportMenuKey]);
  const resolvedLoadingPrefix = loadingPrefix ?? exportMenuKey;
  const hoverBg = resolveExportButtonHoverBg(exportBtnColor);

  const handleClose = () => {
    setShowExportDropdown((prev) => ({ ...prev, [exportMenuKey]: false }));
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <button
        type="button"
        data-export-menu="true"
        onClick={(event) => {
          event.stopPropagation();
          setShowExportDropdown((prev) => ({
            ...prev,
            [exportMenuKey]: !prev[exportMenuKey],
          }));
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: isLargeScreen ? '16px' : '14px',
          color: exportBtnColor,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: isLargeScreen ? '8px 12px' : '6px 10px',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <FileUploadOutlined
          sx={{ fontSize: isLargeScreen ? 20 : 18, color: 'inherit', flexShrink: 0 }}
          aria-hidden
        />
        Export
      </button>
      <BasicEnergyExportDropdown
        isOpen={isOpen}
        exportMenuKey={exportMenuKey}
        loadingPrefix={resolvedLoadingPrefix}
        exportLoading={exportLoading}
        onEmail={() => {
          handleClose();
          onEmail();
        }}
        onDownload={() => {
          handleClose();
          onDownload();
        }}
        innerRef={(el) => {
          if (exportDropdownRefs?.current) {
            exportDropdownRefs.current[exportMenuKey] = el;
          }
        }}
        preset={preset}
        emailLabel={emailLabel}
        downloadLabel={downloadLabel}
      />
    </Box>
  );
}
