/**
 * @jest-environment jsdom
 */
import {
  SHADES_NAME_KEY,
  SHADES_HYPERLINK_KEY,
  SHADES_IMAGE_KEY,
  SHADES_DESCRIPTION_KEY,
  SHADES_CO2_CONSTANT_KEY,
  DEFAULT_SHADES_WIDGET_NAME,
  DEFAULT_SHADES_CO2_CONSTANT,
  getShadesWidgetName,
  getShadesWidgetHyperlink,
  getShadesWidgetImage,
  getShadesWidgetDescription,
  getShadesCo2Constant,
  snapshotShadesSettingsForLogout,
  restoreShadesSettingsAfterStorageClear,
} from './shadesWidgetSettings';

describe('shadesWidgetSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default values when localStorage is empty', () => {
    expect(getShadesWidgetName()).toBe(DEFAULT_SHADES_WIDGET_NAME);
    expect(getShadesWidgetHyperlink('https://fallback.com')).toBe('https://fallback.com');
    expect(getShadesWidgetImage()).toBe('');
    expect(getShadesWidgetDescription()).toBe('');
    expect(getShadesCo2Constant()).toBe(DEFAULT_SHADES_CO2_CONSTANT);
  });

  it('snapshots and restores shades settings across localStorage.clear()', () => {
    localStorage.setItem(SHADES_NAME_KEY, 'Shades');
    localStorage.setItem(SHADES_HYPERLINK_KEY, 'https://quantumvue.example.com');
    localStorage.setItem(SHADES_IMAGE_KEY, 'data:image/png;base64,abc123');
    localStorage.setItem(SHADES_DESCRIPTION_KEY, 'Lutron motorized shades');
    localStorage.setItem(SHADES_CO2_CONSTANT_KEY, '0.85');

    const snapshot = snapshotShadesSettingsForLogout();
    expect(snapshot[SHADES_NAME_KEY]).toBe('Shades');
    expect(snapshot[SHADES_HYPERLINK_KEY]).toBe('https://quantumvue.example.com');
    expect(snapshot[SHADES_IMAGE_KEY]).toBe('data:image/png;base64,abc123');
    expect(snapshot[SHADES_DESCRIPTION_KEY]).toBe('Lutron motorized shades');
    expect(snapshot[SHADES_CO2_CONSTANT_KEY]).toBe('0.85');

    // Simulate logout clear
    localStorage.clear();
    expect(localStorage.getItem(SHADES_NAME_KEY)).toBeNull();

    // Restore
    restoreShadesSettingsAfterStorageClear(snapshot);

    expect(getShadesWidgetName()).toBe('Shades');
    expect(getShadesWidgetHyperlink()).toBe('https://quantumvue.example.com');
    expect(getShadesWidgetImage()).toBe('data:image/png;base64,abc123');
    expect(getShadesWidgetDescription()).toBe('Lutron motorized shades');
    expect(getShadesCo2Constant()).toBe(0.85);
  });
});
