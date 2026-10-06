import { renderHook, act } from '@testing-library/react';
import {
  buildClearAllResolution,
  buildSelectAllResolution,
  getAreaSelectionText,
} from '../../filters';
import { useDashboardAreaTreeOrchestration } from '../useDashboardAreaTreeOrchestration';

const floors = [{ id: 1, floor_name: 'Ground' }, { id: 2, name: 'Upper' }];
const areaTree = {
  tree: [
    {
      name: 'Building',
      children: [{ area_id: 10, name: 'Lobby' }, { area_id: 11, name: 'Office' }],
    },
  ],
};

function createHookProps(overrides = {}) {
  const dispatch = jest.fn();
  const setLocalSelectedFloorIds = jest.fn();
  const setLocalSelectedAreas = jest.fn();
  const setLocalSelectedGroups = jest.fn();
  const setFloorsWithSelectedAreas = jest.fn();
  const setExpandedFloorId = jest.fn();
  const setExpandedNodes = jest.fn();
  const setShowAreaDropdown = jest.fn();
  const previousApiParamsRef = { current: { duration: 'today' } };

  const reduxActions = {
    clearDataCache: jest.fn(() => ({ type: 'clearDataCache' })),
    setSelectedAreas: jest.fn((v) => ({ type: 'setSelectedAreas', payload: v })),
    setSelectedFloorIds: jest.fn((v) => ({ type: 'setSelectedFloorIds', payload: v })),
    setSelectedGroups: jest.fn((v) => ({ type: 'setSelectedGroups', payload: v })),
    setSelectedGroupIds: jest.fn((v) => ({ type: 'setSelectedGroupIds', payload: v })),
    setSelectedFloor: jest.fn((v) => ({ type: 'setSelectedFloor', payload: v })),
    setCustomWidgetFilters: jest.fn((v) => ({ type: 'setCustomWidgetFilters', payload: v })),
  };

  return {
    props: {
      variant: 'advanced',
      dispatch,
      reduxActions,
      floors,
      areaTree,
      selectedFloorIds: [],
      selectedAreas: [],
      localSelectedFloorIds: [],
      localSelectedAreas: [],
      localSelectedGroups: [],
      setLocalSelectedFloorIds,
      setLocalSelectedAreas,
      setLocalSelectedGroups,
      setFloorsWithSelectedAreas,
      setExpandedFloorId,
      setExpandedNodes,
      previousApiParamsRef,
      setShowAreaDropdown,
      ...overrides,
    },
    spies: {
      dispatch,
      setLocalSelectedAreas,
      setShowAreaDropdown,
      previousApiParamsRef,
      reduxActions,
    },
  };
}

