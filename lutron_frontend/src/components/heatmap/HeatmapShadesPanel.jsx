import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  SHADE_PRESET_LEVELS,
  SHADES_VISIBLE_PER_PAGE,
  getShadeDisplayName,
  getShadesForPage,
  isShadePresetActive,
  resolveShadeZoneId,
  clampShadeLevel,
} from "../../utils/heatmapSidebarUtils";
import ShadeSlatIcon from "./ShadeSlatIcon";

const DEFAULT_NAV_ICON_SX = {
  bgcolor: "#fff",
  borderRadius: "50%",
  boxShadow: 1,
  width: { xs: 24, md: 28 },
  height: { xs: 24, md: 28 },
  minWidth: { xs: 24, md: 28 },
  minHeight: { xs: 24, md: 28 },
  p: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": { bgcolor: "#eee" },
};

function getShadeInputChrome(variant) {
  if (variant === "customized") {
    return {
      inputFontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      inputFontSize: { xs: 11, md: 12 },
      inputFontWeight: 600,
      inputBorder: "1px solid rgba(128, 120, 100, 0.55)",
      inputBorderHover: "1px solid rgba(128, 120, 100, 0.75)",
      inputBorderFocus: "1px solid #807864",
      inputBorderRadius: 4,
    };
  }
  if (variant === "advanced") {
    return {
      inputFontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      inputFontSize: { xs: 12, md: 13 },
      inputFontWeight: 500,
      inputBorder: "1px solid rgba(0, 0, 0, 0.38)",
      inputBorderHover: "1px solid rgba(0, 0, 0, 0.55)",
      inputBorderFocus: "1px solid rgba(0, 0, 0, 0.72)",
      inputBorderRadius: 4,
    };
  }
  // basic
  return {
    inputFontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    inputFontSize: { xs: 11, md: 12 },
    inputFontWeight: 600,
    inputBorder: "1px solid rgba(30, 116, 197, 0.45)",
    inputBorderHover: "1px solid rgba(30, 116, 197, 0.7)",
    inputBorderFocus: "1px solid #1E74C5",
    inputBorderRadius: 6,
  };
}

function resolveVariantTheme(variant, themeOverrides = {}) {
  const inputChrome = getShadeInputChrome(variant);

  if (themeOverrides.sectionBg) {
    return {
      sectionBg: themeOverrides.sectionBg,
      sectionBorder: themeOverrides.sectionBorder ?? "1px solid rgba(255,255,255,0.12)",
      labelColor: themeOverrides.labelColor ?? "#fff",
      labelBg: themeOverrides.labelBg ?? themeOverrides.sectionBg,
      navIconColor: themeOverrides.navIconColor ?? "#222",
      cardBg: themeOverrides.shadeCardBg ?? themeOverrides.cardBg ?? "#111",
      cardBorder: themeOverrides.shadeCardBorder ?? themeOverrides.cardBorder ?? "none",
      cardText: themeOverrides.shadeCardText ?? themeOverrides.cardText ?? "#fff",
      cardShadow: themeOverrides.shadeCardShadow ?? themeOverrides.cardShadow ?? 2,
      presetButtonSx: themeOverrides.presetButtonSx,
      ...inputChrome,
    };
  }

  if (variant === "customized") {
    return {
      sectionBg: "#f5f5f5",
      sectionBorder: "2px solid #807864",
      labelColor: "#807864",
      labelBg: "#fff",
      navIconColor: "#222",
      cardBg: "#fff",
      cardBorder: "1px solid rgba(128, 120, 100, 0.35)",
      cardText: "rgba(0,0,0,0.87)",
      cardShadow: "0 2px 6px rgba(0,0,0,0.12)",
      presetButtonSx: null,
      ...inputChrome,
    };
  }

  if (variant === "basic") {
    return {
      sectionBg: "#f5f7fb",
      sectionBorder: "2px solid #1E74C5",
      labelColor: "#1E74C5",
      labelBg: "#fff",
      navIconColor: "#1E74C5",
      cardBg: "#fff",
      cardBorder: "1px solid rgba(0,0,0,0.12)",
      cardText: "rgba(0,0,0,0.87)",
      cardShadow: "0 1px 3px rgba(0,0,0,0.08)",
      presetButtonSx: null,
      ...inputChrome,
    };
  }

  return {
    sectionBg: "rgba(0,0,0,0.35)",
    sectionBorder: "1px solid rgba(255, 255, 255, 0.12)",
    labelColor: "#fff",
    labelBg: "rgba(0,0,0,0.35)",
    navIconColor: "#fff",
    cardBg: "#111",
    cardBorder: "none",
    cardText: "#fff",
    cardShadow: 2,
    presetButtonSx: null,
    ...inputChrome,
  };
}

