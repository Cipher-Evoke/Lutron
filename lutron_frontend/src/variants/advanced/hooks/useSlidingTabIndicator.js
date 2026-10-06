import { useLayoutEffect, useState } from 'react';

/**
 * Positions an absolutely positioned sliding pill under the active tab.
 * Remeasures on key/layout/breakpoint/font changes so refresh races don't leave
 * the pill stuck between tabs.
 *
 * @param {object} options
 * @param {string|null|undefined} options.activeKey - Active tab key in tabRefs
 * @param {React.MutableRefObject<Record<string, HTMLElement|null>>} options.tabRefs
 * @param {React.MutableRefObject<HTMLElement|null>} [options.containerRef]
 * @param {boolean} [options.enabled=true]
 * @param {unknown[]} [options.layoutDeps=[]] - Extra deps that change tab size/label (breakpoints, etc.)
 */
export function useSlidingTabIndicator({
  activeKey,
  tabRefs,
  containerRef = null,
  enabled = true,
  layoutDeps = [],
}) {
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    if (!enabled || activeKey == null || activeKey === '') {
      return undefined;
    }

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;

    const measure = () => {
      if (cancelled) return false;
      const activeEl = tabRefs.current?.[activeKey];
      if (!activeEl) return false;
      const width = activeEl.offsetWidth;
      if (width <= 0) return false;
      const left = activeEl.offsetLeft;
      setTabIndicator((prev) => {
        if (prev.ready && prev.left === left && prev.width === width) return prev;
        return { left, width, ready: true };
      });
      return true;
    };

    // Immediate measure (keeps tab-switch animation when layout is already stable)
    measure();

    // Retry after layout + fonts — fixes intermittent wrong geometry on hard refresh
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        measure();
      });
    });

    let fontsPromise = null;
    try {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        fontsPromise = document.fonts.ready.then(() => {
          if (!cancelled) measure();
        });
      }
    } catch {
      // ignore
    }

    const handleResize = () => {
      measure();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver = null;
    const containerEl = containerRef?.current;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measure();
      });
      if (containerEl) resizeObserver.observe(containerEl);
      const activeEl = tabRefs.current?.[activeKey];
      if (activeEl) resizeObserver.observe(activeEl);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver?.disconnect();
      // Prevent unhandled rejection if fonts.ready settles after unmount
      if (fontsPromise && typeof fontsPromise.catch === 'function') {
        fontsPromise.catch(() => {});
      }
    };
    // layoutDeps intentionally expanded by callers (breakpoints / label sizes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, enabled, tabRefs, containerRef, ...layoutDeps]);

  return tabIndicator;
}
