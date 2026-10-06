import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, FormControl, Select, MenuItem,
  Checkbox, Button, Typography, Collapse, IconButton,
  DialogContentText, DialogActions
} from '@mui/material';
import { CARD_BACKGROUND } from '../../config/themeConstants';
import {
  AddBoxOutlined, IndeterminateCheckBoxOutlined,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFloors, selectFloors, getLeafByFloorID, fetchLeafDataByID
} from "../../redux/slice/floor/floorSlice";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { UseAuth } from '../../customhooks/UseAuth';
import { isGoldApplicationTheme, isLightSurface } from '../../utils/themeOnSurface';
import {
  getThemeButtonColor,
  usesCustomApplicationTheme,
  usesTheme4PageGradient,
} from '../../utils/themePageBackground';
import {
  dispatchFetchFloorsOnce,
} from '../../../../shared/utils/bootstrapFetchGuards';

const SelectAreaDialog = ({ open, onClose, onAdd, variant = "dark" }) => {
  const dispatch = useDispatch();
  const floors = useSelector(selectFloors);
  const leafs = useSelector(fetchLeafDataByID) || {};
  const tree = leafs?.tree || [];
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const isLightVariant = variant === "light";
  const themeBackground = appTheme?.application_theme?.background;
  const isCustomTheme = usesCustomApplicationTheme(themeBackground);
  const isTheme4Shell = usesTheme4PageGradient(themeBackground);
  const isDarkThemedPickerShell =
    isTheme4Shell || (isCustomTheme && !isLightSurface(themeBackground));
  const useLightShell =
    isLightVariant ||
    isGoldApplicationTheme(themeBackground) ||
    isTheme4Shell ||
    isCustomTheme;
  const lightDialogTitleColor = isDarkThemedPickerShell
    ? "var(--area-picker-light-dialog-title-color, #ffffff)"
    : "var(--area-picker-light-dialog-title-color, #000)";
  const lightDialogFieldTextColor =
    "var(--area-picker-light-dialog-field-text, #1c2330)";
  const lightDialogBodyTextColor = isDarkThemedPickerShell
    ? "var(--area-picker-confirm-dialog-body-text, rgba(255, 255, 255, 0.92))"
    : "var(--settings-panel-muted-text, rgba(0, 0, 0, 0.72))";

  const shellSx = useMemo(() => {
    if (!useLightShell) return { className: "select-area-premium-dialog", sx: {} };
    return {
      className: undefined,
      sx: {
        background: "var(--area-picker-light-dialog-bg, #d6dde8)",
        borderRadius: "16px",
        border: "1px solid var(--schedule-panel-border, rgba(61, 74, 92, 0.25))",
        boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
        color: lightDialogTitleColor,
      },
    };
  }, [useLightShell, lightDialogTitleColor, lightDialogFieldTextColor]);
  
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

  // Tree expand (+/−) must stay high-contrast on dark picker shells (buttonColor is often dark).
  const treeExpandIconColor = useLightShell ? lightDialogTitleColor : '#ffffff';
  const treeExpandButtonBg = isDarkThemedPickerShell
    ? 'rgba(255, 255, 255, 0.18)'
    : useLightShell
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.18)';

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
              maxWidth: area.name && area.name.length > 40 ? '40ch' : 'none',
              color: useLightShell ? lightDialogTitleColor : '#fff',
            }}>
              {area.name}
            </Typography>
            {hasChildren && (
              <IconButton 
                size="small" 
                onClick={() => toggleExpand(area.area_code)}
                aria-label={isExpanded ? 'Collapse area' : 'Expand area'}
                sx={{ 
                  p: 0.5,
                  ml: 0.5,
                  backgroundColor: treeExpandButtonBg,
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: isDarkThemedPickerShell || !useLightShell
                      ? 'rgba(255, 255, 255, 0.28)'
                      : 'rgba(0, 0, 0, 0.14)',
                  },
                }}
              >
                {isExpanded ? (
                  <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: treeExpandIconColor, fontSize: '18px' }} />
                ) : (
                  <AddBoxOutlined fontSize="small" sx={{ color: treeExpandIconColor, fontSize: '18px' }} />
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
  

  const handleOuterClose = () => {
    if (showDoneDialog) {
      setShowDoneDialog(false);
      return;
    }
    if (showRemoveDialog) {
      setShowRemoveDialog(false);
      setAreaToRemove(null);
      return;
    }
    resetPickerState();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleOuterClose}
      maxWidth="md"
      fullWidth
      disableScrollLock
      className="select-area-dialog-root"
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent',
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
      {/* Previous plain dark card - kept for quick rollback
      <Box sx={{ 
        background: CARD_BACKGROUND, 
        borderRadius: 1, 
        p: 2, 
        width: 600,
        maxWidth: '90vw',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      */}
      {!showDoneDialog && !showRemoveDialog && (
      <Box
        className={[shellSx.className, useLightShell ? 'area-picker-light-dialog' : null].filter(Boolean).join(' ') || undefined}
        sx={{
          p: 3,
          width: 600,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          ...(shellSx.sx || {}),
        }}
      >
        <DialogTitle sx={{ fontSize: 16, flexShrink: 0, color: useLightShell ? lightDialogTitleColor : '#fff' }}>Select Area</DialogTitle>
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
              sx={{
                color: useLightShell ? lightDialogFieldTextColor : '#fff',
                backgroundColor: useLightShell ? 'var(--users-input-bg, #ffffff)' : 'transparent',
                '& .MuiSelect-icon': { color: useLightShell ? lightDialogFieldTextColor : '#fff' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: useLightShell ? 'var(--users-border, rgba(0,0,0,0.25))' : 'rgba(255,255,255,0.25)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: useLightShell ? 'var(--home-tab-active-color, rgba(0,0,0,0.4))' : 'rgba(255,255,255,0.45)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: useLightShell ? 'var(--home-tab-active-color, rgba(0,0,0,0.55))' : 'rgba(255,255,255,0.65)',
                },
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
                <MenuItem key={floor.id} value={Number(floor.id)}>
                  {floor.floor_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedFloor && Array.isArray(tree) && (
            <Box
              className={useLightShell ? 'area-picker-field-surface' : undefined}
              sx={{ 
              // Previous light gray container - kept for quick rollback
              // border: '1px solid #ccc', backgroundColor: '#f9f9f9',
              border: useLightShell ? '1px solid var(--area-groups-border, rgba(0,0,0,0.15))' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: useLightShell ? 'var(--area-groups-inner-bg, #ffffff)' : 'rgba(255, 255, 255, 0.04)',
              color: useLightShell ? lightDialogFieldTextColor : '#fff',
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              maxHeight: '300px',
              maxWidth: '100%',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: useLightShell ? '#f1f1f1' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: useLightShell ? '#888' : 'rgba(255, 255, 255, 0.25)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: useLightShell ? '#555' : 'rgba(255, 255, 255, 0.4)',
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
                backgroundColor: 'var(--app-button, #232323)',
                color: '#fff !important',
                '&:hover': {
                  backgroundColor: 'var(--app-button, #232323)',
                  opacity: 0.92,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'var(--app-button, #232323)',
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
      )}

      {/* Remove Area Confirmation Dialog */}
      <Dialog
        open={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setAreaToRemove(null);
        }}
        aria-labelledby="remove-area-dialog-title"
        aria-describedby="remove-area-dialog-description"
        BackdropProps={{ sx: { backgroundColor: 'transparent' } }}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <Box
          className={useLightShell ? 'area-picker-confirm-dialog' : undefined}
          sx={{
            px: 3,
            py: 2.5,
            minWidth: 340,
            maxWidth: '90vw',
            ...(useLightShell ? {
              background: 'var(--area-picker-light-dialog-bg, #d6dde8)',
              borderRadius: '16px',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--schedule-panel-border, rgba(61, 74, 92, 0.25))',
              color: lightDialogTitleColor,
            } : {}),
          }}
        >
        <DialogTitle id="remove-area-dialog-title" sx={{ fontWeight: 600, fontSize: 18, color: useLightShell ? lightDialogTitleColor : '#fff', px: 0, pt: 0, pb: 1 }}>
          Remove Area
        </DialogTitle>
        <DialogContent sx={{ px: 0, py: 0 }}>
          <DialogContentText id="remove-area-dialog-description" sx={{ color: useLightShell ? 'var(--settings-panel-muted-text, rgba(0,0,0,0.72))' : undefined }}>
            Are you sure you want to remove this area from selection?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 0, pt: 2, pb: 0, gap: 1, justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => {
              setShowRemoveDialog(false);
              setAreaToRemove(null);
            }}
            variant="outlined"
            sx={{ 
              borderColor: useLightShell ? 'var(--home-tab-active-color, #3D4A5C)' : '#666',
              color: useLightShell ? 'var(--settings-panel-text, #1c2330)' : '#666',
              backgroundColor: useLightShell ? 'var(--users-input-bg, #ffffff)' : undefined,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { borderColor: useLightShell ? 'var(--home-tab-active-color, #3D4A5C)' : '#333', color: useLightShell ? 'var(--settings-panel-text, #1c2330)' : '#333' }
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
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            Remove
          </Button>
        </DialogActions>
        </Box>
      </Dialog>

      {/* Done Confirmation Dialog */}
      <Dialog
        open={showDoneDialog}
        onClose={() => setShowDoneDialog(false)}
        aria-labelledby="done-dialog-title"
        aria-describedby="done-dialog-description"
        BackdropProps={{ sx: { backgroundColor: 'transparent' } }}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        {/* Previous plain white dialog - kept for quick rollback */}
        <Box
          className="area-picker-confirm-dialog"
          sx={{
            px: 3,
            py: 2.5,
            minWidth: 340,
            maxWidth: '90vw',
            background: 'var(--area-picker-light-dialog-bg, #d6dde8)',
            borderRadius: '16px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--schedule-panel-border, rgba(61, 74, 92, 0.25))',
            color: lightDialogTitleColor,
          }}
        >
          <DialogTitle
            id="done-dialog-title"
            sx={{
              fontWeight: 600,
              fontSize: 18,
              color: lightDialogTitleColor,
              px: 0,
              pt: 0,
              pb: 1,
            }}
          >
            Add Selected Areas
          </DialogTitle>
          <DialogContent sx={{ px: 0, py: 0 }}>
            <DialogContentText
              id="done-dialog-description"
              sx={{
                color: lightDialogBodyTextColor,
                fontSize: 14,
              }}
            >
              Are you sure you want to add the selected areas to the group?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 0, pt: 2, pb: 0, gap: 1, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setShowDoneDialog(false)}
              variant="outlined"
              sx={{
                borderColor: 'var(--home-tab-active-color, #3D4A5C)',
                color: 'var(--settings-panel-text, #1c2330)',
                backgroundColor: 'var(--users-input-bg, #ffffff)',
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: 'var(--home-tab-active-color, #3D4A5C)',
                  backgroundColor: 'var(--area-groups-inner-bg, rgba(255, 255, 255, 0.9))',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDone}
              variant="contained"
              sx={{
                backgroundColor: 'var(--app-button, #232323)',
                color: '#fff !important',
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                '&:hover': { backgroundColor: 'var(--app-button, #232323)', opacity: 0.92 },
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Dialog>
  );
};


export default SelectAreaDialog;