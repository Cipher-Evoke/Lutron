import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuickControls,
  fetchQuickControlDetails,
  triggerQuickControl,
  deleteQuickControl,
  clearSelectedControl,
  updateQuickControl,
  createQuickControl,
  setShouldRefresh,
} from '../../redux/slice/quickcontrols/quickControlSlice';
// Remove the incorrect import
// Removed schedule imports as schedules should not affect Quick Controls
import { useNavigate } from 'react-router-dom';
import AreaTreeDialog from './AreaTreeDialog';
import Action from './Action';
import { ConfirmDialog } from '../../utils/FeedbackUI';
import { UseAuth } from '../../customhooks/UseAuth';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import Swal from 'sweetalert2';

// Helper to chunk array into rows of 4 with new row
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const QuickControls = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  
  // Get user authentication and role
  const { role } = UseAuth();
  const userProfile = useSelector((state) => state.user?.profile);
  
  // Debug logging to understand userProfile structure
  useEffect(() => {
    console.log('QuickControls Debug:', {
      role,
      userProfile,
      floors: userProfile?.floors,
      hasFloors: !!userProfile?.floors,
      floorsLength: userProfile?.floors?.length
    });
  }, [role, userProfile]);
  
  // Direct role checking for Quick Control permissions
  const canCreateQuickControl = () => {
    // Superadmin and Admin can always create Quick Controls
    if (role === 'Superadmin' || role === 'Admin') {
      console.log('canCreateQuickControl: Superadmin/Admin access granted');
      return true;
    }
    
    // For Operators, check if they have monitor_control_edit permission
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      console.log('canCreateQuickControl: Operator check', {
        floors: userProfile.floors,
        hasMonitorControlEdit,
        floorPermissions: userProfile.floors.map(f => f.floor_permission)
      });
      return hasMonitorControlEdit;
    }
    
    console.log('canCreateQuickControl: Access denied', { role, hasUserProfile: !!userProfile, hasFloors: !!userProfile?.floors });
    return false;
  };
  
  const canModifyQuickControl = () => {
    // Superadmin and Admin can always modify Quick Controls
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control_edit permission
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    
    return false;
  };
  
  const canDeleteQuickControl = () => {
    // Superadmin and Admin can always delete Quick Controls
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control_edit permission
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    
    return false;
  };
  
  const canTriggerQuickControl = () => {
    // Superadmin and Admin can always trigger Quick Controls
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control or monitor_control_edit permission
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControl = userProfile.floors.some(f => 
        f.floor_permission === 'monitor_control' || f.floor_permission === 'monitor_control_edit'
      );
      return hasMonitorControl;
    }
    
    return false;
  };
  
  // Add responsive state for tablets
  const [isTablet, setIsTablet] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isTabletSize = width >= 768 && width <= 1024;
      setIsTablet(isTabletSize);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const {
    controls,
    loading,
    status,
    selectedControl,
    selectedControlLoading,
    triggerStatus,
    deleteStatus,
    updateStatus,
    shouldRefresh,
    error,
    // Removed usageCheck as schedules should not affect Quick Controls
  } = useSelector((state) => state.quickControl);

  // Removed schedule selectors as schedules should not appear in Quick Controls

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableControl, setEditableControl] = useState(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  // New state for editing functionality
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);
  const [editAllMode, setEditAllMode] = useState(false);
  const [editAllAction, setEditAllAction] = useState(null);

  // Add state for error handling
  const [errorMessage, setErrorMessage] = useState("");

  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Removed schedule tracking state
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  useEffect(() => {
    if (status === 'idle' || shouldRefresh) {
      dispatch(fetchQuickControls());
      if (shouldRefresh) dispatch(setShouldRefresh(false));
    }
  }, [status, shouldRefresh, dispatch]);

  // Removed schedule change listener as schedules should not affect Quick Controls

  // Removed schedule status listener as schedules should not affect Quick Controls

  // Periodic refresh as fallback (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Only refresh if it's been more than 10 seconds since last refresh
      if (now - lastRefreshTime > 10000) {
        dispatch(fetchQuickControls());
        setLastRefreshTime(now);
        
        // Removed usage check as schedules should not affect Quick Controls
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [dispatch, lastRefreshTime]);

  // Force refresh when component mounts or when navigating to this page
  useEffect(() => {
    dispatch(fetchQuickControls());
    setLastRefreshTime(Date.now());
  }, [dispatch]);

  // Check if all areas have the same action type
  const checkSameActionType = () => {
    if (!editableControl?.quick_control_areas || editableControl.quick_control_areas.length === 0) return false;
    
    const firstActionType = editableControl.quick_control_areas[0]?.actions?.[0]?.type;
    if (!firstActionType) return false;
    
    return editableControl.quick_control_areas.every(area => 
      area.actions?.[0]?.type === firstActionType
    );
  };

  // Open details and fetch only if not already loaded or different
  const handleOpenDetails = (control) => {
    setDetailsOpen(true);
    setEditMode(false);
    setEditableControl(null);
    setErrorMessage(""); // Clear any previous error messages
    
    if (!selectedControl || selectedControl.id !== control.id) {
      dispatch(fetchQuickControlDetails(control.id));
      // Removed schedule usage check as schedules should not affect Quick Controls
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setEditMode(false);
    setEditableControl(null);
    setErrorMessage(""); // Clear error messages when closing
    dispatch(clearSelectedControl());
    navigate("/quickcontrols");
  };

  const handleTrigger = () => {
    if (selectedControl) dispatch(triggerQuickControl(selectedControl.id));
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedControl) return;
    
    // Removed schedule usage check as schedules should not affect Quick Controls
    
    try {
      await dispatch(deleteQuickControl(selectedControl.id)).unwrap();
      
      // If successful, close the modal
      setDetailsOpen(false);
      setEditMode(false);
      setEditableControl(null);
      setErrorMessage(""); // Clear any previous error
    } catch (error) {
      // Just use the error message directly from the backend
      setErrorMessage(error);
    }
    
    setShowDeleteDialog(false);
  };

  // Copy: create a new quick control with the same data and show in list
  const handleCopy = (control) => {
    if (updateStatus === 'loading') return; // Prevent copy during save operation
    setDetailsOpen(true);
    setEditMode(true);
    setIsCopyMode(true);
    // Deep copy and reset name
    const copy = JSON.parse(JSON.stringify(control));
    copy.name = `Copy of ${copy.name}`;
    copy.id = undefined; // Remove id so it's not mistaken for update
    setEditableControl(copy);
  };

  // Modify: allow editing in modal
  const handleModify = () => {
    if (!selectedControl) return;
    setEditMode(true);
    // Deep copy to avoid mutating redux state
    setEditableControl(JSON.parse(JSON.stringify(selectedControl)));
  };

  // Handle location changes
  const handleAddLocations = (areas) => {
    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: [
        ...prev.quick_control_areas,
        ...areas.map(a => ({
          floor_id: a.floorId,
          floor_name: a.floorName,
          area_id: a.areaId,
          area_name: a.areaName,
          actions: []
        }))
      ]
    }));
  };

  const handleRemoveLocation = (index) => {
    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: prev.quick_control_areas.filter((_, i) => i !== index)
    }));
  };

  // Handle action changes
  const handleOpenActionDialog = (idx) => {
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

  const handleAddAction = (idx, actionData) => {
    setEditableControl(prev => {
      const updatedAreas = [...prev.quick_control_areas];
      let newAction = actionData;

      // Convert action data to the correct format for the API
      if (actionData.type === "scene" && actionData.scene) {
        newAction = {
          type: "set_scene",
          scene_code: String(actionData.scene.id),
          scene_name: actionData.scene.name
        };
      } else if (actionData.type === "zone" && actionData.zone) {
        newAction = {
          type: "zone_status",
          zone_id: Number(actionData.zone.id || actionData.zone.zone_id),
          zone_type: actionData.zone.type,
          zone_status: actionData.values?.on_off,
          zone_brightness: actionData.values?.brightness !== undefined ? `${actionData.values.brightness}%` : undefined,
          zone_temperature: actionData.values?.cct ? `${actionData.values.cct}K` : undefined,
          zone_name: actionData.zone.name
        };
      } else if (actionData.type === "occupancy" && actionData.action) {
        newAction = {
          type: "occupancy",
          occupancy_setting: actionData.action
        };
      } else if (actionData.type === "shade" && actionData.shade) {
        newAction = {
          type: "shade_group_status",
          shade_group_id: Number(actionData.shade.id || actionData.shade.zone_id),
          shade_group_name: actionData.shade.name,
          shade_level: `${actionData.value}%`
        };
      }

      // Remove previous action of the same type
      const filtered = (updatedAreas[idx].actions || []).filter(a => a.type !== newAction.type);
      updatedAreas[idx] = { 
        ...updatedAreas[idx], 
        actions: [...filtered, newAction] 
      };

      return { ...prev, quick_control_areas: updatedAreas };
    });
    setActionDialogIdx(null);
    setSelectedActionData(null);
  };

  // Handle edit all functionality
  const handleEditAll = () => {
    if (!checkSameActionType()) return;
    
    const firstArea = editableControl.quick_control_areas[0];
    const firstAction = firstArea?.actions?.[0];
    
    if (firstAction) {
      setEditAllMode(true);
      setEditAllAction(firstAction);
    }
  };

  const handleEditAllSave = (updatedAction) => {
    // Convert the action data to the correct format
    let convertedAction = updatedAction;
    
    if (updatedAction.type === "scene" && updatedAction.scene) {
      convertedAction = {
        type: "set_scene",
        scene_code: String(updatedAction.scene.id),
        scene_name: updatedAction.scene.name
      };
    } else if (updatedAction.type === "zone" && updatedAction.zone) {
      convertedAction = {
        type: "zone_status",
        zone_id: Number(updatedAction.zone.id || updatedAction.zone.zone_id),
        zone_type: updatedAction.zone.type,
        zone_status: updatedAction.values?.on_off,
        zone_brightness: updatedAction.values?.brightness !== undefined ? `${updatedAction.values.brightness}%` : undefined,
        zone_temperature: updatedAction.values?.cct ? `${updatedAction.values.cct}K` : undefined,
        zone_name: updatedAction.zone.name
      };
    } else if (updatedAction.type === "occupancy" && updatedAction.action) {
      convertedAction = {
        type: "occupancy",
        occupancy_setting: updatedAction.action
      };
    } else if (updatedAction.type === "shade" && updatedAction.shade) {
      convertedAction = {
        type: "shade_group_status",
        shade_group_id: Number(updatedAction.shade.id || updatedAction.shade.zone_id),
        shade_group_name: updatedAction.shade.name,
        shade_level: `${updatedAction.value}%`
      };
    }

    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: prev.quick_control_areas.map(area => ({
        ...area,
        actions: [convertedAction]
      }))
    }));
    setEditAllMode(false);
    setEditAllAction(null);
  };

  // Save after modify
  const handleSave = async () => {
    if (!editableControl || updateStatus === 'loading') return;
    const payload = {
      name: editableControl.name,
      areas: editableControl.quick_control_areas.map(area => ({
        floor_id: area.floor_id,
        area_id: area.area_id,
        actions: area.actions.map(action => ({
          ...action,
          id: undefined,
          quick_control_area_id: undefined,
          quick_control_area_action_id: undefined,
        }))
      }))
    };

    if (isCopyMode) {
      try {
        // Create new quick control
        const response = await dispatch(createQuickControl(payload)).unwrap();
        
        if (response?.id) {
          // Reset copy mode FIRST before any other operations
          setIsCopyMode(false);
          // After creating, go back to the list and refresh
          setDetailsOpen(false);
          setEditMode(false);
          setEditableControl(null);
          
          // Try to refresh the list
          try {
            await dispatch(fetchQuickControls());
          } catch (refreshError) {
            // Error refreshing quick controls list
          }
          
          // Navigate to the list
          try {
            navigate('/quickcontrols', { replace: true });
          } catch (navError) {
            // Fallback: try window.location
            window.location.href = '/quickcontrols';
          }
        }
      } catch (error) {
        // Show error message with SweetAlert
        const errorMessage = error?.response?.data?.detail || 
                            error?.response?.data?.message ||
                            error?.message || 
                            'Failed to create quick control';
        
        Swal.fire({
          background: "#D0DAF7",
          width: 200,
          icon: "error",
          title: "Oops...",
          text: errorMessage,
          customClass: {
            popup: 'custom-swal-radius',
          },
        });
        // Don't reset copy mode on error so user can try again
      }
    } else {
      // Update existing
      await dispatch(updateQuickControl({ controlId: editableControl.id, payload }));
      setEditMode(false);
      setEditableControl(null);
      dispatch(fetchQuickControlDetails(editableControl.id)); // reload details
    }
  };

  // Handle input changes in edit mode
  const handleEditChange = (field, value) => {
    setEditableControl(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div style={{ color: '#fff', padding: 40 }}>Loading...</div>;
  }

  // Show all controls in a single line, covering full container width
  const allControls = controls || [];
  const firstRow = allControls; // Show all controls in first row
  const otherRows = []; // No additional rows

  const hasSameActionType = checkSameActionType();

        // Removed schedule usage check as schedules should not affect Quick Controls

  return (
    <div style={{ padding: "18px"}}>
      <div style={{ paddingLeft: "18px" }} >
      {/* Row 1: Heading */}
      <h2 style={{ 
        color: '#fff', 
        fontWeight: 600,
        fontSize: 24,
        margin: 0,
        letterSpacing: 0.5,
        marginBottom: 16,
        paddingTop: "18px"
      }}>Quick Controls</h2>

      {/* Row 2: Create New button */}
      {canCreateQuickControl() && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '20px',
          marginRight: '15px'
        }}>
          <button
            style={{
              background: buttonColor,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: isTablet ? '12px 32px' : '13px 20px',
              fontWeight: 500,
              fontSize: isTablet ? 16 : 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30,117,187,0.08)',
              transition: 'background 0.2s'
            }}
            onClick={() => navigate('/quickcontrols/create')}
          >
            + Create New
          </button>
        </div>
      )}

      {/* Enhanced Error Message Display */}
      {errorMessage && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '8px',
              fontSize: '16px'
            }}>
              Cannot Delete Quick Control
            </div>
            <div style={{ 
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {errorMessage}
            </div>
            {/* Removed schedule usage warning as schedules should not affect Quick Controls */}
          </div>
          <button
            onClick={() => setErrorMessage("")}
            style={{
              background: 'none',
              border: 'none',
              color: '#856404',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              padding: '0 8px',
              marginLeft: '16px',
              lineHeight: '1'
            }}
            title="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {/* Row 3: Quick control buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 15,
          marginBottom: 20,
          flexWrap: 'wrap',
          width: '100%'
        }}
      >
        {firstRow.map((qc, idx) => (
          <button
            key={qc.id || idx}
            style={{
              background: '#fff',
              color: buttonColor,
              borderRadius: 10,
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              minWidth: '140px',
              maxWidth: '200px',
              flex: '0 1 auto',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onClick={() => navigate(`/quickcontrols/${qc.id}`)}
          >
            {qc.name}
          </button>
        ))}
      </div>
      
      {/* Render additional rows if any */}
      {otherRows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isTablet ? 12 : 20,
            marginBottom: 20,
            flexWrap: isTablet ? 'wrap' : 'nowrap',
          }}
        >
          {row.map((qc, idx) => (
            <button
              key={qc.id || idx}
              style={{
                background: '#fff',
              color: buttonColor,
                borderRadius: 10,
                padding: isTablet ? '12px 20px' : '15px 30px',
                fontWeight: 700,
                fontSize: isTablet ? 14 : 16,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                minWidth: isTablet ? 140 : 180,
                flex: isTablet ? '0 0 auto' : 'none',
              }}
              onClick={() => navigate(`/quickcontrols/${qc.id}`)}
            >
              {qc.name}
            </button>
          ))}
        </div>
      ))}

      {/* Details Modal/Panel */}
      {detailsOpen && (selectedControl || editableControl) && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            left: 60,
            right: 60,
            bottom: 60,
            background: '#a89c81',
            borderRadius: 20,
            zIndex: 1000,
            padding: 40,
            boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {editMode ? (
              <input
                value={editableControl.name}
                onChange={e => handleEditChange('name', e.target.value)}
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: buttonColor,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '8px 16px',
                  marginBottom: 24,
                  minWidth: 300,
                }}
              />
            ) : (
              <h2 style={{ color: '#fff', marginBottom: 24 }}>
                Quick Control: {selectedControl?.name}
              </h2>
            )}
            {!editMode && (
              <button
                style={{
                  background: canTriggerQuickControl() ? buttonColor : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 28px',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: canTriggerQuickControl() ? 'pointer' : 'not-allowed',
                  minWidth: 100,
                  opacity: canTriggerQuickControl() ? 1 : 0.6,
                }}
                onClick={canTriggerQuickControl() ? handleTrigger : undefined}
                disabled={triggerStatus === 'loading' || !canTriggerQuickControl()}
                title={!canTriggerQuickControl() ? 'You do not have permission to trigger Quick Controls' : ''}
              >
                {triggerStatus === 'loading' ? 'Triggering...' : 'Trigger'}
              </button>
            )}
          </div>

          <table style={{ width: '100%', color: '#fff', marginBottom: 32, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #fff', paddingBottom: 8 }}>Location</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #fff', paddingBottom: 8 }}>Action</th>
                {editMode && <th style={{ textAlign: 'left', borderBottom: '1px solid #fff', paddingBottom: 8 }}>
                  {hasSameActionType ? (
                    <span 
                      style={{ 
                        cursor: 'pointer', 
                        textDecoration: 'underline',
                        color: '#fff'
                      }}
                      onClick={handleEditAll}
                    >
                      Edit All
                    </span>
                  ) : (
                    'Actions'
                  )}
                </th>}
              </tr>
            </thead>
            <tbody>
              {(editMode ? editableControl.quick_control_areas : selectedControl.quick_control_areas)?.map((area, idx) => (
                area.actions?.map((action, aidx) => (
                  <tr key={aidx}>
                    <td style={{ 
                      padding: '8px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}>
                      {editMode ? (
                        <span>{area.floor_name} &gt; {area.area_name}</span>
                      ) : (
                        `${area.floor_name} &gt; ${area.area_name}`
                      )}
                    </td>
                    <td style={{ padding: '8px 0' }}>
                      {action.type === 'set_scene' && `Scene : ${action.scene_name || action.set_scene || action.scene_code || action.scene_id}${action.scene_name ? ' -' : ''}`}
                      {action.type === 'zone_status' && `Zone : ${action.zone_name || action.zone_id || ''} Level ${action.zone_brightness || action.zone_status || ''}`}
                      {action.type === 'occupancy' && `Occupancy : ${action.occupancy_setting}`}
                      {action.type === 'shade_group_status' && `Shade : ${action.shade_group_name || action.shade_group_id || ''} Level ${action.shade_level}`}
                      {action.type === 'device' && `Device : ${action.device_name || action.device_id}${action.device_name ? ' -' : ''}`}
                    </td>
                    {editMode && !hasSameActionType && (
                      <td style={{ padding: '8px 0' }}>
                        <button
                          onClick={() => handleOpenActionDialog(idx)}
                          style={{
                            background: buttonColor,
                            border: 'none',
                            borderRadius: 4,
                            color: '#fff',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          {area.actions && area.actions.length > 0 ? 'Edit' : 'Add'} Action
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ))}
            </tbody>
          </table>

          {/* Add Location Button */}
          {editMode && (
            <div style={{ marginBottom: 16 }}>
              <button
                style={{
                  background: buttonColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => setShowLocationDialog(true)}
              >
                + Add Location
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            {!editMode && (
              <>
                <button
                  style={{
                    background: canCreateQuickControl() ? buttonColor : '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: canCreateQuickControl() ? 'pointer' : 'not-allowed',
                    opacity: canCreateQuickControl() ? 1 : 0.6,
                  }}
                  onClick={() => canCreateQuickControl() && handleCopy(selectedControl)}
                  disabled={!canCreateQuickControl()}
                  title={!canCreateQuickControl() ? 'You do not have permission to copy Quick Controls' : ''}
                >
                  Copy
                </button>
                <button
                  style={{
                    background: canModifyQuickControl() ? buttonColor : '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: canModifyQuickControl() ? 'pointer' : 'not-allowed',
                    opacity: canModifyQuickControl() ? 1 : 0.6,
                  }}
                  onClick={canModifyQuickControl() ? handleModify : undefined}
                  disabled={!canModifyQuickControl()}
                  title={!canModifyQuickControl() ? 'You do not have permission to modify Quick Controls' : ''}
                >
                  Modify
                </button>
                <button
                  style={{
                    background: canDeleteQuickControl() ? buttonColor : '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: canDeleteQuickControl() ? 'pointer' : 'not-allowed',
                    opacity: canDeleteQuickControl() ? 1 : 0.6,
                  }}
                  onClick={canDeleteQuickControl() ? handleDelete : undefined}
                  disabled={deleteStatus === 'loading' || !canDeleteQuickControl()}
                  title={!canDeleteQuickControl() ? 'You do not have permission to delete Quick Controls' : 'Delete Quick Control'}
                >
                  {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  style={{
                    background: buttonColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </>
            )}
            {editMode && (
              <>
                <button
                  style={{
                    background: buttonColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={handleSave}
                  disabled={updateStatus === 'loading'}
                >
                  {updateStatus === 'loading' ? 'Saving...' : 'Save'}
                </button>
                <button
                  style={{
                    background: buttonColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => { setEditMode(false); setEditableControl(null); setIsCopyMode(false); }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Location Dialog */}
      <AreaTreeDialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAdd={handleAddLocations}
      />

      {/* Edit All Dialog */}
      {editAllMode && editAllAction && (
        <div style={{
          position: 'fixed',
          left: 0, top: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#CDC0A0",
            borderRadius: 18,
            padding: 28,
            minWidth: 340,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            position: "relative",
            color: buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: buttonColor }}>
              Edit All Actions
            </div>
            <Action
              areaId={editableControl.quick_control_areas[0]?.area_id}
              onActionSelect={action => setSelectedActionData(action)}
            />
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (selectedActionData && selectedActionData.type) {
                    handleEditAllSave(selectedActionData);
                  }
                }}
                disabled={!selectedActionData || !selectedActionData.type}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: "none",
                  background: (selectedActionData && selectedActionData.type) ? buttonColor : "#888",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: (selectedActionData && selectedActionData.type) ? "pointer" : "not-allowed"
                }}
              >
                Apply to All
              </button>
              <button
                onClick={() => { setEditAllMode(false); setEditAllAction(null); setSelectedActionData(null); }}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: `1px solid ${buttonColor}`,
                  background: "#fff",
                  color: buttonColor,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      {actionDialogIdx !== null && (
        <div style={{
          position: 'fixed',
          left: 0, top: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#CDC0A0",
            borderRadius: 18,
            padding: 28,
            minWidth: 340,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            position: "relative",
            color: buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: buttonColor }}>
              {editableControl?.quick_control_areas[actionDialogIdx]?.actions?.length > 0 ? 'Edit' : 'Add'} Action
            </div>
            <Action
              areaId={editableControl?.quick_control_areas[actionDialogIdx]?.area_id}
              onActionSelect={action => setSelectedActionData(action)}
            />
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (selectedActionData && selectedActionData.type) {
                    handleAddAction(actionDialogIdx, selectedActionData);
                  }
                }}
                disabled={
                  !selectedActionData ||
                  !selectedActionData.type ||
                  (selectedActionData.type === "scene" && !selectedActionData.scene) ||
                  (selectedActionData.type === "shade" && !selectedActionData.shade)
                }
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: "none",
                  background: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? buttonColor : "#888",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? "pointer" : "not-allowed"
                }}
              >
                {editableControl?.quick_control_areas[actionDialogIdx]?.actions?.length > 0 ? 'Update' : 'Add'} Action
              </button>
              <button
                onClick={() => { setActionDialogIdx(null); setSelectedActionData(null); }}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: `1px solid ${buttonColor}`,
                  background: "#fff",
                  color: buttonColor,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quick Control Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Quick Control"
        message={`Are you sure you want to delete quick control "${selectedControl?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
      </div>
    </div>
  );
};

export default QuickControls;