import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  settingsSidebarGridItemSx,
  settingsTitleTypographySx,
} from '../utils/settingsPageLayout';
import {
  getSettingsSidebarActiveLabel,
  isSettingsSidebarNavActive,
} from '../../../utils/settingsSidebarNavPath';
import { getRovingTabIndex } from '../../../utils/keyboard/rovingTablistKeyboard';
import {
  focusSettingsHomeTab,
  registerSettingsSidebarFocusHandler,
  requestTopbarNavFocus,
} from '../../../utils/keyboard/pageSubNavBridge';
import { syncSettingsSidebarKeyboardApi, activateSettingsSidebarItem } from '../../../utils/keyboard/settingsSidebarKeyboard';
import { getSettingsSidebarDisplayLabel } from '../../../utils/settingsSidebarDisplayLabel';

function useSettingsSidebarKeyboard({ navItems, navItemKeys, isTablet, location, navigate }) {
  const activeLabel = getSettingsSidebarActiveLabel(location.pathname, navItems);
  const activeLabelRef = useRef(activeLabel);
  activeLabelRef.current = activeLabel;

  const itemRefs = useRef({});
  const sidebarKeyboardModeRef = useRef(false);
  const [keyboardNavKey, setKeyboardNavKey] = useState(
    () => activeLabel || navItemKeys[0] || ''
  );
  const keyboardNavKeyRef = useRef(keyboardNavKey);
  keyboardNavKeyRef.current = keyboardNavKey;

  useEffect(() => {
    const nextKey = activeLabel || navItemKeys[0] || '';
    if (nextKey) {
      keyboardNavKeyRef.current = nextKey;
      setKeyboardNavKey(nextKey);
      syncSettingsSidebarKeyboardApi({ keyboardNavKey: nextKey, pathname: location.pathname });
    }
  }, [activeLabel, location.pathname, navItemKeys]);

  const focusSidebarItem = useCallback((label) => {
    if (!label) return;
    requestAnimationFrame(() => {
      itemRefs.current[label]?.focus({ preventScroll: true });
    });
  }, []);

  const activateSidebarItem = useCallback((label) => {
    sidebarKeyboardModeRef.current = true;
    keyboardNavKeyRef.current = label;
    setKeyboardNavKey(label);
    activateSettingsSidebarItem(label);
  }, []);

  const getRovingSidebarKey = () =>
    keyboardNavKeyRef.current || activeLabelRef.current || navItemKeys[0] || '';

  const handleSidebarItemKeyDown = (event, itemLabel) => {
    sidebarKeyboardModeRef.current = true;
    const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
    const firstLabel = navItemKeys[0];
    const rovingActiveKey = getRovingSidebarKey() || itemLabel;

    keyboardNavKeyRef.current = rovingActiveKey;
    syncSettingsSidebarKeyboardApi({ keyboardNavKey: rovingActiveKey });

    if (!isTablet && event.key === 'ArrowUp' && rovingActiveKey === firstLabel) {
      event.preventDefault();
      event.stopPropagation();
      requestTopbarNavFocus('Settings');
      return;
    }

    if (isTablet && event.key === 'ArrowLeft' && rovingActiveKey === firstLabel) {
      event.preventDefault();
      event.stopPropagation();
      requestTopbarNavFocus('Settings');
      return;
    }

    if (event.key === 'ArrowRight' && rovingActiveKey === 'Home' && normalizedPath === '/main') {
      event.preventDefault();
      event.stopPropagation();
      focusSettingsHomeTab('Lutron');
      return;
    }

    if (event.key === 'ArrowDown' || (isTablet && event.key === 'ArrowRight')) {
      event.preventDefault();
      event.stopPropagation();
      const idx = navItemKeys.indexOf(rovingActiveKey);
      const next = navItemKeys[Math.min(idx + 1, navItemKeys.length - 1)];
      if (next && next !== rovingActiveKey) activateSidebarItem(next);
      return;
    }

    if (event.key === 'ArrowUp' || (isTablet && event.key === 'ArrowLeft')) {
      event.preventDefault();
      event.stopPropagation();
      const idx = navItemKeys.indexOf(rovingActiveKey);
      const next = navItemKeys[Math.max(idx - 1, 0)];
      if (next && next !== rovingActiveKey) activateSidebarItem(next);
    }
  };

  useEffect(() => {
    return registerSettingsSidebarFocusHandler((label) => {
      const key = navItemKeys.includes(label) ? label : navItemKeys[0];
      if (!key) return;
      activateSidebarItem(key);
    });
  }, [navItemKeys, activateSidebarItem]);

  useLayoutEffect(() => {
    const rovingKey = getRovingSidebarKey();
    syncSettingsSidebarKeyboardApi({
      navItemKeys,
      navItems,
      isTablet,
      pathname: location.pathname,
      keyboardNavKey: rovingKey,
      itemRefs,
      navigate,
      onUpFromFirst: () => requestTopbarNavFocus('Settings'),
      onRightFromHome: () => focusSettingsHomeTab('Lutron'),
    });
  });

  useEffect(() => {
    if (!activeLabel) return undefined;
    if (!sidebarKeyboardModeRef.current) return undefined;
    focusSidebarItem(activeLabel);
    return undefined;
  }, [activeLabel, location.pathname, focusSidebarItem]);

  return {
    activeLabel,
    keyboardNavKey,
    itemRefs,
    sidebarKeyboardModeRef,
    handleSidebarItemKeyDown,
    activateSidebarItem,
  };
}

