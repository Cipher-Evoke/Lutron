import { resolveUnifiedEnergyYAxis } from './normalizeUnifiedEnergyPayload';

describe('resolveUnifiedEnergyYAxis', () => {
  it('preserves per-area series when the backend returns named area series for a small selection', () => {
    const payload = {
      'Area One': [1, 2, 3],
      'Area Two': [4, 5, 6],
    };

    const result = resolveUnifiedEnergyYAxis(payload, {
      fallbackLabel: 'Consumption',
      requestedKeys: ['1', '2'],
    });

    expect(result).toEqual({
      'Area One': [1, 2, 3],
      'Area Two': [4, 5, 6],
    });
  });

  it('preserves named series even when the requested keys are area ids rather than series names', () => {
    const payload = {
      'Area One': [1, 2, 3],
      'Area Two': [4, 5, 6],
    };

    const result = resolveUnifiedEnergyYAxis(payload, {
      fallbackLabel: 'Consumption',
      requestedKeys: ['42', '43'],
    });

    expect(result).toEqual({
      'Area One': [1, 2, 3],
      'Area Two': [4, 5, 6],
    });
  });

  it('keeps combined series when the backend returns combined_areas only', () => {
    const payload = {
      combined_areas: [7, 8, 9],
    };

    const result = resolveUnifiedEnergyYAxis(payload, {
      fallbackLabel: 'Savings',
      requestedKeys: [],
    });

    expect(result).toEqual({
      'Combined Areas': [7, 8, 9],
    });
  });
});
