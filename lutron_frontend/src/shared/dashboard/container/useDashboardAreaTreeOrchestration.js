import { useCallback, useMemo } from 'react';
import {
  buildClearAllResolution,
  buildSelectAllResolution,
  checkIfAllChildrenSelected as checkIfAllChildrenSelectedHelper,
  checkIfChildrenSelected as checkIfChildrenSelectedHelper,
  getAllChildAreaIds as getAllChildAreaIdsFromNode,
  getAreasForFloor as getAreasForFloorFromTree,
  getAreaSelectionText as resolveAreaSelectionText,
  getAllAreasFromGroup as resolveAreasFromGroup,
} from '../filters';

export function useDashboardAreaTreeOrchestration({
  variant,
  dispatch,
  reduxActions,
  floors,
  areaTree,
  selectedFloorIds,
  selectedAreas,
  localSelectedFloorIds,
  setLocalSelectedFloorIds,
  localSelectedAreas,
  setLocalSelectedAreas,
  localSelectedGroups,
  setLocalSelectedGroups,
  setFloorsWithSelectedAreas,
  setExpandedFloorId,
  setExpandedNodes,
  previousApiParamsRef,
  setShowAreaDropdown,
  clearAllOptions,
  selectAllContextExtras,
  selectionTextExtras,
  getAllAreasFromGroupOverride,
  extraReduxActions,
}) {
  const {
    clearDataCache,
    setSelectedAreas,
    setSelectedFloorIds,
    setSelectedGroups,
    setSelectedGroupIds,
    setSelectedFloor,
  } = reduxActions;
  const areaTreeSelectionState = useMemo(
    () => ({
      localSelectedAreas,
      localSelectedFloorIds,
      localSelectedGroups,
    }),
    [localSelectedAreas, localSelectedFloorIds, localSelectedGroups]
  );

  const getAreasForFloor = useCallback((_floorId) => getAreasForFloorFromTree(areaTree), [areaTree]);

  const getAllAreasFromGroup = useCallback(
    (groupId) =>
      getAllAreasFromGroupOverride
        ? getAllAreasFromGroupOverride(groupId)
        : resolveAreasFromGroup(groupId),
    [getAllAreasFromGroupOverride]
  );

  const getAllChildAreaIds = useCallback(
    (node) => getAllChildAreaIdsFromNode(node, (gid) => getAllAreasFromGroup(gid)),
    [getAllAreasFromGroup]
  );

  const checkIfChildrenSelected = useCallback(
    (node) => checkIfChildrenSelectedHelper(node, areaTreeSelectionState),
    [areaTreeSelectionState]
  );

  const checkIfAllChildrenSelected = useCallback(
    (node) => checkIfAllChildrenSelectedHelper(node, areaTreeSelectionState),
    [areaTreeSelectionState]
  );

  const applyAreaTreeClearAll = useCallback(() => {
    const resolution = buildClearAllResolution(clearAllOptions ?? {});
    setLocalSelectedFloorIds(resolution.local.localSelectedFloorIds);
    setFloorsWithSelectedAreas(new Set(resolution.local.floorsWithSelectedAreas));
    setLocalSelectedAreas(resolution.local.localSelectedAreas);
    setLocalSelectedGroups(resolution.local.localSelectedGroups);
    setExpandedFloorId(resolution.local.expandedFloorId);
    setExpandedNodes(new Set(resolution.local.expandedNodes));
    dispatch(clearDataCache());
    dispatch(setSelectedAreas(resolution.redux.selectedAreas));
    dispatch(setSelectedFloorIds(resolution.redux.selectedFloorIds));
    dispatch(setSelectedGroups(resolution.redux.selectedGroups));
    dispatch(setSelectedGroupIds(resolution.redux.selectedGroupIds));
    dispatch(setSelectedFloor(resolution.redux.selectedFloor));
    if (
      extraReduxActions?.setCustomWidgetFilters &&
      Object.prototype.hasOwnProperty.call(resolution.redux, 'customWidgetFilters')
    ) {
      dispatch(extraReduxActions.setCustomWidgetFilters(resolution.redux.customWidgetFilters));
    }
    if (previousApiParamsRef) previousApiParamsRef.current = null;
    setShowAreaDropdown(resolution.ui.showAreaDropdown);
  }, [
    clearAllOptions,
    dispatch,
    extraReduxActions,
    previousApiParamsRef,
    setExpandedFloorId,
    setExpandedNodes,
    setFloorsWithSelectedAreas,
    setLocalSelectedAreas,
    setLocalSelectedFloorIds,
    setLocalSelectedGroups,
    setShowAreaDropdown,
  ]);

  const applyAreaTreeSet = useCallback(() => {
    const resolution = buildSelectAllResolution({
      variant,
      localSelectedFloorIds,
      localSelectedAreas,
      localSelectedGroups,
      floors,
      getAllAreasFromGroup,
      ...(selectAllContextExtras ?? {}),
    });
    dispatch(clearDataCache());
    // setSelectedFloor clears selectedAreas in each dashboard slice. Commit the
    // floor first so an explicit area-only selection remains in Redux.
    dispatch(setSelectedFloor(resolution.redux.selectedFloor));
    dispatch(setSelectedAreas(resolution.redux.selectedAreas));
    dispatch(setSelectedFloorIds(resolution.redux.selectedFloorIds));
    dispatch(setSelectedGroups(resolution.redux.selectedGroups));
    dispatch(setSelectedGroupIds(resolution.redux.selectedGroupIds));
    if (
      extraReduxActions?.setCustomWidgetFilters &&
      Object.prototype.hasOwnProperty.call(resolution.redux, 'customWidgetFilters')
    ) {
      dispatch(extraReduxActions.setCustomWidgetFilters(resolution.redux.customWidgetFilters));
    }
    if (previousApiParamsRef) previousApiParamsRef.current = null;
    setShowAreaDropdown(resolution.ui.showAreaDropdown);
  }, [
    dispatch,
    extraReduxActions,
    floors,
    getAllAreasFromGroup,
    localSelectedAreas,
    localSelectedFloorIds,
    localSelectedGroups,
    previousApiParamsRef,
    selectAllContextExtras,
    setShowAreaDropdown,
    variant,
  ]);

  const getAreaSelectionText = useCallback(
    () =>
      resolveAreaSelectionText({
        variant,
        floors,
        areaTree,
        selectedFloorIds,
        selectedAreas,
        localSelectedFloorIds,
        localSelectedAreas,
        localSelectedGroups,
        ...(selectionTextExtras ?? {}),
      }),
    [
      areaTree,
      floors,
      localSelectedAreas,
      localSelectedFloorIds,
      localSelectedGroups,
      selectedAreas,
      selectedFloorIds,
      selectionTextExtras,
      variant,
    ]
  );

  return {
    areaTreeSelectionState,
    getAreasForFloor,
    getAllAreasFromGroup,
    getAllChildAreaIds,
    checkIfChildrenSelected,
    checkIfAllChildrenSelected,
    applyAreaTreeClearAll,
    applyAreaTreeSet,
    getAreaSelectionText,
  };
}
