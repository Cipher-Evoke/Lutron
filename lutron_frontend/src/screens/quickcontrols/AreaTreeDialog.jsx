// src/screens/quickcontrols/AreaTreeDialog.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, Checkbox, Button, Typography, Collapse, IconButton, FormControl, Select, MenuItem
} from '@mui/material';
import { AddBoxOutlined, IndeterminateCheckBoxOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFloors, selectFloors, getLeafByFloorID } from "../../redux/slice/floor/floorSlice";
import { UseAuth } from '../../customhooks/UseAuth';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';

const AreaTreeDialog = ({ open, onClose, onAdd }) => {
  const dispatch = useDispatch();
  const floors = useSelector(selectFloors);
  const leafData = useSelector(state => state.floor.leafData); // get area tree data
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const [selectedFloor, setSelectedFloor] = useState('');
  const selectedFloorRef = React.useRef(selectedFloor);
  useEffect(() => { selectedFloorRef.current = selectedFloor; });
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [expanded, setExpanded] = useState({});

  // Get user role and profile for floor filtering
  const { role: currentUserRole } = UseAuth();
  const userProfile = useSelector((state) => state.user?.profile);

  // Function to get available floors based on user permissions
  const getAvailableFloors = () => {
    // Superadmin and Admin can see all floors
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return floors;
    }

    // For Operators, only show floors they have access to
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const operatorFloorIds = userProfile.floors.map(f => f.floor_id);
      return floors.filter(floor => operatorFloorIds.includes(floor.id));
    }

    // Default: return all floors
    return floors;
  };

  // Helper to get all area_codes under a node (including itself and ALL descendants)
  const getAllAreaCodes = (node) => {
    let codes = [node.area_code];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        codes = codes.concat(getAllAreaCodes(child));
      });
    }
    return codes;
  };

  // Helper to get all leaf nodes under a node
  const getAllLeafNodes = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(getAllLeafNodes);
  };

  // Returns the node itself and its direct children (not all descendants)
  const getNodeAndDirectChildren = (node) => {
    let codes = [node.area_code];
    if (node.children && node.children.length > 0) {
      codes = codes.concat(node.children.map(child => child.area_code));
    }
    return codes;
  };

  // Use area_code for selection tracking (parents and leaves)
  const [selectedAreaCodes, setSelectedAreaCodes] = useState([]);

  // toggleArea function - select node and all its descendants (recursive)
  const toggleArea = (area) => {

    // Get area codes from this node and all its descendants (recursive)
    const getAllAreaCodes = (node) => {
      let areaCodes = [];

      // Add this node's area_code if it exists
      if (node.area_code) {
        areaCodes.push(node.area_code);
      }

      // Add all descendants' area_codes (recursive)
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          areaCodes = areaCodes.concat(getAllAreaCodes(child));
        });
      }

      return areaCodes;
    };

    const allAreaCodes = getAllAreaCodes(area);

    if (allAreaCodes.length === 0) {
      return;
    }

    // Check if all areas from this node and its descendants are currently selected
    const allSelected = allAreaCodes.every(code => selectedAreaCodes.includes(code));

    if (allSelected) {
      // If all are selected, deselect all areas from this node and its descendants
      setSelectedAreaCodes(prev => prev.filter(code => !allAreaCodes.includes(code)));
    } else {
      // If not all are selected, select all areas from this node and its descendants
      setSelectedAreaCodes(prev => [...new Set([...prev, ...allAreaCodes])]);
    }
  };



  // isChecked function - check if this node and all its descendants are selected
  const isChecked = (area) => {
    // Get area codes from this node and all its descendants (recursive)
    const getAllAreaCodes = (node) => {
      let areaCodes = [];

      // Add this node's area_code if it exists
      if (node.area_code) {
        areaCodes.push(node.area_code);
      }

      // Add all descendants' area_codes (recursive)
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          areaCodes = areaCodes.concat(getAllAreaCodes(child));
        });
      }

      return areaCodes;
    };

    const allAreaCodes = getAllAreaCodes(area);

    if (allAreaCodes.length === 0) {
      return false;
    }

    // Check if all areas from this node and its descendants are selected
    return allAreaCodes.every(code => selectedAreaCodes.includes(code));
  };

  // isIndeterminate function - check if some but not all areas under this node are selected
  const isIndeterminate = (area) => {
    // Get area codes from this node and all its descendants (recursive)
    const getAllAreaCodes = (node) => {
      let areaCodes = [];

      // Add this node's area_code if it exists
      if (node.area_code) {
        areaCodes.push(node.area_code);
      }

      // Add all descendants' area_codes (recursive)
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          areaCodes = areaCodes.concat(getAllAreaCodes(child));
        });
      }

      return areaCodes;
    };

    const allAreaCodes = getAllAreaCodes(area);

    if (allAreaCodes.length === 0) {
      return false;
    }

    const selectedCodes = allAreaCodes.filter(code => selectedAreaCodes.includes(code));

    // Indeterminate if some but not all areas are selected
    return selectedCodes.length > 0 && selectedCodes.length < allAreaCodes.length;
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Render the area tree recursively
  const renderAreaTree = (nodes, level = 0) => {
    if (!nodes) return null;
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      // Use a more reliable nodeId - prefer area_code, fallback to area_id, then name
      const nodeId = node.area_code || node.area_id || node.name || `node-${level}-${node.name || 'unknown'}`;
      const isExpanded = expanded[nodeId] || false;
      return (
        <Box key={nodeId} sx={{ ml: level * 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={isChecked(node)}
              indeterminate={isIndeterminate(node)}
              onChange={() => toggleArea(node)}
              size="small"
              sx={{
                backgroundColor: '#fff',
                borderRadius: '4px',
                p: -0.0,
                mr: 1,
                '& .MuiSvgIcon-root': {
                  fontSize: 17,
                  color: '#000',
                },
              }}
            />
            <Typography variant="body2" sx={{
              flexGrow: 1,
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: node.name && node.name.length > 40 ? '40ch' : 'none'
            }}>
              {node.name}
            </Typography>
            {hasChildren && (
              <IconButton size="small" onClick={() => toggleExpand(nodeId)}>
                {isExpanded ? (
                  <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: buttonColor }} />
                ) : (
                  <AddBoxOutlined fontSize="small" sx={{ color: buttonColor }} />
                )}
              </IconButton>
            )}
          </Box>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box>
                {node.children.map(child => renderAreaTree([child], level + 1))}
              </Box>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  // Update handleDone to only return selected leaf nodes
  const handleDone = () => {
    const floor = getAvailableFloors().find(f => String(f.id) === String(selectedFloor));
    // Find all selected leaf nodes
    const selectedLeafAreas = (leafData?.tree || [])
      .flatMap(getAllLeafNodes)
      .filter(leaf => selectedAreaCodes.includes(leaf.area_code));
    onAdd(selectedLeafAreas.map(area => ({
      floorId: floor.id,
      floorName: floor.floor_name,
      areaId: area.area_id,
      areaName: area.name
    })));
    setSelectedAreaCodes([]);
    setExpanded({});
    onClose();
  };

  // Auto-select first available floor when floors are loaded.
  // Only reset the floor if it no longer exists in the available list — never
  // overwrite a valid selection just because the list refreshed.
  useEffect(() => {
    if (!open) return;
    const availableFloors = getAvailableFloors();
    if (!availableFloors || availableFloors.length === 0) {
      setSelectedFloor('');
      return;
    }
    const currentFloor = selectedFloorRef.current;
    const exists = availableFloors.some(f => String(f.id) === String(currentFloor));
    if (!exists) {
      setSelectedFloor(String(availableFloors[0].id));
    }
  }, [open, floors, currentUserRole, userProfile]);

  // In the useEffect for dialog open, reset selectedAreaCodes and fetch floors
  useEffect(() => {
    if (open) {
      setSelectedAreaCodes([]);
      setExpanded({});
      // Fetch floors when dialog opens
      dispatch(fetchFloors());
    }
  }, [open, dispatch]);

  // Fetch area tree when floor changes
  useEffect(() => {
    if (selectedFloor) {
      dispatchFetchLeafByFloorOnce(dispatch, getLeafByFloorID, selectedFloor, { force: true });
    }
  }, [selectedFloor, dispatch]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }
      }}
    >
      <Box sx={{
        backgroundColor: '#D2C29D',
        borderRadius: 1,
        p: 2,
        width: 600,
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <DialogTitle sx={{ fontSize: 16, flexShrink: 0 }}>Select Area</DialogTitle>
        <DialogContent sx={{
          flex: 1,
          overflow: 'hidden',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <FormControl fullWidth size="small" sx={{ mb: 2, flexShrink: 0 }}>
            <Select
              value={selectedFloor !== '' ? String(selectedFloor) : ''}
              displayEmpty
              onChange={(e) => setSelectedFloor(String(e.target.value))}
              renderValue={(selected) => {
                const availableFloors = getAvailableFloors();
                const floor = availableFloors.find(f => String(f.id) === String(selected));
                return floor ? (floor.floor_name || floor.name || '') : '';
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }
                }
              }}
            >
              {getAvailableFloors()?.map((floor) => (
                <MenuItem key={floor.id} value={String(floor.id)}>
                  {floor.floor_name || floor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Render area tree for selected floor */}
          {selectedFloor && (
            <Box sx={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '5px',
              backgroundColor: '#f9f9f9',
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              maxWidth: '100%',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}>
              {renderAreaTree(leafData?.tree)}
            </Box>
          )}
          <Box sx={{ mt: 2, textAlign: 'right', flexShrink: 0 }}>
            <Button
              onClick={handleDone}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: 'var(--app-button)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'var(--app-button)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'var(--app-button)',
                  color: 'rgba(255,255,255,0.6)',
                  opacity: 0.4,
                },
              }}
              disabled={selectedAreaCodes.length === 0}
            >
              Add
            </Button>
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
};
export default AreaTreeDialog;