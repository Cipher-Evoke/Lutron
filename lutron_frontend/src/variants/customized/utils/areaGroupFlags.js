/** APIs sometimes return booleans as strings ("true") or 1/0. */
function truthyFlag(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export function isSpecialAreaGroup(g) {
  if (!g || typeof g !== 'object') return false;
  return (
    truthyFlag(g.special) ||
    truthyFlag(g.is_special) ||
    truthyFlag(g.is_special_area)
  );
}
