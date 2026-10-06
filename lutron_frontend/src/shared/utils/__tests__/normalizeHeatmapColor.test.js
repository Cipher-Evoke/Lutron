import { normalizeHeatmapColor } from '../normalizeHeatmapColor';

describe('normalizeHeatmapColor', () => {
  it('returns hex colors unchanged', () => {
    expect(normalizeHeatmapColor('#f2ff00')).toBe('#f2ff00');
  });

  it('converts valid HSL to hex', () => {
    expect(normalizeHeatmapColor('hsl(120, 50%, 50%)')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('does not throw on malformed HSL', () => {
    expect(normalizeHeatmapColor('hsl()')).toBe('#e88330');
    expect(normalizeHeatmapColor('hsl(invalid)')).toBe('#e88330');
  });

  it('uses custom fallback when color is empty', () => {
    expect(normalizeHeatmapColor(null, '#ffffff')).toBe('#ffffff');
  });
});
