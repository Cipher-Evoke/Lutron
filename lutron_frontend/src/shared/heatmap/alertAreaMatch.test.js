/**
 * @jest-environment node
 */

import {
  alertBelongsToHeatmapArea,
  buildAlertFocusPayload,
  findFocusedAlertIndex,
  leapCodesEqual,
} from "./alertAreaMatch";

const gfWs2 = { id: 35, code: "993", name: "WS_2", floor_id: 5 };
const thirdWs2 = { id: 24, code: "5149", name: "WS_2", floor_id: 4 };

test("does not put 3rd Floor WS_2 alert on Ground Floor heatmap", () => {
  const alert = {
    area_id: 24,
    area_code: 5149,
    floor_id: 4,
    location: "IDEAAZ AUTOMATION PVT LTD/BUILDING_A/Lightright/Aivara_3F/WS_2",
  };
  expect(alertBelongsToHeatmapArea(alert, gfWs2, 5)).toBe(false);
  expect(alertBelongsToHeatmapArea(alert, thirdWs2, 4)).toBe(true);
});

test("does not match by shared leaf name when codes are missing", () => {
  const alert = {
    location: "IDEAAZ AUTOMATION PVT LTD/BUILDING_A/Lightright/Aivara_3F/WS_2",
  };
  expect(alertBelongsToHeatmapArea(alert, gfWs2, 5)).toBe(false);
});

test("area_id fallback still keeps 3rd Floor alert off Ground Floor", () => {
  const alert = { area_id: 24 };
  expect(alertBelongsToHeatmapArea(alert, gfWs2, 5)).toBe(false);
  expect(alertBelongsToHeatmapArea(alert, thirdWs2, 4)).toBe(true);
});

test("focus payload and row focus use area code", () => {
  expect(leapCodesEqual("5149", 5149)).toBe(true);
  const alert = {
    area_id: 24,
    area_code: "5149",
    floor_id: 4,
    location: "IDEAAZ AUTOMATION PVT LTD/BUILDING_A/Lightright/Aivara_3F/WS_2",
    alert_type: "Ballast Failure",
  };
  const focus = buildAlertFocusPayload(thirdWs2, alert);
  expect(focus.areaCode).toBe("5149");
  expect(focus.areaId).toBe(24);
  const idx = findFocusedAlertIndex(
    [
      {
        area_code: "993",
        area_id: 35,
        location: "x/WS_2",
        alert_type: "Ballast Failure",
      },
      alert,
    ],
    focus
  );
  expect(idx).toBe(1);
});
