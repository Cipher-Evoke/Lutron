/** Query param on `/main` for Lutron | Client | Project pills — shared by Home settings + top bar breadcrumb */
export const SETTINGS_HOME_TAB_QUERY = "homeTab";

const LABEL_BY_PARAM = {
  lutron: "Lutron",
  client: "Client",
  project: "Project",
};

export function getSettingsHomeTabLabelFromSearch(search) {
  if (search == null || typeof search !== "string") return "Lutron";
  const q = search.startsWith("?") ? search.slice(1) : search;
  const raw = (new URLSearchParams(q).get(SETTINGS_HOME_TAB_QUERY) || "lutron").toLowerCase();
  return LABEL_BY_PARAM[raw] || "Lutron";
}
