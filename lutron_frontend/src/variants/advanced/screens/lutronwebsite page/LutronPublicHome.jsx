import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Typography,
} from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { useNavigate } from "react-router-dom";
import { sanitizeRichHtml } from "../../../../shared/html/sanitizeRichHtml";
import { resolveHomeUploadUrl } from "../../../../shared/utils/resolveMediaUrl";
import { useDispatch, useSelector } from "react-redux";
import {
  getLutronData,
  getLutronDataClient,
  getLutronDataProject,
  homeDataClient,
  homeDataList,
  homeDataProject,
} from "../../redux/slice/home/homeSlice";

const MODES = ["Lutron", "Client", "Project"];

function resolveMediaUrl(path) {
  const url = resolveHomeUploadUrl(path);
  return url || null;
}

const stripHtmlToText = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const parseInstalledSolutions = (raw) => {
  if (!raw) return [];
  try {
    const solutions = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(solutions)) {
      return solutions
        .map((item, index) => ({
          id: index,
          name:
            typeof item === "string"
              ? item
              : item.solution || item.name || "",
        }))
        .filter((s) => s.name);
    }
  } catch {
    // fall through
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s, index) => ({ id: index, name: s.trim() }))
      .filter((s) => s.name);
  }
  return [];
};

const HERO_HEIGHT = { xs: "42vh", sm: "48vh", md: "52vh", lg: "56vh" };

