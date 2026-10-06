import {
    Box,
    Button,
    Grid,
    Typography,
    useTheme,
    Paper,
    Snackbar,
    Alert,
    TextField,
    Divider,
    useMediaQuery,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { SidebarItems, getVisibleSidebarItems } from "../../../utils/sidebarItems";
import { useLocation, useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import {
    uploadHelpFile,
    getUploadStatus,
    getUploadError,
} from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { UseAuth } from "../../../customhooks/UseAuth";
import SettingsLayout from "../SettingsLayout";
import { getThemeButtonColor } from '../../../utils/themePageBackground';

const helpBorderColor = 'var(--users-border, #C5CDD8)';
const helpHoverBg = 'var(--users-select-menu-hover, #D6DDE8)';

/** Theme sets MuiTextField defaultProps.variant = "filled" (tan bg) — force theme-aware light styling. */
const helpUrlFieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--users-chip-bg, #D6DDE8)',
        borderRadius: '8px',
        '& fieldset': { borderColor: helpBorderColor },
        '&:hover': {
            backgroundColor: 'var(--users-chip-bg, #D6DDE8)',
            '& fieldset': { borderColor: 'var(--home-tab-active-color, #3D4A5C)' },
        },
        '&.Mui-focused': {
            backgroundColor: 'var(--users-input-bg, #ffffff)',
            '& fieldset': { borderColor: 'var(--home-tab-active-color, #3D4A5C)' },
        },
    },
    '& .MuiOutlinedInput-input': {
        color: 'var(--settings-panel-text, #1c2330)',
        '&::placeholder': {
            color: 'var(--settings-panel-muted-text, #4A586C)',
            opacity: 1,
        },
    },
    '& .MuiFilledInput-root': {
        backgroundColor: 'var(--users-chip-bg, #D6DDE8) !important',
        borderRadius: '8px',
        border: `1px solid ${helpBorderColor}`,
        '&:hover': {
            backgroundColor: 'var(--users-chip-bg, #D6DDE8) !important',
        },
        '&.Mui-focused': {
            backgroundColor: 'var(--users-input-bg, #ffffff) !important',
        },
        '&:before, &:after': {
            borderBottom: 'none !important',
        },
    },
    '& .MuiFilledInput-input': {
        color: 'var(--settings-panel-text, #1c2330)',
    },
};

