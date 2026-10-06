import { resolveApiAssetUrl } from '../../../shared/utils/resolveMediaUrl';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Grid, Typography, TextField, Button, List, Box, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSingleFloor, uniqueFloor, updateFloor } from '../../../redux/slice/floor/floorSlice';
import { fetchProcessors, downloadLeafAreas, uploadAreaCoordinates } from '../../../redux/slice/processor/processorSlice';

import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { ConfirmDialog } from '../../../utils/FeedbackUI';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
});

const DocumentPreviewContainer = styled('div')({
  width: '100%',
  maxHeight: '240px',
  borderRadius: '8px',
  marginTop: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#676050',
  color: '#fff',
  overflow: 'hidden',
  position: 'relative',
});


export default function EditFloor() {
  const { floorId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const singleFloor = useSelector(uniqueFloor);
  const allProcessors = useSelector((state) => state.processor.processors || []);
  const [openProcessorDialog, setOpenProcessorDialog] = useState(false);
  const [selectedProcessorIds, setSelectedProcessorIds] = useState([]);

  const [floorName, setFloorName] = useState('');
  const [newFloorDocument, setNewFloorDocument] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [processorList, setProcessorList] = useState([]);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Floor updated successfully!');
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewFile, setHasNewFile] = useState(false); // Track if new file was uploaded
  const [uploadStatuses, setUploadStatuses] = useState({}); // Track upload status per processor
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processorToDelete, setProcessorToDelete] = useState(null);

  const role = localStorage.getItem('role');
  if (role !== 'Superadmin') return <Navigate to="/main" replace />;

  // Load floor data
  useEffect(() => {
    if (floorId) {
      dispatch(fetchSingleFloor(floorId));
    }
    dispatch(fetchProcessors());
  }, [dispatch, floorId]);


  // helper
  const withCacheBust = (path) => {
    const base = path?.startsWith('http') ? path : (resolveApiAssetUrl(path || '') || (path || ''));
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}t=${Date.now()}`;
  };

  // when loading data from server
  useEffect(() => {
    if (singleFloor && !hasNewFile) {
      setFloorName(singleFloor.floor_name || '');
      setProcessorList(singleFloor.processors || []);
      const rawPath = singleFloor.floor_image || singleFloor.floor_plan || singleFloor.floor_plan_path || '';
      if (rawPath) {
        setPreviewURL(withCacheBust(rawPath)); // cache-bust
      }
    }
  }, [singleFloor, hasNewFile]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handleCancel = () => navigate('/floor');
  
  const handleCloseErrorSnackbar = () => {
    setShowErrorSnackbar(false);
    setErrorMessage('');
  };
  
  const displayErrorSnackbar = (message) => {
    setErrorMessage(message);
    setShowErrorSnackbar(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setNewFloorDocument(file);
      setHasNewFile(true); // Mark that we have a new file
      
      // Clean up old blob URL
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
      
      // Create new preview URL
      const newPreviewURL = URL.createObjectURL(file);
      setPreviewURL(newPreviewURL);
      
    } else {
      displayErrorSnackbar('Please upload a PDF file.');
    }
  };

  const handleSave = async () => {
    if (!floorName.trim()) {
      displayErrorSnackbar('Floor name is required.');
      return;
    }

    setIsLoading(true);

    try {
        const formData = new FormData();
        formData.append('floor_name', floorName.trim());
  
        // FIELD NAME MUST MATCH BACKEND: use 'floor_plan' (not 'floor_image')
        if (newFloorDocument) {
          formData.append('floor_plan', newFloorDocument);
        }
  
        // BACKEND EXPECTS 'processors' JSON, not repeated 'processor_ids'
        if (processorList.length > 0) {
          const processorsPayload = processorList.map(proc => ({
            processor_id: proc.processor_id || proc.id,
            area_ids: (proc.areas || []).map(a => a.area_id || a.id).filter(Boolean)
          }));
          formData.append('processors', JSON.stringify(processorsPayload));
        }
    
        

      const result = await dispatch(updateFloor({ floorId, formData })).unwrap();
      
      setSuccessMessage('Floor updated successfully!');
      setShowSuccessSnackbar(true);
      setIsLoading(false);
      
      // Reset the new file flag and refresh data
      setHasNewFile(false);
      setNewFloorDocument(null);
      
      // after successful save – show the server file immediately (no wait)
      if (result?.floor_image) {
        // make the iframe reload the fresh file
        setPreviewURL(withCacheBust(result.floor_image));
      }
      dispatch(fetchSingleFloor(floorId)); // optional refresh
      
      // Navigate back after success
      setTimeout(() => navigate('/floor'), 3000);
      
    } catch (err) {
      displayErrorSnackbar(`Update failed: ${err.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleRemoveProcessor = (index) => {
    const processor = processorList[index];
    setProcessorToDelete({ index, processor });
    setShowDeleteDialog(true);
  };

  const confirmRemoveProcessor = () => {
    if (processorToDelete) {
      setProcessorList(prev => prev.filter((_, i) => i !== processorToDelete.index));
      setShowDeleteDialog(false);
      setProcessorToDelete(null);
    }
  };

  const handleAddProcessors = () => {
    const selected = allProcessors.filter((p) => selectedProcessorIds.includes(p.id));
    const existingIds = processorList.map(p => p.processor_id || p.id);
    const newProcessors = selected.filter(p => !existingIds.includes(p.id));
    setProcessorList(prev => [...prev, ...newProcessors]);
    setOpenProcessorDialog(false);
    setSelectedProcessorIds([]);
  };

  return (
    <>
      <Grid container spacing={4} sx={{ p: 2 }}>
        {/* Left Section */}
        <Grid item xs={12} md={6}>
          {/* Floor Name */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ color: '#fff' }}>Floor Name</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                InputProps={{
                  sx: {
                    backgroundColor: '#5e5543',
                    color: '#fff',
                    borderRadius: 1,
                    border: '1px solid #888',
                    '& input': { color: '#fff' }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Floor Image Upload */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography sx={{ color: '#fff' }}>Floor Image</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Button
                component="label"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  width: '100%',
                  py: 1.3,
                  backgroundColor: '#5e5543',
                  color: '#fff',
                  borderRadius: 1,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#72644f' }
                }}
              >
                {hasNewFile ? 'Change Floor Image' : 'Upload Floor Image'}
                <VisuallyHiddenInput
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
          </Grid>

          {/* File Status Indicator */}
          {hasNewFile && (
            <Grid container sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography sx={{ color: '#4CAF50', fontSize: '0.875rem' }}>
                  ✓ New file selected: {newFloorDocument?.name}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Document Preview */}
          <Grid container sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <DocumentPreviewContainer>
                {previewURL ? (
                  <iframe
                    key={previewURL}        // forces remount when src changes
                    src={previewURL}
                    title="Floor Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <Typography>No Document Selected</Typography>
                )}
              </DocumentPreviewContainer>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Section - Processors */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: '#5e5543',
              borderRadius: 2,
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ color: '#fff', fontWeight: 600 }}>Processor</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenProcessorDialog(true)}
                sx={{
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: 3,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#222' }
                }}
              >
                Add Processor
              </Button>
            </Box>

            <Box sx={{ overflowY: 'auto', maxHeight: '220px', pr: 1 }}>
              <List dense>
                {processorList.length > 0 ? (
                  processorList.map((proc, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#5e5543',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        mb: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          onClick={() => handleRemoveProcessor(index)}
                          sx={{ color: '#fff', mr: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {proc.server}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() =>
                            dispatch(downloadLeafAreas(proc.processor_id || proc.id))
                          }
                          sx={{
                            backgroundColor: '#000',
                            color: '#fff',
                            textTransform: 'none',
                            borderRadius: 4
                          }}
                        >
                          Areas
                        </Button>
                        <Button
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploadStatuses[proc.processor_id || proc.id] === 'uploading'}
                          sx={{
                            backgroundColor: '#000',
                            color: '#fff',
                            textTransform: 'none',
                            borderRadius: 4
                          }}
                        >
                          Area Coordinates
                          <input
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              const processorId = proc.processor_id || proc.id;
                              
                              if (file) {
                                // Set uploading status
                                setUploadStatuses(prev => ({ ...prev, [processorId]: 'uploading' }));
                                
                                try {
                                  // Pass the correct object structure expected by Redux action
                                  await dispatch(uploadAreaCoordinates({ 
                                    processorId: processorId, 
                                    file: file 
                                  })).unwrap();
                                  
                                  // Set success status
                                  setUploadStatuses(prev => ({ ...prev, [processorId]: 'success' }));
                                  
                                  // Refresh floor data to show updated coordinates
                                  dispatch(fetchSingleFloor(floorId));
                                } catch (err) {
                                  // Set failure status
                                  setUploadStatuses(prev => ({ ...prev, [processorId]: 'failure' }));
                                  
                                  // Show error message
                                  displayErrorSnackbar(err || 'Failed to upload area coordinates.');
                                }
                                // Clear the file input so the same file can be uploaded again
                                e.target.value = '';
                              }
                            }}
                          />
                        </Button>
                        
                        {/* Upload Status Indicators */}
                        {uploadStatuses[proc.processor_id || proc.id] === 'success' && (
                          <Box
                            sx={{
                              backgroundColor: '#CDC0A0',
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
                        {uploadStatuses[proc.processor_id || proc.id] === 'failure' && (
                          <CancelIcon sx={{ color: 'red', fontSize: 20, ml: 1 }} />
                        )}
                        {uploadStatuses[proc.processor_id || proc.id] === 'uploading' && (
                          <CircularProgress size={16} sx={{ color: '#fff', ml: 1 }} />
                        )}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: '#fff' }}>No processors</Typography>
                )}
              </List>
            </Box>
          </Box>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            disabled={isLoading}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#222' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#222' }
            }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: '#1f1d18',
            color: '#fff',
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '15px',
            boxShadow: 4,
          },
        }}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
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
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Processor Selection Dialog */}
      {openProcessorDialog && (
        <Box
          sx={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
          onClick={() => setOpenProcessorDialog(false)}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: '#d5c49b',
              borderRadius: 3,
              p: 3,
              width: '90%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              color: '#000',
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" fontWeight="bold">Select Processors</Typography>

            {allProcessors.length > 0 ? (
              allProcessors.map((processor) => (
                <Box key={processor.id} sx={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedProcessorIds.includes(processor.id)}
                    onChange={() => {
                      setSelectedProcessorIds((prev) =>
                        prev.includes(processor.id)
                          ? prev.filter((id) => id !== processor.id)
                          : [...prev, processor.id]
                      );
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <Typography>{processor.server}</Typography>
                </Box>
              ))
            ) : (
              <Typography>No processors available</Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                onClick={() => setOpenProcessorDialog(false)}
                sx={{
                  backgroundColor: '#b4a789',
                  color: '#fff',
                  px: 3,
                  borderRadius: 2,
                  boxShadow: 2,
                  textTransform: 'none'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProcessors}
                sx={{
                  backgroundColor: '#000',
                  color: '#fff',
                  px: 3,
                  borderRadius: 2,
                  boxShadow: 2,
                  textTransform: 'none'
                }}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Box>
      )}

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





