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
import { getVisibleSidebarItemsWithPaths, UseAuth } from "../../../customhooks/UseAuth";
import { isLightSurface } from "../../../utils/themeOnSurface";
import { settingsSidebarColumnDividerSx } from "../../../utils/settingsSidebarTabStyles";
import SettingsSidebarNav from "../../../components/SettingsSidebarNav";
function HelpDropdown({ value, onChange }) {
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false);
    const [piOpen, setPiOpen] = useState(true);
    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#ffffff';
    const contentColor = appTheme?.application_theme?.content || '#ffffff';
    const buttonColor = appTheme?.application_theme?.button || '#232323'
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
    const isDefaultWhiteTheme = isLightSurface(contentColor);

    return (
        <Box>
            <Box
                onClick={toggle}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #cfcfcf",
                    borderRadius: "8px",
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    userSelect: "none",
                    bgcolor: "#fff",
                }}
            >
                <Typography sx={{ color: value ? "inherit" : "#888" }}>
                    {value || "Select  Help"}
                </Typography>
                {open ? (
                    <ExpandLess fontSize="small" sx={{ color: isDefaultWhiteTheme ? "#1565C0" : "inherit" }} />
                ) : (
                    <ExpandMore fontSize="small" sx={{ color: isDefaultWhiteTheme ? "#1565C0" : "inherit" }} />
                )}
            </Box>
            {open && (
                <Box
                    sx={{
                        mt: 1,
                        border: "1px solid #cfcfcf",
                        borderRadius: "8px",
                        p: 1,
                        bgcolor: "#fff",
                    }}
                >
                    <Box
                        onClick={() => chooseTop("Troubleshooting Guide")}
                        sx={{
                            px: 1,
                            py: 0.75,
                            borderRadius: "6px",
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#f6f6f6" },
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
                            "&:hover": { backgroundColor: "#f6f6f6" },
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
                            "&:hover": { backgroundColor: "#f6f6f6" },
                        }}
                    >
                        <span>Project Information</span>
                        {piOpen ? (
                            <ExpandLess fontSize="small" sx={{ color: isDefaultWhiteTheme ? "#1565C0" : "inherit" }} />
                        ) : (
                            <ExpandMore fontSize="small" sx={{ color: isDefaultWhiteTheme ? "#1565C0" : "inherit" }} />
                        )}
                    </Box>

                    {piOpen && (
                        <Box
                            sx={{
                                border: "1px solid #cfcfcf",
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
                                        "&:hover": { backgroundColor: "#f6f6f6" },
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
    const status = useSelector(getUploadStatus);
    const error = useSelector(getUploadError);
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || "#ffffff";
    const isDefaultWhiteTheme = isLightSurface(contentColor);

    // Add responsive breakpoints
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));

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
    const visibleSidebarItems = getVisibleSidebarItems(role);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);

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
        <Grid container className="settings-layout-root" sx={{ ml: '18px', p: '18px', width: '100%', alignItems: 'flex-start' }}>
            {/* Full-width header (title + 2 horizontal dividers) */}
            <Grid item xs={12} sx={{ pt: '18px', mb: 1.5 }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        mb: 1,
                    }}
                >
                    Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
                    <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
                </Box>
            </Grid>

            <Grid item xs={12} md={2} sx={{
                p: 0,
                ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp && !isTablet),
            }}>
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>
            <Grid
                item
                xs={12}
                md={10}
                className="settings-main-content-column"
                sx={{
                    backgroundColor: isDefaultWhiteTheme ? '#ffffff' : contentColor,
                    p: 3,
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                }}
            >
                <Paper
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        width: '100%',
                        maxWidth: 'none',
                        bgcolor: "#fff",
                        m: 0,
                    }}
                >
                    <HelpDropdown value={selectedHelp} onChange={setSelectedHelp} />
                    <Box
                        sx={{
                            p: 1.2,
                            border: "1px solid #cfcfcf",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 2,
                            bgcolor: "#fff",
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.2}>
                            <PictureAsPdfIcon color="error" fontSize="small" />
                            <Typography fontSize="14px" fontWeight={600}>
                                {selectedHelp}
                            </Typography>
                        </Box>

                        <Button variant="outlined" size="small" component="label">
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
                        onClick={triggerFilePicker}
                        onDrop={onDrop}
                        onDragOver={(e) => e.preventDefault()}
                        sx={{
                            p: 4,
                            textAlign: "center",
                            border: "2px dashed #90caf9",
                            borderRadius: "12px",
                            backgroundColor: "#f5faff",
                            my: 2,
                            cursor: "pointer",
                        }}
                    >
                        <CloudUploadIcon sx={{ fontSize: 36, color: "#90caf9" }} />
                        <Typography color="primary" sx={{ mt: 1, fontWeight: 600 }}>
                            Select a PDF to Upload
                        </Typography>
                        <Typography variant="caption">or Drag and drop it here</Typography>

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
                            fullWidth
                            placeholder="Add File URL"
                            variant="outlined"
                            size="small"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            sx={
                                isDefaultWhiteTheme
                                    ? {
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: "#bde0fe",
                                            borderRadius: "8px",
                                            "&:hover": {
                                                backgroundColor: "#ffffff",
                                            },
                                        },
                                        // Force outline to render even if global CSS overrides MUI defaults
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#cfcfcf !important",
                                            borderWidth: "1px !important",
                                            borderStyle: "solid !important",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#cfcfcf !important",
                                        },
                                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#cfcfcf !important",
                                        },
                                        "& .MuiOutlinedInput-input": {
                                            color: "#000000",
                                        },
                                        "& input::placeholder": {
                                            color: "rgba(0,0,0,0.6)",
                                            opacity: 1,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <Button variant="contained" size="small" onClick={uploadFromUrl}>
                            Upload
                        </Button>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.secondary" }}>
                        {selectedFile?.name ? `Selected: ${selectedFile.name}` : "Only PDF files are allowed"}
                    </Typography>
                </Paper>
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
            </Grid>
        </Grid>
    );
};

export default CreateHelp;
