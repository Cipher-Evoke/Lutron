import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectApplicationTheme } from "../redux/slice/theme/themeSlice";
import { isGoldApplicationTheme, isLightSurface } from "../utils/themeOnSurface";
import {
  usesCustomApplicationTheme,
  usesTheme3PageGradient,
  usesTheme4PageGradient,
} from "../utils/themePageBackground";
import {
  getSettingsSidebarActiveLabel,
  getSettingsSidebarNavItemSx,
  isSettingsSidebarNavActive,
  usesThemedSettingsSidebarChrome,
} from "../utils/settingsSidebarTabStyles";
import { ADVANCED_SETTINGS_HOME_PATH } from "../utils/advancedSettingsPaths";
import { SettingsSidebarNavLabel } from "../utils/SettingsSidebarNavLabel";
import {
  readSettingsSidebarPillState,
  writeSettingsSidebarPillState,
} from "../utils/settingsSidebarPillState";
import {
  getRovingTabIndex,
} from "../utils/rovingTablistKeyboard";
import {
  focusSettingsHomeTab,
  registerSettingsSidebarFocusHandler,
  requestTopbarNavFocus,
} from "../utils/pageSubNavBridge";
import { syncSettingsSidebarKeyboardApi, activateSettingsSidebarItem } from "../utils/settingsSidebarKeyboard";

const PILL_TRANSITION_MS = 600;
const PILL_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Settings left nav with a sliding active pill (vertical on desktop, horizontal on tablet).
 * Theme colors come from CSS vars (--settings-sidebar-active-bg, etc.).
 */
