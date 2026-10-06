import SPACE_CHART_DEFAULT_COLORS from './chartPalette';

describe('chartPalette', () => {
  it('exports the shared eight-color space chart palette', () => {
    expect(SPACE_CHART_DEFAULT_COLORS).toEqual([
      '#FFB3B3',
      '#87CEEB',
      '#98FB98',
      '#FFD4A3',
      '#DDA0DD',
      '#FFB6C1',
      '#AFEEEE',
      '#F0E68C',
    ]);
  });
});
