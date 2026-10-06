import React, { memo, useMemo, useRef } from 'react';
import { DashboardLayoutRenderer } from './layout';
import { dashboardContainerPropsAreEqual } from './dashboardContainerMemoCompare';
import { resolveDashboardSectionKey } from './layout/dashboardLayoutResolvers';

function DashboardContainerInner({ variant, adapter, activeTab, runtime, orchestration }) {
  const keepAlive = adapter.layoutAdapter?.keepInactiveSectionsMounted === true;

  const builtSections = useMemo(
    () => adapter.buildSections({ orchestration, runtime, activeTab }),
    [adapter, orchestration, runtime]
  );

  const sectionCacheRef = useRef({});
  const prevTabRef = useRef(null);
  const layoutAdapter = adapter.layoutAdapter;
  const activeSectionKey = resolveDashboardSectionKey(activeTab, layoutAdapter);

  let sections = builtSections;

  if (keepAlive) {
    const prevTab = prevTabRef.current;
    const tabChanged = prevTab != null && prevTab !== activeTab;
    const cache = sectionCacheRef.current;

    // Seed any not-yet-cached section from the latest build (first visit).
    Object.keys(builtSections || {}).forEach((key) => {
      if (cache[key] == null && builtSections[key] != null) {
        cache[key] = builtSections[key];
      }
    });

    // Same-tab updates (filters/data): refresh only the active section so
    // inactive keep-alive panels keep their element identity (no chart blink).
    if (!tabChanged && activeSectionKey && builtSections?.[activeSectionKey] != null) {
      cache[activeSectionKey] = builtSections[activeSectionKey];
    }

    prevTabRef.current = activeTab;
    sections = { ...cache };
  }

  return (
    <DashboardLayoutRenderer
      activeTab={activeTab}
      variant={variant}
      adapter={layoutAdapter}
      sections={sections}
    />
  );
}

const DashboardContainer = memo(DashboardContainerInner, dashboardContainerPropsAreEqual);
DashboardContainer.displayName = 'DashboardContainer';

export default DashboardContainer;