const contentShellSx = {
  position: "relative",
  width: "100%",
  minHeight: HERO_HEIGHT,
  maxHeight: { xs: "52vh", sm: "56vh", md: "58vh" },
  borderRadius: { xs: "8px", md: "12px" },
  overflow: "hidden",
  display: "flex",
  alignItems: { xs: "stretch", md: "flex-start" },
  boxSizing: "border-box",
  px: { xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2.5 },
  py: { xs: 1, sm: 1.5, md: 2 },
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

const contentPanelSx = {
  backgroundColor: "#fff",
  borderRadius: { xs: "8px", md: "12px" },
  border: "2px solid rgba(0,0,0,0.85)",
  boxSizing: "border-box",
  flexShrink: 0,
  width: { xs: "100%", sm: "70%", md: "55%", lg: "48%" },
  maxWidth: { xs: "none", sm: 560, md: 620, lg: 760, xl: 780 },
  maxHeight: { xs: "52vh", sm: "56vh", md: "58vh" },
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const descriptionCardSx = {
  backgroundColor: "#fff",
  borderRadius: { xs: "8px", md: "12px" },
  border: "2px solid rgba(0,0,0,0.85)",
  width: "100%",
  maxHeight: { xs: "52vh", sm: "56vh", md: "58vh" },
  overflow: "hidden",
  position: "relative",
};

const descriptionCardInnerSx = {
  position: "relative",
  zIndex: 2,
  p: { xs: 1.5, sm: 2, md: 2.5 },
  maxHeight: { xs: "52vh", sm: "56vh", md: "58vh" },
  overflowY: "auto",
  overflowX: "hidden",
  flex: 1,
  minHeight: 0,
};

const DescriptionCard = ({
  html,
  logoUrl = null,
  backgroundUrl = null,
  emptyLabel = "No description available.",
  fullWidth = false,
}) => {
  const hasContent = stripHtmlToText(html).length > 0;

  const cardBody = (
    <Box sx={descriptionCardInnerSx}>
      {logoUrl && (
        <Box
          component="img"
          src={logoUrl}
          alt=""
          sx={{
            display: "block",
            maxHeight: 48,
            maxWidth: 160,
            objectFit: "contain",
            mb: 1.5,
          }}
        />
      )}
      {hasContent ? (
        <Box
          className="lutron-public-description"
          sx={{
            color: "#111",
            fontSize: { xs: 12, sm: 13, md: 14 },
            lineHeight: 1.55,
            "& p": { margin: "0 0 0.75em" },
            "& ul, & ol": { margin: "0 0 0.75em", paddingLeft: "1.25em" },
            "& strong": { fontWeight: 700 },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
        />
      ) : (
        <Typography sx={{ color: "#666", fontSize: { xs: 13, md: 15 } }}>
          {emptyLabel}
        </Typography>
      )}
    </Box>
  );

  if (fullWidth) {
    return (
      <Box className="lutron-content-scrollable" sx={descriptionCardSx}>
        {cardBody}
      </Box>
    );
  }

  return (
    <Box
      className="lutron-content-shell lutron-home-hero"
      sx={{
        ...contentShellSx,
        ...(backgroundUrl
          ? { backgroundImage: `url("${backgroundUrl}")` }
          : { backgroundImage: "none" }),
      }}
    >
      <Box className="lutron-content-scrollable" sx={contentPanelSx}>
        {cardBody}
      </Box>
    </Box>
  );
};

const infoTileSx = {
  backgroundColor: "#fff",
  borderRadius: { xs: "8px", md: "10px" },
  border: "2px solid rgba(0,0,0,0.85)",
  p: { xs: 1.2, md: 1.5 },
  minHeight: { xs: 88, md: 100 },
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
};

const projectInfoTileSx = {
  ...infoTileSx,
  flex: 1,
  minWidth: 0,
  width: { xs: "100%", sm: "auto" },
  minHeight: { xs: 120, sm: 150 },
  p: { xs: 2, md: 3 },
};

const LutronPublicHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const homeData = useSelector(homeDataList);
  const homeClientData = useSelector(homeDataClient);
  const homeProjectData = useSelector(homeDataProject);
  const { loading } = useSelector((state) => state.home);

  const [displayMode, setDisplayMode] = useState("Lutron");
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  const clientTabLabel = useMemo(() => {
    const name = (homeClientData?.name || "").trim();
    return name || "Client";
  }, [homeClientData?.name]);

  const tabLabels = useMemo(
    () => ({
      Lutron: "Lutron",
      Client: clientTabLabel,
      Project: "Project",
    }),
    [clientTabLabel]
  );

  useEffect(() => {
    document.body.classList.add("lutron-page");
    const root = document.getElementById("root");
    if (root) root.classList.add("lutron-page");
    dispatch(getLutronData());
    dispatch(getLutronDataClient());
    dispatch(getLutronDataProject());
    return () => {
      document.body.classList.remove("lutron-page");
      if (root) root.classList.remove("lutron-page");
    };
  }, [dispatch]);

  useLayoutEffect(() => {
    const measure = () => {
      const activeEl = tabRefs.current[displayMode];
      if (!activeEl) return false;
      const width = activeEl.offsetWidth;
      if (width <= 0) return false;
      setTabIndicator({ left: activeEl.offsetLeft, width, ready: true });
      return true;
    };
    if (measure()) return;
    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [displayMode, clientTabLabel]);

  const projectSolutions = useMemo(
    () => parseInstalledSolutions(homeProjectData?.installed_solutions),
    [homeProjectData?.installed_solutions]
  );

  const renderTabs = () => (
    <Box
      ref={tabsContainerRef}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        mb: { xs: 1.5, md: 2 },
        background: "var(--heatmap-tab-pill-bg, #3d4a5c)",
        borderRadius: "999px",
        padding: "4px",
        position: "relative",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        maxWidth: "100%",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: `${tabIndicator.left}px`,
          width: `${tabIndicator.width}px`,
          backgroundColor: "#ffffff",
          borderRadius: "999px",
          transition: tabIndicator.ready
            ? "left 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          opacity: tabIndicator.ready ? 1 : 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {MODES.map((mode) => (
        <Button
          key={mode}
          ref={(el) => {
            tabRefs.current[mode] = el;
          }}
          onClick={() => setDisplayMode(mode)}
          sx={{
            minWidth: { xs: 56, sm: 70, md: 85 },
            height: { xs: 24, sm: 28, md: 32 },
            backgroundColor: "transparent",
            color:
              displayMode === mode
                ? "var(--home-tab-active-color, #3d4a5c)"
                : "#fff",
            borderRadius: "999px",
            fontWeight: "bold",
            border: "none",
            textTransform: "none",
            fontSize: { xs: 10, sm: 11, md: 13 },
            position: "relative",
            zIndex: 1,
            px: { xs: 1, md: 1.5 },
            "&:hover": {
              backgroundColor:
                displayMode === mode
                  ? "transparent"
                  : "rgba(255, 255, 255, 0.12)",
            },
          }}
        >
          {tabLabels[mode]}
        </Button>
      ))}
    </Box>
  );

  const renderLutronOrClient = (data, _showClientExtras = false) => {
    const backgroundUrl = resolveMediaUrl(data?.background_image);

    return (
      <DescriptionCard
        html={data?.description}
        logoUrl={null}
        backgroundUrl={backgroundUrl}
      />
    );
  };

  const renderProject = () => {
    const locationValue =
      homeProjectData?.location_link || homeProjectData?.location || "";
    const areaValue =
      homeProjectData?.overall_area_size ||
      homeProjectData?.area_size ||
      "";

    return (
      <Box
        sx={{
          width: "100%",
          flex: { xs: "1 0 auto", md: 1 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "flex-start",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2, md: 2, lg: 6, xl: 6 },
          py: 4,
          gap: 4,
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: "45%" },
            maxWidth: { xs: "100%", md: "50%" },
            minWidth: 0,
            flex: "1 1 0",
          }}
        >
          <DescriptionCard html={homeProjectData?.description} fullWidth />
        </Box>

        <Box
          sx={{
            width: { xs: "100%", md: "45%" },
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "flex-start",
            flex: "0 0 auto",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              width: "100%",
            }}
          >
            <Box sx={projectInfoTileSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <PlaceOutlinedIcon sx={{ fontSize: 24, color: "#111" }} />
                <Typography fontWeight={700} fontSize={{ xs: 13, md: 15 }}>
                  Location
                </Typography>
              </Box>
              <Typography
                fontSize={{ xs: 12, md: 14 }}
                sx={{ color: "#333", wordBreak: "break-word", mt: 0.5 }}
              >
                {locationValue ? (
                  locationValue.startsWith("http") ? (
                    <Link
                      href={locationValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                    >
                      {locationValue}
                    </Link>
                  ) : (
                    locationValue
                  )
                ) : (
                  "—"
                )}
              </Typography>
              {locationValue && (
                <Link
                  href={
                    locationValue.startsWith("http")
                      ? locationValue
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationValue)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    mt: 2,
                    display: "inline-block",
                    fontWeight: 600,
                    fontSize: { xs: 12, md: 13 },
                    color: "#111",
                  }}
                >
                  Open Maps →
                </Link>
              )}
            </Box>

            <Box sx={projectInfoTileSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <FormatListBulletedIcon sx={{ fontSize: 24, color: "#111" }} />
                <Typography fontWeight={700} fontSize={{ xs: 13, md: 15 }}>
                  Area
                </Typography>
              </Box>
              <Typography
                fontSize={{ xs: 12, md: 14 }}
                sx={{ color: "#333", mt: 0.5 }}
              >
                {areaValue || "—"}
              </Typography>
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/heatmap")}
                sx={{
                  mt: 2,
                  alignSelf: "flex-start",
                  fontWeight: 600,
                  fontSize: { xs: 12, md: 13 },
                  color: "#111",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  textDecoration: "underline",
                }}
              >
                Floor Plan →
              </Link>
            </Box>
          </Box>

          <Typography
            fontWeight={700}
            fontSize={{ xs: 13, md: 15 }}
            sx={{ color: "var(--heatmap-legends-nav-text, #111)" }}
          >
            Installed Solutions
          </Typography>

          {projectSolutions.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                width: "100%",
              }}
            >
              {projectSolutions.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    flex: "1 1 calc(50% - 8px)",
                    minWidth: { xs: "100%", sm: "calc(50% - 8px)" },
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    border: "2px solid rgba(0,0,0,0.85)",
                    px: 2,
                    py: 1.5,
                    minHeight: 60,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    fontSize={{ xs: 12, md: 14 }}
                    sx={{ color: "#111" }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              fontSize={{ xs: 12, md: 14 }}
              sx={{
                color: "var(--heatmap-legends-nav-text, #666)",
                fontStyle: "italic",
                width: "100%",
                textAlign: "center",
                py: 2,
              }}
            >
              No installed solutions available. Add solutions in the settings
              page.
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      className="lutron-website-container"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          mb: { xs: 1, md: 1.5 },
        }}
      >
        {renderTabs()}
      </Box>

      {loading &&
      !homeData?.description &&
      !homeClientData?.name &&
      !homeProjectData?.description ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress size={36} />
        </Box>
      ) : (
        <Box sx={{ width: "100%", flex: 1, minHeight: 0 }}>
          {displayMode === "Lutron" && renderLutronOrClient(homeData, false)}
          {displayMode === "Client" &&
            renderLutronOrClient(homeClientData, true)}
          {displayMode === "Project" && renderProject()}
        </Box>
      )}
    </Box>
  );
};

export default LutronPublicHome;