function HelpDropdown({ value, onChange }) {
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false);
    const [piOpen, setPiOpen] = useState(true);
    const toggle = () => setOpen((v) => !v);
    const chooseTop = (name) => {
        if (name === "Project Information") {
            setPiOpen((v) => !v);
            return;
        }
        onChange(name);
        setOpen(false);
    };
    const choosePi = (sub) => {
        onChange(sub);
        setOpen(false);
    };

    return (
        <Box>
            <Box
                onClick={toggle}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `1px solid ${helpBorderColor}`,
                    borderRadius: "8px",
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    userSelect: "none",
                    bgcolor: 'var(--users-input-bg, #fff)',
                }}
            >
                <Typography sx={{ color: value ? 'var(--settings-panel-text, #1c2330)' : 'var(--settings-panel-muted-text, #4A586C)' }}>
                    {value || "Select  Help"}
                </Typography>
                {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </Box>
            {open && (
                <Box
                    sx={{
                        mt: 1,
                        border: `1px solid ${helpBorderColor}`,
                        borderRadius: "8px",
                        p: 1,
                        bgcolor: 'var(--users-input-bg, #fff)',
                    }}
                >
                    <Box
                        onClick={() => chooseTop("Troubleshooting Guide")}
                        sx={{
                            px: 1,
                            py: 0.75,
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: 'var(--settings-panel-text, #1c2330)',
                            "&:hover": { backgroundColor: helpHoverBg },
                        }}
                    >
                        Troubleshooting Guide
                    </Box>

                    <Box
                        onClick={() => chooseTop("User Manual")}
                        sx={{
                            px: 1,
                            py: 0.75,
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: 'var(--settings-panel-text, #1c2330)',
                            "&:hover": { backgroundColor: helpHoverBg },
                        }}
                    >
                        User Manual
                    </Box>

                    <Box
                        onClick={() => chooseTop("Project Information")}
                        sx={{
                            px: 1,
                            py: 0.75,
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            color: 'var(--settings-panel-text, #1c2330)',
                            "&:hover": { backgroundColor: helpHoverBg },
                        }}
                    >
                        <span>Project Information</span>
                        {piOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </Box>

                    {piOpen && (
                        <Box
                            sx={{
                                border: `1px solid ${helpBorderColor}`,
                                borderRadius: "8px",
                                mt: 1,
                                p: 0.5,
                                ml: 0.5,
                            }}
                        >
                            {["Scope", "BOQ", "Floor Layout", "Escalation Matrix", "Fixture Details"].map((sub) => (
                                <Box
                                    key={sub}
                                    onClick={() => choosePi(sub)}
                                    sx={{
                                        px: 2,
                                        py: 0.6,
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        color: 'var(--settings-panel-text, #1c2330)',
                                        "&:hover": { backgroundColor: helpHoverBg },
                                    }}
                                >
                                    {sub}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
const CreateHelp = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const status = useSelector(getUploadStatus);
    const error = useSelector(getUploadError);

    // Add responsive breakpoints
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [selectedHelp, setSelectedHelp] = useState("Troubleshooting Guide");
    const [selectedFile, setSelectedFile] = useState(null);
    const [url, setUrl] = useState("");
    const [didTriggerUpload, setDidTriggerUpload] = useState(false);
    const fileInputRef = useRef();
    const { role } = UseAuth();
    const appTheme = useSelector(selectApplicationTheme);
    const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
    const visibleSidebarItems = getVisibleSidebarItems(role);

    useEffect(() => {
        if (!didTriggerUpload) return;
        if (status === "succeeded") {
            setSnackbar({
                open: true,
                message: "File uploaded successfully!",
                severity: "success",
            });
            setDidTriggerUpload(false);
        } else if (status === "failed") {
            setSnackbar({
                open: true,
                message: error || "Upload failed!",
                severity: "error",
            });
            setDidTriggerUpload(false);
        }
    }, [status, error, didTriggerUpload]);

    const doUpload = (file) => {
        if (!selectedHelp) {
            setSnackbar({
                open: true,
                message: "Please select a Help item first.",
                severity: "warning",
            });
            return;
        }
        if (!file || file.type !== "application/pdf") {
            setSnackbar({
                open: true,
                message: "Only PDF files are allowed.",
                severity: "warning",
            });
            return;
        }
        setSelectedFile(file);
        setDidTriggerUpload(true);
        dispatch(uploadHelpFile({ name: selectedHelp, file }));
    };

    const triggerFilePicker = () => fileInputRef.current?.click();

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file) doUpload(file);
    };

    const uploadFromUrl = async () => {
        if (!selectedHelp || !url) return;
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], `${selectedHelp}.pdf`, {
                type: "application/pdf",
            });
            doUpload(file);
            setUrl("");
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to fetch file from URL.",
                severity: "error",
            });
        }
    };

    return (
        <>
        <SettingsLayout>
                    <Paper
                        className="settings-main-inner-panel"
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            width: '100%',
                            maxWidth: 'none',
                            bgcolor: 'var(--settings-panel-inner-bg, #ffffff)',
                            border: `1px solid var(--settings-panel-border, ${helpBorderColor})`,
                            m: 0,
                        }}
                    >
                        <HelpDropdown value={selectedHelp} onChange={setSelectedHelp} />
                        <Box
                            sx={{
                                p: 1.2,
                                border: `1px solid ${helpBorderColor}`,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mt: 2,
                                bgcolor: 'var(--users-input-bg, #ffffff)',
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1.2}>
                                <PictureAsPdfIcon sx={{ color: '#d32f2f' }} fontSize="small" />
                                <Typography fontSize="14px" fontWeight={600} sx={{ color: 'var(--settings-panel-text, #1c2330)' }}>
                                    {selectedHelp}
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                sx={{
                                    textTransform: 'none',
                                    borderColor: helpBorderColor,
                                    color: 'var(--settings-panel-text, #1c2330)',
                                    '&:hover': { borderColor: 'var(--home-tab-active-color, #3D4A5C)', backgroundColor: helpHoverBg },
                                }}
                            >
                                Change
                                <input
                                    hidden
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => doUpload(e.target.files?.[0])}
                                />
                            </Button>
                        </Box>
                        <Box
                            className="help-upload-zone"
                            onClick={triggerFilePicker}
                            onDrop={onDrop}
                            onDragOver={(e) => e.preventDefault()}
                            sx={{
                                p: 4,
                                textAlign: "center",
                                border: "2px dashed var(--area-groups-border, #90caf9)",
                                borderRadius: "12px",
                                backgroundColor: "var(--area-groups-inner-bg, #f5faff)",
                                my: 2,
                                cursor: "pointer",
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 36, color: "var(--home-tab-active-color, #90caf9)" }} />
                            <Typography sx={{ mt: 1, fontWeight: 600, color: 'var(--settings-panel-text, #1c2330)' }}>
                                Select a PDF to Upload
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)' }}>
                                or Drag and drop it here
                            </Typography>

                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                accept="application/pdf"
                                onChange={(e) => doUpload(e.target.files?.[0])}
                            />
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                className="help-url-input"
                                fullWidth
                                variant="outlined"
                                placeholder="Add File URL"
                                size="small"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                sx={helpUrlFieldSx}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={uploadFromUrl}
                                sx={{
                                    textTransform: 'none',
                                    backgroundColor: buttonColor,
                                    color: 'var(--settings-panel-button-text, #fff)',
                                    boxShadow: 'none',
                                    '&:hover': { backgroundColor: buttonColor, opacity: 0.92 },
                                }}
                            >
                                Upload
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ mt: 1, display: "block", color: 'var(--settings-panel-muted-text, rgba(0,0,0,0.72))' }}>
                            {selectedFile?.name ? `Selected: ${selectedFile.name}` : "Only PDF files are allowed"}
                        </Typography>
                    </Paper>
        </SettingsLayout>
                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={3000}
                        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    >
                        <Alert
                            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                            severity={snackbar.severity}
                            sx={{ width: "100%" }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
        </>
    );
};

export default CreateHelp;
