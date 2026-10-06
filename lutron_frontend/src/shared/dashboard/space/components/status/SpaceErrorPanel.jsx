import React, { memo } from 'react';
import SpaceStatusPanel from './SpaceStatusPanel';
import { spaceErrorPanelPropsAreEqual } from './spaceStatusMemoCompare';

const DEFAULT_SUBTITLE = 'Check console for detailed debugging information';

function SpaceErrorPanelInner({
  message,
  shellVariant = 'basic',
  subtitle = DEFAULT_SUBTITLE,
}) {
  if (!message) return null;

  const resolvedMessage =
    typeof message === 'string' ? message : 'An error occurred';

  return (
    <SpaceStatusPanel
      tone="error"
      shellVariant={shellVariant}
      title={`Error: ${resolvedMessage}`}
      subtitle={subtitle}
    />
  );
}

const SpaceErrorPanel = memo(SpaceErrorPanelInner, spaceErrorPanelPropsAreEqual);

SpaceErrorPanel.displayName = 'SpaceErrorPanel';

export default SpaceErrorPanel;
