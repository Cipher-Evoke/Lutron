export function getRovingTabIndex(isFocused) {
  return isFocused ? 0 : -1;
}

function resolveFocusedKey(itemKeys, activeKey, keyRefs, eventTarget) {
  if (activeKey && itemKeys.includes(activeKey)) {
    return activeKey;
  }
  if (eventTarget) {
    for (const key of itemKeys) {
      const el = keyRefs.current?.[key];
      if (el && (el === eventTarget || el.contains(eventTarget))) {
        return key;
      }
    }
  }
  return activeKey;
}

export function handleRovingTablistKeyDown(event, {
  itemKeys,
  activeKey,
  keyRefs,
  orientation = 'horizontal',
  onActivate,
  wrap = false,
}) {
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  if (event.key !== prevKey && event.key !== nextKey) return false;

  event.preventDefault();
  event.stopPropagation();

  const currentKey = resolveFocusedKey(itemKeys, activeKey, keyRefs, event.currentTarget);
  const currentIndex = itemKeys.indexOf(currentKey);
  if (currentIndex < 0) return true;

  let nextIndex;
  if (event.key === nextKey) {
    nextIndex = currentIndex + 1;
    if (nextIndex >= itemKeys.length) {
      nextIndex = wrap ? 0 : itemKeys.length - 1;
    }
  } else {
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = wrap ? itemKeys.length - 1 : 0;
    }
  }

  const nextItemKey = itemKeys[nextIndex];
  if (nextItemKey === currentKey) return true;

  keyRefs.current[nextItemKey]?.focus({ preventScroll: true });
  onActivate?.(nextItemKey);
  return true;
}
