/**
 * @jest-environment node
 */
import {
  resolveSavingsByStrategyLoading,
  resolveSavingsByStrategyTheme,
  resolveSavingsByStrategyExportActions,
  resolveSavingsByStrategyApiPathExportActions,
  SAVINGS_BY_STRATEGY_THEME_PRESETS,
} from './savingsByStrategyTheme';
import {
  savingsByStrategyWidgetPropsAreEqual,
  legacySavingsByStrategyLoading,
  sharedSavingsByStrategyWidgetLoading,
  sharedSavingsByStrategyWidgetStatus,
} from './savingsByStrategyMemoCompare';
import { sharedSavingsStrategyStatus } from '../charts/savings/savingsStrategyMemoCompare';

const populatedPayload = {
  data: { Keypad: 25, Sensors: 35, Schedule: 15, GUI: 10, Consumption: 15 },
};

const zeroPayload = {
  data: { Keypad: 0, Sensors: 0, Schedule: 0, GUI: 0, Consumption: 0 },
};

const title = 'Savings By Strategy';

function legacyBasicLoading(props) {
  if (props.customDatesIncomplete) return false;
  return (
    props.chartLoadingSavingsByStrategy ||
    !props.savingsByStrategy
  );
}

function legacyAdvancedLoading(props) {
  return legacyBasicLoading({ ...props, customDatesIncomplete: false });
}

function legacyCustomizedLoading(props) {
  return legacyAdvancedLoading(props);
}

describe('SavingsByStrategy loading parity', () => {
  const readyProps = {
    allEnergyChartsReady: true,
    chartLoadingSavingsByStrategy: false,
    globalLoading: false,
    savingsByStrategy: populatedPayload,
    customDatesIncomplete: false,
  };

  it('basic legacy loading matches shared resolver', () => {
    expect(sharedSavingsByStrategyWidgetLoading(readyProps)).toBe(legacyBasicLoading(readyProps));
    expect(sharedSavingsByStrategyWidgetLoading(readyProps)).toBe(false);
  });

  it('advanced legacy loading matches shared resolver', () => {
    expect(legacySavingsByStrategyLoading(readyProps)).toBe(legacyAdvancedLoading(readyProps));
  });

  it('customized legacy loading matches shared resolver', () => {
    expect(resolveSavingsByStrategyLoading(readyProps)).toBe(legacyCustomizedLoading(readyProps));
  });

  it('custom date placeholder disables loading gate', () => {
    expect(
      resolveSavingsByStrategyLoading({
        ...readyProps,
        customDatesIncomplete: true,
        savingsByStrategy: null,
      })
    ).toBe(false);
  });

  it('does not wait on sibling Energy widgets', () => {
    expect(
      resolveSavingsByStrategyLoading({ ...readyProps, allEnergyChartsReady: false })
    ).toBe(false);
  });
});

describe('SavingsByStrategy status parity', () => {
  it('empty-null when payload missing', () => {
    expect(
      sharedSavingsByStrategyWidgetStatus(null, {
        isLoading: false,
        globalLoading: false,
      })
    ).toBe('empty-null');
  });

  it('placeholder donut when custom dates incomplete', () => {
    expect(
      sharedSavingsByStrategyWidgetStatus(populatedPayload, {
        isLoading: false,
        globalLoading: false,
        customDatesIncomplete: true,
      })
    ).toBe('custom-range-placeholder');
  });

  it('zero payload transitional state maps to loading (placeholder donut)', () => {
    const status = sharedSavingsStrategyStatus(zeroPayload, {
      isLoading: false,
      globalLoading: false,
    });
    expect(status).toBe('loading');
    expect(
      sharedSavingsByStrategyWidgetStatus(zeroPayload, {
        isLoading: false,
        globalLoading: false,
      })
    ).toBe('loading');
  });

  it('ready state for populated payload', () => {
    expect(
      sharedSavingsByStrategyWidgetStatus(populatedPayload, {
        isLoading: false,
        globalLoading: false,
      })
    ).toBe('ready');
  });
});

