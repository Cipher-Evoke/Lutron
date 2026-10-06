/**
 * @jest-environment node
 */
import {
  resolveExportMenuLoadingLabels,
  resolveSpaceExportMenuPreset,
  resolveCustomizedEnergyExportMenuPreset,
  resolveAdvancedEnergyExportMenuPreset,
} from './exportMenuTheme';

describe('exportMenuTheme', () => {
  it('resolveExportMenuLoadingLabels preserves emoji variant', () => {
    expect(resolveExportMenuLoadingLabels({ useEmoji: true }).sending).toBe('⏳ Sending...');
    expect(resolveExportMenuLoadingLabels({ useEmoji: false }).sending).toBe('Sending...');
  });

  it('resolveSpaceExportMenuPreset keeps basic data attribute', () => {
    expect(resolveSpaceExportMenuPreset('basic', true).panelDataAttribute).toBe(
      'data-export-dropdown-panel'
    );
    expect(resolveSpaceExportMenuPreset('customized', true).panel.backgroundColor).toBe('#CDC0A0');
  });

  it('resolveCustomizedEnergyExportMenuPreset enables emoji loading labels', () => {
    expect(resolveCustomizedEnergyExportMenuPreset().useEmoji).toBe(true);
  });

  it('resolveAdvancedEnergyExportMenuPreset uses chart export panel class', () => {
    expect(resolveAdvancedEnergyExportMenuPreset().className).toBe('chart-export-dropdown');
    expect(resolveSpaceExportMenuPreset('advanced', true).className).toBe('chart-export-dropdown');
  });
});
