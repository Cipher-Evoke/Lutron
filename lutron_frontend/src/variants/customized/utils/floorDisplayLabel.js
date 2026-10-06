/**
 * Resolve a floor row from Redux `floor.floors` for chart labels (1st Floor, etc.).
 */
export function getFloorDisplayLabel(floors, floorId) {
  const list = Array.isArray(floors) ? floors : []
  const f = list.find(
    (x) =>
      x &&
      (String(x.id) === String(floorId) || Number(x.id) === Number(floorId))
  )
  const name = f?.name ?? f?.floor_name ?? f?.title
  if (name != null && String(name).trim() !== '') return String(name).trim()
  return `Floor ${floorId}`
}
