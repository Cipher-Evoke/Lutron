import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Snackbar,
} from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { fetchFloors, correctCoordinates } from '../../../redux/slice/floor/floorSlice';
import { fetchFloorMapData } from '../../../redux/slice/settingsslice/heatmap/HeatmapSlice';
import { MdArrowBack, MdExpandMore } from 'react-icons/md';
import { Document, Page } from "react-pdf";
import { configurePdfJsWorker, buildPdfDocumentFile } from '../../../../../shared/pdf/floorPlanPdf';
import { createSingleFlight } from '../../../../../shared/utils/createSingleFlight';
import { getPolygonRings, flattenAreaCoords, resolveFloorPlanPageDims } from '../../../utils/floorplanCoordinates';
import { premiumSelectMenuProps } from '../Users/userSelectMenuProps';
import {
  floorToolPanelSx,
  floorToolHeadingSx,
  floorToolLabelSx,
  floorToolMutedSx,
  floorToolPageTitleSx,
  floorToolBackIconSx,
  floorToolInputLabelSx,
  floorToolSelectSx,
  floorToolTextFieldSx,
  floorToolApplyButtonSx,
} from './floorToolStyles';

configurePdfJsWorker();

export default function CorrectCoordinate() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { floorId } = useParams();

  const [selectedAction, setSelectedAction] = useState('');
  const [selectedSubAction, setSelectedSubAction] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [moveValue, setMoveValue] = useState('');
  const [scaleValue, setScaleValue] = useState('');
  const [scale, setScale] = useState(1);
  const [pageDims, setPageDims] = useState({ width: 800, height: 600 });
  const [hasFit, setHasFit] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const containerRef = useRef();

  const floors = useSelector((state) => state.floor.floors);
  const floorStatus = useSelector((state) => state.floor.status);
  const heatmapData = useSelector((state) => state.heatmap.heatmapData);
  const pdfUrl = useSelector((state) => state.heatmap.pdfUrl);
  const pdfFile = useMemo(() => buildPdfDocumentFile(pdfUrl), [pdfUrl]);
  const heatmapLoading = useSelector((state) => state.heatmap.loading);

  const currentFloor = floors.find(floor => floor.id === parseInt(floorId));

  useEffect(() => {
    // if (floorStatus === 'idle') {
    dispatch(fetchFloors());
    // }
  }, [dispatch]);

  useEffect(() => {
    if (floorId) {
      dispatch(fetchFloorMapData({ floorId: parseInt(floorId) }));
    }
  }, [dispatch, floorId]);

  const handleActionChange = (event) => {
    setSelectedAction(event.target.value);
    setSelectedSubAction(''); // Reset sub-action when main action changes
    setMoveValue('');
    setScaleValue('');
  };

  const handleSubActionChange = (event) => {
    setSelectedSubAction(event.target.value);
    setMoveValue('');
    setScaleValue('');
  };

  const runApplyOnce = useMemo(() => createSingleFlight(), []);
  const handleApplyAction = () =>
    runApplyOnce(async () => {
    if (selectedAction && selectedSubAction) {
      const payload = {
        floorId: parseInt(floorId),
        action: selectedAction,
        subAction: selectedSubAction,
        value: parseFloat(selectedAction.includes('move') ? moveValue : scaleValue),
      };


      try {
        const result = await dispatch(correctCoordinates(payload)).unwrap();

        // Show success message with details from API response
        const successMessage = result.details
          ? `Successfully applied ${result.operation} operation. ${result.affected_coordinates} coordinates affected.`
          : 'Coordinate correction applied successfully';

        setSnackbarMessage(successMessage);
        setShowSuccessSnackbar(true);

        // Refresh the floor data to show updated coordinates
        dispatch(fetchFloorMapData({ floorId: parseInt(floorId) }));

        // Reset form
        setSelectedAction('');
        setSelectedSubAction('');
        setMoveValue('');
        setScaleValue('');

      } catch (error) {

        // Fix: Convert error object to string
        let errorMessage = 'Failed to apply coordinate correction';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Handle array of validation errors
          if (Array.isArray(error)) {
            errorMessage = error.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage = error.message || error.detail || error.msg || JSON.stringify(error);
          }
        }

        setSnackbarMessage(errorMessage);
        setShowErrorSnackbar(true);
      }
    }
  });

  const handleFit = () => {
    if (!containerRef.current || !pageDims.width || !pageDims.height) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / pageDims.width;
    const scaleY = containerHeight / pageDims.height;
    const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding

    setScale(fitScale);
    setHasFit(true);
  };

  const coordinateActions = [
    {
      value: 'move-x', label: 'Move-X', subActions: [
        { value: 'pixels', label: 'Move by Pixels' },
        { value: 'percent', label: 'Move by Percent' }
      ]
    },
    {
      value: 'move-y', label: 'Move-Y', subActions: [
        { value: 'pixels', label: 'Move by Pixels' },
        { value: 'percent', label: 'Move by Percent' }
      ]
    },
    {
      value: 'scale-x', label: 'Scale-X', subActions: [
        { value: 'factor', label: 'Scale Factor' }
      ]
    },
    {
      value: 'scale-y', label: 'Scale-Y', subActions: [
        { value: 'factor', label: 'Scale Factor' }
      ]
    },
  ];

  const currentAction = coordinateActions.find(action => action.value === selectedAction);

  if (floorStatus === 'loading' || heatmapLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentFloor) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error">
          Floor not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/setting/floor')}
          sx={{ mr: 2, ...floorToolBackIconSx }}
        >
          <MdArrowBack />
        </IconButton>
        <Typography variant="h5" sx={floorToolPageTitleSx}>
          Correct Coordinate - {currentFloor.floor_name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Floor Plan */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: '600px',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {pdfUrl ? (
                <Box
                  sx={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <Document file={pdfFile} key={pdfUrl}>
                    <Page
                      pageNumber={1}
                      width={pageDims.width}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      onLoadSuccess={(page) => {
                        setPageDims(resolveFloorPlanPageDims(page, heatmapData?.areas));
                        if (!hasFit) {
                          setTimeout(() => handleFit(), 100);
                        }
                      }}
                    />
                  </Document>

                  {/* SVG Overlay for Areas */}
                  <svg
                    width={pageDims.width}
                    height={pageDims.height}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 2,
                      pointerEvents: 'auto'
                    }}
                  >
                    {(heatmapData?.areas || []).map((area, index) => {
                      const rings = getPolygonRings(area);
                      const allCoords = flattenAreaCoords(area);
                      if (!rings.length) return null;

                      return (
                        <g key={index}>
                          {rings.map((ring, ri) => (
                            <polygon
                              key={ri}
                              points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill="rgba(255, 0, 0, 0.2)"
                              stroke="rgba(255, 0, 0, 0.8)"
                              strokeWidth="2"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                // Area clicked
                              }}
                            />
                          ))}
                          {/* Area Name */}
                          {allCoords.length > 0 && (
                            <text
                              x={allCoords.reduce((sum, p) => sum + p.x, 0) / allCoords.length}
                              y={allCoords.reduce((sum, p) => sum + p.y, 0) / allCoords.length}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="12"
                              fill="#000"
                              fontWeight="bold"
                            >
                              {area.name || area.area_name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </Box>
              ) : (
                <CircularProgress />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Coordinate Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '600px', ...floorToolPanelSx }}>
            <Typography variant="h6" sx={{ mb: 3, ...floorToolHeadingSx }}>
              Coordinate Actions
            </Typography>

            {/* Main Action Dropdown */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="action-select-label" sx={floorToolInputLabelSx}>
                Select Action
              </InputLabel>
              <Select
                labelId="action-select-label"
                id="action-select"
                value={selectedAction}
                label="Select Action"
                onChange={handleActionChange}
                onOpen={() => setIsDropdownOpen(true)}
                onClose={() => setIsDropdownOpen(false)}
                IconComponent={MdExpandMore}
                MenuProps={premiumSelectMenuProps}
                sx={{
                  ...floorToolSelectSx,
                  '& .MuiSelect-icon': {
                    transition: 'transform 0.2s',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  },
                }}
              >
                {coordinateActions.map((action) => (
                  <MenuItem key={action.value} value={action.value}>
                    {action.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sub Action Dropdown */}
            {selectedAction && currentAction && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="sub-action-select-label" sx={floorToolInputLabelSx}>
                  Select Type
                </InputLabel>
                <Select
                  labelId="sub-action-select-label"
                  id="sub-action-select"
                  value={selectedSubAction}
                  label="Select Type"
                  onChange={handleSubActionChange}
                  onOpen={() => setIsSubDropdownOpen(true)}
                  onClose={() => setIsSubDropdownOpen(false)}
                  IconComponent={MdExpandMore}
                  MenuProps={premiumSelectMenuProps}
                  sx={{
                    ...floorToolSelectSx,
                    '& .MuiSelect-icon': {
                      transition: 'transform 0.2s',
                      transform: isSubDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    },
                  }}
                >
                  {currentAction.subActions.map((subAction) => (
                    <MenuItem key={subAction.value} value={subAction.value}>
                      {subAction.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Value Input Field */}
            {selectedAction && selectedSubAction && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, ...floorToolHeadingSx }}>
                  {currentAction?.label} - {currentAction?.subActions?.find(sa => sa.value === selectedSubAction)?.label}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, ...floorToolLabelSx }}>
                    {selectedAction.includes('move') ? 'Move Value:' : 'Scale Factor:'}
                  </Typography>
                  <TextField
                    type="number"
                    placeholder={selectedAction.includes('move') ? 'Enter move value' : 'Enter scale factor'}
                    value={selectedAction.includes('move') ? moveValue : scaleValue}
                    onChange={(e) => {
                      if (selectedAction.includes('move')) {
                        setMoveValue(e.target.value);
                      } else {
                        setScaleValue(e.target.value);
                      }
                    }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={floorToolTextFieldSx}
                    inputProps={{
                      step: selectedAction.includes('move') && selectedSubAction === 'percent' ? '0.1' : '1',
                      min: selectedAction.includes('move') ? undefined : '0.1',
                      max: selectedAction.includes('move') ? undefined : '10',
                    }}
                    helperText={
                      selectedAction.includes('move')
                        ? selectedSubAction === 'pixels'
                          ? 'Enter pixels to move (positive = right/down, negative = left/up)'
                          : 'Enter percentage to move (e.g., 10 = 10%)'
                        : 'Enter scale factor (e.g., 1.5 = 150% scale, 0.5 = 50% scale)'
                    }
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApplyAction}
                  disabled={!moveValue && !scaleValue}
                  sx={{ ...floorToolApplyButtonSx, py: 1.5 }}
                >
                  Apply Action
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: '#4caf50',
            color: '#fff',
            borderRadius: '12px',
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }
        }}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowErrorSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: '#f44336',
            color: '#fff',
            borderRadius: '12px',
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }
        }}
      />
    </Box>
  );
}
