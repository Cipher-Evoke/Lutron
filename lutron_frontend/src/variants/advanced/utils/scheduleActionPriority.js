export const ACTION_SOURCE = {
  INDIVIDUAL: 'individual',
  COMMON: 'common',
};

export function tagLoadedActions(actions) {
  return (actions || []).map((action) => ({
    ...action,
    source: action.source || ACTION_SOURCE.INDIVIDUAL,
  }));
}

export function tagAreasWithLoadedActions(areas) {
  return (areas || []).map((area) => ({
    ...area,
    actions: tagLoadedActions(area.actions),
  }));
}

export function withIndividualSource(action) {
  return { ...action, source: ACTION_SOURCE.INDIVIDUAL };
}

export function withCommonSource(action) {
  return { ...action, source: ACTION_SOURCE.COMMON };
}

export function stripActionSource(action) {
  if (!action || typeof action !== 'object') return action;
  const { source, ...rest } = action;
  return rest;
}

/**
 * Merge a common action into a location's actions.
 * "Apply to All" replaces any existing action of the same type (individual or common)
 * so modify-flow common Light Off/On updates previously saved light status.
 */
export function applyCommonActionToActions(existingActions, commonAction) {
  const taggedCommon = withCommonSource(commonAction);
  const commonType = commonAction.type;
  const existing = existingActions || [];

  const withoutSameType = existing.filter((action) => action.type !== commonType);
  return [...withoutSameType, taggedCommon];
}
