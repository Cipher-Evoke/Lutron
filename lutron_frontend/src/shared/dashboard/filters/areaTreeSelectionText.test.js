/**
 * @jest-environment node
 */
import {
  getAreaSelectionText,
  getFloorSelectionText,
  getGroupSelectionText,
  getAreaSummaryText,
} from './areaTreeSelectionText';

const floors = [
  { id: 1, floor_name: 'Ground' },
  { id: 2, name: 'Level 2' },
];

const areaTree = {
  tree: [
    {
      name: 'Project Alpha',
      children: [
        { area_id: 10, name: 'Lobby' },
        { area_id: 11, name: 'Office' },
      ],
    },
  ],
};

describe('areaTreeSelectionText', () => {
  it('getFloorSelectionText handles single and multiple floors', () => {
    expect(getFloorSelectionText([1], floors)).toBe('Ground');
    expect(getFloorSelectionText([2], floors)).toBe('Level 2');
    expect(getFloorSelectionText([1, 2], floors)).toBe('2 Floors Selected');
  });

  it('getGroupSelectionText basic vs customized', () => {
    expect(getGroupSelectionText([5], { variant: 'basic' })).toBe('1 Group Selected');
    expect(getGroupSelectionText([5, 6], { variant: 'advanced' })).toBe('2 Groups Selected');
    expect(
      getGroupSelectionText([9], {
        variant: 'customized',
        areaGroups: { special_area_groups: [{ group_id: 9, name: 'HVAC' }], user_area_groups: [] },
      })
    ).toBe('HVAC');
  });

  it('getAreaSummaryText resolves single and combined labels', () => {
    expect(getAreaSummaryText([10], { areaTree, variant: 'basic' })).toBe('Lobby');
    expect(getAreaSummaryText([10, 11], { areaTree, variant: 'basic' })).toBe('Project Alpha');
    expect(getAreaSummaryText([10, 11, 12, 13, 14], { areaTree, variant: 'basic' })).toBe(
      'Combined Areas'
    );
  });

  it('getAreaSelectionText prioritizes committed floors', () => {
    expect(
      getAreaSelectionText({
        variant: 'basic',
        floors,
        areaTree,
        selectedFloorIds: [1],
        localSelectedAreas: [99],
      })
    ).toBe('Ground');
  });

  it('getAreaSelectionText customized joins floor group and area parts', () => {
    const label = getAreaSelectionText({
      variant: 'customized',
      floors,
      areaTree,
      selectedFloorIds: [1],
      selectedGroupIds: [9],
      selectedAreas: [10],
      areaGroups: { special_area_groups: [{ group_id: 9, name: 'HVAC' }], user_area_groups: [] },
    });
    expect(label).toBe('Ground · HVAC · Lobby');
  });

  it('getAreaSelectionText returns project name when empty', () => {
    expect(
      getAreaSelectionText({ variant: 'basic', floors, areaTree })
    ).toBe('Project Alpha');
  });
});