function defaultPresetButtonSx({ disabled, active, variant }) {
  const accent = variant === "customized" ? "#807864" : variant === "basic" ? "#1E74C5" : "#222";
  return {
    background: disabled ? "#ddd" : active ? accent : variant === "advanced" ? "#222" : "#fff",
    color: disabled ? "#999" : active ? "#fff" : variant === "advanced" ? "#fff" : accent,
    border: `1px solid ${disabled ? "#ccc" : active ? accent : accent}`,
    borderRadius: variant === "basic" ? 1 : 0.8,
    fontSize: { xs: 8, md: 10 },
    fontWeight: active ? 600 : 400,
    textTransform: "none",
    boxShadow: active ? 1 : "none",
    minWidth: { xs: 56, md: 64 },
    minHeight: { xs: 18, md: 22 },
    lineHeight: 1.1,
    px: { xs: 0.5, md: 0.6 },
    py: { xs: 0.2, md: 0.3 },
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    "&:hover": disabled
      ? {}
      : {
          background: active ? accent : "rgba(0,0,0,0.04)",
        },
  };
}

export default function HeatmapShadesPanel({
  shades,
  shadesLocalValues,
  onShadeChange,
  onPreset,
  onApply,
  shadesUpdating = false,
  canUpdate = true,
  isMobile = false,
  variant = "basic",
  themeOverrides,
  applyButtonSx,
  navIconSx = DEFAULT_NAV_ICON_SX,
  panelClassName,
  shadeCardClassName,
  presetButtonClassName,
}) {
  const [shadesPage, setShadesPage] = useState(0);
  /** Draft strings while typing so users can clear/replace the field freely. */
  const [levelDrafts, setLevelDrafts] = useState({});
  const [focusedShadeId, setFocusedShadeId] = useState(null);
  /** Per-shade "max 100" hint when user tries to type above 100. */
  const [maxHints, setMaxHints] = useState({});
  const theme = useMemo(
    () => resolveVariantTheme(variant, themeOverrides),
    [variant, themeOverrides]
  );

  // Only reset paging/drafts when the shade zone list actually changes — not on every
  // parent re-render (new `shades` array reference), which was snapping typed values back.
  const shadeIdsKey = useMemo(
    () =>
      shades
        .map((shade) => String(resolveShadeZoneId(shade) ?? ""))
        .filter(Boolean)
        .join("|"),
    [shades]
  );

  useEffect(() => {
    setShadesPage(0);
    setLevelDrafts({});
    setFocusedShadeId(null);
    setMaxHints({});
  }, [shadeIdsKey]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(shades.length / SHADES_VISIBLE_PER_PAGE) - 1);
    if (shadesPage > maxPage) setShadesPage(maxPage);
  }, [shades.length, shadesPage]);

  const pagedShades = getShadesForPage(shades, shadesPage);
  const hasPrev = shadesPage > 0;
  const hasNext = (shadesPage + 1) * SHADES_VISIBLE_PER_PAGE < shades.length;
  const controlsDisabled = shadesUpdating || !canUpdate;

  const clearMaxHint = (shadeZoneId) => {
    setMaxHints((prev) => {
      if (!prev[shadeZoneId]) return prev;
      const next = { ...prev };
      delete next[shadeZoneId];
      return next;
    });
  };

  const showMaxHint = (shadeZoneId) => {
    setMaxHints((prev) => ({ ...prev, [shadeZoneId]: true }));
  };

  const commitShadeLevel = (shadeZoneId, raw) => {
    const next = raw === "" || raw == null ? 0 : clampShadeLevel(raw);
    onShadeChange(shadeZoneId, next);
    clearMaxHint(shadeZoneId);
    return next;
  };

  const getPresetSx = (percent) => {
    const active = isShadePresetActive(shades, shadesLocalValues, percent);
    const disabled = !canUpdate;
    if (typeof theme.presetButtonSx === "function") {
      return theme.presetButtonSx({ disabled, active });
    }
    return defaultPresetButtonSx({ disabled, active, variant });
  };

  return (
    <Box
      className={panelClassName}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        bgcolor: theme.sectionBg,
        background: theme.sectionBg,
        border: theme.sectionBorder,
        borderRadius: variant === "advanced" ? 1.5 : 0,
        boxShadow: "none",
        minHeight: { xs: 100, md: 112 },
        flexShrink: 0,
        p: 0,
        m: 0,
        boxSizing: "border-box",
      }}
      data-testid="heatmap-shades-panel"
    >
      <Box
        sx={{
          writingMode: "vertical-rl",
          fontWeight: 600,
          fontSize: { xs: 9, sm: 10, md: 11 },
          fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
          lineHeight: 1.15,
          color: theme.labelColor,
          px: 0.5,
          py: 0.2,
          minWidth: { xs: 20, md: 24 },
          textAlign: "center",
          bgcolor: theme.labelBg,
          border:
            variant === "advanced" ? "1px solid rgba(255, 255, 255, 0.15)" : "none",
          borderRadius: "0 12px 12px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(180deg)",
          mr: 1,
          flexShrink: 0,
        }}
      >
        Shades
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          py: { xs: 0.35, md: 0.5 },
          pr: { xs: 0.5, md: 0.75 },
          pb: { xs: 0.5, md: 0.65 },
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 0.5,
            flexShrink: 0,
            minHeight: { xs: 78, md: 90 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 0.15, md: 0.2 },
              mr: 0.5,
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {SHADE_PRESET_LEVELS.map((percent) => (
              <Button
                key={percent}
                className={presetButtonClassName}
                variant="contained"
                onClick={() => onPreset(percent)}
                disabled={!canUpdate}
                sx={getPresetSx(percent)}
              >
                {percent}% open
              </Button>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {hasPrev && (
              <IconButton
                size="small"
                onClick={() => setShadesPage((page) => page - 1)}
                sx={{ ...navIconSx, mr: 0.25, flexShrink: 0 }}
              >
                <ArrowBackIosNewIcon
                  sx={{ color: theme.navIconColor, fontSize: { xs: 14, md: 18 } }}
                />
              </IconButton>
            )}

            {pagedShades.map((shade) => {
              const shadeZoneId = resolveShadeZoneId(shade);
              if (shadeZoneId == null) return null;
              const level = clampShadeLevel(shadesLocalValues[shadeZoneId] ?? 0);
              const displayName = getShadeDisplayName(shade);
              const isFocused = focusedShadeId === shadeZoneId;
              const draft = levelDrafts[shadeZoneId];
              const inputValue = isFocused
                ? (draft !== undefined ? draft : String(level))
                : String(level);
              // While typing (including empty), keep icon/label in sync without fighting the field
              const visualLevel =
                isFocused && draft !== undefined && draft !== ""
                  ? clampShadeLevel(draft)
                  : level;

              return (
                <Box
                  key={shadeZoneId}
                  className={shadeCardClassName}
                  sx={{
                    flex: 1,
                    minWidth: { xs: 96, md: 112 },
                    maxWidth: { xs: 150, md: 170 },
                    bgcolor: theme.cardBg,
                    border: theme.cardBorder,
                    borderRadius: 0.75,
                    boxShadow: theme.cardShadow,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    px: { xs: 0.5, md: 0.75 },
                    py: { xs: 0.5, md: 0.65 },
                    gap: 0.35,
                    overflow: "visible",
                  }}
                >
                  <Tooltip title={displayName} placement="top" arrow>
                    <Typography
                      fontSize={{ xs: 9, md: 10 }}
                      fontWeight={600}
                      sx={{
                        color: theme.cardText,
                        textAlign: "center",
                        lineHeight: 1.2,
                        width: "100%",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: { xs: 22, md: 24 },
                      }}
                    >
                      {displayName}
                    </Typography>
                  </Tooltip>

                  <ShadeSlatIcon
                    level={visualLevel}
                    onChange={(next) => onShadeChange(shadeZoneId, next)}
                    disabled={controlsDisabled}
                    isMobile={isMobile}
                  />

                  <Typography
                    fontSize={{ xs: 9, md: 10 }}
                    fontWeight={500}
                    sx={{ color: theme.cardText }}
                  >
                    {visualLevel}% Open
                  </Typography>

                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mt: 0.25,
                      minHeight: 40,
                    }}
                  >
                    <Box
                      className={`heatmap-shade-level-wrap heatmap-shade-level-wrap--${variant}`}
                      style={{
                        border: maxHints[shadeZoneId]
                          ? "1.5px solid #c62828"
                          : theme.inputBorder.replace(/^1px/, "1.5px"),
                        borderRadius: theme.inputBorderRadius,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                        width: 64,
                        height: 32,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      sx={{
                        flexShrink: 0,
                        overflow: "visible",
                        "&:focus-within": {
                          boxShadow: "0 0 0 2px rgba(0,0,0,0.14)",
                        },
                      }}
                    >
                      <input
                        className={`heatmap-shade-level-input heatmap-shade-level-input--${variant}`}
                        value={inputValue}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        disabled={controlsDisabled}
                        maxLength={3}
                        aria-label={`${displayName} open percent`}
                        onFocus={(event) => {
                          setFocusedShadeId(shadeZoneId);
                          setLevelDrafts((prev) => ({
                            ...prev,
                            [shadeZoneId]: String(level),
                          }));
                          clearMaxHint(shadeZoneId);
                          const input = event.target;
                          requestAnimationFrame(() => {
                            try {
                              input.select();
                            } catch {
                              /* ignore */
                            }
                          });
                        }}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw !== "" && !/^\d{0,3}$/.test(raw)) return;
                          if (raw !== "" && Number(raw) > 100) {
                            showMaxHint(shadeZoneId);
                            return;
                          }
                          clearMaxHint(shadeZoneId);
                          setLevelDrafts((prev) => ({ ...prev, [shadeZoneId]: raw }));
                          if (raw !== "") {
                            onShadeChange(shadeZoneId, clampShadeLevel(raw));
                          }
                        }}
                        onBlur={(event) => {
                          commitShadeLevel(shadeZoneId, event.target.value);
                          setFocusedShadeId(null);
                          setLevelDrafts((prev) => {
                            const next = { ...prev };
                            delete next[shadeZoneId];
                            return next;
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          textAlign: "center",
                          color: "#111111",
                          caretColor: "#111111",
                          fontFamily: theme.inputFontFamily,
                          fontSize:
                            typeof theme.inputFontSize === "object"
                              ? undefined
                              : theme.inputFontSize,
                          fontWeight: theme.inputFontWeight,
                          lineHeight: 1.2,
                          padding: "0 4px",
                          boxSizing: "border-box",
                          WebkitTextFillColor: "#111111",
                          opacity: controlsDisabled ? 0.55 : 1,
                          cursor: controlsDisabled ? "not-allowed" : "text",
                        }}
                      />
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        mt: 0.15,
                        fontFamily: theme.inputFontFamily,
                        fontSize: 9,
                        lineHeight: 1.1,
                        fontWeight: 600,
                        color: "#c62828",
                        visibility: maxHints[shadeZoneId] ? "visible" : "hidden",
                        minHeight: 11,
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      max 100
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {hasNext && (
              <IconButton
                size="small"
                onClick={() => setShadesPage((page) => page + 1)}
                sx={{ ...navIconSx, ml: 0.25, flexShrink: 0 }}
              >
                <ArrowForwardIosIcon
                  sx={{ color: theme.navIconColor, fontSize: { xs: 14, md: 18 } }}
                />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            mt: { xs: 0.35, md: 0.5 },
            mb: { xs: 2, md: 3 },
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Button
            size="small"
            variant="contained"
            onClick={onApply}
            disabled={controlsDisabled}
            sx={{
              ...(applyButtonSx || {}),
              mb: 0,
              flexShrink: 0,
              opacity: !canUpdate ? 0.5 : 1,
              cursor: !canUpdate ? "not-allowed" : "pointer",
            }}
          >
            {shadesUpdating ? "Applying..." : "Apply"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
