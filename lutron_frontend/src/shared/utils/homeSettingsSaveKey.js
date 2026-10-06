/**
 * Fingerprint for Settings → Home Lutron / Client / Project saves.
 * Skips duplicate Save clicks when form content is unchanged.
 */
export function buildHomeSettingsSaveKey({
  mode,
  description = "",
  clientName = "",
  locationText = "",
  address = "",
  areaSize = "",
  installedSolutions = [],
  imageFile = null,
  logoFile = null,
}) {
  const fileKey = (file) =>
    file ? `${file.name}:${file.size}:${file.lastModified}` : "";

  return JSON.stringify({
    mode: String(mode || ""),
    description: String(description || ""),
    clientName: String(clientName || ""),
    locationText: String(locationText || ""),
    address: String(address || ""),
    areaSize: String(areaSize || ""),
    solutions: (installedSolutions || []).map((s) => s?.name || s).join(","),
    imageFile: fileKey(imageFile),
    logoFile: fileKey(logoFile),
  });
}
