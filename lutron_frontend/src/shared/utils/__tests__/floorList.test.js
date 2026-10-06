import { getFloorsList } from '../floorList';

describe('getFloorsList', () => {
  it('returns an empty array for nullish input', () => {
    expect(getFloorsList(null)).toEqual([]);
    expect(getFloorsList(undefined)).toEqual([]);
  });

  it('returns arrays unchanged', () => {
    const floors = [{ id: 1, floor_name: 'Ground' }];
    expect(getFloorsList(floors)).toBe(floors);
  });

  it('unwraps { floors: [] } payloads', () => {
    const floors = [{ id: 2, floor_name: 'First' }];
    expect(getFloorsList({ floors })).toEqual(floors);
  });

  it('unwraps { data: [] } payloads', () => {
    const floors = [{ id: 3, floor_name: 'Second' }];
    expect(getFloorsList({ data: floors })).toEqual(floors);
  });

  it('returns an empty array for unexpected shapes', () => {
    expect(getFloorsList({ status: 'success' })).toEqual([]);
  });
});