describe('SavingsByStrategy theme parity', () => {
  it('basic standalone light theme sets full card height', () => {
    const theme = resolveSavingsByStrategyTheme({
      preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
      chartSurface: 'light',
      energyLightFullCardHeightPx: 500,
    });
    expect(theme.shellVariant).toBe('basic-energy');
    expect(theme.loaderLight).toBe(true);
    expect(theme.outerStyleOverride.height).toBe(500);
    expect(theme.outerStyleOverride.minHeight).toBe(500);
  });

  it('basic standalone dark theme matches Consumption By Area Groups card height', () => {
    const theme = resolveSavingsByStrategyTheme({
      preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
      chartSurface: 'dark',
    });
    expect(theme.outerStyleOverride.height).toBe(460);
    expect(theme.outerStyleOverride.minHeight).toBe(460);
  });

  it('basic embedded theme uses transparent shell', () => {
    const theme = resolveSavingsByStrategyTheme({
      preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
      embedded: true,
    });
    expect(theme.embedded).toBe(true);
    expect(theme.outerStyleOverride.backgroundColor).toBe('transparent');
  });

  it('advanced theme wires palette resolvers', () => {
    const resolveThemeColor = () => '#fff';
    const theme = resolveSavingsByStrategyTheme({
      preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.advanced,
      chartHeaderStyle: { fontSize: 14 },
      advancedSurface: {
        cardBackground: '#111',
        cardBorder: '1px solid #222',
        cardShadow: 'none',
        resolveThemeColor,
      },
    });
    expect(theme.shellVariant).toBe('advanced-card');
    expect(theme.resolveThemeColor).toBe(resolveThemeColor);
    expect(theme.cardClassName).toBe('chart-card-animated');
  });

  it('customized theme uses builtin card shell', () => {
    const theme = resolveSavingsByStrategyTheme({
      preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.customized,
    });
    expect(theme.shellVariant).toBe('customized-builtin');
    expect(theme.cardShellStyle.border).toBe('1px solid #ccc');
    expect(theme.loaderHeight).toBe('300px');
  });
});

describe('SavingsByStrategy export routing', () => {
  const thunks = {
    sendSavingsByStrategyEmail: 'strategy-email',
    downloadSavingsByStrategy: 'strategy-download',
    sendEnergySavingsEmail: 'savings-email',
    downloadEnergySavings: 'savings-download',
  };

  it('resolves dedicated widget export thunks', () => {
    const actions = resolveSavingsByStrategyExportActions(thunks);
    expect(actions.emailThunk).toBe('strategy-email');
    expect(actions.downloadThunk).toBe('strategy-download');
  });

  it('resolves api-path export routing for saving_by_stratergy', () => {
    const actions = resolveSavingsByStrategyApiPathExportActions(
      '/dashboard/saving_by_stratergy',
      thunks
    );
    expect(actions.emailThunk).toBe('savings-email');
    expect(actions.downloadThunk).toBe('savings-download');
  });

  it('returns null for unrelated api paths', () => {
    expect(
      resolveSavingsByStrategyApiPathExportActions('/dashboard/energy_consumption', thunks)
    ).toBeNull();
  });
});

describe('savingsByStrategyWidgetPropsAreEqual', () => {
  const base = {
    title,
    savingsByStrategy: populatedPayload,
    allEnergyChartsReady: true,
    chartLoadingSavingsByStrategy: false,
    globalLoading: false,
    shellVariant: SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
    chartSurface: 'dark',
    embedded: false,
    customDatesIncomplete: false,
    ChartLoader: null,
  };

  it('skips re-render for deep-equal payload with different reference', () => {
    const next = {
      ...base,
      savingsByStrategy: JSON.parse(JSON.stringify(populatedPayload)),
    };
    expect(savingsByStrategyWidgetPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when loading gate changes', () => {
    const next = { ...base, chartLoadingSavingsByStrategy: true };
    expect(savingsByStrategyWidgetPropsAreEqual(base, next)).toBe(false);
  });

  it('re-renders when embedded mode changes', () => {
    const next = { ...base, embedded: true };
    expect(savingsByStrategyWidgetPropsAreEqual(base, next)).toBe(false);
  });
});