function SettingsSidebarNavTrack({
  navItems,
  location,
  isTablet,
  theme,
  containerBg,
  keyboardNavKey,
  itemRefs,
  sidebarKeyboardModeRef,
  handleSidebarItemKeyDown,
  activateSidebarItem,
}) {
  return (
    <Box
      className="settings-sidebar-nav-track"
      role="tablist"
      aria-label="Settings navigation"
      sx={{
        display: 'flex',
        flexDirection: isTablet ? 'row' : 'column',
        flexWrap: isTablet ? 'wrap' : 'nowrap',
        gap: isTablet ? 1 : 0,
        justifyContent: 'flex-start',
        alignItems: isTablet ? 'flex-start' : 'stretch',
      }}
    >
      {navItems.map((item) => {
        const active = isSettingsSidebarNavActive(location.pathname, item.path);
        return (
          <Box
            key={item.label}
            component="button"
            type="button"
            ref={(el) => {
              itemRefs.current[item.label] = el;
            }}
            role="tab"
            aria-selected={active}
            tabIndex={getRovingTabIndex(keyboardNavKey === item.label)}
            className="settings-sidebar-item"
            onKeyDown={(event) => handleSidebarItemKeyDown(event, item.label)}
            onMouseDown={() => {
              sidebarKeyboardModeRef.current = false;
            }}
            onClick={() => {
              sidebarKeyboardModeRef.current = true;
              activateSidebarItem(item.label);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              font: 'inherit',
              backgroundColor: active ? containerBg : 'transparent',
              color: active ? theme.palette.text.primary : theme.palette.text.secondary,
              px: isTablet ? 1.5 : 2,
              py: isTablet ? 0.8 : 1,
              borderRadius: '4px',
              mb: isTablet ? 0 : 0.8,
              mr: isTablet ? 1 : 0,
              fontSize: isTablet ? '11px' : '14px',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              minWidth: isTablet ? 'auto' : '100%',
              textAlign: isTablet ? 'center' : 'left',
              whiteSpace: isTablet ? 'nowrap' : 'normal',
              outline: 'none',
              '&:focus': { outline: 'none', boxShadow: 'none' },
              '&:focus-visible': { outline: 'none', boxShadow: 'none' },
              '&:hover': {
                backgroundColor: containerBg,
              },
              ...(isTablet && {
                flex: '0 0 auto',
                border: '1px solid rgba(255,255,255,0.1)',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }),
            }}
          >
            {getSettingsSidebarDisplayLabel(item.label)}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Shared settings left nav (customized variant).
 * `embedded` — nav track only (parent supplies column/title layout).
 */
const SettingsSidebar = ({ items = [], embedded = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const containerBg =
    theme.palette.custom?.containerBg || theme.palette.custom.containerBg;

  const navItems = useMemo(
    () => (items || []).filter((item) => item?.label && item?.path),
    [items]
  );
  const navItemKeys = useMemo(() => navItems.map((item) => item.label), [navItems]);

  const keyboard = useSettingsSidebarKeyboard({
    navItems,
    navItemKeys,
    isTablet,
    location,
    navigate,
  });

  const navTrack = (
    <SettingsSidebarNavTrack
      navItems={navItems}
      location={location}
      isTablet={isTablet}
      theme={theme}
      containerBg={containerBg}
      {...keyboard}
    />
  );

  if (embedded) {
    return navTrack;
  }

  return (
    <Grid item xs={12} md={3} sx={settingsSidebarGridItemSx}>
      <Typography
        variant="h6"
        sx={{
          ...settingsTitleTypographySx,
          color: theme.palette.text.secondary,
        }}
      >
        Settings
      </Typography>
      {navTrack}
    </Grid>
  );
};

export default SettingsSidebar;
