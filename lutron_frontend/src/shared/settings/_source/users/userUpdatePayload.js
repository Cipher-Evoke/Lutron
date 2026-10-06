const permissionMap = {
  "Monitoring Only": "monitor",
  "Monitoring and control": "monitor_control",
  "Monitoring, edit and control": "monitor_control_edit",
};

const permissionOptions = [
  "Monitoring Only",
  "Monitoring and control",
  "Monitoring, edit and control",
];

export function apiToPermissionLabel(api) {
  const key = String(api || "")
    .toLowerCase()
    .trim();
  const rev = {
    monitor: "Monitoring Only",
    monitor_control: "Monitoring and control",
    monitor_control_edit: "Monitoring, edit and control",
  };
  return rev[key] || permissionOptions[0];
}

export function floorPayloadFromSelection(selectedFloors) {
  return selectedFloors.map((f) => ({
    floor_id: f.id,
    floor_permission: permissionMap[f.permission] || "monitor",
  }));
}

export function serializeFloorsSelection(selectedFloors) {
  const payload = floorPayloadFromSelection(selectedFloors);
  return JSON.stringify(
    [...payload].sort((a, b) => a.floor_id - b.floor_id)
  );
}

export function buildUserPatchBody({
  name,
  initialName,
  email,
  initialEmail,
  password,
  isOperator,
  selectedFloors,
  initialFloorsJson,
}) {
  const body = {};
  const nameTrim = String(name ?? "").trim();
  const initialNameNorm = String(initialName ?? "").trim();
  if (nameTrim !== initialNameNorm) {
    body.name = nameTrim;
  }
  const emailTrim = String(email ?? "").trim();
  const initialEmailTrim = String(initialEmail ?? "").trim();
  if (emailTrim !== initialEmailTrim) {
    body.email = emailTrim;
  }
  const passwordStr = String(password ?? "").trim();
  if (passwordStr) {
    body.password = passwordStr;
  }
  if (isOperator && serializeFloorsSelection(selectedFloors) !== initialFloorsJson) {
    body.floor = floorPayloadFromSelection(selectedFloors);
  }
  return body;
}

export function hasUserUpdateChanges({
  name,
  initialName,
  email,
  initialEmail,
  password,
  isOperator,
  selectedFloors,
  initialFloorsJson,
}) {
  const nameChanged = String(name ?? "").trim() !== String(initialName ?? "").trim();
  const emailChanged =
    String(email ?? "").trim() !== String(initialEmail ?? "").trim();
  const passwordFilled = String(password ?? "").trim().length > 0;
  const floorsChanged =
    isOperator && serializeFloorsSelection(selectedFloors) !== initialFloorsJson;
  return nameChanged || emailChanged || passwordFilled || floorsChanged;
}
