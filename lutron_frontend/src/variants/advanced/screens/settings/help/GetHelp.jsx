import React, { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
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
import { CARD_BACKGROUND } from "../../../config/themeConstants";
import { getThemeButtonColor, usesGoldPageTheme } from '../../../utils/themePageBackground';
import { downloadHelpFile } from "../../../../../shared/help/downloadHelpFile";

const GetHelp = () => {
    const dispatch = useDispatch();
    const helpFiles = useSelector(fetchHelpFileList);
    const [expandedId, setExpandedId] = useState({});
    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const themeBackground = appTheme?.application_theme?.background;
    const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, themeBackground);
    const isGoldTheme = usesGoldPageTheme(themeBackground);

    const helpDownloadButtonSx = (hasFile) => {
        const base = {
            borderRadius: '10px',
            textTransform: 'none',
            px: 2.2,
            py: 0.9,
        };
        if (hasFile) {
            if (isGoldTheme) {
                return {
                    ...base,
                    fontWeight: 600,
                    bgcolor: 'var(--help-download-available-bg, #faf0d4)',
                    color: 'var(--help-download-available-text, #000)',
                    border: '2px solid var(--help-download-available-border, #4A4334)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                        bgcolor: 'var(--help-download-available-hover-bg, #f5e8bc)',
                        color: 'var(--help-download-available-text, #000)',
                    },
                };
            }
            return {
                ...base,
                bgcolor: buttonColor,
                color: '#fff',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
                '&:hover': { bgcolor: buttonColor, opacity: 0.92 },
            };
        }
        if (isGoldTheme) {
            return {
                ...base,
                fontWeight: 500,
                bgcolor: 'transparent',
                color: 'var(--help-download-unavailable-text, rgba(255,255,255,0.42))',
                border: '2px dashed var(--help-download-unavailable-border, rgba(255,255,255,0.45))',
                boxShadow: 'none',
                '&.Mui-disabled': {
                    bgcolor: 'transparent',
                    color: 'var(--help-download-unavailable-text, rgba(255,255,255,0.42))',
                    border: '2px dashed var(--help-download-unavailable-border, rgba(255,255,255,0.45))',
                    opacity: 1,
                    WebkitTextFillColor: 'var(--help-download-unavailable-text, rgba(255,255,255,0.42))',
                },
            };
        }
        return {
            ...base,
            bgcolor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px dashed rgba(255,255,255,0.4)',
            boxShadow: 'none',
            '&.Mui-disabled': {
                bgcolor: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px dashed rgba(255,255,255,0.4)',
                opacity: 1,
            },
        };
    };

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

    const toggle = (id) =>
        setExpandedId((prev) => ({ ...prev, [id]: !prev[id] }));

    const cards = [
        {
            key: byName["Troubleshooting Guide"]?.id || "tg",
            title: "Troubleshooting Guide",
            icon: <BuildIcon sx={{ fontSize: 26 }} />,
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
            icon: <MenuBookIcon sx={{ fontSize: 26 }} />,
            summary:
                "Comprehensive documentation on system usage, features, and best practices for optimal operation.",
            details:
                "Complete walkthrough of all system features, configuration options, and user settings.",
            actions: [
                {
                    label: "Download PDF",
                    onClick: () => handleDownload(byName["User Manual"]?.file_path, "User Manual"),
                    disabled: !byName["User Manual"],
                },
            ],
        },
        {
            key: "pi-group",
            title: "Project Information",
            icon: <AssignmentIcon sx={{ fontSize: 26 }} />,
            summary: "Essential project details and information.",
            details: "Project scope, technical specifications and contact information.",
            actions: [
                { label: "Download Scope", onClick: () => handleDownload(byName["Scope"]?.file_path, "Scope"), disabled: !byName["Scope"] },
                { label: "Download BOQ", onClick: () => handleDownload(byName["BOQ"]?.file_path, "BOQ"), disabled: !byName["BOQ"] },
                { label: "Download Floor Layout", onClick: () => handleDownload(byName["Floor Layout"]?.file_path, "Floor Layout"), disabled: !byName["Floor Layout"] },
                { label: "Escalation Matrix", onClick: () => handleDownload(byName["Escalation Matrix"]?.file_path, "Escalation Matrix"), disabled: !byName["Escalation Matrix"] },
                {
                    label: "Fixture Details",
                    onClick: () =>
                        handleDownload(
                            (byName["Fixture Details"] || byName["Fixture Make model"])?.file_path,
                            "Fixture Details"
                        ),
                    disabled: !(byName["Fixture Details"] || byName["Fixture Make model"]),
                },
            ],
        },
    ];
    return (
        <Box className="help-container" sx={{ 
            width: '100%', 
            height: 'calc(100vh - 180px)',
            minHeight: 'calc(100vh - 180px)',
            maxHeight: 'calc(100vh - 180px)',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            overflow: 'hidden'
        }}>
            <Box sx={{ 
                flex: 1, 
                overflow: 'hidden', 
                width: '100%',
                px: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                py: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{ 
                    flex: 1, 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {cards.map((card) => (
                        <Accordion
                            key={card.key}
                            disableGutters
                            square={true}
                            sx={{
                                p: 3,
                                background: CARD_BACKGROUND,
                                color: '#fff',
                                width: '100%',
                                borderRadius: '8px', // small curve, set 0px if you want perfectly square
                                boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                                '&:before': { display: 'none' }, // remove MUI default line
                                flex: '0 0 auto'
                            }}
                        >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
                        sx={{
                            px: 3,
                            py: 1,
                            minHeight: 0,
                            "& .MuiAccordionSummary-content": {
                                margin: 0,
                                padding: 0,
                                alignItems: "center",
                            },
                            "& .MuiAccordionSummary-content.Mui-expanded": {
                                margin: 0,
                            },
                        }}
                    >
                        <Box>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                {card.icon}
                                <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2, m: 0 }}>
                                    {card.title}
                                </Typography>
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "rgba(255,255,255,0.9)",
                                    m: 1,
                                    //mb: -1,
                                    lineHeight: 1.4,
                                    pl: 3.8,
                                    width: '100%',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                }}
                            >
                                {card.summary}
                            </Typography>
                        </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: 3, py: 1.25 }}>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", mt: 0.25, mb: 1, pl: 3 }} />
                        {card.details && (
                            <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.5, pl: 4.9 }}>
                                {card.details}
                            </Typography>
                        )}

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pl: 3.8 }}>
                            {card.actions.map((btn, idx) => (
                                <Tooltip
                                    key={idx}
                                    title={btn.disabled ? "File not uploaded yet" : ""}
                                    arrow
                                    disableHoverListener={!btn.disabled}
                                >
                                    <span>
                                        <Button
                                            variant={btn.disabled ? 'outlined' : 'contained'}
                                            disableElevation
                                            className={
                                                btn.disabled
                                                    ? 'help-download-btn help-download-btn--unavailable'
                                                    : 'help-download-btn help-download-btn--available'
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
                    </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default GetHelp;
