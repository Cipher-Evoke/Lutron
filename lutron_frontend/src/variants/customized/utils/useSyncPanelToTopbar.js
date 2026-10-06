import { useLayoutEffect } from 'react';

const TOPBAR_TRACK = '[data-topbar-track]';

const clearPanelStyles = (panel) => {
  if (!panel) return;
  panel.style.width = '';
  panel.style.maxWidth = '';
  panel.style.marginLeft = '';
  panel.style.marginRight = '';
  panel.style.boxSizing = '';
};

/**
 * Sets one or more panels' width to match the navbar AppBar (customized variant only).
 * @param {boolean} enabled
 * @param {string} panelSelector - e.g. '.quick-controls-content-panel'
 */
export function useSyncPanelToTopbar(enabled, panelSelector) {
  useLayoutEffect(() => {
    if (!enabled || !panelSelector) return undefined;

    const sync = () => {
      const track = document.querySelector(TOPBAR_TRACK);
      const panels = document.querySelectorAll(panelSelector);
      if (!track || panels.length === 0) return;

      const { width } = track.getBoundingClientRect();
      const w = Math.max(0, Math.round(width));
      panels.forEach((panel) => {
        panel.style.width = `${w}px`;
        panel.style.maxWidth = `${w}px`;
        panel.style.marginLeft = 'auto';
        panel.style.marginRight = 'auto';
        panel.style.boxSizing = 'border-box';
      });
    };

    sync();
    const rafId = requestAnimationFrame(sync);
    const t50 = window.setTimeout(sync, 50);
    const t300 = window.setTimeout(sync, 300);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      const trackEl = document.querySelector(TOPBAR_TRACK);
      if (trackEl) ro.observe(trackEl);
      document.querySelectorAll(panelSelector).forEach((panel) => {
        if (panel.parentElement) ro.observe(panel.parentElement);
      });
    }

    window.addEventListener('resize', sync);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t50);
      window.clearTimeout(t300);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', sync);
      document.querySelectorAll(panelSelector).forEach(clearPanelStyles);
    };
  }, [enabled, panelSelector]);
}
