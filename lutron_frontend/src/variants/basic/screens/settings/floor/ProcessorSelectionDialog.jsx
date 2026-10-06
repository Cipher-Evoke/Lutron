import React, { useState, useEffect, useRef } from 'react';
import { getProcessorId, processorIdsEqual } from '../../../../../utils/processorId';
import { toSafeReactText } from '../../../../../utils/safeReactText';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useDispatch } from 'react-redux';
import { fetchProcessors } from '../../../redux/slice/processor/processorSlice';
import { isWhiteAreaPickerChrome } from '../../../utils/themeOnSurface';

export default function ProcessorSelectionDialog({
  open,
  onClose,
  availableProcessors,
  onAddProcessors,
  selectedInitialProcessors = [],
  onRefreshProcessors,
  onProcessorCsvUpload,
}) {
  const theme = useTheme();
  const isDefaultWhiteTheme = isWhiteAreaPickerChrome(
    theme?.palette?.custom?.navbarBg || theme?.palette?.background?.paper || ''
  );
  const dispatch = useDispatch();
  const [selectedProcessors, setSelectedProcessors] = useState(selectedInitialProcessors.map((p) => getProcessorId(p)).filter((id) => id != null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const hasInitialized = useRef(false); // Track if we've already initialized

  useEffect(() => {
    setSelectedProcessors(selectedInitialProcessors.map((p) => getProcessorId(p)).filter((id) => id != null));
  }, [selectedInitialProcessors, open]);

  // Fetch processors only when dialog opens and only once
  useEffect(() => {
    if (open && !hasInitialized.current) {
      refreshProcessors();
      hasInitialized.current = true;
    }
    
    // Reset the flag when dialog closes
    if (!open) {
      hasInitialized.current = false;
    }
  }, [open]);

  const handleToggle = (processorId) => {
    const pid = getProcessorId(processorId);
    setSelectedProcessors((prevSelected) =>
      prevSelected.some((id) => processorIdsEqual(id, pid))
        ? prevSelected.filter((id) => !processorIdsEqual(id, pid))
        : [...prevSelected, pid]
    );
  };

  const refreshProcessors = async () => {
    setRefreshing(true);
    setError('');
    try {
      await dispatch(fetchProcessors()).unwrap();
      
      if (onRefreshProcessors) {
        await onRefreshProcessors();
      }
      setError(''); // clear error if successful
    } catch (err) {
      setError('Failed to load processors. Please check the connection and retry.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    try {
      const processorsToAdd = availableProcessors.filter((processor) => selectedProcessors.some((id) => processorIdsEqual(id, processor)));
      await onAddProcessors(processorsToAdd);
      
      // Don't refresh processors immediately after adding
      // setTimeout(async () => {
      //   await refreshProcessors();
      // }, 1000);
      
      onClose();
    } catch (err) {
      setError('Failed to add processors.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e, processorId) => {
    const file = e.target.files[0];
    if (file) {
      onProcessorCsvUpload(processorId, file); // Parent handles upload and area ID storage
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.custom.containerBg,
          borderRadius: '10px',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Select Processors
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={refreshProcessors} 
            disabled={refreshing}
            size="small"
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary }
            }}
          >
            {refreshing ? (
              <CircularProgress size={16} />
            ) : (
              <Box
                component="span"
                sx={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${theme.palette.text.secondary}`,
                  borderTop: `2px solid transparent`,
                  borderRadius: '50%',
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            )}
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon sx={{ color: theme.palette.text.secondary }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2, pb: 0 }}>
        {refreshing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
              <CircularProgress />
            </Box>
        ) : error ? (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography color="error">{toSafeReactText(error)}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={refreshProcessors}
              disabled={refreshing}
            >
              Retry
            </Button>
          </Box>
        ) : availableProcessors.length === 0 ? (
          <Typography sx={{ color: theme.palette.text.secondary }}>No processors available.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {availableProcessors.map((processor) => (
              <Box key={processor.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedProcessors.some((id) => processorIdsEqual(id, processor))}
                      onChange={() => handleToggle(getProcessorId(processor))}
                      disabled={refreshing}
                    />
                  }
                  label={processor.name}
                  sx={{ color: theme.palette.text.primary }}
                />
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => handleCsvUpload(e, getProcessorId(processor))}
                />
              </Box>
            ))}
          </Box>
          )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading || refreshing}
          variant="outlined"
          sx={{
            mr: 1,
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1,
            backgroundColor: '#fff',
            color: '#1565C0',
            borderColor: '#1565C0',
            '&:hover': { borderColor: '#0d47a1', backgroundColor: 'rgba(21, 101, 192, 0.06)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={loading || refreshing}
          sx={{
            backgroundColor: isDefaultWhiteTheme ? '#1565C0' : theme.palette.custom.buttonBg,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: isDefaultWhiteTheme ? '#0d47a1' : theme.palette.custom.buttonBg,
            },
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            py: 1,
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 