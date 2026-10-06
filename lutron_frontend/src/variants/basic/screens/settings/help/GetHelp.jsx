import React, { useEffect, useMemo, useState } from "react";
import {
    Typography,
    Button,
    Box,
    Divider,
    Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import {
    getHelpFileList,
    fetchHelpFileList,
} from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";

import BuildIcon from "@mui/icons-material/Build";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { isLightSurface } from "../../../utils/themeOnSurface";
import { lighten } from "@mui/material/styles";
import { downloadHelpFile } from "../../../../../shared/help/downloadHelpFile";

/** Section icons, chevrons, and action buttons — consistent blue on white cards. */
const HELP_ICON_BLUE = "#1976d2";

const GetHelp = () => {
    const dispatch = useDispatch();
    const helpFiles = useSelector(fetchHelpFileList);
    const [expandedCards, setExpandedCards] = useState({});
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || '#ffffff';
    const buttonColor = appTheme?.application_theme?.button || "#232323";
    const isDefaultWhiteTheme = isLightSurface(contentColor);
    const actionColor = isDefaultWhiteTheme ? HELP_ICON_BLUE : buttonColor;
    const cardBg = isDefaultWhiteTheme ? "#ffffff" : "#615846";
    const cardText = isDefaultWhiteTheme ? "#000000" : "#ffffff";
    const subText = isDefaultWhiteTheme ? "rgba(0,0,0,0.74)" : "rgba(255,255,255,0.9)";
    const dividerColor = isDefaultWhiteTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)";
    useEffect(() => {
        dispatch(getHelpFileList());
    }, [dispatch]);

    const byName = useMemo(() => {
        const map = {};
        (helpFiles || []).forEach((f) => (map[f.name] = f));
        return map;
    }, [helpFiles]);

    const handleDownload = (filePath, fileName) => {
        if (!filePath) return;
        void downloadHelpFile(filePath, { fileName });
    };

    const toggleCard = (key) => {
        setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const helpDownloadButtonSx = (hasFile) => {
        const base = {
            borderRadius: "10px",
            textTransform: "none",
            px: 2.2,
            py: 0.9,
        };
        if (hasFile) {
            return {
                ...base,
                bgcolor: actionColor,
                color: "#fff",
                "&:hover:not(:disabled)": {
                    bgcolor: lighten(actionColor, 0.12),
                },
            };
        }
        return {
            ...base,
            bgcolor: isDefaultWhiteTheme ? "#f5f5f5" : "rgba(255,255,255,0.12)",
            color: isDefaultWhiteTheme ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
            border: isDefaultWhiteTheme
                ? "1px dashed rgba(0,0,0,0.28)"
                : "1px dashed rgba(255,255,255,0.4)",
            boxShadow: "none",
            "&.Mui-disabled": {
                bgcolor: isDefaultWhiteTheme ? "#f5f5f5" : "rgba(255,255,255,0.12)",
                color: isDefaultWhiteTheme ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
                border: isDefaultWhiteTheme
                    ? "1px dashed rgba(0,0,0,0.28)"
                    : "1px dashed rgba(255,255,255,0.4)",
                opacity: 1,
                WebkitTextFillColor: isDefaultWhiteTheme
                    ? "rgba(0,0,0,0.5)"
                    : "rgba(255,255,255,0.6)",
            },
        };
    };

    const cards = [
        {
            key: byName["Troubleshooting Guide"]?.id || "tg",
            title: "Troubleshooting Guide",
            icon: <BuildIcon sx={{ fontSize: 26, color: actionColor }} />,
            summary:
                "Step-by-step solutions for common issues, system diagnostics, and quick fixes for technical problems.",
            details:
                "Access detailed troubleshooting steps, error code references, and resolution procedures.",
            actions: [
                {
                    label: "Download PDF",
                    onClick: () =>
                        handleDownload(
                            byName["Troubleshooting Guide"]?.file_path,
                            "Troubleshooting Guide"
                        ),
                    disabled: !byName["Troubleshooting Guide"],
                },
            ],
        },
        {
            key: byName["User Manual"]?.id || "um",
            title: "User Manual",
            icon: <MenuBookIcon sx={{ fontSize: 26, color: actionColor }} />,
            summary:
                "Comprehensive documentation on system usage, features, and best practices for optimal operation.",
            details:
                "Complete walkthrough of all system features, configuration options, and user settings.",
            actions: [
                {
                    label: "Download PDF",
                    onClick: () =>
                        handleDownload(byName["User Manual"]?.file_path, "User Manual"),
                    disabled: !byName["User Manual"],
                },
            ],
        },
        {
            key: "pi-group",
            title: "Project Information",
            icon: <AssignmentIcon sx={{ fontSize: 26, color: actionColor }} />,
            summary: "Essential project details and information.",
            details: "Project scope, technical specifications and contact information.",
            actions: [
                { label: "Download Scope", onClick: () => handleDownload(byName["Scope"]?.file_path, "Scope"), disabled: !byName["Scope"] },
                { label: "Download BOQ", onClick: () => handleDownload(byName["BOQ"]?.file_path, "BOQ"), disabled: !byName["BOQ"] },
                { label: "Download Floor Layout", onClick: () => handleDownload(byName["Floor Layout"]?.file_path, "Floor Layout"), disabled: !byName["Floor Layout"] },
                { label: "Escalation Matrix", onClick: () => handleDownload(byName["Escalation Matrix"]?.file_path, "Escalation Matrix"), disabled: !byName["Escalation Matrix"] },
                { label: "Fixture Details", onClick: () => handleDownload((byName["Fixture Details"] || byName["Fixture Make model"])?.file_path, "Fixture Details"), disabled: !(byName["Fixture Details"] || byName["Fixture Make model"]) },
            ],
        },
    ];
    return (
        <Box className="help-container help-get-help-page" sx={{ width: "100%", p: 0, pb: { xs: 2, md: 3 } }}>
            <Box
                className="help-cards-list"
                sx={{
                    width: "100%",
                    px: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                    py: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {cards.map((card) => {
                    const isExpanded = !!expandedCards[card.key];
                    return (
                        <Box
                            key={card.key}
                            className="help-card"
                            sx={{
                                p: 3,
                                backgroundColor: cardBg,
                                color: cardText,
                                width: "100%",
                                borderRadius: "8px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
                                overflow: "visible",
                            }}
                        >
                            <Box
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                                onClick={() => toggleCard(card.key)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleCard(card.key);
                                    }
                                }}
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1,
                                    cursor: "pointer",
                                    userSelect: "none",
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        {card.icon}
                                        <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2, m: 0 }}>
                                            {card.title}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: subText,
                                            m: 1,
                                            lineHeight: 1.4,
                                            pl: 3.8,
                                            width: "100%",
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                        }}
                                    >
                                        {card.summary}
                                    </Typography>
                                </Box>
                                <ExpandMoreIcon
                                    sx={{
                                        color: actionColor,
                                        mt: 0.5,
                                        flexShrink: 0,
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }}
                                />
                            </Box>

                            {isExpanded && (
                                <Box className="help-card-details" sx={{ px: 3, py: 1.25, pb: 2, color: cardText }}>
                                    <Divider sx={{ borderColor: dividerColor, mt: 0.25, mb: 1, pl: 3 }} />
                                    {card.details && (
                                        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.5, pl: 4.9, color: cardText }}>
                                            {card.details}
                                        </Typography>
                                    )}

                                    <Box className="help-download-actions" sx={{ display: "flex", gap: 1, flexWrap: "wrap", pl: 3.8 }}>
                                        {(card.actions || []).map((btn, idx) => (
                                            <Tooltip
                                                key={idx}
                                                title={btn.disabled ? "File not uploaded yet" : ""}
                                                arrow
                                                disableHoverListener={!btn.disabled}
                                            >
                                                <span>
                                                    <Button
                                                        variant={btn.disabled ? "outlined" : "contained"}
                                                        disableElevation
                                                        className={
                                                            btn.disabled
                                                                ? "help-download-btn help-download-btn--unavailable"
                                                                : "help-download-btn help-download-btn--available"
                                                        }
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            btn.onClick?.(e);
                                                        }}
                                                        disabled={btn.disabled}
                                                        sx={helpDownloadButtonSx(!btn.disabled)}
                                                    >
                                                        {btn.label}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default GetHelp;
