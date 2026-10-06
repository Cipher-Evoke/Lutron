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
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import SettingsSidebar from "../../../components/SettingsSidebar";
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
import { getVisibleSidebarItemsWithPaths, UseAuth } from "../../../customhooks/UseAuth";
import {
    settingsHelpLayoutShellSx,
    settingsHelpLayoutGridSx,
    settingsHelpLayoutContentColumnSx,
    settingsSidebarGridItemSx,
} from "../../../utils/settingsPageLayout";
function HelpDropdown({ value, onChange }) {
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
                {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
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
                        {piOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
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
    
    // Add responsive breakpoints
    
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
        <Box className="help-container" sx={settingsHelpLayoutShellSx}>
            <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1.5 }} sx={settingsHelpLayoutGridSx}>
            <Grid
              item
              xs={12}
              md={3}
              lg={3}
              className="settings-sidebar-column"
              sx={{
                ...settingsSidebarGridItemSx,
                order: { xs: 2, lg: 1 },
              }}
            >
            <Typography variant="h6" sx={{
                            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                            color: theme.palette.text.secondary,
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            paddingTop: "18px",
                            marginBottom: 16
                        }}>
                    Settings
                </Typography>
                
                <SettingsSidebar items={visibleSidebarItemsWithPaths} embedded />
            </Grid>
            <Grid
              item
              xs={12}
              md={9}
              lg={9}
              className="settings-help-content-column"
              sx={settingsHelpLayoutContentColumnSx}
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
                            <PictureAsPdfIcon sx={{ color: '#d32f2f' }} fontSize="small" />
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
                            size="small"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Button variant="contained" size="small" onClick={uploadFromUrl}>
                            Upload
                        </Button>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: "block", color: "black" }}>
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
        </Box>
    );
};

export default CreateHelp;
