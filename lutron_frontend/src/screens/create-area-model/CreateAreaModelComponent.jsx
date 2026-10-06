
import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Typography,
  List, ListItem, IconButton, ListItemText, Divider, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { RiDeleteBin6Fill } from "react-icons/ri";
import SelectAreaDialog from '../../screens/create-area-model/SelectAreaDialog';
import { useDispatch, useSelector } from 'react-redux';
import { createAreaGroup } from '../../redux/slice/floor/floorSlice';
import { ConfirmDialog } from '../../utils/FeedbackUI';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';

const CreateAreaModelComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';

  const [groupName, setGroupName] = useState('');
  const [locations, setLocations] = useState([]);
  const [floorAreas, setFloorAreas] = useState([]);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showCreateFailure, setShowCreateFailure] = useState(false);
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteArea = (locationIndex, areaIndex, areaName) => {
    // Set the item to delete and show confirmation dialog
    setItemToDelete({ 
      locationIndex, 
      areaIndex, 
      areaName,
      type: 'area' 
    });
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const { locationIndex, areaIndex } = itemToDelete;
    
    // Remove this area from this location
    const updatedAreaCodes = [...locations[locationIndex].areaCodes];
    updatedAreaCodes.splice(areaIndex, 1);
    const updatedAreaNames = [...locations[locationIndex].areaNames];
    updatedAreaNames.splice(areaIndex, 1);
    const updatedAreaIds = [...locations[locationIndex].areaIds];
    updatedAreaIds.splice(areaIndex, 1);
    
    if (updatedAreaIds.length === 0) {
      // Remove the whole location if no areas left
      setLocations(prev => prev.filter((_, i) => i !== locationIndex));
      
      // Update floorAreas to remove this floor entirely
      const removedFloorId = locations[locationIndex].floorId;
      setFloorAreas(prev => prev.filter(f => f.floor_id !== removedFloorId));
    } else {
      // Update the location with the removed area
      setLocations(prev => prev.map((loc, i) =>
        i === locationIndex
          ? { ...loc, areaCodes: updatedAreaCodes, areaNames: updatedAreaNames, areaIds: updatedAreaIds }
          : loc
      ));
      
      // Update floorAreas to remove this specific area
      const removedFloorId = locations[locationIndex].floorId;
      const removedAreaId = locations[locationIndex].areaIds[areaIndex];
      setFloorAreas(prev => prev.map(floor => {
        if (floor.floor_id === removedFloorId) {
          const filteredIds = floor.area_ids.filter(id => id !== removedAreaId);
          return { ...floor, area_ids: filteredIds };
        }
        return floor;
      }).filter(f => f.area_ids.length > 0));
    }
    
    // Close dialog and reset state
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleAddLocation = () => {
    setAreaDialogOpen(true);
  };

  const handleAddFromDialog = ({ areaNames, areaCodes, areaIds, floorId, floorName }) => {

    const numericFloorId = parseInt(floorId);
    const numericAreaIds = areaIds.map(id => parseInt(id));
    setLocations(prev => [
      ...prev,
      { floorId: numericFloorId, floorName, areaNames, areaCodes: areaCodes, areaIds: numericAreaIds }
    ]);
    setFloorAreas(prev => {
      const updated = [...prev];
      const existing = updated.find(f => f.floor_id === numericFloorId);
      if (existing) {
        existing.area_ids = Array.from(new Set([...existing.area_ids, ...numericAreaIds]));
      } else {
        updated.push({ floor_id: numericFloorId, area_ids: numericAreaIds });
      }
      return updated;
    });
  };

  const handleSave = () => {
    if (!groupName || floorAreas.length === 0) {
      setShowCreateFailure(true);
      return;
    }

    // Validate that all area_ids are numbers and filter out null/undefined values
    const validFloorAreas = floorAreas.map(f => ({
      floor_id: parseInt(f.floor_id),
      area_ids: (f.area_ids || []).filter(id => id != null && id !== undefined).map(id => parseInt(id))
    })).filter(f => f.area_ids.length > 0);

    const payload = {
      name: groupName.trim(),
      special: false, // Add this field as expected by the backend
      floors: validFloorAreas
    };


    dispatch(createAreaGroup(payload))
      .unwrap()
      .then((result) => {
        setShowCreateSuccess(true);
        setTimeout(() => navigate('/heatmap'), 1500);
      })
      .catch((error) => {
        setShowCreateFailure(true);
      });
  };

  return (
    <Box 
      className="area-group-container"
      sx={{
        height: '100%',
        backgroundColor: 'white',
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        maxHeight: '100%',
        border: '1px solid #d2c4a2',
        borderRadius: 1,
        margin: 2
      }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 3, flexShrink: 0 }}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Area Group Name
          </Typography>
          <TextField
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            size="small"
            variant="outlined"
            sx={{ width: 320 }}
          />
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddLocation}
            sx={{
              textTransform: 'none',
              mt: 3,
              pl: 0,
            }}
          >
            Add Location
          </Button>
        </Box>

        <Divider sx={{ my: 2, width: '40%', flexShrink: 0 }} />

        {/* Scrollable List Box - Takes remaining space */}
        <Box 
          className="area-group-scrollable"
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            minHeight: 0,
            maxHeight: 'calc(100vh - 350px)', // Fixed max height to prevent overflow
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 1
          }}>
          <List disablePadding>
            {locations.map((location, index) =>
              location.areaNames.map((name, idx) => (
                <ListItem
                  key={`${location.floorId}-${name}`}
                  secondaryAction={
                    <IconButton
                      onClick={() => handleDeleteArea(index, idx, name)}
                      sx={{
                        ml: 1,
                        backgroundColor: buttonColor,
                        borderRadius: 1,
                        color: '#fff',
                        '&:hover': { backgroundColor: buttonColor },
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 'bold' }}>🗑️</span>
                    </IconButton>
                  }
                  sx={{ 
                    py: 1, 
                    px: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    },
                    '&:active': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateX(2px)',
                    }
                  }}
                >
                  <Typography variant="body1" sx={{ 
                    flexGrow: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0
                  }}>
                    {location.floorName} &gt; {name}
                  </Typography>
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <SelectAreaDialog
          open={areaDialogOpen}
          onClose={() => setAreaDialogOpen(false)}
          onAdd={handleAddFromDialog}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexShrink: 0, mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/heatmap')}
          sx={{
            backgroundColor: buttonColor,
            color: '#fff',
            '&:hover': { backgroundColor: buttonColor }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            backgroundColor: buttonColor,
            color: '#fff',
            '&:hover': { backgroundColor: buttonColor }
          }}
        >
          Save
        </Button>
      </Box>

      {/* Snackbar for success */}
      <Snackbar
        open={showCreateSuccess}
        autoHideDuration={3000}
        onClose={() => setShowCreateSuccess(false)}
        message="Area group created successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: buttonColor,
            color: '#fff',
            fontSize: 14
          }
        }}
      />

      {/* Snackbar for failure */}
      <Snackbar
        open={showCreateFailure}
        autoHideDuration={3000}
        onClose={() => setShowCreateFailure(false)}
        message="Failed to create area group. Please try again."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: buttonColor,
            color: '#fff',
            fontSize: 14
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Area"
        message={`Are you sure you want to delete "${itemToDelete?.areaName}" from this area group?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
      />
    </Box>
  );
};

export default CreateAreaModelComponent;