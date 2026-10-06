/** `/users` — breadcrumb suffix when Create modal or Delete confirmation is open */
export const SETTINGS_USERS_ACTION_QUERY = "usersAction";

export function getSettingsUsersActionSuffixFromSearch(search) {
  if (search == null || typeof search !== "string") return "";
  const q = search.startsWith("?") ? search.slice(1) : search;
  const raw = (new URLSearchParams(q).get(SETTINGS_USERS_ACTION_QUERY) || "").toLowerCase();
  if (raw === "create") return "Create User";
  if (raw === "edit") return "Edit User";
  if (raw === "delete") return "Delete";
  return "";
}
