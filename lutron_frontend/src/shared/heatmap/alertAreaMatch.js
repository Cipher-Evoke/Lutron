/**
 * Bind heatmap polygons to active alerts by LEAP area_code, then LMS area_id.
 * Never match by leaf name (WS_2 exists on multiple floors).
 */

/** Site-specific safety net when alert has no area_code / area_id. Do not rely on this long-term. */
export const PROCESSOR_FLOOR_HINTS = {
  ideaaz_gf: "Ground Floor",
  aivara_3f: "3rd Floor",
  cafe_terrace: "Terrace",
  lightright: "3rd Floor",
};

export function sameAlertAreaId(left, right) {
  const a = Number(left);
  const b = Number(right);
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
}

export function leapCodesEqual(left, right) {
  if (left == null || right == null) return false;
  const a = String(left).trim();
  const b = String(right).trim();
  if (!a || !b) return false;
  if (Number.isFinite(Number(a)) && Number.isFinite(Number(b))) {
    return Number(a) === Number(b);
  }
  return a === b;
}

export function getFloorName(floors, floorId) {
  const list = Array.isArray(floors) ? floors : [];
  const f = list.find(
    (x) =>
      x &&
      (String(x.id) === String(floorId) || Number(x.id) === Number(floorId))
  );
  const name = f?.name ?? f?.floor_name ?? f?.title;
  if (name != null && String(name).trim() !== "") return String(name).trim();
  if (floorId == null || floorId === "") return null;
  return `Floor ${floorId}`;
}

function heatmapAreaCode(area) {
  return area?.code ?? area?.area_code ?? null;
}

function heatmapAreaId(area) {
  return area?.area_id ?? area?.id ?? null;
}

function heatmapFloorId(area) {
  return area?.floor_id ?? area?.floorId ?? null;
}

function hasLeapCode(value) {
  return value != null && String(value).trim() !== "";
}

/**
 * Show a heatmap alert icon only for this polygon's area.
 * Ground Floor WS_2 is LEAP 993; 3rd Floor WS_2 is 5149. Never match by name.
 */
export function alertBelongsToHeatmapArea(alert, area, selectedFloorId) {
  if (!alert || !area) return false;

  const areaFloor = heatmapFloorId(area);
  if (
    selectedFloorId != null &&
    areaFloor != null &&
    Number(areaFloor) !== Number(selectedFloorId)
  ) {
    return false;
  }

  const areaCode = heatmapAreaCode(area);
  if (hasLeapCode(alert.area_code) && hasLeapCode(areaCode)) {
    if (!leapCodesEqual(alert.area_code, areaCode)) {
      return false;
    }
    if (
      alert.floor_id != null &&
      areaFloor != null &&
      Number(alert.floor_id) !== Number(areaFloor)
    ) {
      return false;
    }
    return true;
  }

  if (!sameAlertAreaId(alert.area_id, heatmapAreaId(area))) {
    return false;
  }
  if (
    alert.floor_id != null &&
    selectedFloorId != null &&
    Number(alert.floor_id) !== Number(selectedFloorId)
  ) {
    return false;
  }
  return true;
}

export function hasActiveAlertForArea(alerts, area, selectedFloorId) {
  if (!Array.isArray(alerts) || alerts.length === 0) return false;
  return alerts.some((alert) =>
    alertBelongsToHeatmapArea(alert, area, selectedFloorId)
  );
}

export function findAlertForFloorplanArea(alerts, area, selectedFloorId) {
  if (!Array.isArray(alerts) || alerts.length === 0) return null;
  return (
    alerts.find((alert) =>
      alertBelongsToHeatmapArea(alert, area, selectedFloorId)
    ) || null
  );
}

export function buildAlertFocusPayload(area, matchedAlert) {
  const areaName = area?.name || area?.area_name || "";
  return {
    areaName,
    areaCode: heatmapAreaCode(area) ?? matchedAlert?.area_code ?? null,
    areaId: heatmapAreaId(area) ?? matchedAlert?.area_id ?? null,
    floorId: heatmapFloorId(area) ?? matchedAlert?.floor_id ?? null,
    location: matchedAlert?.location || null,
    alertType: matchedAlert?.alert_type || null,
    deviceName: matchedAlert?.device_name || null,
    serialNo: matchedAlert?.serial_no || null,
    reportedTime: matchedAlert?.reported_time || null,
    time: matchedAlert?.time || null,
  };
}

function normalizeFocusText(value) {
  return String(value || "").toLowerCase().trim();
}

/**
 * Find index of alert to highlight after heatmap redirect.
 * Prefer area_code / area_id. Never highlight by leaf name alone.
 */
export function findFocusedAlertIndex(alerts, focusAlert) {
  if (!focusAlert || !Array.isArray(alerts) || alerts.length === 0) {
    return -1;
  }

  const targetCode = focusAlert.areaCode ?? focusAlert.area_code;
  const targetAreaId = focusAlert.areaId ?? focusAlert.area_id;
  const targetLocation = normalizeFocusText(focusAlert.location);
  const targetType = normalizeFocusText(focusAlert.alertType);
  const targetDevice = normalizeFocusText(focusAlert.deviceName);
  const targetSerial = normalizeFocusText(focusAlert.serialNo);
  const targetTime = normalizeFocusText(focusAlert.reportedTime || focusAlert.time);

  const metaOk = (alert) => {
    const type = normalizeFocusText(alert?.alert_type);
    const device = normalizeFocusText(alert?.device_name);
    const serial = normalizeFocusText(alert?.serial_no);
    const time = normalizeFocusText(alert?.reported_time || alert?.time);
    const typeOk = !targetType || type === targetType;
    const deviceOk = !targetDevice || device === targetDevice;
    const serialOk = !targetSerial || serial === targetSerial;
    const timeOk = !targetTime || time === targetTime;
    return typeOk && deviceOk && serialOk && timeOk;
  };

  if (hasLeapCode(targetCode)) {
    const byCode = alerts.findIndex((alert) => {
      return leapCodesEqual(alert?.area_code, targetCode) && metaOk(alert);
    });
    if (byCode >= 0) return byCode;
  }

  if (targetAreaId != null && String(targetAreaId).trim() !== "") {
    const byId = alerts.findIndex((alert) => {
      return sameAlertAreaId(alert?.area_id, targetAreaId) && metaOk(alert);
    });
    if (byId >= 0) return byId;
  }

  if (targetLocation) {
    return alerts.findIndex((alert) => {
      return normalizeFocusText(alert?.location) === targetLocation && metaOk(alert);
    });
  }

  return -1;
}

// Back-compat aliases used by earlier wiring in this tree
export const alertMatchesFloorplanArea = (alert, area) =>
  alertBelongsToHeatmapArea(alert, area, heatmapFloorId(area));
