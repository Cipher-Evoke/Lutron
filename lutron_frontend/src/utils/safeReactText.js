/**
 * Convert API / RTK error values into a string safe for React children.
 * Prevents: "Objects are not valid as a React child (found: object with keys {detail})"
 */
export function toSafeReactText(value, fallback = '') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => toSafeReactText(item, ''))
      .filter(Boolean)
      .join('; ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    if (typeof value.msg === 'string' && value.msg) return value.msg;
    if (typeof value.message === 'string' && value.message && value.message !== '[object Object]') {
      return value.message;
    }
    if (value.detail != null) return toSafeReactText(value.detail, fallback);
    if (value.error != null) return toSafeReactText(value.error, fallback);
    if (value.data != null) return toSafeReactText(value.data, fallback);
    try {
      const asJson = JSON.stringify(value);
      if (asJson && asJson !== '{}' && asJson !== 'null') return asJson;
    } catch {
      // ignore
    }
  }
  try {
    const asString = String(value);
    if (asString && asString !== '[object Object]') return asString;
  } catch {
    // ignore
  }
  return fallback || 'An unknown error occurred';
}

export default toSafeReactText;
