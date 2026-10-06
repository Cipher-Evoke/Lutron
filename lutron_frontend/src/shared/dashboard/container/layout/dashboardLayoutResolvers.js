import { DASHBOARD_SECTION_IDS } from './layoutTypes';

const CANONICAL_SECTION_IDS = Object.values(DASHBOARD_SECTION_IDS);

export function resolveDashboardSectionKey(activeTab, adapter) {
  if (activeTab == null || activeTab === '') return null;
  if (typeof adapter?.resolveSectionKey === 'function') {
    return adapter.resolveSectionKey(activeTab);
  }
  return CANONICAL_SECTION_IDS.includes(activeTab) ? activeTab : null;
}

export function isDashboardTabRoutable(activeTab, adapter) {
  return resolveDashboardSectionKey(activeTab, adapter) != null;
}

export function resolveDashboardSectionContent(activeTab, sections, adapter) {
  const sectionKey = resolveDashboardSectionKey(activeTab, adapter);
  if (!sectionKey || !sections) return null;
  return sections[sectionKey] ?? null;
}

export function resolveDashboardSectionProps(activeTab, adapter) {
  const sectionKey = resolveDashboardSectionKey(activeTab, adapter);
  if (!sectionKey) return {};
  if (typeof adapter?.getSectionProps === 'function') {
    return adapter.getSectionProps(sectionKey, activeTab) ?? {};
  }
  return {};
}

export function listRoutableDashboardSections(adapter) {
  const tabs = adapter?.TAB_ORDER || adapter?.tabs || CANONICAL_SECTION_IDS;
  const seen = new Set();
  const sections = [];
  for (const tabId of tabs) {
    const sectionKey = resolveDashboardSectionKey(tabId, adapter);
    if (sectionKey && !seen.has(sectionKey)) {
      seen.add(sectionKey);
      sections.push(sectionKey);
    }
  }
  return sections;
}
