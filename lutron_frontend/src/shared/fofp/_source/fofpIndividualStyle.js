/**
 * Pure helpers for FOFP per-marker style panel enablement and hints.
 */

export const isFofpIndividualStyleEnabled = (
  isEditing,
  defaultShapeReady,
  selectedZoneId,
  hasHandlers
) =>
  Boolean(
    isEditing &&
      defaultShapeReady &&
      selectedZoneId != null &&
      selectedZoneId !== "" &&
      hasHandlers
  );

export const getFofpIndividualStyleHint = (
  isEditing,
  defaultShapeReady,
  selectedZoneId
) => {
  if (!isEditing) {
    return "Turn on Edit above the floorplan to select markers and change shape or size.";
  }
  if (!defaultShapeReady) {
    return "Choose a default marker shape above to unlock per-marker styling.";
  }
  if (selectedZoneId == null || selectedZoneId === "") {
    return "Click a marker on the floorplan to edit its shape and size.";
  }
  return null;
};