describe('useDashboardAreaTreeOrchestration', () => {
  it('advanced selection text matches direct resolver output', () => {
    const { props } = createHookProps({ variant: 'advanced', selectedFloorIds: [1] });
    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    const expected = getAreaSelectionText({
      variant: 'advanced',
      floors,
      areaTree,
      selectedFloorIds: [1],
      selectedAreas: [],
      localSelectedFloorIds: [],
      localSelectedAreas: [],
      localSelectedGroups: [],
    });

    expect(result.current.getAreaSelectionText()).toBe(expected);
    expect(result.current.getAreaSelectionText()).toBe('Ground');
  });

  it('advanced Set All dispatches the same redux payload as buildSelectAllResolution', () => {
    const { props, spies } = createHookProps({
      variant: 'advanced',
      localSelectedFloorIds: [1, 2],
    });
    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    const expected = buildSelectAllResolution({
      variant: 'advanced',
      localSelectedFloorIds: [1, 2],
      localSelectedAreas: [],
      localSelectedGroups: [],
      floors,
      getAllAreasFromGroup: () => [],
    }).redux;

    act(() => {
      result.current.applyAreaTreeSet();
    });

    expect(spies.reduxActions.setSelectedAreas).toHaveBeenCalledWith(expected.selectedAreas);
    expect(spies.reduxActions.setSelectedFloorIds).toHaveBeenCalledWith(expected.selectedFloorIds);
    expect(spies.reduxActions.setSelectedGroups).toHaveBeenCalledWith(expected.selectedGroups);
    expect(spies.previousApiParamsRef.current).toBeNull();
    expect(spies.setShowAreaDropdown).toHaveBeenCalledWith(false);
  });

  it('commits the floor before areas so the floor reducer cannot erase area selections', () => {
    const { props, spies } = createHookProps({
      localSelectedAreas: [10, 11],
    });
    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.applyAreaTreeSet();
    });

    const dispatchedTypes = spies.dispatch.mock.calls.map(([action]) => action.type);
    expect(dispatchedTypes.indexOf('setSelectedFloor')).toBeLessThan(
      dispatchedTypes.indexOf('setSelectedAreas')
    );
  });

  it('advanced Clear All matches buildClearAllResolution side effects', () => {
    const { props, spies } = createHookProps({ variant: 'advanced' });
    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });
    const expected = buildClearAllResolution();

    act(() => {
      result.current.applyAreaTreeClearAll();
    });

    expect(spies.setLocalSelectedAreas).toHaveBeenCalledWith(expected.local.localSelectedAreas);
    expect(spies.reduxActions.setSelectedAreas).toHaveBeenCalledWith(expected.redux.selectedAreas);
    expect(spies.reduxActions.setSelectedFloorIds).toHaveBeenCalledWith(expected.redux.selectedFloorIds);
    expect(spies.previousApiParamsRef.current).toBeNull();
    expect(spies.setShowAreaDropdown).toHaveBeenCalledWith(false);
  });

  it('customized mixed-scope Set preserves customWidgetFilters', () => {
    const areaIdToFloorId = new Map([
      [5, 1],
      ['5', 1],
      [6, 2],
      ['6', 2],
    ]);
    const { props, spies } = createHookProps({
      variant: 'customized',
      localSelectedFloorIds: [1],
      localSelectedAreas: [5, 6],
      selectAllContextExtras: { areaIdToFloorId },
      extraReduxActions: {},
    });
    props.extraReduxActions = { setCustomWidgetFilters: spies.reduxActions.setCustomWidgetFilters };

    const expected = buildSelectAllResolution({
      variant: 'customized',
      localSelectedFloorIds: [1],
      localSelectedAreas: [5, 6],
      localSelectedGroups: [],
      floors,
      areaIdToFloorId,
      getAllAreasFromGroup: () => [],
    }).redux;

    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.applyAreaTreeSet();
    });

    expect(expected.customWidgetFilters).toEqual({
      floor_ids: [1],
      area_ids: [6],
    });
    expect(spies.reduxActions.setCustomWidgetFilters).toHaveBeenCalledWith(expected.customWidgetFilters);
  });

  it('customized Clear All dispatches customWidgetFilters null', () => {
    const { props, spies } = createHookProps({
      variant: 'customized',
      clearAllOptions: { includeCustomWidgetFilters: true },
      extraReduxActions: {},
    });
    props.extraReduxActions = { setCustomWidgetFilters: spies.reduxActions.setCustomWidgetFilters };

    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.applyAreaTreeClearAll();
    });

    expect(spies.reduxActions.setCustomWidgetFilters).toHaveBeenCalledWith(null);
  });

  it('customized selection text includes areaGroups and selectedGroupIds extras', () => {
    const areaGroups = {
      special_area_groups: [{ group_id: 7, name: 'Special' }],
      user_area_groups: [],
    };
    const { props } = createHookProps({
      variant: 'customized',
      localSelectedGroups: [7],
      selectionTextExtras: { areaGroups, selectedGroupIds: [7] },
    });
    const { result } = renderHook((hookProps) => useDashboardAreaTreeOrchestration(hookProps), {
      initialProps: props,
    });

    const expected = getAreaSelectionText({
      variant: 'customized',
      floors,
      areaTree,
      areaGroups,
      selectedFloorIds: [],
      selectedAreas: [],
      selectedGroupIds: [7],
      localSelectedFloorIds: [],
      localSelectedAreas: [],
      localSelectedGroups: [7],
    });

    expect(result.current.getAreaSelectionText()).toBe(expected);
  });
});
