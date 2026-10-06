import React, { memo, useRef, useLayoutEffect } from 'react';
import DashboardTabRenderer from './DashboardTabRenderer';
import {
  resolveDashboardSectionContent,
  resolveDashboardSectionKey,
  resolveDashboardSectionProps,
  listRoutableDashboardSections,
} from './dashboardLayoutResolvers';
import { dashboardLayoutRendererPropsAreEqual } from './dashboardLayoutMemoCompare';

function DashboardLayoutRendererInner({ activeTab, variant, sections, adapter }) {
  const sectionKey = resolveDashboardSectionKey(activeTab, adapter);
  const keepMounted = adapter?.keepInactiveSectionsMounted === true;
  const visitedSectionKeysRef = useRef(new Set());
  const stackRef = useRef(null);
  const activePanelRef = useRef(null);

  if (sectionKey) {
    visitedSectionKeysRef.current.add(sectionKey);
  }

  // Keep parent height matched to the visible panel without React setState (no flicker).
  useLayoutEffect(() => {
    if (!keepMounted) return undefined;
    const stack = stackRef.current;
    const active = activePanelRef.current;
    if (!stack || !active) return undefined;
    stack.style.minHeight = `${active.offsetHeight}px`;
    return undefined;
  }, [keepMounted, sectionKey, sections]);

  if (!keepMounted) {
    if (!sectionKey) return null;

    const content = resolveDashboardSectionContent(activeTab, sections, adapter);
    if (content == null) return null;

    const sectionProps = resolveDashboardSectionProps(activeTab, adapter);

    return (
      <DashboardTabRenderer tabId={sectionKey} sectionProps={sectionProps}>
        {content}
      </DashboardTabRenderer>
    );
  }

  // Advanced: keep visited tabs mounted. All panels stay position:absolute so
  // switching tabs only toggles visibility — no relative↔absolute reflow/jump.
  if (!sectionKey) return null;

  const keysToRender = listRoutableDashboardSections(adapter).filter(
    (key) => visitedSectionKeysRef.current.has(key) && sections?.[key] != null
  );

  return (
    <div ref={stackRef} style={{ position: 'relative', width: '100%' }}>
      {keysToRender.map((key) => {
        const isActive = key === sectionKey;
        const content = sections[key];
        const sectionProps =
          typeof adapter?.getSectionProps === 'function'
            ? adapter.getSectionProps(key, activeTab) ?? {}
            : {};

        return (
          <div
            key={key}
            ref={isActive ? activePanelRef : undefined}
            data-dashboard-section-keep-alive={key}
            aria-hidden={!isActive}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              visibility: isActive ? 'visible' : 'hidden',
              pointerEvents: isActive ? 'auto' : 'none',
              zIndex: isActive ? 1 : 0,
            }}
          >
            <DashboardTabRenderer tabId={key} sectionProps={sectionProps}>
              {content}
            </DashboardTabRenderer>
          </div>
        );
      })}
    </div>
  );
}

const DashboardLayoutRenderer = memo(
  DashboardLayoutRendererInner,
  dashboardLayoutRendererPropsAreEqual
);
DashboardLayoutRenderer.displayName = 'DashboardLayoutRenderer';

export default DashboardLayoutRenderer;
