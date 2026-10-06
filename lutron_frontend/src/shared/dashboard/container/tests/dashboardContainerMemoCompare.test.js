import { dashboardContainerPropsAreEqual } from '../dashboardContainerMemoCompare';

function baseProps(overrides = {}) {
  return {
    variant: 'basic',
    activeTab: 'energy',
    adapter: { id: 'adapter-a' },
    runtime: { id: 'runtime-a' },
    orchestration: { id: 'orchestration-a' },
    ...overrides,
  };
}

describe('dashboardContainerPropsAreEqual', () => {
  it('returns true when all compared props are referentially equal', () => {
    const props = baseProps();
    expect(dashboardContainerPropsAreEqual(props, props)).toBe(true);
    expect(dashboardContainerPropsAreEqual(props, { ...props })).toBe(true);
  });

  it('returns false when orchestration reference changes', () => {
    const prev = baseProps();
    const next = baseProps({ orchestration: { id: 'orchestration-b' } });
    expect(dashboardContainerPropsAreEqual(prev, next)).toBe(false);
  });

  it('returns false when runtime reference changes', () => {
    const prev = baseProps();
    const next = baseProps({ runtime: { id: 'runtime-b' } });
    expect(dashboardContainerPropsAreEqual(prev, next)).toBe(false);
  });

  it('returns false when activeTab changes', () => {
    const prev = baseProps();
    const next = baseProps({ activeTab: 'charts' });
    expect(dashboardContainerPropsAreEqual(prev, next)).toBe(false);
  });

  it('returns false when variant changes', () => {
    const prev = baseProps();
    const next = baseProps({ variant: 'advanced' });
    expect(dashboardContainerPropsAreEqual(prev, next)).toBe(false);
  });

  it('returns false when adapter reference changes', () => {
    const prev = baseProps();
    const next = baseProps({ adapter: { id: 'adapter-b' } });
    expect(dashboardContainerPropsAreEqual(prev, next)).toBe(false);
  });
});
