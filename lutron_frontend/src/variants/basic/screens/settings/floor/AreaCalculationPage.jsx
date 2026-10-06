import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import { useSelector, useDispatch } from 'react-redux';
import { fetchFloors, fetchSingleFloor, calculateAreaWithReferenceLength, fetchExistingCalculatedAreas } from '../../../redux/slice/floor/floorSlice';
import { fetchFloorMapData, fetchAreaOccupancyStatus, fetchAreaEnergyConsumption } from '../../../redux/slice/settingsslice/heatmap/HeatmapSlice';
import { BASIC_FLOOR_PATH } from '../../../utils/basicSettingsPaths';
import { MdArrowBack } from 'react-icons/md';
import { Document, Page } from "react-pdf";
import { configurePdfJsWorker, buildPdfDocumentFile } from '../../../../../shared/pdf/floorPlanPdf';
import { getPolygonRings, flattenAreaCoords, resolveFloorPlanPageDims } from '../../../utils/floorplanCoordinates';

configurePdfJsWorker();

export default function AreaCalculationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { floorId } = useParams();
  const dispatch = useDispatch();

  // Add responsive breakpoints
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const floors = useSelector((state) => state.floor.floors);
  const floorStatus = useSelector((state) => state.floor.status);
  const singleFloor = useSelector((state) => state.floor.singleFloor);
  const heatmapData = useSelector((state) => state.heatmap.heatmapData);
  const heatmapLoading = useSelector((state) => state.heatmap.loading);
  const pdfUrl = useSelector((state) => state.heatmap.pdfUrl);
  const pdfFile = useMemo(() => buildPdfDocumentFile(pdfUrl), [pdfUrl]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [scale, setScale] = useState(1);
  const [pageDims, setPageDims] = useState({ width: 800, height: 600 });
  const [hasFit, setHasFit] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState('');
  const [edgeLength, setEdgeLength] = useState('');
  const [lengthUnit, setLengthUnit] = useState('meters');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResults, setCalculationResults] = useState(() => {
    // Try to load calculation results from localStorage on component mount
    const savedResults = localStorage.getItem(`area_calculation_${floorId}`);
    return savedResults ? JSON.parse(savedResults) : null;
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const containerRef = useRef();

  useEffect(() => {
    // if (floorStatus === 'idle') {
    dispatch(fetchFloors());
    // }
  }, [dispatch]);

  useEffect(() => {
    if (floors.length > 0 && floorId) {
      const floor = floors.find(f => f.id === parseInt(floorId));
      setSelectedFloor(floor);

      // Fetch single floor details and heatmap data
      if (floor) {
        dispatch(fetchSingleFloor(floor.id));
        dispatch(fetchFloorMapData({ floorId: floor.id }));
      }
    }
  }, [floors, floorId, dispatch]);

  // Check if areas are already calculated when heatmap data loads
  useEffect(() => {
    if (heatmapData?.areas && heatmapData.areas.length > 0 && selectedFloor) {
      // Fetch existing calculated areas for this floor
      loadExistingCalculatedAreas();
    }
  }, [heatmapData, selectedFloor]);

  const loadExistingCalculatedAreas = async () => {
    try {
      const result = await dispatch(fetchExistingCalculatedAreas(selectedFloor.id)).unwrap();

      if (result.status === 'success' && result.calculated_areas && result.calculated_areas.length > 0) {
        // Set the existing calculated areas
        setCalculationResults({
          status: 'success',
          updated_areas: result.calculated_areas
        });
      }
    } catch (error) {

      // Fallback: Check if areas in heatmap data already have calculated sizes
      const areasWithCalculatedSizes = heatmapData?.areas?.filter(area =>
        area.area_size || area.area_sqm || area.area_size_feet || area.area_sqft
      );

      if (areasWithCalculatedSizes && areasWithCalculatedSizes.length > 0) {
        const mockResults = {
          status: 'success',
          updated_areas: areasWithCalculatedSizes.map(area => ({
            area_id: area.area_id || area.id,
            area_sqm: area.area_size || area.area_sqm,
            area_sqft: area.area_size_feet || area.area_sqft
          }))
        };
        setCalculationResults(mockResults);
      }
    }
  };

  const getLightStatusColor = (status) => {
    const lightStatus = (status || '').toLowerCase().trim();
    if (lightStatus === 'on') return '#ffcc00'; // Yellow for lights on
    if (lightStatus === 'off') return '#95,95,95'; // Gray for lights off
    return '#e0e0e0'; // Default light gray
  };

  const getOccupancyStatusColor = (status) => {
    const occupancyStatus = (status || '').toLowerCase().trim();
    if (occupancyStatus === 'occupied') return '#00cc66'; // Green for occupied
    if (occupancyStatus === 'unoccupied') return '#95,95,95'; // Gray for unoccupied
    return '#e0e0e0'; // Default light gray
  };

  const handleFit = () => {
    if (!containerRef.current || !pageDims.width || !pageDims.height) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / pageDims.width;
    const scaleY = containerHeight / pageDims.height;
    const fitScale = Math.min(scaleX, scaleY);

    setScale(fitScale);
    setHasFit(true);
  };

  const handleAreaClick = (area, coords) => {
    setSelectedArea(area);
    setSelectedEdge('');
  };

  const getEdgeLabel = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

  const getSelectedEdgeCoordinates = () => {
    if (!selectedArea || !selectedEdge) return null;

    const rings = getPolygonRings(selectedArea);
    const coords = rings[0] || []; // Use first ring for reference edge selection

    // Extract edge index from "AB", "BC", "CD", etc.
    const firstVertex = selectedEdge.charAt(0);
    const secondVertex = selectedEdge.charAt(1);
    const edgeIndex = firstVertex.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
    const nextIndex = secondVertex.charCodeAt(0) - 65; // B=1, C=2, D=3, etc.

    if (edgeIndex >= coords.length || nextIndex >= coords.length) return null;
    return {
      first_point: { x: coords[edgeIndex].x, y: coords[edgeIndex].y },
      second_point: { x: coords[nextIndex].x, y: coords[nextIndex].y }
    };
  };

  const handleCalculateArea = async () => {
    if (!selectedArea || !selectedEdge || !edgeLength || parseFloat(edgeLength) <= 0) {
      setSnackbar({
        open: true,
        message: 'Please select an edge and enter a valid length greater than 0',
        severity: 'error'
      });
      return;
    }

    const edgeCoords = getSelectedEdgeCoordinates();
    if (!edgeCoords) {
      setSnackbar({
        open: true,
        message: 'Invalid edge coordinates',
        severity: 'error'
      });
      return;
    }

    setIsCalculating(true);
    try {
      const payload = {
        first_point: edgeCoords.first_point,
        second_point: edgeCoords.second_point,
        floor_id: selectedFloor.id,
        length_in_meters: lengthUnit === 'meters' ? parseFloat(edgeLength) : null,
        length_in_feet: lengthUnit === 'feet' ? parseFloat(edgeLength) : null
      };

      const result = await dispatch(calculateAreaWithReferenceLength(payload)).unwrap();

      if (result.status === 'success') {
        setCalculationResults(result);
        // Save calculation results to localStorage for persistence
        localStorage.setItem(`area_calculation_${selectedFloor.id}`, JSON.stringify(result));
        setSnackbar({
          open: true,
          message: `Area calculation completed! Updated ${result.updated_areas?.length || 0} areas.`,
          severity: 'success'
        });
        // Reset form
        setEdgeLength('');
        setSelectedEdge('');
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Area calculation failed',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error calculating area. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setSelectedEdge('');
    setEdgeLength('');
    setLengthUnit('meters');
    setCalculationResults(null);
    // Clear localStorage when resetting
    localStorage.removeItem(`area_calculation_${selectedFloor.id}`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (floorStatus === 'loading' || heatmapLoading || !singleFloor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedFloor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Floor not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MdArrowBack />}
          onClick={() => navigate(BASIC_FLOOR_PATH)}
          sx={{
            borderColor: theme.palette.text.secondary,
            color: theme.palette.text.secondary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              color: theme.palette.text.primary,
            }
          }}
        >

        </Button>
        <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
          Area Calculation - {selectedFloor.floor_name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Heatmap Section - Left Side */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              height: '600px',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,
              boxShadow: 2,
            }}
          >
            <Typography variant="h6" sx={{ p: 2, color: theme.palette.text.primary, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              Select an Area here
            </Typography>
            {/* Debug info */}
            <Box sx={{ p: 1, backgroundColor: '#f0f0f0', fontSize: '10px' }}>
              Areas: {heatmapData?.areas?.length || 0} |
              PDF: {pdfUrl ? 'Loaded' : 'Not loaded'} |
              Page: {pageDims.width}x{pageDims.height}
            </Box>


            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: '10px',
              }}
            >
              {pdfUrl ? (
                <Box
                  sx={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {(() => {
                    const urlLower = pdfUrl.toLowerCase();
                    const isImage = urlLower.endsWith(".png") || urlLower.endsWith(".jpg") || 
                                    urlLower.endsWith(".jpeg") || urlLower.endsWith(".svg") ||
                                    urlLower.includes("image");
                    
                    if (isImage) {
                      return (
                        <img
                          src={pdfUrl}
                          alt="Floor Plan"
                          style={{
                            width: pageDims.width,
                            height: pageDims.height,
                            display: "block",
                          }}
                          onLoad={(e) => {
                            const img = e.target;
                            setPageDims({ width: img.naturalWidth, height: img.naturalHeight });
                            if (!hasFit) {
                              setTimeout(() => handleFit(), 100);
                            }
                          }}
                        />
                      );
                    }

                    return (
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
                    );
                  })()}

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

                      // Check if this area has calculated size
                      const calculatedArea = calculationResults?.updated_areas?.find(a => a.area_id === area.area_id);
                      const hasCalculatedSize = calculatedArea && (calculatedArea.area_size || calculatedArea.area_sqm);

                      // Determine fill color based on selection only
                      let fillColor = "rgba(255, 0, 0, 0.2)"; // Default red
                      let strokeColor = "rgba(255, 0, 0, 0.8)";

                      if (selectedArea?.area_id === area.area_id) {
                        fillColor = "rgba(0, 255, 0, 0.3)"; // Selected green
                        strokeColor = "rgba(0, 255, 0, 0.8)";
                      }

                      return (
                        <g key={index}>
                          {rings.map((ring, ri) => (
                            <polygon
                              key={ri}
                              points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={selectedArea?.area_id === area.area_id ? "3" : "2"}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleAreaClick(area, flattenAreaCoords(area))}
                            />
                          ))}
                          {/* Area Name and Size */}
                          {allCoords.length > 0 && (
                            <g>
                              <text
                                x={allCoords.reduce((sum, p) => sum + p.x, 0) / allCoords.length}
                                y={allCoords.reduce((sum, p) => sum + p.y, 0) / allCoords.length - 10}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="12"
                                fill="#000"
                                fontWeight="bold"
                              >
                                {area.name || area.area_name}
                              </text>
                              {/* Always show area size if calculated, otherwise show "Not calculated" */}
                              <text
                                x={allCoords.reduce((sum, p) => sum + p.x, 0) / allCoords.length}
                                y={allCoords.reduce((sum, p) => sum + p.y, 0) / allCoords.length + 10}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={hasCalculatedSize ? "18" : "10"}
                                fill={hasCalculatedSize ? "#000" : "#666"}
                                fontWeight="bold"
                              >
                                {hasCalculatedSize ? `${(calculatedArea.area_size || calculatedArea.area_sqm).toFixed(2)} m²` : "Not calculated"}
                              </text>
                            </g>
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

        {/* Right Side Section */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{
            height: '600px',
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            boxShadow: 2,
            p: 3
          }}>


            {calculationResults ? (
              // Show success message and calculated data after calculation
              <Box>
                <Box sx={{ p: 2, backgroundColor: '#e8f5e8', borderRadius: 1, border: '1px solid #4caf50', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2e7d32', textAlign: 'center', mb: 1 }}>
                    ✓ Area Calculation Completed!
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2e7d32', textAlign: 'center' }}>
                    Successfully calculated {calculationResults.updated_areas?.length || 0} areas
                  </Typography>
                </Box>

                {/* All Areas Results */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                    Calculated Areas:
                  </Typography>
                  <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {(heatmapData?.areas || []).map((area, index) => {
                      const calculatedArea = calculationResults?.updated_areas?.find(a => a.area_id === area.area_id);
                      const hasCalculatedSize = calculatedArea && (calculatedArea.area_size || calculatedArea.area_sqm);

                      return (
                        <Box key={index} sx={{
                          p: 1.5,
                          mb: 1,
                          backgroundColor: hasCalculatedSize ? '#e8f5e8' : '#f5f5f5',
                          borderRadius: 1,
                          border: `1px solid ${hasCalculatedSize ? '#4caf50' : '#ddd'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: hasCalculatedSize ? '#2e7d32' : '#666' }}>
                              {area.name || area.area_name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                              {hasCalculatedSize ? 'Calculated' : 'Not calculated'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: hasCalculatedSize ? '#2e7d32' : '#999' }}>
                              {hasCalculatedSize ? `${(calculatedArea.area_size || calculatedArea.area_sqm).toFixed(2)} m²` : '---'}
                            </Typography>
                            {hasCalculatedSize && (calculatedArea.area_size_feet || calculatedArea.area_sqft) && (
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                                {(calculatedArea.area_size_feet || calculatedArea.area_sqft).toFixed(2)} ft²
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Summary */}
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f0f8ff', borderRadius: 1, border: '1px solid #2196f3' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
                      Calculation Summary
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
                      Reference edge used for calculation
                    </Typography>
                    {calculationResults.reference_edge && (
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
                        Length: {calculationResults.reference_edge.length} {calculationResults.reference_edge.unit}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : selectedArea ? (
              // Show area selection interface before calculation
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                  Selected Area: {selectedArea.area_name || selectedArea.name}
                </Typography>

                {/* Area Visualization */}
                <Box sx={{ mb: 3, p: 1, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                    Area Polygon:
                  </Typography>
                  <svg width="100%" height="150" style={{ display: 'block', marginLeft: '10%' }}>
                    {(() => {
                      const rings = getPolygonRings(selectedArea);
                      const firstRing = rings[0];
                      if (!firstRing || firstRing.length === 0) return null;

                      const allCoords = rings.flat();
                      const minX = Math.min(...allCoords.map(c => c.x));
                      const maxX = Math.max(...allCoords.map(c => c.x));
                      const minY = Math.min(...allCoords.map(c => c.y));
                      const maxY = Math.max(...allCoords.map(c => c.y));

                      const width = Math.max(maxX - minX, 1);
                      const height = Math.max(maxY - minY, 1);

                      // Scale to fit in 150x150 viewport with padding and center
                      const scale = Math.min(100 / width, 100 / height);
                      const offsetX = (150 - width * scale) / 2;
                      const offsetY = (150 - height * scale) / 2;

                      // Transform coordinates for first ring (for vertex labels/edge selection)
                      const transformedCoords = firstRing.map(coord => ({
                        x: (coord.x - minX) * scale + offsetX,
                        y: (coord.y - minY) * scale + offsetY
                      }));

                      return (
                        <g>
                          {rings.map((ring, ri) => {
                            const tr = ring.map(coord => ({
                              x: (coord.x - minX) * scale + offsetX,
                              y: (coord.y - minY) * scale + offsetY
                            }));
                            const points = tr.map(p => `${p.x},${p.y}`).join(' ');
                            return (
                              <polygon
                                key={ri}
                                points={points}
                                fill="rgba(0, 255, 0, 0.3)"
                                stroke="rgba(0, 255, 0, 1)"
                                strokeWidth="3"
                              />
                            );
                          })}

                          {/* Vertex Labels (A, B, C, D) - for first ring only, used for edge selection */}
                          {transformedCoords.map((coord, coordIndex) => {
                            // Simple positioning based on vertex position relative to polygon center
                            const centerX = transformedCoords.reduce((sum, c) => sum + c.x, 0) / transformedCoords.length;
                            const centerY = transformedCoords.reduce((sum, c) => sum + c.y, 0) / transformedCoords.length;

                            // Calculate direction from center to vertex
                            const dx = coord.x - centerX;
                            const dy = coord.y - centerY;

                            // Normalize the direction
                            const length = Math.sqrt(dx * dx + dy * dy);
                            const dirX = dx / length;
                            const dirY = dy / length;

                            // Position label outside the polygon
                            const labelOffset = 25;
                            const labelX = coord.x + dirX * labelOffset;
                            const labelY = coord.y + dirY * labelOffset;

                            return (
                              <g key={`vertex-${coordIndex}`}>
                                <text
                                  x={labelX}
                                  y={labelY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="14"
                                  fill="#000"
                                  fontWeight="bold"
                                >
                                  {String.fromCharCode(65 + coordIndex)}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                </Box>

                {/* Edge Selection Dropdown */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                    Select Edge to Update:
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedEdge}
                      onChange={(e) => setSelectedEdge(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select an edge...</em>
                      </MenuItem>
                      {(() => {
                        const rings = getPolygonRings(selectedArea);
                        const coords = rings[0] || [];
                        return coords.map((coord, index) => {
                          const nextCoord = coords[(index + 1) % coords.length];
                          const edgeLabel = `${String.fromCharCode(65 + index)}${String.fromCharCode(65 + ((index + 1) % coords.length))}`;
                          return (
                            <MenuItem key={index} value={edgeLabel}>
                              {edgeLabel} - ({coord.x?.toFixed(2)}, {coord.y?.toFixed(2)}) to ({nextCoord?.x?.toFixed(2)}, {nextCoord?.y?.toFixed(2)})
                            </MenuItem>
                          );
                        });
                      })()}
                    </Select>
                  </FormControl>
                </Box>

                {selectedEdge && (
                  <Box sx={{ mt: 2 }}>
                    {/* Edge Length Input */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                        Enter Edge Length:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <TextField
                          type="number"
                          value={edgeLength}
                          onChange={(e) => setEdgeLength(e.target.value)}
                          size="small"
                          sx={{ flexGrow: 1 }}
                          placeholder="Enter length"
                          inputProps={{
                            min: 0,
                            step: 0.01,
                            style: { fontSize: '14px' }
                          }}
                        />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={lengthUnit}
                            onChange={(e) => setLengthUnit(e.target.value)}
                            label="Unit"
                          >
                            <MenuItem value="meters">Meters</MenuItem>
                            <MenuItem value="feet">Feet</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleCalculateArea}
                        disabled={isCalculating || !edgeLength || parseFloat(edgeLength) <= 0}
                        sx={{ flexGrow: 1 }}
                      >
                        {isCalculating ? <CircularProgress size={20} /> : 'Calculate Area'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReset}
                        disabled={isCalculating}
                      >
                        Reset
                      </Button>
                    </Box>

                    {/* Edge Information */}
                    {selectedEdge && edgeLength && (
                      <Box sx={{ p: 2, backgroundColor: '#f0f8ff', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Edge Information:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          • Edge: {selectedEdge}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          • Length: {edgeLength} {lengthUnit}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          • This will calculate areas for all areas on floor {selectedFloor.floor_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <Typography variant="body1" color="text.secondary">
                  Click on any area in the heatmap to select it
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
