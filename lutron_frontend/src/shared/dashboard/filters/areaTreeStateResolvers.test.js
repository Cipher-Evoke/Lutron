/**
 * @jest-environment node
 */
import {
  resolveAreaTreeCheckboxState,
  resolveAreaTreeSelectionState,
  resolveAreaTreeSummaryState,
} from './areaTreeStateResolvers';

const node = {
  name: 'Parent',
  children: [{ area_id: 1 }, { area_id: 2 }],
};

describe('areaTreeStateResolvers', () => {
  it('resolveAreaTreeSelectionState flags pending selection', () => {
    expect(
      resolveAreaTreeSelectionState({
        localSelectedAreas: [1],
        localSelectedFloorIds: [],
        localSelectedGroups: [],
      }).hasPendingSelection
    ).toBe(true);
  });

  it('resolveAreaTreeCheckboxState returns partial selection', () => {
    const state = resolveAreaTreeCheckboxState(node, {
      localSelectedAreas: [1],
      localSelectedFloorIds: [],
      localSelectedGroups: [],
    });
    expect(state.isIndeterminate).toBe(true);
    expect(state.isSelected).toBe(false);
  });

  it('resolveAreaTreeSummaryState builds label and display sets', () => {
    const summary = resolveAreaTreeSummaryState({
      variant: 'basic',
      floors: [{ id: 1, floor_name: 'Ground' }],
      areaTree: { tree: [{ name: 'Project' }] },
      localSelectedFloorIds: [1],
      localSelectedAreas: [],
      localSelectedGroups: [],
      selectedAreas: [],
      selectedFloorIds: [],
      selectedGroupIds: [],
    });
    expect(summary.selectionLabel).toBe('Ground');
    expect(summary.displayFloorIds).toEqual([1]);
    expect(summary.hasPendingSelection).toBe(true);
  });
});
