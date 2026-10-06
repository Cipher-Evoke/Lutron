import { getVariableOwners } from "./themeRegistryManifest";

/**
 * Validate preset variable names exist in the theme registry manifest.
 * @param {string} presetName
 * @param {string[]} variableNames
 * @returns {{ valid: boolean, errors: string[], orphans: string[] }}
 */
export function validatePresetVariables(presetName, variableNames) {
  const errors = [];
  const orphans = [];

  for (const variable of variableNames) {
    const key = String(variable).replace(/^--/, "");
    const entry = getVariableOwners(key);
    if (!entry) {
      orphans.push(key);
      errors.push(`Orphan variable not in manifest: ${key} (${presetName})`);
    }
  }

  return { valid: errors.length === 0, errors, orphans };
}

/**
 * @param {Record<string, string[]>} presetVariableMap
 */
export function validateAllPresetVariables(presetVariableMap) {
  const allErrors = [];
  const allOrphans = [];

  for (const [presetName, variableNames] of Object.entries(presetVariableMap)) {
    const result = validatePresetVariables(presetName, variableNames);
    allErrors.push(...result.errors);
    allOrphans.push(...result.orphans);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    orphans: [...new Set(allOrphans)],
  };
}
