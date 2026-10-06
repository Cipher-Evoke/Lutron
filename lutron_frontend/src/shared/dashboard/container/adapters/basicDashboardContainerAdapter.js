import { BASIC_DASHBOARD_LAYOUT_ADAPTER } from '../layout/adapters/basicDashboardLayoutAdapter';
import {
  buildBasicDashboardExportOptions,
  buildBasicDashboardSections,
  buildBasicDashboardVisibilityOptions,
  buildDashboardDatesOptions,
  buildDashboardWidgetOptions,
} from './dashboardAdapterHelpers';

import {
  useBasicDashboardVisibility,
} from '../hooks/useDashboardVisibility';

export const basicDashboardContainerAdapter = {
  variant: 'basic',
  layoutAdapter: BASIC_DASHBOARD_LAYOUT_ADAPTER,
  useVisibility: useBasicDashboardVisibility,

  resolveVisibilityOptions(runtime) {
    return buildBasicDashboardVisibilityOptions(runtime);
  },

  resolveWidgetsOptions(ctx) {
    return buildDashboardWidgetOptions(ctx, 'basic');
  },

  resolveDatesOptions(ctx) {
    return buildDashboardDatesOptions(ctx);
  },

  resolveExportsOptions(ctx) {
    return buildBasicDashboardExportOptions(ctx);
  },

  buildSections({ orchestration, runtime }) {
    return buildBasicDashboardSections({ orchestration, runtime });
  },
};
