import React, { memo, useMemo } from 'react';
import { spaceUtilizationContainerPropsAreEqual } from './spaceContainerMemoCompare';

function SpaceUtilizationContainerInner({
  variant,
  adapter,
  activeTab,
  runtime,
  orchestration,
}) {
  const section = useMemo(() => {
    return adapter.buildSections({ orchestration, runtime, activeTab, variant });
  }, [adapter, orchestration, runtime, activeTab, variant]);

  return section;
}

const SpaceUtilizationContainer = memo(
  SpaceUtilizationContainerInner,
  spaceUtilizationContainerPropsAreEqual
);
SpaceUtilizationContainer.displayName = 'SpaceUtilizationContainer';

export default SpaceUtilizationContainer;
