// lutron_frontend_app/src/screens/dashboard/Alerts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveAlerts,
  downloadAlerts,
  sendAlertsByEmail,
  selectAlerts,
  selectAlertsLoading,
  selectDownloadLoading,
  selectDownloadError,
  selectDownloadSuccess,
  selectEmailLoading,
  selectEmailError,
  selectEmailSuccess,
  resetDownloadState,
  resetEmailState,
} from '../../redux/slice/dashboard/alertsSlice';
import { fetchEmailConfigs } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { invokeValidatedEmailExportAction } from '../../../../shared/dashboard/export/emailExportGate';
import { fetchProfile } from '../../redux/slice/auth/userlogin';
import {
  dispatchFetchActiveAlertsOnce,
  dispatchFetchProfileOnce,
} from '../../../../shared/utils/bootstrapFetchGuards';
import { findFocusedAlertIndex } from '../../../../shared/heatmap/alertAreaMatch';
import {
  Snackbar,
  Alert,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { FileUpload as FileUploadIcon } from '@mui/icons-material';

const pad2 = (n) => String(n).padStart(2, "0");
const formatDateTime = (timeStr) => {
  if (!timeStr) return "-";
  
  // Handle backend format: "17-09-2025 06.45"
  if (timeStr.includes('-') && timeStr.includes('.')) {
    try {
      const [datePart, timePart] = timeStr.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hour, minute] = timePart.split('.');
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      
      const dd = pad2(date.getDate());
      const mm = pad2(date.getMonth() + 1);
      const yyyy = date.getFullYear();
      let hh = date.getHours();
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12 || 12;
      const HH = pad2(hh);
      const min = pad2(date.getMinutes());
      return `${dd}/${mm}/${yyyy} ${HH}:${min} ${ampm}`;
    } catch (error) {
      return timeStr; // Return original if parsing fails
    }
  }
  
  // Handle ISO format as fallback
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const HH = pad2(hh);
    const min = pad2(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${HH}:${min} ${ampm}`;
  } catch (error) {
    return timeStr; // Return original if parsing fails
  }
};

function Alerts({ selectedTypes = [], focusAlert = null }) {
  const dispatch = useDispatch();
  
  const alerts = useSelector(selectAlerts);
  const loading = useSelector(selectAlertsLoading);
  const downloadLoading = useSelector(selectDownloadLoading);
  const downloadError = useSelector(selectDownloadError);
  const downloadSuccess = useSelector(selectDownloadSuccess);
  const emailLoading = useSelector(selectEmailLoading);
  const emailError = useSelector(selectEmailError);
  const emailSuccess = useSelector(selectEmailSuccess);
  const hasInitialized = useRef(false);
  
  // User profile for email functionality
  const userProfile = useSelector((state) => state.user?.profile);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [highlightedAlertKey, setHighlightedAlertKey] = useState(null);
  const [pendingScrollKey, setPendingScrollKey] = useState(null);
  const highlightedRowRef = useRef(null);
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  // Email dialog state - DISABLED: No popup, using saved email only
  
  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Export functionality
  const handleDownload = async () => {
    try {
      const result = await dispatch(downloadAlerts());
      if (result.type.endsWith('/fulfilled')) {
        // Create blob and download file - backend returns CSV
        const blob = new Blob([result.payload], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSnackbar('Alerts exported successfully!', 'success');
      } else {
        showSnackbar(result.payload || 'Failed to export alerts', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to export alerts', 'error');
    }
    setShowExportDropdown(false);
  };

  // Email dialog handlers - Send email directly to logged-in user

  const handleEmailDialogOpen = async (action) => {
    await invokeValidatedEmailExportAction({
      dispatch,
      fetchEmailConfigs,
      userProfile,
      showSnackbar,
      action,
    });
  };

  const handleEmailExport = async () => {
    const emailAction = async (email) => {
      try {
        const result = await dispatch(sendAlertsByEmail(email));
        if (result.type.endsWith('/fulfilled')) {
          // Check if payload contains error status
          if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
            // API returned error in payload even though action was fulfilled
            const errorMessage = result.payload.message || 'Unknown error occurred';
            showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
          } else {
            // Success
            showSnackbar('Alerts sent by email successfully!', 'success');
          }
        } else {
          const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
          showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
        }
      } catch (error) {
        showSnackbar('Failed to send email. Please try again.', 'error');
      }
    };

    handleEmailDialogOpen(emailAction);
    setShowExportDropdown(false);
  };

  useEffect(() => {
    // Only fetch alerts once on component mount to prevent multiple API calls
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatchFetchActiveAlertsOnce(dispatch, fetchActiveAlerts);
    }
  }, [dispatch]);

  // Profile is owned by Topbar; join in-flight / skip if already loaded
  useEffect(() => {
    dispatchFetchProfileOnce(dispatch, fetchProfile);
  }, [dispatch]);

  // Handle download success/error notifications
  useEffect(() => {
    if (downloadSuccess) {
      showSnackbar('Alerts exported successfully!', 'success');
      dispatch(resetDownloadState());
    } else if (downloadError) {
      showSnackbar(downloadError, 'error');
      dispatch(resetDownloadState());
    }
  }, [downloadSuccess, downloadError, dispatch]);

  // Handle email success/error notifications - Keep for Redux state updates
  useEffect(() => {
    if (emailSuccess) {
      // Success message is already shown in handleEmailExport
      dispatch(resetEmailState());
    } else if (emailError) {
      // Error message is already shown in handleEmailExport, but show Redux error if different
      if (emailError) {
        showSnackbar(emailError, 'error');
      }
      dispatch(resetEmailState());
    }
  }, [emailSuccess, emailError, dispatch]);

  const filtered = useMemo(() => {
    if (!Array.isArray(alerts)) return [];
    if (!selectedTypes || selectedTypes.length === 0) return alerts;

    const normalizedSelected = (Array.isArray(selectedTypes) ? selectedTypes : [selectedTypes])
      .filter(Boolean)
      .map((t) => String(t).toLowerCase().trim());

    if (normalizedSelected.length === 0) return alerts;

    return alerts.filter((a) => {
      const t = String(a?.alert_type || '').toLowerCase().trim();
      // exact match first; fallback to substring match
      return normalizedSelected.includes(t) || normalizedSelected.some((s) => t.includes(s));
    });
  }, [alerts, selectedTypes, forceUpdate]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = filtered.slice(startIndex, endIndex);

  const normalizeText = (value) => String(value || '').toLowerCase().trim();
  const getAlertKey = (alert) => {
    return [
      normalizeText(alert?.location),
      normalizeText(alert?.alert_type),
      normalizeText(alert?.device_name),
      normalizeText(alert?.serial_no),
      normalizeText(alert?.reported_time || alert?.time)
    ].join('|');
  };

  useEffect(() => {
    if (!focusAlert || loading || !Array.isArray(filtered) || filtered.length === 0) return;

    const matchedIndex = findFocusedAlertIndex(filtered, focusAlert);

    if (matchedIndex < 0) return;

    const matchedAlert = filtered[matchedIndex];
    const matchedKey = getAlertKey(matchedAlert);
    const page = Math.floor(matchedIndex / itemsPerPage) + 1;
    setCurrentPage(page);
    setHighlightedAlertKey(matchedKey);
    setPendingScrollKey(matchedKey);

    const timeoutId = setTimeout(() => {
      setHighlightedAlertKey(null);
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [focusAlert, filtered, itemsPerPage, loading]);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to first page when filtered data changes
  useEffect(() => {
    if (focusAlert) return;
    setCurrentPage(1);
  }, [filtered.length, focusAlert]);

  // Auto-scroll to the highlighted row only for floorplan alert redirection.
  useEffect(() => {
    if (!focusAlert || !pendingScrollKey) return;
    if (!highlightedRowRef.current) return;

    highlightedRowRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    setPendingScrollKey(null);
  }, [focusAlert, pendingScrollKey, currentPage, paginatedAlerts]);

  // Force immediate re-render when selectedTypes changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [selectedTypes]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('[data-export-dropdown]')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  return (
    <div style={{
      backgroundColor: 'rgba(128, 120, 100, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      minHeight: 'calc(100vh - 200px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '20px',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: "0 12px",
        marginBottom: "6px"
      }}>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: "18px" }}>
          System Alerts
        </div>
        <div style={{ position: 'relative' }} data-export-dropdown>
          <Button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            disabled={downloadLoading || emailLoading || filtered.length === 0}
            sx={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 400,
              padding: '4px 8px',
              minWidth: 'auto',
              height: 'auto',
              textTransform: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.8,
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 0.5,
              },
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: '4px',
              }
            }}
            startIcon={
              <FileUploadIcon fontSize="small" />
            }
          >
            {(downloadLoading || emailLoading) ? 'Exporting...' : 'Export'}
          </Button>
          
          {showExportDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#CDC0A0',
                border: '1px solid #444',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 1000,
                minWidth: '180px',
                padding: '8px 0'
              }}
            >
              <button
                onClick={handleEmailExport}
                disabled={emailLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  color: emailLoading ? '#999' : '#fff',
                  fontWeight: '500',
                  borderBottom: '1px solid #444',
                  opacity: emailLoading ? 0.6 : 1
                }}
              >
                {emailLoading ? '⏳ Sending...' : 'Send By Email'}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: downloadLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  color: downloadLoading ? '#999' : '#fff',
                  fontWeight: '500',
                  opacity: downloadLoading ? 0.6 : 1
                }}
              >
                {downloadLoading ? '⏳ Downloading...' : 'Download To PC'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ color: "#fff", opacity: 0.9, fontSize: "12px", marginBottom: "10px", padding: "0 12px" }}>
        {loading ? "Loading..." : `${filtered.length} active alerts`}
        {!loading && filtered.length > 0 && (
          <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>
           
          </span>
        )}
      </div>

      <div style={{ 
        overflowX: "auto", 
        padding: "0 12px 12px 12px"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#cdc0a0" }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {/* Updated to match JSON response fields */}
              {["Location", "Alert Type", "Device Name", "Serial No", "Model Number", "Description", "Reported At"].map((h) => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #8f8a7b",
                    backgroundColor: "#b8ad91",
                    color: "#222",
                    padding: "10px 8px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ border: "1px solid #8f8a7b", padding: "14px", textAlign: "center", color: "#333" }}>
                  No alerts
                </td>
              </tr>
            )}
            {paginatedAlerts.map((a, index) => {
              const rowKey = getAlertKey(a);
              const isHighlighted = highlightedAlertKey && rowKey === highlightedAlertKey;
              const rowCellStyle = {
                border: isHighlighted ? "2px solid #d32f2f" : "1px solid #8f8a7b",
                padding: "10px 8px",
                backgroundColor: isHighlighted ? "rgba(255, 230, 230, 0.95)" : "transparent",
                fontWeight: isHighlighted ? 700 : 400,
                transition: "background-color 0.2s ease, border 0.2s ease"
              };

              return (
              <tr
                key={index}
                ref={isHighlighted && rowKey === pendingScrollKey ? highlightedRowRef : null}
              >
                <td style={rowCellStyle}>{a.location ?? "-"}</td>
                <td style={rowCellStyle}>{a.alert_type ?? "-"}</td>
                <td style={rowCellStyle}>{a.device_name ?? "-"}</td>
                <td style={rowCellStyle}>{a.serial_no ?? "-"}</td>
                <td style={rowCellStyle}>{a.model_number || "-"}</td>
                <td style={rowCellStyle}>{a.description ?? "-"}</td>
                <td style={rowCellStyle}>{formatDateTime(a.reported_time || a.time)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 12px',
          backgroundColor: 'rgba(128, 120, 100, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#fff', fontSize: '14px' }}>
              Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} alerts
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value)}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#fff',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#cdc0a0',
                      '& .MuiMenuItem-root': {
                        color: '#333',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ color: '#fff', fontSize: '14px' }}>
              per page
            </Typography>
          </Box>
          
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => setCurrentPage(page)}
            color="primary"
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }
            }}
          />
        </Box>
      )}
      
      {/* MUI Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            backgroundColor: 'white',
            color: 'black',
            border: snackbarSeverity === 'error'
              ? '1px solid #f44336'
              : snackbarSeverity === 'warning'
                ? '1px solid #ff9800'
                : '1px solid #4CAF50',
            '& .MuiAlert-icon': {
              color: snackbarSeverity === 'error'
                ? '#f44336'
                : snackbarSeverity === 'warning'
                  ? '#ff9800'
                  : '#4CAF50'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      {/* Email Input Dialog - DISABLED: No popup, using saved email only */}
    </div>
  );
}

export default Alerts;