export const DEVICE_TYPE_OPTIONS = [
  { label: "Devices", value: "devices" },
  { label: "Keypad", value: "keypad" },
  { label: "Sensors", value: "sensors" },
  { label: "Drivers", value: "drivers" },
  { label: "AWN RF", value: "awn_rf" },
  { label: "AWN OCC", value: "awn_occ" },
  { label: "Others", value: "others" },
];

export const OCCUPANCY_TYPE_OPTION = {
  label: "Occupancy Mode",
  value: "occupancy_mode",
};

export const OCCUPANCY_TYPE = OCCUPANCY_TYPE_OPTION.value;

const DEVICE_TYPES = DEVICE_TYPE_OPTIONS.map((opt) => opt.value);

/**
 * Toggle a maintenance report category with occupancy_mode mutually exclusive from device types.
 */
export function onCategoryToggle(selected, toggled) {
  if (toggled === OCCUPANCY_TYPE) {
    return selected.includes(OCCUPANCY_TYPE) ? [] : [OCCUPANCY_TYPE];
  }

  const withoutOccupancy = selected.filter((type) => type !== OCCUPANCY_TYPE);
  if (withoutOccupancy.includes(toggled)) {
    return withoutOccupancy.filter((type) => type !== toggled);
  }

  return [...withoutOccupancy, toggled];
}

export function isOccupancyReportSelected(selected) {
  return selected.includes(OCCUPANCY_TYPE);
}

export function getMaintenanceErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "object" && detail?.message) {
    return detail.message;
  }
  if (typeof detail === "string") {
    return detail;
  }
  return err?.response?.data?.message || err?.message || "Failed to download maintenance report.";
}

export function downloadCsvFile(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || "maintenance_report.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function formatPartialProcessorsWarning(processorsNotResponding) {
  if (!processorsNotResponding?.length) {
    return "";
  }
  return `Some processors did not respond: ${processorsNotResponding.join(", ")}`;
}

export { DEVICE_TYPES };
