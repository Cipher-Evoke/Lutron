import {
  abortSingletonDashboardGets,
  buildDashboardGetCoalesceKey,
  coalesceDashboardHttpGet,
  resetDashboardHttpGetCoalesce,
} from './coalesceDashboardHttpGet';

describe('coalesceDashboardHttpGet', () => {
  afterEach(() => {
    resetDashboardHttpGetCoalesce();
  });

  it('matches query-in-url with axios params object', () => {
    const a = buildDashboardGetCoalesceKey(
      '/dashboard/instant_occupancy_count?time_range=this_day&floor_ids=1'
    );
    const b = buildDashboardGetCoalesceKey('/dashboard/instant_occupancy_count', {
      params: { time_range: 'this_day', floor_ids: ['1'] },
    });
    expect(a).toBe(b);
  });

  it('shares one in-flight promise for identical gets', async () => {
    let calls = 0;
    const client = {
      get: jest.fn(() => {
        calls += 1;
        return Promise.resolve({ data: { ok: true } });
      }),
    };
    const p1 = coalesceDashboardHttpGet(client, '/dashboard/occupancy_by_group', {
      params: { time_range: 'this_day' },
    });
    const p2 = coalesceDashboardHttpGet(
      client,
      '/dashboard/occupancy_by_group?time_range=this_day'
    );
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(calls).toBe(1);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(r1).toBe(r2);
    expect(r1.data).toEqual({ ok: true });
  });

  it('ignores cache-buster query keys when coalescing', () => {
    const a = buildDashboardGetCoalesceKey('/dashboard/light_power_density', {
      params: { time_range: 'this_day', _: '123' },
    });
    const b = buildDashboardGetCoalesceKey(
      '/dashboard/light_power_density?time_range=this_day'
    );
    expect(a).toBe(b);
  });

  it('serves recent completed response within TTL', async () => {
    let calls = 0;
    const client = {
      get: jest.fn(() => {
        calls += 1;
        return Promise.resolve({ data: { ok: true } });
      }),
    };
    await coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    await coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    expect(calls).toBe(1);
  });

  it('ignores group_ids on occupancy_count coalesce key', () => {
    const a = buildDashboardGetCoalesceKey('/dashboard/occupancy_count', {
      params: { time_range: 'this_day', group_ids: ['1'] },
    });
    const b = buildDashboardGetCoalesceKey('/dashboard/occupancy_count', {
      params: { time_range: 'this_day', group_ids: ['2'] },
    });
    expect(a).toBe(b);
  });

  it('aborts previous occupancy_count request when params change', async () => {
    const signals = [];
    const client = {
      get: jest.fn((_url, config) => {
        signals.push(config.signal);
        return new Promise(() => {});
      }),
    };
    coalesceDashboardHttpGet(client, '/dashboard/occupancy_count', {
      params: { time_range: 'this_day' },
    });
    coalesceDashboardHttpGet(client, '/dashboard/occupancy_count', {
      params: { time_range: 'this_week' },
    });
    expect(client.get).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('aborts previous from_logs request when params change', async () => {
    const signals = [];
    const client = {
      get: jest.fn((_url, config) => {
        signals.push(config.signal);
        return new Promise(() => {});
      }),
    };
    coalesceDashboardHttpGet(client, '/dashboard/space_utilization_per_from_logs', {
      params: { time_range: 'this_day' },
    });
    coalesceDashboardHttpGet(client, '/dashboard/space_utilization_per_from_logs', {
      params: { time_range: 'this_week' },
    });
    expect(client.get).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('shares one in-flight Light Power Density request for identical params', async () => {
    let resolveGet;
    const client = {
      get: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveGet = resolve;
          })
      ),
    };
    const p1 = coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    const p2 = coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    expect(client.get).toHaveBeenCalledTimes(1);
    resolveGet({ data: { ok: true } });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(r2);
  });

  it('aborts previous Light Power Density request when params change', async () => {
    const signals = [];
    const client = {
      get: jest.fn((_url, config) => {
        signals.push(config.signal);
        return new Promise(() => {});
      }),
    };
    coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_week' },
    });
    expect(client.get).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('abortSingletonDashboardGets cancels the in-flight Light Power Density request', () => {
    const signals = [];
    const client = {
      get: jest.fn((_url, config) => {
        signals.push(config.signal);
        return new Promise(() => {});
      }),
    };
    coalesceDashboardHttpGet(client, '/dashboard/light_power_density', {
      params: { time_range: 'this_day' },
    });
    abortSingletonDashboardGets();
    expect(signals[0].aborted).toBe(true);
  });
});
