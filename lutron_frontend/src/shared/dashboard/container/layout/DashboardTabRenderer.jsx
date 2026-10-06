import React, { memo } from 'react';

function DashboardTabRendererInner({ tabId, sectionProps = {}, children }) {
  if (children == null || children === false) return null;

  const Wrapper = sectionProps.Wrapper;
  if (Wrapper) {
    return (
      <Wrapper data-dashboard-section={tabId} {...(sectionProps.wrapperProps || {})}>
        {children}
      </Wrapper>
    );
  }

  return <>{children}</>;
}

const DashboardTabRenderer = memo(DashboardTabRendererInner);
DashboardTabRenderer.displayName = 'DashboardTabRenderer';

export default DashboardTabRenderer;
