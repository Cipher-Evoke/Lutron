/**
 * @jest-environment node
 */
import { mapTimeRangeToBackend, mapTimeRangeToBackendForSavings } from './mapTimeRangeToBackend';

describe('mapTimeRangeToBackend', () => {
  it('maps UI keys to backend snake keys', () => {
    expect(mapTimeRangeToBackend('this-day')).toBe('this_day');
    expect(mapTimeRangeToBackend('this-week')).toBe('this_week');
    expect(mapTimeRangeToBackend('this-month')).toBe('this_month');
    expect(mapTimeRangeToBackend('this-year')).toBe('this_year');
  });

  it('defaults empty to this_day', () => {
    expect(mapTimeRangeToBackend()).toBe('this_day');
  });

  it('savings strategy maps this-year to this_month', () => {
    expect(mapTimeRangeToBackendForSavings('this-year')).toBe('this_month');
  });
});
