/**
 * @jest-environment node
 */
import {
  attachEnergyTabIndependentCompletion,
  resetEnergyTabIndependentCompletion,
} from './attachEnergyTabIndependentCompletion';

describe('attachEnergyTabIndependentCompletion', () => {
  afterEach(() => {
    resetEnergyTabIndependentCompletion();
  });

  it('completes each widget as soon as its own request finishes', async () => {
    let resolveUnified;
    let resolveLpd;
    const completed = [];
    attachEnergyTabIndependentCompletion({
      apiCalls: [
        {
          name: 'unifiedEnergyData',
          promise: new Promise((resolve) => {
            resolveUnified = resolve;
          }),
        },
        {
          name: 'lightPowerDensity',
          promise: new Promise((resolve) => {
            resolveLpd = resolve;
          }),
        },
      ],
      completeEnergyWidgetLoading: (name) => completed.push(name),
    });

    resolveUnified({ meta: { requestStatus: 'fulfilled' } });
    await Promise.resolve();
    expect(completed).toEqual(['unifiedEnergyData']);

    resolveLpd({ meta: { requestStatus: 'fulfilled' } });
    await Promise.resolve();
    expect(completed).toEqual(['unifiedEnergyData', 'lightPowerDensity']);
  });

  it('does not complete a stale fetch after a newer Energy tab request starts', async () => {
    let resolveFirst;
    const completed = [];
    attachEnergyTabIndependentCompletion({
      apiCalls: [
        {
          name: 'lightPowerDensity',
          promise: new Promise((resolve) => {
            resolveFirst = resolve;
          }),
        },
      ],
      completeEnergyWidgetLoading: (name) => completed.push(`first:${name}`),
    });

    attachEnergyTabIndependentCompletion({
      apiCalls: [
        {
          name: 'lightPowerDensity',
          promise: Promise.resolve({ meta: { requestStatus: 'fulfilled' } }),
        },
      ],
      completeEnergyWidgetLoading: (name) => completed.push(`second:${name}`),
    });

    await Promise.resolve();
    resolveFirst({ meta: { requestStatus: 'fulfilled' } });
    await Promise.resolve();
    expect(completed).toEqual(['second:lightPowerDensity']);
  });

  it('ignores aborted results so a canceled LPD does not clear the new loader', async () => {
    const completed = [];
    attachEnergyTabIndependentCompletion({
      apiCalls: [
        {
          name: 'lightPowerDensity',
          promise: Promise.resolve({
            meta: { requestStatus: 'rejected', aborted: true },
            error: { name: 'CanceledError', message: 'canceled' },
          }),
        },
      ],
      completeEnergyWidgetLoading: (name) => completed.push(name),
    });
    await Promise.resolve();
    expect(completed).toEqual([]);
  });
});