export default function SettingsSidebarNav({ items = [] }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const appTheme = useSelector(selectApplicationTheme);
  const themeBackground = appTheme?.application_theme?.background;
  const contentColor = appTheme?.application_theme?.content || "#ffffff";
  const isGoldTheme = isGoldApplicationTheme(themeBackground);
  const isTheme3Page = usesTheme3PageGradient(themeBackground);
  const isTheme4Page = usesTheme4PageGradient(themeBackground);
  const isCustomTheme = usesCustomApplicationTheme(themeBackground);
  const isDefaultWhiteTheme = isLightSurface(contentColor) && !isGoldTheme;
  const useThemedSidebarChrome = usesThemedSettingsSidebarChrome({
    isGoldTheme,
    isTheme3Page,
    isTheme4Page,
    isCustomTheme,
  });

  const navItems = useMemo(
    () => (items || []).filter((item) => item?.label && item?.path),
    [items]
  );
  const navItemKeys = useMemo(() => navItems.map((item) => item.label), [navItems]);
  const activeLabel = getSettingsSidebarActiveLabel(location.pathname, navItems);
  const activeLabelRef = useRef(activeLabel);
  activeLabelRef.current = activeLabel;

  const itemRefs = useRef({});
  const sidebarKeyboardModeRef = useRef(false);
  const [keyboardNavKey, setKeyboardNavKey] = useState(
    () => activeLabel || navItemKeys[0] || ""
  );
  const keyboardNavKeyRef = useRef(keyboardNavKey);
  keyboardNavKeyRef.current = keyboardNavKey;

  useEffect(() => {
    if (activeLabel) {
      keyboardNavKeyRef.current = activeLabel;
      setKeyboardNavKey(activeLabel);
      syncSettingsSidebarKeyboardApi({ keyboardNavKey: activeLabel, pathname: location.pathname });
    }
  }, [activeLabel, location.pathname]);

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
    keyboardNavKeyRef.current || activeLabelRef.current || navItemKeys[0] || "";

  const handleSidebarItemKeyDown = (event, itemLabel) => {
    sidebarKeyboardModeRef.current = true;
    const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
    const firstLabel = navItemKeys[0];
    const rovingActiveKey = getRovingSidebarKey() || itemLabel;

    keyboardNavKeyRef.current = rovingActiveKey;
    syncSettingsSidebarKeyboardApi({ keyboardNavKey: rovingActiveKey });

    if (!isTablet && event.key === "ArrowUp" && rovingActiveKey === firstLabel) {
      event.preventDefault();
      event.stopPropagation();
      requestTopbarNavFocus("Settings");
      return;
    }

    if (isTablet && event.key === "ArrowLeft" && rovingActiveKey === firstLabel) {
      event.preventDefault();
      event.stopPropagation();
      requestTopbarNavFocus("Settings");
      return;
    }

    if (
      event.key === "ArrowRight" &&
      rovingActiveKey === "Home" &&
      normalizedPath === ADVANCED_SETTINGS_HOME_PATH
    ) {
      event.preventDefault();
      event.stopPropagation();
      focusSettingsHomeTab("Lutron");
      return;
    }

    if (event.key === "ArrowDown" || (isTablet && event.key === "ArrowRight")) {
      event.preventDefault();
      event.stopPropagation();
      const idx = navItemKeys.indexOf(rovingActiveKey);
      const next = navItemKeys[Math.min(idx + 1, navItemKeys.length - 1)];
      if (next && next !== rovingActiveKey) activateSidebarItem(next);
      return;
    }

    if (event.key === "ArrowUp" || (isTablet && event.key === "ArrowLeft")) {
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
      onUpFromFirst: () => requestTopbarNavFocus("Settings"),
      onRightFromHome: () => focusSettingsHomeTab("Lutron"),
    });
  });

  useEffect(() => {
    if (!activeLabel) return undefined;
    if (!sidebarKeyboardModeRef.current) return undefined;
    focusSidebarItem(activeLabel);
    return undefined;
  }, [activeLabel, location.pathname, focusSidebarItem]);

  const savedPill = readSettingsSidebarPillState();
  const shouldSlideFromPersisted = Boolean(
    savedPill?.width > 0 &&
      savedPill?.height > 0 &&
      savedPill.activeLabel &&
      activeLabel &&
      savedPill.activeLabel !== activeLabel
  );
  const slideOnMountRef = useRef(shouldSlideFromPersisted);

  const [indicator, setIndicator] = useState(() => {
    if (shouldSlideFromPersisted) {
      return {
        top: savedPill.top,
        left: savedPill.left,
        width: savedPill.width,
        height: savedPill.height,
        ready: true,
      };
    }
    return { top: 0, left: 0, width: 0, height: 0, ready: false };
  });

  const pillTransition =
    indicator.ready && slideOnMountRef.current
      ? `top ${PILL_TRANSITION_MS}ms ${PILL_EASING}, left ${PILL_TRANSITION_MS}ms ${PILL_EASING}, width ${PILL_TRANSITION_MS}ms ${PILL_EASING}, height ${PILL_TRANSITION_MS}ms ${PILL_EASING}, opacity 0.25s ease`
      : "none";

  useLayoutEffect(() => {
    if (!activeLabel) {
      setIndicator((prev) => ({ ...prev, ready: false }));
      return undefined;
    }

    const applyMeasure = () => {
      const el = itemRefs.current[activeLabel];
      if (!el) return false;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width <= 0 || height <= 0) return false;
      const next = {
        top: el.offsetTop,
        left: el.offsetLeft,
        width,
        height,
        ready: true,
      };
      setIndicator(next);
      writeSettingsSidebarPillState({ ...next, activeLabel });
      return true;
    };

    if (slideOnMountRef.current) {
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyMeasure();
        });
      });
      return () => cancelAnimationFrame(rafId);
    }

    if (applyMeasure()) return undefined;
    const rafId = requestAnimationFrame(applyMeasure);
    return () => cancelAnimationFrame(rafId);
  }, [activeLabel, navItems.length, isTablet]);

  useEffect(() => {
    const handleResize = () => {
      if (!activeLabel) return;
      const el = itemRefs.current[activeLabel];
      if (!el) return;
      setIndicator({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
        ready: true,
      });
      writeSettingsSidebarPillState({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
        activeLabel,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeLabel, isTablet]);

  return (
    <Box
      className="settings-sidebar-nav-track"
      role="tablist"
      aria-label="Settings navigation"
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: isTablet ? "row" : "column",
        flexWrap: isTablet ? "wrap" : "nowrap",
        gap: isTablet ? 1 : 0.5,
        alignItems: isTablet ? "flex-start" : "stretch",
        width: "100%",
      }}
    >
      <Box
        aria-hidden
        className="settings-sidebar-active-pill"
        sx={{
          position: "absolute",
          top: indicator.top,
          left: indicator.left,
          width: indicator.width,
          height: indicator.height,
          borderRadius: "4px",
          opacity: indicator.ready && activeLabel ? 1 : 0,
          transition: pillTransition,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {navItems.map((item) => {
        const navActive = isSettingsSidebarNavActive(location.pathname, item.path);
        const labelIsLightChrome = isDefaultWhiteTheme && !useThemedSidebarChrome;

        return (
          <Box
            key={item.label}
            component="button"
            type="button"
            ref={(el) => {
              itemRefs.current[item.label] = el;
            }}
            role="tab"
            aria-selected={navActive}
            tabIndex={getRovingTabIndex(keyboardNavKey === item.label)}
            className="settings-sidebar-item settings-sidebar-item--pill"
            data-active={navActive ? "true" : "false"}
            data-testid={`settings-nav-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
            onKeyDown={(event) => handleSidebarItemKeyDown(event, item.label)}
            onMouseDown={() => {
              sidebarKeyboardModeRef.current = false;
            }}
            onClick={() => {
              sidebarKeyboardModeRef.current = true;
              activateSidebarItem(item.label);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              border: "none",
              font: "inherit",
              textAlign: isTablet ? "center" : "left",
              whiteSpace: isTablet ? "nowrap" : "normal",
              boxSizing: "border-box",
              position: "relative",
              zIndex: 1,
              cursor: "pointer",
              px: isTablet ? 1.5 : { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
              py: isTablet ? 0.8 : { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
              borderRadius: "4px",
              mb: isTablet ? 0 : 0,
              mr: isTablet ? 1 : 0,
              minWidth: isTablet ? "auto" : "100%",
              width: isTablet ? "auto" : "100%",
              outline: "none",
              "&:focus": { outline: "none", boxShadow: "none" },
              "&:focus-visible": { outline: "none", boxShadow: "none" },
              ...(useThemedSidebarChrome
                ? {
                    background: "transparent !important",
                    color: navActive
                      ? "var(--settings-sidebar-active-text, #ffffff)"
                      : "var(--settings-sidebar-text, #2c2820)",
                  }
                : labelIsLightChrome
                  ? {
                      background: "transparent !important",
                      color: "inherit",
                    }
                  : {
                      background: "transparent !important",
                      ...(getSettingsSidebarNavItemSx(false, theme, navActive).color
                        ? { color: navActive ? theme.palette.text.primary : theme.palette.text.secondary }
                        : {}),
                    }),
              ...(isTablet && {
                flex: "0 0 auto",
                border: useThemedSidebarChrome
                  ? undefined
                  : "1px solid rgba(0, 0, 0, 0.12)",
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }),
            }}
          >
            <SettingsSidebarNavLabel
              label={item.label}
              isLightChrome={labelIsLightChrome}
              isThemedChrome={useThemedSidebarChrome}
              isActive={navActive}
            />
          </Box>
        );
      })}
    </Box>
  );
}
