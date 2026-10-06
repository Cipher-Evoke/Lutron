import React from 'react';
import EnergyExportMenu from './EnergyExportMenu';
import { toggleEnergyExportMenuState } from '../../container/hooks/exportMenuState';

/**
 * Anchored export trigger + dropdown for built-in energy dashboard charts.
 * Uses stable menu keys aligned with useDashboardExports loading prefixes.
 */
export default function EnergyChartExportMenuControl({
  exportMenuKey,
  loadingPrefix,
  showExportDropdown,
  setShowExportDropdown,
  exportLoading,
  exportDropdownRefs,
  onEmail,
  onDownload,
  preset,
  renderTrigger,
  emailLabel,
  downloadLabel,
}) {
  const isOpen = Boolean(showExportDropdown?.[exportMenuKey]);
  const resolvedLoadingPrefix = loadingPrefix ?? exportMenuKey;

  const handleToggle = (event) => {
    toggleEnergyExportMenuState(setShowExportDropdown, exportMenuKey, event);
  };

  return (
    <div style={{ position: 'relative' }} data-energy-chart-export-menu>
      {renderTrigger({ onClick: handleToggle, isOpen })}
      {isOpen ? (
        <EnergyExportMenu
          menuKey={exportMenuKey}
          loadingPrefix={resolvedLoadingPrefix}
          isOpen={isOpen}
          exportLoading={exportLoading}
          onEmail={onEmail}
          onDownload={onDownload}
          innerRef={(el) => {
            if (exportDropdownRefs?.current) {
              exportDropdownRefs.current[exportMenuKey] = el;
            }
          }}
          preset={preset}
          emailLabel={emailLabel}
          downloadLabel={downloadLabel}
        />
      ) : null}
    </div>
  );
}
