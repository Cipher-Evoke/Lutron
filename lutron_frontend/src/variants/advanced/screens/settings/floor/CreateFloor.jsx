import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getProcessorId } from '../../../../../utils/processorId';
import { validateAreaCoordinatesCsvFile } from '../../../../../utils/areaCoordinatesCsv';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Grid, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, List, ListItem, IconButton, Checkbox, FormControlLabel, DialogActions,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import PublishIcon from '@mui/icons-material/Publish';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProcessors,
  downloadLeafAreas,
  uploadAreaCoordinates,
} from '../../../redux/slice/processor/processorSlice';
import {
  addSelectedProcessor,
  removeSelectedProcessor,
  clearSelectedProcessors,
  createFloor,
  updateFloor,
  fetchFloors,
  clearProcessorAreaIds,
  updateAreaFloorAndProcessor,
  createFloorWithAreas,
} from '../../../redux/slice/floor/floorSlice';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { ConfirmDialog } from '../../../utils/FeedbackUI';
import FloorPlanPdfPreview from '../../../../../shared/pdf/FloorPlanPdfPreview';

import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { getThemeButtonColor } from '../../../utils/themePageBackground';
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  width: 1,
});

const DocumentPreviewContainer = styled('div')({
  width: '100%',
  minHeight: '240px',
  maxHeight: '240px',
  borderRadius: '8px',
  marginTop: '16px',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  backgroundColor: 'var(--settings-form-section-bg, #3d4a5c)',
  color: 'var(--settings-form-control-text, #fff)',
  overflow: 'auto',
  position: 'relative',
});

