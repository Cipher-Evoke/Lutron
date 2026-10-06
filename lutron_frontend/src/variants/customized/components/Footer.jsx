import React, { useEffect, useState, useLayoutEffect } from "react";
import { Box, Typography } from "@mui/material";
import { FOOTER_VERSION_FONT_SIZE, getAppDisplayVersion } from "../../../utils/appVersion";

const Footer = () => {
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    setRoleName(localStorage.getItem('role') || '');
  }, []);

  useLayoutEffect(() => {
    const sync = () => {
      const track = document.querySelector('[data-topbar-track]');
      const footer = document.querySelector('.app-footer-track');
      if (!track || !footer) return;

      const { width } = track.getBoundingClientRect();
      const w = Math.max(0, Math.round(width));
      footer.style.width = `${w}px`;
      footer.style.maxWidth = `${w}px`;
      footer.style.marginLeft = 'auto';
      footer.style.marginRight = 'auto';
      footer.style.boxSizing = 'border-box';
    };

    sync();
    const rafId = requestAnimationFrame(sync);
    const t50 = window.setTimeout(sync, 50);
    const t300 = window.setTimeout(sync, 300);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      const trackEl = document.querySelector('[data-topbar-track]');
      const footerEl = document.querySelector('.app-footer-track');
      if (trackEl) ro.observe(trackEl);
      if (footerEl?.parentElement) ro.observe(footerEl.parentElement);
    }

    window.addEventListener('resize', sync);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t50);
      window.clearTimeout(t300);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  const isSuperadmin = roleName === 'Superadmin';

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        // Decorative only — must not intercept Cancel/Save (bottom-right) clicks
        pointerEvents: 'none',
        backgroundColor: 'transparent',
      }}
    >
    <Box
        className="app-footer-track"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSuperadmin ? 'space-between' : 'flex-end',
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          minHeight: 20,
          pl: 0,
          pr: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: FOOTER_VERSION_FONT_SIZE,
            lineHeight: 1,
            visibility: isSuperadmin ? 'visible' : 'hidden',
            minWidth: isSuperadmin ? 'auto' : 0,
          }}
        >
          {isSuperadmin && `Version ${getAppDisplayVersion()}`}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexShrink: 0,
            paddingRight: '20px',
          }}
        >
          <Typography
            component="span"
            sx={{
              color: 'rgba(0, 0, 0, 0.65)',
              fontSize: FOOTER_VERSION_FONT_SIZE,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Communicating with
          </Typography>
          <Box
            component="img"
            src="/assets/loginlogo.png"
            alt="Lutron Logo"
            sx={{
              height: 15,
              width: 'auto',
              display: 'block',
              flexShrink: 0,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;