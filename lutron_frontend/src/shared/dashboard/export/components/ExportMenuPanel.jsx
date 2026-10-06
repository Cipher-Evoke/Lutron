import React, { memo } from 'react';
import ExportMenuAction from './ExportMenuAction';
import { resolveExportMenuLoadingLabels } from './exportMenuTheme';
import { areExportMenuPanelPropsEqual } from './exportMenuMemoCompare';

const BASE_PANEL_STYLE = {
  position: 'absolute',
  top: '100%',
  right: 0,
};

function resolveActionLabel(action, labels) {
  if (!action.loading) {
    return action.label;
  }
  if (action.loadingLabel) {
    return action.loadingLabel;
  }
  if (action.key === 'email') {
    return labels.sending;
  }
  if (action.key === 'download') {
    return labels.downloading;
  }
  return action.label;
}

function ExportMenuPanel({
  innerRef = null,
  panelStyle = {},
  panelDataAttribute = null,
  className,
  actions = [],
  itemDefaults = {},
  useEmoji = false,
  children,
}) {
  const dataProps = panelDataAttribute ? { [panelDataAttribute]: true } : {};
  const labels = resolveExportMenuLoadingLabels({ useEmoji });

  return (
    <div
      ref={innerRef}
      className={className}
      style={{ ...BASE_PANEL_STYLE, ...panelStyle }}
      {...dataProps}
    >
      {actions.map((action, index) => (
        <ExportMenuAction
          key={action.key}
          label={resolveActionLabel(action, labels)}
          loading={action.loading}
          disabled={action.disabled}
          onClick={action.onClick}
          withDivider={index < actions.length - 1}
          item={{ ...itemDefaults, ...action.item }}
        />
      ))}
      {children}
    </div>
  );
}

export default memo(ExportMenuPanel, areExportMenuPanelPropsEqual);