export default function CreateFloor() {
  const dispatch = useDispatch();
  const { processors, status: processorStatus } = useSelector(state => state.processor);
  const { selectedProcessors, error, status: floorStatus } = useSelector(state => state.floor);
  const { processorAreaIds } = useSelector(state => state.floor);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const navigate = useNavigate();

  const role = localStorage.getItem('role');

  const [floorName, setFloorName] = useState('');
  const [floorDocument, setFloorDocument] = useState(null);
  const [documentObjectURL, setDocumentObjectURL] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogSelectedProcessors, setDialogSelectedProcessors] = useState([]);
  const [uploadStatuses, setUploadStatuses] = useState({});
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showUploadFailure, setShowUploadFailure] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showCreateError, setShowCreateError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [areaUploadSuccess, setAreaUploadSuccess] = useState({});
  const [areaUploadMsg, setAreaUploadMsg] = useState({});

  const [saving, setSaving] = useState(false);

  const [processorAreaMap, setProcessorAreaMap] = useState({}); // { [processorId]: [areaId, ...] }
  const pollingRef = useRef();

  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processorToDelete, setProcessorToDelete] = useState(null);

  // Error handler functions
  const handleCloseErrorSnackbar = () => {
    setShowCreateError(false);
    setErrorMessage('');
  };

  const showErrorSnackbar = (message) => {
    setErrorMessage(message);
    setShowCreateError(true);
  };

  // Helper to safely render error messages
  const renderErrorMessage = (err) => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (Array.isArray(err)) {
      // If array of objects, try to extract 'message' or stringify
      return err.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          // Try to extract a message or detail field, else stringify
          return item.message || item.detail || JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }
    if (typeof err === 'object') {
      // Try to extract all string values from the object
      return Object.values(err)
        .map(val => {
          if (typeof val === 'string') return val;
          if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        })
        .join(', ');
    }
    return 'An unknown error occurred.';
  };

  useEffect(() => {
    dispatch(fetchProcessors());
    dispatch(clearSelectedProcessors());
    dispatch(clearProcessorAreaIds()); // Clear area IDs on component mount
    setProcessorAreaMap({});  //for empty processor data
  }, [dispatch]);

  useEffect(() => {
    if (documentObjectURL) {
      return () => URL.revokeObjectURL(documentObjectURL);
    }
  }, [documentObjectURL]);

  useEffect(() => {
    if (error && floorStatus === 'failed') {
      setErrorMessage(error);
      setShowCreateError(true);
    }
  }, [error, floorStatus]);

  // Poll for processors if error exists (disconnected)
  useEffect(() => {
    if (processorStatus === 'failed') {
      pollingRef.current = setInterval(() => {
        dispatch(fetchProcessors());
      }, 3000); // retry every 3 seconds
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [processorStatus, dispatch]);

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFloorDocument(file);
      if (documentObjectURL) {
        URL.revokeObjectURL(documentObjectURL);
      }
      const url = URL.createObjectURL(file);
      setDocumentObjectURL(url);
    } else {
      setFloorDocument(null);
      setDocumentObjectURL('');
      if (documentObjectURL) {
        URL.revokeObjectURL(documentObjectURL);
      }
      showErrorSnackbar('Please upload a PDF file.');
    }
  };

  const handleDialogCheckboxChange = (processor) => {
    setDialogSelectedProcessors((prevSelected) => {
      if (prevSelected.some((p) => p.id === processor.id)) {
        return prevSelected.filter((p) => p.id !== processor.id);
      } else {
        return [...prevSelected, processor];
      }
    });
  };

  const handleConfirmAddProcessors = () => {
    const existingIds = new Set(
      selectedProcessors.map((p) => getProcessorId(p)).filter((id) => id != null)
    );
    dialogSelectedProcessors.forEach((processor) => {
      const pid = getProcessorId(processor);
      if (pid != null && !existingIds.has(pid)) {
        dispatch(addSelectedProcessor(processor));
        existingIds.add(pid);
      }
    });
    setDialogSelectedProcessors([]);
    setOpenDialog(false);
  };

  const handleCloseDialog = () => {
    setDialogSelectedProcessors([]);
    setOpenDialog(false);
  };

  const handleRemoveProcessor = (id) => {
    const processor = selectedProcessors.find(p => p.id === id);
    setProcessorToDelete({ id, processor });
    setShowDeleteDialog(true);
  };

  const confirmRemoveProcessor = () => {
    if (processorToDelete) {
      dispatch(removeSelectedProcessor(processorToDelete.id));
      setShowDeleteDialog(false);
      setProcessorToDelete(null);
    }
  };

  // const handleAreaCoordinatesUpload = async (e, processorId) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setUploadStatuses(prev => ({ ...prev, [processorId]: 'uploading' }));
  //     try {
  //       const result = await dispatch(uploadAreaCoordinates({ processorId, file })).unwrap();
  //       setUploadStatuses(prev => ({ ...prev, [processorId]: 'success' }));
  //       setProcessorAreaMap(prev => ({
  //         ...prev,
  //         [processorId]: result?.area_id || []
  //       }));
  //       setAreaUploadSuccess(prev => ({ ...prev, [processorId]: true }));
  //       setAreaUploadMsg(prev => ({
  //         ...prev,
  //         [processorId]: Array.isArray(result.area_id)
  //           ? `Area coordinates uploaded! Area IDs: ${result.area_id.join(', ')}`
  //           : 'Area coordinates uploaded! (No area IDs returned)'
  //       }));
  //       setShowUploadSuccess(true);
  //       dispatch(fetchProcessors());
  //     } catch (error) {
  //       setUploadStatuses(prev => ({ ...prev, [processorId]: 'failure' }));
  //       setAreaUploadSuccess(prev => ({ ...prev, [processorId]: false }));
  //       setAreaUploadMsg(prev => ({
  //         ...prev,
  //         [processorId]: 'Failed to upload area coordinates.'
  //       }));
  //     }
  //   }
  //   e.target.value = '';
  // };

  const handleAreaCoordinatesUpload = async (e, processorId) => {
    const file = e.target.files[0];
    const resolvedProcessorId = getProcessorId(processorId);
    if (!file || resolvedProcessorId == null) {
      e.target.value = '';
      return;
    }

    const validation = await validateAreaCoordinatesCsvFile(file, resolvedProcessorId);
    if (!validation.valid) {
      setUploadStatuses(prev => ({ ...prev, [resolvedProcessorId]: 'failure' }));
      setAreaUploadSuccess(prev => ({ ...prev, [resolvedProcessorId]: false }));
      setAreaUploadMsg(prev => ({
        ...prev,
        [resolvedProcessorId]: validation.error,
      }));
      setShowUploadFailure(true);
      e.target.value = '';
      return;
    }

    setUploadStatuses(prev => ({ ...prev, [resolvedProcessorId]: 'uploading' }));

    try {
      const result = await dispatch(
        uploadAreaCoordinates({ processorId: resolvedProcessorId, file })
      ).unwrap();

      const areaIds = result?.area_id;

      if (!Array.isArray(areaIds) || areaIds.length === 0) {
        throw new Error('No valid area IDs returned');
      }

      setUploadStatuses(prev => ({ ...prev, [resolvedProcessorId]: 'success' }));

      setProcessorAreaMap(prev => ({
        ...prev,
        [resolvedProcessorId]: areaIds,
      }));

      setAreaUploadSuccess(prev => ({ ...prev, [resolvedProcessorId]: true }));

      setAreaUploadMsg(prev => ({
        ...prev,
        [resolvedProcessorId]: `Area coordinates uploaded! Area IDs: ${areaIds.join(', ')}`,
      }));

      setShowUploadSuccess(true);

      dispatch(fetchProcessors());
    } catch (error) {
      console.error('Upload error:', error);

      setUploadStatuses(prev => ({ ...prev, [resolvedProcessorId]: 'failure' }));
      setAreaUploadSuccess(prev => ({ ...prev, [resolvedProcessorId]: false }));
      setAreaUploadMsg(prev => ({
        ...prev,
        [resolvedProcessorId]:
          typeof error === 'string'
            ? error
            : error?.message || 'Failed to upload area coordinates.',
      }));
      setShowUploadFailure(true);
    }

    e.target.value = '';
  };

  // const handleSave = async () => {
  //   setShowCreateError(false);
  //   setErrorMessage('');

  //   // Validation
  //   if (!floorName.trim()) {
  //     setErrorMessage('Floor name is required.');
  //     setShowCreateError(true);
  //     return;
  //   }
  //   if (!floorDocument) {
  //     setErrorMessage('Floor document (PDF) is required.');
  //     setShowCreateError(true);
  //     return;
  //   }
  //   if (selectedProcessors.length === 0) {
  //     setErrorMessage('Please select at least one processor.');
  //     setShowCreateError(true);
  //     return;
  //   }
  //   // Per-processor CSV validation
  //   const missingCsv = selectedProcessors.some(proc => !processorAreaMap[proc.id] || processorAreaMap[proc.id].length === 0);
  //   if (missingCsv) {
  //     setErrorMessage('Please upload an area CSV for each processor.');
  //     setShowCreateError(true);
  //     return;
  //   }

  //   // Build processors array for payload
  //   const processorsPayload = selectedProcessors.map(proc => ({
  //     processor_id: proc.id,
  //     area_ids: processorAreaMap[proc.id] || []
  //   }));

  //   const sendData = {
  //     floor_name: floorName.trim(),
  //     processors: processorsPayload
  //   };

  //   const formData = new FormData();
  //   formData.append('json_data', JSON.stringify(sendData));
  //   formData.append('floor_plan', floorDocument);

  //   try {
  //     await dispatch(createFloorWithAreas(formData)).unwrap();
  //     setShowCreateSuccess(true);
  //     setFloorName('');
  //     setFloorDocument(null);
  //     setDocumentObjectURL('');
  //     dispatch(clearSelectedProcessors());
  //     setUploadStatuses({});
  //     dispatch(clearProcessorAreaIds());
  //     setAreaUploadSuccess({});
  //     setAreaUploadMsg({});
  //     setProcessorAreaMap({}); // <-- FLUSH the global variable here!
  //     dispatch(fetchFloors());
  //     setTimeout(() => {
  //       navigate('/setting/floor');
  //     }, 1500);
  //   } catch (error) {
  //     setErrorMessage(renderErrorMessage(error));
  //     setShowCreateError(true);
  //   }
  // };

  // const handleSave = async () => {
  //   setShowCreateError(false);
  //   setErrorMessage('');

  //   // Validation
  //   if (!floorName.trim()) {
  //     setErrorMessage('Floor name is required.');
  //     setShowCreateError(true);
  //     return;
  //   }

  //   if (!floorDocument) {
  //     setErrorMessage('Floor document (PDF) is required.');
  //     setShowCreateError(true);
  //     return;
  //   }

  //   if (selectedProcessors.length === 0) {
  //     setErrorMessage('Please select at least one processor.');
  //     setShowCreateError(true);
  //     return;
  //   }

  //   const missingCsv = selectedProcessors.some(
  //     proc => !processorAreaMap[proc.id] || processorAreaMap[proc.id].length === 0
  //   );

  //   if (missingCsv) {
  //     setErrorMessage('Please upload an area CSV for each processor.');
  //     setShowCreateError(true);
  //     return;
  //   }

  //   const processorsPayload = selectedProcessors.map(proc => ({
  //     processor_id: proc.id,
  //     area_ids: processorAreaMap[proc.id] || []
  //   }));

  //   const sendData = {
  //     floor_name: floorName.trim(),
  //     processors: processorsPayload
  //   };

  //   const formData = new FormData();
  //   formData.append('json_data', JSON.stringify(sendData));
  //   formData.append('floor_plan', floorDocument);

  //   try {
  //     setSaving(true); // START LOADING

  //     await dispatch(createFloorWithAreas(formData)).unwrap();

  //     setShowCreateSuccess(true);
  //     setFloorName('');
  //     setFloorDocument(null);
  //     setDocumentObjectURL('');

  //     dispatch(clearSelectedProcessors());
  //     setUploadStatuses({});
  //     dispatch(clearProcessorAreaIds());
  //     setAreaUploadSuccess({});
  //     setAreaUploadMsg({});
  //     setProcessorAreaMap({});

  //     dispatch(fetchFloors());

  //     setTimeout(() => {
  //       navigate('/setting/floor');
  //     }, 1500);

  //   } catch (error) {
  //     setErrorMessage(renderErrorMessage(error));
  //     setShowCreateError(true);
  //   } finally {
  //     setSaving(false); // STOP LOADING
  //   }
  // };

  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const handleSave = async () => runSaveOnce(async () => {
    if (saving) return; // prevent double click

    setShowCreateError(false);
    setErrorMessage('');

    // VALIDATIONS
    if (!floorName.trim()) {
      setErrorMessage('Floor name is required.');
      setShowCreateError(true);
      return;
    }

    if (!floorDocument) {
      setErrorMessage('Floor document (PDF) is required.');
      setShowCreateError(true);
      return;
    }

    if (selectedProcessors.length === 0) {
      setErrorMessage('Please select at least one processor.');
      setShowCreateError(true);
      return;
    }

    const missingCsv = selectedProcessors.some((proc) => {
      const pid = getProcessorId(proc);
      return pid == null || !processorAreaMap[pid] || processorAreaMap[pid].length === 0;
    });

    if (missingCsv) {
      setErrorMessage('Please upload an area CSV for each processor.');
      setShowCreateError(true);
      return;
    }

    // PAYLOAD — one entry per unique processor; area map keyed by getProcessorId
    const seen = new Set();
    const processorsPayload = [];
    selectedProcessors.forEach((proc) => {
      const pid = getProcessorId(proc);
      if (pid == null || seen.has(pid)) return;
      seen.add(pid);
      processorsPayload.push({
        processor_id: pid,
        area_ids: processorAreaMap[pid] || [],
      });
    });

    const sendData = {
      floor_name: floorName.trim(),
      processors: processorsPayload
    };

    const formData = new FormData();
    formData.append('json_data', JSON.stringify(sendData));
    formData.append('floor_plan', floorDocument);

    try {
      setSaving(true); // Save controls this

      await dispatch(createFloorWithAreas(formData)).unwrap(); // key call

      // SUCCESS
      setShowCreateSuccess(true);

      setFloorName('');
      setFloorDocument(null);
      setDocumentObjectURL('');

      dispatch(clearSelectedProcessors());
      setUploadStatuses({});
      dispatch(clearProcessorAreaIds());
      setAreaUploadSuccess({});
      setAreaUploadMsg({});
      setProcessorAreaMap({});

      dispatch(fetchFloors());

      setTimeout(() => {
        navigate('/setting/floor');
      }, 1500);

    } catch (error) {
      // unwrap error
      setErrorMessage(renderErrorMessage(error));
      setShowCreateError(true);

    } finally {
      setSaving(false); // always stop
    }
  });

  const handleCancel = () => {
    setFloorName('');
    setFloorDocument(null);
    if (documentObjectURL) {
      URL.revokeObjectURL(documentObjectURL);
    }
    setDocumentObjectURL('');
    dispatch(clearSelectedProcessors());
    setUploadStatuses({});
    dispatch(clearProcessorAreaIds());
    setAreaUploadSuccess({});
    setAreaUploadMsg({});
    setProcessorAreaMap({}); // <-- FLUSH the global variable here!
    navigate('/setting/floor');
  };

  if (role !== 'Superadmin') {
    return <Navigate to="/setting/main" replace />;
  }

  return (
    <>
      <Grid container spacing={4} alignItems="flex-start" className="settings-floor-form" sx={{ p: 2, borderRadius: '8px' }}>
        {/* Left Section */}
        <Grid item xs={12} md={6}>
          {/* Floor Name */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Typography sx={{ color: 'var(--settings-form-label-color, #fff)' }}>Floor Name</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                size="small"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                InputProps={{
                  sx: {
                    backgroundColor: 'var(--settings-form-control-bg, #3d4a5c)',
                    color: 'var(--settings-form-control-text, #fff)',
                    borderRadius: 1,
                    border: '1px solid var(--users-border, #999)',
                    '&:hover': {
                      backgroundColor: 'var(--settings-panel-outer-bg, #4a586c)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'var(--settings-form-control-bg, #3d4a5c)',
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Floor Document Upload */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <Typography sx={{ color: 'var(--settings-form-label-color, #fff)' }}>Floor Document (PDF)</Typography>
            </Grid>
            <Grid item xs={8}>
              <Button
                component="label"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  width: '100%',
                  py: 1.5,
                  backgroundColor: 'var(--settings-form-control-bg, #3d4a5c)',
                  color: 'var(--settings-form-control-text, #fff)',
                  borderRadius: 1,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'var(--settings-panel-outer-bg, #4a586c)' }
                }}
              >
                Upload Floor Document
                <VisuallyHiddenInput type="file" accept=".pdf" onChange={handleDocumentUpload} />
              </Button>
            </Grid>
          </Grid>

          {/* Document Preview Area */}
          <Grid container sx={{ mt: 2 }}>
            <Grid item xs={4}></Grid>
            <Grid item xs={8}>
              <DocumentPreviewContainer>
                <FloorPlanPdfPreview
                  source={floorDocument || documentObjectURL || null}
                  emptyTextColor="var(--settings-form-control-text, #fff)"
                />
              </DocumentPreviewContainer>
            </Grid>
          </Grid>

          {/* Area CSV Upload
          <Grid container spacing={2} alignItems="center" sx={{ mt: 3 }}>
            <Grid item xs={4}>
              <Typography sx={{ color: 'var(--settings-form-label-color, #fff)' }}>Area Coordinates (CSV)</Typography>
            </Grid>
            <Grid item xs={8}>
              <Button
                component="label"
                variant="contained"
                startIcon={<PublishIcon />}
                sx={{
                  width: '100%',
                  py: 1.5,
                  backgroundColor: 'var(--settings-form-control-bg, #3d4a5c)',
                  color: 'var(--settings-form-control-text, #fff)',
                  borderRadius: 1,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'var(--settings-panel-outer-bg, #7a705e)' }
                }}
              >
                Upload Area CSV
                <VisuallyHiddenInput type="file" accept=".csv" onChange={handleAreaCsvUpload} />
              </Button>
            </Grid>
          </Grid>
          {areas.length > 0 && (
            <Typography sx={{ color: 'lightgreen', mt: 1 }}>
              {areas.length} areas loaded from CSV.
            </Typography>
          )} */}
        </Grid>

        {/* Right Section: Processors */}
        <Grid item xs={12} md={6}>
          <Box sx={{ backgroundColor: 'var(--settings-form-section-bg, #3d4a5c)', p: 3, borderRadius: '8px', height: '100%', border: '1px solid var(--users-border, transparent)' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: 'var(--settings-form-label-color, #fff)', fontWeight: 600 }}>Processor</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setOpenDialog(true);
                  setDialogSelectedProcessors(selectedProcessors);
                }}
                sx={{
                  backgroundColor: buttonColor,
                  color: '#fff',
                  borderRadius: 1,
                  px: 2,
                  textTransform: 'none',
                }}
              >
                Add Processor
              </Button>
            </Box>

            {/* Selected Processors */}
            <Box
              sx={{
                overflowY: 'auto',
                maxHeight: '270px',
                pr: 1,
              }}
            >
              <List>
                {selectedProcessors.map((processor, idx) => (
                  <ListItem key={`${getProcessorId(processor) ?? processor.id}-${idx}`} sx={{
                    backgroundColor: 'var(--settings-form-section-bg, #3d4a5c)',
                    border: '1px solid #4a586c',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleRemoveProcessor(processor.id)}
                        sx={{ color: 'var(--settings-form-label-color, #fff)' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <Typography sx={{ color: 'var(--settings-form-label-color, #fff)', ml: 1 }}>{processor.server || processor.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<GetAppIcon />}
                        sx={{
                          backgroundColor: buttonColor,
                          color: '#ffffff',
                          '&:hover': { backgroundColor: '#555555' },
                          borderRadius: '6px',
                          textTransform: 'none',
                        }}
                        onClick={async () => {
                          try {
                            await dispatch(downloadLeafAreas(processor.id)).unwrap();
                            setShowDownloadSuccess(true);
                          } catch (error) {
                            // Failed to download leaf areas
                          }
                        }}
                      >
                        Areas
                      </Button>
                      <Button
                        component="label"
                        size="small"
                        startIcon={<PublishIcon />}
                        sx={{
                          backgroundColor: buttonColor,
                          color: '#ffffff',
                          '&:hover': { backgroundColor: '#555555' },
                          borderRadius: '6px',
                          textTransform: 'none',
                        }}
                        disabled={uploadStatuses[processor.id] === 'uploading'}
                      >
                        Area Coordinates
                        <VisuallyHiddenInput
                          type="file"
                          accept=".csv"
                          onChange={e => handleAreaCoordinatesUpload(e, getProcessorId(processor) ?? processor.id)}
                        />
                      </Button>

                      {uploadStatuses[getProcessorId(processor) ?? processor.id] === 'success' && (
                        <Box
                          sx={{
                            backgroundColor: 'var(--users-chip-bg, #d6dde8)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            ml: 1,
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                        </Box>
                      )}
                      {uploadStatuses[processor.id] === 'failure' && <CancelIcon sx={{ color: 'red', fontSize: 20, ml: 1 }} />}
                      {uploadStatuses[processor.id] === 'uploading' && <CircularProgress size={16} sx={{ color: '#fff', ml: 1 }} />}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Grid>

        {/* Save/Cancel Buttons */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{
              color: '#fff',
              borderColor: '#fff',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': { borderColor: '#ccc', backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Cancel
          </Button>
          {/* <Button
            variant="contained"
            onClick={handleSave}
            disabled={floorStatus === 'loading'}
            sx={{
              backgroundColor: buttonColor,
              color: '#fff',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#444' }
            }}
          >
            {floorStatus === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button> */}

          {/* <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || floorStatus === 'loading'}
            sx={{
              backgroundColor: buttonColor,
              color: '#fff',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { backgroundColor: '#444' }
            }}
          >
            {(saving || floorStatus === 'loading') ? (
              <>
                <CircularProgress size={20} color="inherit" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button> */}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              backgroundColor: buttonColor,
              color: '#fff',
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { backgroundColor: '#444' }
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={20} color="inherit" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Grid>
      </Grid>

      {/* Add Processor Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        BackdropProps={{
          sx: { backgroundColor: 'transparent' },
        }}
        PaperProps={{
          className: 'settings-theme-dialog',
          sx: {
            backgroundColor: 'var(--area-picker-light-dialog-bg, #d6dde8)',
            color: 'var(--settings-panel-text, #1c2330)',
            borderRadius: '16px',
            minWidth: '300px',
            border: '1px solid var(--users-border, #C5CDD8)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--area-picker-light-dialog-title-color, #1c2330)', fontSize: '1.5rem', pb: 1, fontWeight: 600 }}>Select Processors</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {processorStatus === 'loading' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
              <Typography sx={{ color: 'var(--settings-panel-text, #1c2330)' }}>Loading Processors...</Typography>
            </Box>
          ) : processorStatus === 'failed' ? (
            <Box sx={{ p: 2 }}>
              <Typography sx={{ color: '#c62828' }}>Failed to load processors. Please check the connection and retry.</Typography>
            </Box>
          ) : processors.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography sx={{ color: 'var(--settings-panel-text, #1c2330)' }}>No processors found.</Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {processors.map((processor) => (
                <ListItem
                  key={processor.id}
                  disablePadding
                  sx={{
                    backgroundColor: 'var(--users-chip-bg, #d6dde8)',
                    border: 'none',
                    px: 2,
                    py: 1,
                    '&:hover': { backgroundColor: 'var(--settings-panel-outer-bg, #b8c5d6)' },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dialogSelectedProcessors.some((p) => p.id === processor.id)}
                        onChange={() => handleDialogCheckboxChange(processor)}
                        sx={{
                          color: 'var(--settings-panel-text, #1c2330)',
                          '&.Mui-checked': {
                            color: 'var(--settings-panel-text, #1c2330)',
                          }
                        }}
                      />
                    }
                    label={<Typography className="settings-processor-picker-label" sx={{ color: 'var(--area-picker-light-dialog-field-text, #1c2330)', fontWeight: 500 }}>{processor.server}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ pt: 2, px: 2, pb: 2, backgroundColor: 'var(--area-picker-light-dialog-bg, #d6dde8)' }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            sx={{
              borderColor: 'var(--home-tab-active-color, #3D4A5C)',
              color: 'var(--settings-panel-text, #1c2330)',
              backgroundColor: 'var(--users-input-bg, #fff)',
              textTransform: 'none',
              '&:hover': { borderColor: 'var(--home-tab-active-color, #3D4A5C)', backgroundColor: 'var(--area-groups-inner-bg, #fff)' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAddProcessors}
            sx={{
              backgroundColor: 'var(--app-button, #232323)',
              color: '#fff !important',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'var(--app-button, #232323)', opacity: 0.92 }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showDownloadSuccess}
        autoHideDuration={3000}
        onClose={() => setShowDownloadSuccess(false)}
        message="Leaf areas downloaded successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={showUploadSuccess}
        autoHideDuration={3000}
        onClose={() => setShowUploadSuccess(false)}
        message="Area coordinates uploaded successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={showUploadFailure}
        autoHideDuration={3000}
        onClose={() => setShowUploadFailure(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowUploadFailure(false)}
          severity="error"
          sx={{
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #f44336',
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              color: '#f44336',
            },
            '& .MuiAlert-message': {
              color: '#000',
            },
            '& .MuiAlert-action': {
              color: '#000',
            }
          }}
        >
          Failed to upload area coordinates. Please try again.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showCreateSuccess}
        autoHideDuration={3000}
        onClose={() => setShowCreateSuccess(false)}
        message="Floor created successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={showCreateError}
        autoHideDuration={5000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          zIndex: 9999,
          '& .MuiSnackbar-root': {
            zIndex: 9999,
          },
          '& .MuiAlert-root': {
            fontSize: { xs: '12px', sm: '14px', md: '16px' },
            fontWeight: 600,
            minWidth: { xs: '200px', sm: '250px', md: '300px' },
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }
        }}
      >
        <Alert
          onClose={handleCloseErrorSnackbar}
          severity="error"
          sx={{
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #f44336',
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              color: '#f44336',
            },
            '& .MuiAlert-message': {
              color: '#000',
            },
            '& .MuiAlert-action': {
              color: '#000',
            }
          }}
        >
          {renderErrorMessage(errorMessage)}
        </Alert>
      </Snackbar>

      {/* Remove Processor Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Remove Processor"
        message={`Are you sure you want to remove processor "${processorToDelete?.processor?.server}"?`}
        onConfirm={confirmRemoveProcessor}
        onCancel={() => {
          setShowDeleteDialog(false);
          setProcessorToDelete(null);
        }}
      />
    </>
  );
}

const buttonStyle = {
  backgroundColor: '#232323',
  color: '#fff',
  fontSize: 12,
  borderRadius: 1,
  px: 1.5,
  '&:hover': { backgroundColor: '#444' },
};

const footerButtonStyle = {
  backgroundColor: '#232323',
  color: '#fff',
  textTransform: 'none',
  borderRadius: 1,
  px: 4,
  '&:hover': { backgroundColor: '#444' }
};