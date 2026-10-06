/**
 * @jest-environment node
 */
import { resolveSpaceExportThunks } from './spaceExportActionMap';

const thunks = {
  sendInstantOccupancyCountEmail: 'instant-email',
  downloadInstantOccupancyCount: 'instant-dl',
  sendOccupancyCountEmail: 'occ-email',
  downloadOccupancyCount: 'occ-dl',
  sendOccupancyByGroupFromLogsEmail: 'group-logs-email',
  downloadOccupancyByGroupFromLogs: 'group-logs-dl',
  sendOccupancyByGroupEmail: 'group-email',
  downloadOccupancyByGroup: 'group-dl',
  sendSpaceUtilizationPerFromLogsEmail: 'per-logs-email',
  downloadSpaceUtilizationPerFromLogs: 'per-logs-dl',
  sendSpaceUtilizationPerEmail: 'per-email',
  downloadSpaceUtilizationPer: 'per-dl',
};

describe('resolveSpaceExportThunks', () => {
  it('routes instant chart on charts tab', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: 'instant', chartTitle: 'Instant' },
      thunks
    );
    expect(resolved.emailThunk).toBe('instant-email');
    expect(resolved.downloadThunk).toBe('instant-dl');
  });

  it('routes instantCombined on space tab to occupancy count', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'instantCombined', chartTitle: 'x' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('occ-dl');
  });

  it('routes pie on charts tab to from_logs group', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: 'pie', chartTitle: 'Occupancy by Group' },
      thunks
    );
    expect(resolved.emailThunk).toBe('group-logs-email');
  });

  it('routes pie on space tab to regular group', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'pie', chartTitle: 'Area Groups' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('group-dl');
  });

  it('routes utilization by area on charts tab to from_logs', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: null, chartTitle: 'Utilization By Area' },
      thunks
    );
    expect(resolved.emailThunk).toBe('per-logs-email');
  });

  it('routes table dropdown key on charts tab even when title is renamed', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: 'table', chartTitle: 'My Area Table' },
      thunks
    );
    expect(resolved.emailThunk).toBe('per-logs-email');
    expect(resolved.downloadThunk).toBe('per-logs-dl');
  });

  it('routes table dropdown key on space tab even when title is renamed', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'table', chartTitle: 'My Area Table' },
      thunks
    );
    expect(resolved.emailThunk).toBe('per-email');
    expect(resolved.downloadThunk).toBe('per-dl');
  });

  it('returns null for unknown chart without a known dropdown key', () => {
    expect(
      resolveSpaceExportThunks(
        { showChartsTab: true, dropdownKey: null, chartTitle: 'Unknown Widget' },
        thunks
      )
    ).toBeNull();
  });
});
