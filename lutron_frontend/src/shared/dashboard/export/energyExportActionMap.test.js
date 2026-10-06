/**
 * @jest-environment node
 */
import {
  createEnergyExportActionMap,
  resolveEnergyExportByApiPath,
  ENERGY_EXPORT_WIDGET_KEYS,
} from './energyExportActionMap';

const thunks = {
  sendEnergyConsumptionEmail: 'c-email',
  downloadEnergyConsumption: 'c-dl',
  sendEnergySavingsEmail: 's-email',
  downloadEnergySavings: 's-dl',
  sendTotalConsumptionByGroupEmail: 'g-email',
  downloadTotalConsumptionByGroup: 'g-dl',
  sendPeakMinConsumptionEmail: 'p-email',
  downloadPeakMinConsumption: 'p-dl',
  sendOccupancyCountEmail: 'o-email',
  downloadOccupancyCount: 'o-dl',
  sendOccupancyByGroupEmail: 'og-email',
  downloadOccupancyByGroup: 'og-dl',
  sendSpaceUtilizationPerEmail: 'sp-email',
  downloadSpaceUtilizationPer: 'sp-dl',
};

describe('createEnergyExportActionMap', () => {
  it('maps built-in widget keys', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION].downloadThunk).toBe('c-dl');
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.SAVINGS].emailThunk).toBe('s-email');
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP].label).toContain('Area Groups');
  });
});

describe('resolveEnergyExportByApiPath', () => {
  it('resolves energy consumption path', () => {
    const resolved = resolveEnergyExportByApiPath('/api/dashboard/energy_consumption', thunks);
    expect(resolved.downloadThunk).toBe('c-dl');
  });

  it('resolves savings typo path', () => {
    const resolved = resolveEnergyExportByApiPath('/dashboard/saving_by_stratergy', thunks);
    expect(resolved.emailThunk).toBe('s-email');
  });

  it('returns null for unknown path', () => {
    expect(resolveEnergyExportByApiPath('/dashboard/unknown', thunks)).toBeNull();
  });
});
