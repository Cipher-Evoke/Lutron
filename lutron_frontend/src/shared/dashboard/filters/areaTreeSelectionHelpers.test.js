/**
 * @jest-environment node
 */
import {
  checkIfChildrenSelected,
  checkIfAllChildrenSelected,
  resolveNodeCheckState,
} from './areaTreeSelectionHelpers';

const parentNode = {
  name: 'Parent',
  children: [
    { area_id: 1, name: 'A1' },
    {
      name: 'Subgroup',
      children: [{ area_id: 2, name: 'A2' }, { floor_id: 9, name: 'Floor' }],
    },
    { group_id: 5, name: 'Group' },
  ],
  areas: [{ area_id: 3, name: 'A3' }],
};

const emptyState = {
  localSelectedAreas: [],
  localSelectedFloorIds: [],
  localSelectedGroups: [],
};

describe('areaTreeSelectionHelpers', () => {
  it('checkIfChildrenSelected is false when nothing selected', () => {
    expect(checkIfChildrenSelected(parentNode, emptyState)).toBe(false);
  });

  it('checkIfChildrenSelected detects partial area selection', () => {
    const state = { ...emptyState, localSelectedAreas: [2] };
    expect(checkIfChildrenSelected(parentNode, state)).toBe(true);
    expect(checkIfAllChildrenSelected(parentNode, state)).toBe(false);
  });

  it('checkIfAllChildrenSelected true when every direct child is selected', () => {
    const state = {
      localSelectedAreas: [1, 2, 3],
      localSelectedFloorIds: [9],
      localSelectedGroups: [5],
    };
    expect(checkIfAllChildrenSelected(parentNode, state)).toBe(true);
  });

  it('checkIfChildrenSelected detects floor and group child selection', () => {
    expect(
      checkIfChildrenSelected(parentNode, { ...emptyState, localSelectedFloorIds: [9] })
    ).toBe(true);
    expect(
      checkIfChildrenSelected(parentNode, { ...emptyState, localSelectedGroups: [5] })
    ).toBe(true);
  });

  it('resolveNodeCheckState returns indeterminate for partial subtree', () => {
    const state = { ...emptyState, localSelectedAreas: [1] };
    const result = resolveNodeCheckState(parentNode, state);
    expect(result.isSelected).toBe(false);
    expect(result.isIndeterminate).toBe(true);
    expect(result.hasChildren).toBe(true);
  });

  it('resolveNodeCheckState marks fully selected parent as selected', () => {
    const state = {
      localSelectedAreas: [1, 2, 3],
      localSelectedFloorIds: [9],
      localSelectedGroups: [5],
    };
    const result = resolveNodeCheckState(parentNode, state);
    expect(result.isSelected).toBe(true);
    expect(result.isIndeterminate).toBe(false);
    expect(result.allChildrenSelected).toBe(true);
  });

  it('resolveNodeCheckState classifies leaf area node', () => {
    const leaf = { area_id: 42, name: 'Leaf' };
    const result = resolveNodeCheckState(leaf, { ...emptyState, localSelectedAreas: [42] });
    expect(result.isAreaNode).toBe(true);
    expect(result.isSelected).toBe(true);
    expect(result.hasChildren).toBeFalsy();
  });
});
