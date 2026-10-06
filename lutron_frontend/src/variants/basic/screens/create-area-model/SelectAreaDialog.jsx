import React, { useEffect, useState } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, FormControl, Select, MenuItem,
  Checkbox, Button, Typography, Collapse, IconButton,
  DialogContentText, DialogActions
} from '@mui/material';
import {
  AddBoxOutlined, IndeterminateCheckBoxOutlined,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFloors, selectFloors, getLeafByFloorID, fetchLeafDataByID
} from "../../redux/slice/floor/floorSlice";
import {selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { UseAuth } from '../../customhooks/UseAuth';
import { DEFAULT_APP_CONTENT, isWhiteAreaPickerChrome, onContentColors } from '../../utils/themeOnSurface';
import {
  dispatchFetchFloorsOnce,
} from '../../../../shared/utils/bootstrapFetchGuards';

const SelectAreaDialog = ({ open, onClose, onAdd }) => {
  const dispatch = useDispatch();
  const floors = useSelector(selectFloors);
  const leafs = useSelector(fetchLeafDataByID) || {};
  const tree = leafs?.tree || [];
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
  const whiteChrome = isWhiteAreaPickerChrome(contentColor);
  const actionBlue = whiteChrome ? '#1565C0' : buttonColor;
  const onContent = onContentColors(contentColor);
  
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

  // Keep as number|'' so MUI Select value matches MenuItem value={floor.id}.
  const [selectedFloor, setSelectedFloor] = useState('');
  const [explicitlySelectedNodeCodes, setExplicitlySelectedNodeCodes] = useState(new Set());
  const [expanded, setExpanded] = useState({});
  
  // Add confirmation dialog states
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const [areaToRemove, setAreaToRemove] = useState(null);

  // Only track selected area codes (parents and leaves)
  const [selectedAreaCodes, setSelectedAreaCodes] = useState([]);

  const resetPickerState = () => {
    setSelectedFloor('');
    setSelectedAreaCodes([]);
    setExpanded({});
    setExplicitlySelectedNodeCodes(new Set());
    setShowRemoveDialog(false);
    setShowDoneDialog(false);
    setAreaToRemove(null);
  };

  // Closing must not restore the previous floor/checks on reopen (dialog stays mounted).
  useEffect(() => {
    if (!open) resetPickerState();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    dispatchFetchFloorsOnce(
      dispatch,
      fetchFloors,
      Array.isArray(floors) && floors.length > 0
    );
  }, [dispatch, open, floors]);

  // Auto-select first available floor only when the dialog is open
  useEffect(() => {
    if (!open) return;
    const availableFloors = getAvailableFloors();
    if (availableFloors && availableFloors.length > 0 && selectedFloor === '') {
      setSelectedFloor(Number(availableFloors[0].id));
    }
  }, [open, floors, currentUserRole, userProfile, selectedFloor]);

  // Always load tree for the selected floor (shared leafData is a single slot; once-guard
  // would leave a stale tree when switching e.g. Terrace → 1st Floor).
  useEffect(() => {
    if (!open || selectedFloor === '') return;
    dispatch(getLeafByFloorID(selectedFloor));
  }, [dispatch, open, selectedFloor]);

  // Drop checks when the floor changes so codes from another floor cannot stick.
  useEffect(() => {
    setSelectedAreaCodes([]);
    setExpanded({});
  }, [selectedFloor]);

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

  // Toggle selection for a node (parent or leaf) - select ALL descendants
  const toggleArea = (area) => {
    if (!area) return;
    const codesToToggle = getAllAreaCodes(area).filter(
      (code) => code != null && code !== ''
    );
    if (!codesToToggle.length) return;
    const allSelected = codesToToggle.every(code => selectedAreaCodes.includes(code));
    if (allSelected) {
      // Deselect the node and ALL its descendants
      setSelectedAreaCodes(prev => prev.filter(code => !codesToToggle.includes(code)));
    } else {
      // Select the node and ALL its descendants (add those not already selected)
      setSelectedAreaCodes(prev => [...new Set([...prev, ...codesToToggle])]);
    }
  };

  // Check if this node itself is selected
  const isChecked = (area) => selectedAreaCodes.includes(area.area_code);

  // Show indeterminate if some but not all descendants are selected
  const isIndeterminate = (area) => {
    const allCodes = getAllAreaCodes(area);
    const selectedCodes = allCodes.filter(code => selectedAreaCodes.includes(code));
    return selectedCodes.length > 0 && selectedCodes.length < allCodes.length;
  };

  // Helper to get full path for an area node
  const getAreaPath = (area, tree, path = []) => {
    if (!area || !tree) return path;
    for (const node of tree) {
      if (node.area_code === area.area_code) {
        return [...path, node.name];
      }
      if (node.children) {
        const childPath = getAreaPath(area, node.children, [...path, node.name]);
        if (childPath.length > path.length) return childPath;
      }
    }
    return path;
  };

  // Remove a selected area
  const handleRemoveSelectedArea = (area_code) => {
    // Set the area to remove and show confirmation dialog
    setAreaToRemove(area_code);
    setShowRemoveDialog(true);
  };

  const confirmRemoveArea = () => {
    if (!areaToRemove) return;
    
    setSelectedAreaCodes((prev) => prev.filter(code => code !== areaToRemove));
    
    // Close dialog and reset state
    setShowRemoveDialog(false);
    setAreaToRemove(null);
  };

  // Only return selected leaf nodes on Done
  const handleDone = () => {
    if (selectedAreaCodes.length === 0) {
      resetPickerState();
      onClose();
      return;
    }
    
    // Show confirmation dialog before proceeding
    setShowDoneDialog(true);
  };

  // Helper to find all nodes in tree recursively
  const findAllNodes = (nodes) => {
    let result = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(findAllNodes(node.children));
      }
    });
    return result;
  };

  const confirmDone = () => {
    const selectedFloorName = floors.find(f => f.id === parseInt(selectedFloor))?.floor_name || '';
    
    // Find all nodes in the tree
    const allNodes = findAllNodes(tree || []);
    
    // Find nodes that are directly selected (their area_code is in selectedAreaCodes)
    const directlySelectedNodes = allNodes.filter(node => 
      node.area_code != null && selectedAreaCodes.includes(node.area_code)
    );
    
    // Collect all valid areas
    const uniqueAreasMap = new Map();
    
    directlySelectedNodes.forEach(selectedNode => {
      // If this node has an area_id, include it
      if (selectedNode.area_id != null && selectedNode.area_id !== undefined && selectedNode.area_id !== '' && selectedNode.area_id !== 0) {
        uniqueAreasMap.set(selectedNode.area_id, selectedNode);
      }
      
      // Get all leaf descendants of this node
      const leafNodes = getAllLeafNodes(selectedNode);
      leafNodes.forEach(leaf => {
        if (leaf.area_id != null && leaf.area_id !== undefined && leaf.area_id !== '' && leaf.area_id !== 0) {
          uniqueAreasMap.set(leaf.area_id, leaf);
        }
      });
    });
    
    const validAreas = Array.from(uniqueAreasMap.values());
    
    if (validAreas.length > 0) {
      onAdd({
        floorId: parseInt(selectedFloor),
        floorName: selectedFloorName,
        areaCodes: validAreas.map(area => area.area_code),
        areaNames: validAreas.map(area => area.name),
        areaIds: validAreas.map(area => area.area_id)
      });
    } else {
      console.error('No valid areas found to add.');
      console.error('Selected area codes count:', selectedAreaCodes.length);
      console.error('Sample selected codes:', selectedAreaCodes.slice(0, 10));
      console.error('Directly selected nodes count:', directlySelectedNodes.length);
      if (directlySelectedNodes.length > 0) {
        console.error('Sample directly selected nodes:', directlySelectedNodes.slice(0, 5).map(n => ({
          name: n.name,
          area_code: n.area_code,
          area_id: n.area_id,
          has_children: !!(n.children && n.children.length > 0),
          children_count: n.children ? n.children.length : 0
        })));
        
        // Check leaf nodes from first selected node
        if (directlySelectedNodes[0]) {
          const sampleLeafNodes = getAllLeafNodes(directlySelectedNodes[0]);
          console.error('Sample leaf nodes from first selected:', sampleLeafNodes.slice(0, 5).map(l => ({
            name: l.name,
            area_code: l.area_code,
            area_id: l.area_id
          })));
        }
      }
    }
    
    setSelectedAreaCodes([]);
    setSelectedFloor('');
    setExpanded({});
    setShowDoneDialog(false);
    onClose();
  };

  const toggleExpand = (code) => {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const renderAreaTree = (nodes, level = 0) => {
    return nodes.map((area) => {
      const hasChildren = area.children && area.children.length > 0;
      const isExpanded = expanded[area.area_code] || false;

      return (
        <Box key={area.area_code} sx={{ ml: level * 2, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
            <Checkbox
              checked={isChecked(area)}
              indeterminate={isIndeterminate(area)}
              onChange={() => toggleArea(area)}
              size="small"
              sx={{
                backgroundColor: '#fff',
                borderRadius: '4px',
                p: 0.5,
                mr: 1,
                '& .MuiSvgIcon-root': {
                  fontSize: 16,
                },
              }}
            />
            <Typography variant="body2" sx={{ 
              flexGrow: 1, 
              fontSize: '14px', 
              lineHeight: '1.4',
              color: '#000000',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: area.name && area.name.length > 40 ? '40ch' : 'none'
            }}>
              {area.name}
            </Typography>
            {hasChildren && (
              <IconButton 
                size="small" 
                onClick={() => toggleExpand(area.area_code)}
                sx={{ 
                  p: 0.5,
                  backgroundColor: actionBlue,
                  '&:hover': { backgroundColor: '#0d47a1' },
                }}
              >
                {isExpanded ? (
                  <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: '#fff', fontSize: '18px' }} />
                ) : (
                  <AddBoxOutlined fontSize="small" sx={{ color: '#fff', fontSize: '18px' }} />
                )}
              </IconButton>
            )}
          </Box>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {renderAreaTree(area.children, level + 1)}
            </Collapse>
          )}
        </Box>
      );
    });
  };
  

  return (
    <Dialog 
      open={open} 
      onClose={() => {
        resetPickerState();
        onClose();
      }}
      maxWidth="md"
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
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        } 
      }}
    >
      <Box sx={{ 
        backgroundColor: whiteChrome ? '#ffffff' : contentColor,
        border: whiteChrome ? '1px solid #e5e7eb' : 'none',
        borderRadius: whiteChrome ? '12px' : 1,
        boxShadow: whiteChrome ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
        p: 2, 
        width: 600,
        maxWidth: '90vw',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <DialogTitle sx={{ fontSize: 16, flexShrink: 0, color: whiteChrome ? '#000000' : onContent.primary }}>Select Area</DialogTitle>
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
              value={selectedFloor === '' ? '' : selectedFloor}
              displayEmpty
              onChange={(e) => {
                const next = e.target.value;
                setSelectedFloor(next === '' ? '' : Number(next));
              }}
              sx={whiteChrome ? {
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '10px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9ca3af' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: '1px', borderColor: '#64748b' },
                '& .MuiSvgIcon-root': { color: '#1565C0' },
              } : {}}
              MenuProps={{ 
                PaperProps: { 
                  sx: { 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '10px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    ...(whiteChrome ? {
                      border: '1px solid #d1d5db',
                      '& .MuiMenuItem-root': { color: '#000000' },
                      '& .MuiMenuItem-root.Mui-selected': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        color: '#000000',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.12)' },
                      },
                    } : {}),
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
                <MenuItem key={floor.id} value={Number(floor.id)}>
                  {floor.floor_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedFloor && Array.isArray(tree) && (
            <Box sx={{ 
              border: whiteChrome ? '1px solid #d1d5db' : '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: whiteChrome ? '#ffffff' : '#f9f9f9',
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              maxHeight: '300px',
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
              {renderAreaTree(tree)}
            </Box>
          )}

          <Box sx={{ mt: 2, textAlign: 'right', flexShrink: 0 }}>
            <Button
              onClick={handleDone}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: actionBlue,
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#0d47a1',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#bdbdbd',
                  color: 'rgba(255,255,255,0.9)',
                  opacity: 1,
                },
              }}
              disabled={selectedAreaCodes.length === 0}
            >
              Add
            </Button>
          </Box>
        </DialogContent>
      </Box>

      {/* Remove Area Confirmation Dialog */}
      <Dialog
        open={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setAreaToRemove(null);
        }}
        aria-labelledby="remove-area-dialog-title"
        aria-describedby="remove-area-dialog-description"
      >
        <DialogTitle id="remove-area-dialog-title" sx={{ fontWeight: 'bold', color: '#fff' }}>
          Remove Area
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-area-dialog-description">
            Are you sure you want to remove this area from selection?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => {
              setShowRemoveDialog(false);
              setAreaToRemove(null);
            }}
            variant="outlined"
            sx={{ 
              borderColor: '#666', 
              color: '#666',
              '&:hover': { borderColor: '#333', color: '#333' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRemoveArea}
            variant="contained"
            sx={{ 
              backgroundColor: '#d32f2f', 
              color: '#fff',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Done Confirmation Dialog */}
      <Dialog
        open={showDoneDialog}
        onClose={() => setShowDoneDialog(false)}
        aria-labelledby="done-dialog-title"
        aria-describedby="done-dialog-description"
      >
        <DialogTitle id="done-dialog-title" sx={{ fontWeight: 'bold', color: '#000000' }}>
          Add Selected Areas
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="done-dialog-description">
            Are you sure you want to add the selected areas to the group?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setShowDoneDialog(false)}
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              backgroundColor: '#fff',
              borderColor: '#1565C0', 
              color: '#1565C0',
              '&:hover': { borderColor: '#0d47a1', backgroundColor: 'rgba(21, 101, 192, 0.06)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDone}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              backgroundColor: actionBlue, 
              color: '#fff',
              '&:hover': { backgroundColor: '#0d47a1' }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};


export default SelectAreaDialog;