/**
 * @jest-environment node
 */
import {
  BUILTIN_WIDGET_KEYS,
  BUILTIN_WIDGET_REGISTRY,
  getWidgetsBySection,
  WIDGET_SECTIONS,
} from './widgetRegistry';

describe('widgetRegistry', () => {
  it('lists exactly 19 built-in widgets', () => {
    expect(BUILTIN_WIDGET_KEYS).toHaveLength(19);
  });

  it('every registry entry has key and section', () => {
    for (const key of BUILTIN_WIDGET_KEYS) {
      expect(BUILTIN_WIDGET_REGISTRY[key].key).toBe(key);
      expect(BUILTIN_WIDGET_REGISTRY[key].section).toBeTruthy();
    }
  });

  it('overview section has 6 widgets', () => {
    expect(getWidgetsBySection(WIDGET_SECTIONS.OVERVIEW)).toHaveLength(6);
  });

  it('energy section has 7 widgets', () => {
    expect(getWidgetsBySection(WIDGET_SECTIONS.ENERGY)).toHaveLength(7);
  });

  it('space section has 6 widgets', () => {
    expect(getWidgetsBySection(WIDGET_SECTIONS.SPACE)).toHaveLength(6);
  });
});
