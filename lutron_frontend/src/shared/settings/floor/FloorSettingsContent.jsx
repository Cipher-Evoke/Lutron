import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  IconButton,
  Snackbar,
  Tooltip,
  Popover,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { dispatchFetchFloorsOnce } from '../../utils/bootstrapFetchGuards';
import { MdDelete, MdEditSquare, MdCalculate, MdDragIndicator } from 'react-icons/md';
import FlipToBackIcon from '@mui/icons-material/FlipToBack';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFloorRow({
  floor,
  dragEnabled,
  actionColor = '#1E1E1E',
  onEdit,
  onDelete,
  onCorrectCoordinate,
  onAreaCalculation,
  showDeleteDialog,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: floor.id,
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}
    >
      <TableCell sx={{ color: 'var(--settings-panel-text, #000)' }}>
        {floor.floor_name}
      </TableCell>
      <TableCell sx={{ color: 'var(--settings-panel-text, #000)' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {Array.from(
            new Map((floor.processors || []).map((p) => [
              typeof p === 'string' ? p : p.processor_id,
              p,
            ])).values()
          ).map((processor, pIdx) => (
            <Box
              key={pIdx}
              sx={{
                backgroundColor: actionColor,
                color: '#fff',
                borderRadius: '4px',
                px: 1,
                py: 0.5,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              {typeof processor === 'string'
                ? processor
                : `PR ${processor.processor_id}`}
            </Box>
          ))}
        </Box>
      </TableCell>
      <TableCell sx={{ color: '#000' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Tooltip title="Edit Floor" arrow placement="top">
            <IconButton
              onClick={() => onEdit(floor)}
              sx={{
                backgroundColor: actionColor,
                color: '#fff',
                borderRadius: '6px',
                p: 1,
                width: '36px',
                height: '30px',
                '&:hover': { backgroundColor: actionColor },
              }}
            >
              <MdEditSquare />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Floor" arrow placement="top">
            <IconButton
              onClick={() => onDelete(floor)}
              disabled={showDeleteDialog}
              sx={{
                backgroundColor: actionColor,
                color: '#fff',
                borderRadius: '6px',
                p: 1,
                width: '34px',
                height: '30px',
                '&:hover': { backgroundColor: actionColor },
              }}
            >
              <MdDelete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Correct Coordinate" arrow placement="top">
            <IconButton
              onClick={() => onCorrectCoordinate(floor)}
              sx={{
                backgroundColor: actionColor,
                color: '#fff',
                borderRadius: '6px',
                p: 1,
                width: '36px',
                height: '30px',
                '&:hover': { backgroundColor: actionColor },
              }}
            >
              <FlipToBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Area Calculation" arrow placement="top">
            <IconButton
              onClick={() => onAreaCalculation(floor)}
              sx={{
                backgroundColor: actionColor,
                color: '#fff',
                borderRadius: '6px',
                p: 1,
                width: '36px',
                height: '30px',
                '&:hover': { backgroundColor: actionColor },
              }}
            >
              <MdCalculate />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
      <TableCell sx={{ width: 48, p: 1 }}>
        {dragEnabled ? (
          <Tooltip title="Drag to reorder" arrow placement="top">
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{
                cursor: 'grab',
                color: 'var(--settings-panel-text, #000)',
                touchAction: 'none',
              }}
            >
              <MdDragIndicator size={22} />
            </IconButton>
          </Tooltip>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export default function FloorSettingsContent({
  buttonColor,
  createFloorPath = '/createfloor',
  fetchFloors,
  deleteFloor,
  setFloorSortMode,
  reorderFloors,
  selectFloors,
  selectManualSortEnabled,
  ConfirmDialog,
  /** Optional: Basic/Customized themed header (Users/Processors). Advanced omits → CSS vars. */
  tableHeaderRowSx,
  tableHeaderCellSx,
  /** Optional: Basic solid-blue header — keep sort icon fully visible (not clipped). */
  tableHeaderSortCellSx,
  /** Optional: override sort icon colors (Basic blue header needs white, not button blue). */
  headerSortIconColor,
  headerSortIconActiveColor,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const floors = useSelector(selectFloors);
  const manualSortEnabled = useSelector(selectManualSortEnabled);
  const floorStatus = useSelector((state) => state.floor.status);
  const floorError = useSelector((state) => state.floor.error);

  const defaultHeaderRowSx = { backgroundColor: 'var(--users-table-head-bg, #d6dde8)' };
  const defaultHeaderCellSx = {
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--settings-panel-text, #000)',
    borderBottom: '2px solid var(--users-border, #ddd)',
    backgroundColor: 'var(--users-table-head-bg, #d6dde8)',
  };
  const headerRowSx = tableHeaderRowSx || defaultHeaderRowSx;
  const headerCellSx = tableHeaderCellSx
    ? { fontSize: '13px', ...tableHeaderCellSx }
    : defaultHeaderCellSx;
  const headerIconColor =
    headerSortIconColor ||
    tableHeaderCellSx?.color ||
    'var(--settings-panel-text, #000)';
  const headerIconActiveColor =
    headerSortIconActiveColor || buttonColor;

  const [localFloors, setLocalFloors] = useState([]);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortPanelAnchor, setSortPanelAnchor] = useState(null);
  const [isSortModeActive, setIsSortModeActive] = useState(false);
  const [sortModeSaving, setSortModeSaving] = useState(false);
  const [reorderSaving, setReorderSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const sortPanelOpen = Boolean(sortPanelAnchor);
  const dragEnabled = manualSortEnabled && isSortModeActive;
  const floorsRef = useRef(floors);

  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, fetchFloors, floors?.length]);

  useEffect(() => {
    floorsRef.current = floors;
    setLocalFloors(floors);
  }, [floors]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleSortButtonClick = (event) => {
    if (sortPanelOpen || isSortModeActive) {
      setSortPanelAnchor(null);
      setIsSortModeActive(false);
    } else {
      setSortPanelAnchor(event.currentTarget);
      setIsSortModeActive(true);
    }
  };

  const handleSortPanelClose = () => {
    setSortPanelAnchor(null);
  };

  const handleSortModeToggle = async (event) => {
    const enabled = event.target.checked;
    setSortModeSaving(true);
    try {
      await dispatch(setFloorSortMode(enabled)).unwrap();
    } catch (err) {
      setActionError(typeof err === 'string' ? err : 'Failed to update sort mode');
    } finally {
      setSortModeSaving(false);
    }
  };

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !dragEnabled) return;

      const oldIndex = localFloors.findIndex((f) => f.id === active.id);
      const newIndex = localFloors.findIndex((f) => f.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(localFloors, oldIndex, newIndex);
      setLocalFloors(reordered);
      setReorderSaving(true);

      try {
        await dispatch(reorderFloors(reordered.map((f) => f.id))).unwrap();
      } catch (err) {
        setLocalFloors(floorsRef.current);
        setActionError(typeof err === 'string' ? err : 'Failed to reorder floors');
      } finally {
        setReorderSaving(false);
      }
    },
    [dispatch, localFloors, dragEnabled, reorderFloors]
  );

  const handleDelete = (floor) => {
    setFloorToDelete(floor);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!floorToDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteFloor(floorToDelete.id)).unwrap();
      setShowDeleteSuccess(true);
    } catch (err) {
      setDeleteErrorMessage(err.message || 'Failed to delete');
      setShowDeleteError(true);
    }
    setDeleting(false);
    setShowDeleteDialog(false);
    setFloorToDelete(null);
  };

  const colSpan = 4;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ color: theme.palette.text.primary }} />
        <Button
          variant="contained"
          sx={{
            backgroundColor: buttonColor,
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#555555' },
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            py: 1,
          }}
          onClick={() => navigate(createFloorPath)}
        >
          Create Floor
        </Button>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            maxWidth: '900px',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'var(--users-table-container-bg, #fff)',
            border: '1px solid var(--users-border, #C5CDD8)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={headerRowSx}>
                <TableCell sx={headerCellSx}>Floor</TableCell>
                <TableCell sx={headerCellSx}>Processor</TableCell>
                <TableCell sx={headerCellSx}>Action</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    ...headerCellSx,
                    width: 48,
                    p: 1,
                    ...tableHeaderSortCellSx,
                  }}
                >
                  <Tooltip
                    title={
                      isSortModeActive
                        ? 'Click again to exit sorting mode'
                        : 'Enable / Disable floor sorting'
                    }
                    arrow
                    placement="top"
                  >
                    <IconButton
                      size="small"
                      onClick={handleSortButtonClick}
                      aria-label="Floor sorting"
                      sx={{
                        color: isSortModeActive ? headerIconActiveColor : headerIconColor,
                        ...(isSortModeActive && headerSortIconActiveColor
                          ? {
                              bgcolor: 'rgba(255, 255, 255, 0.18)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.28)' },
                            }
                          : null),
                      }}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {floorStatus === 'loading' ? (
                <TableRow sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}>
                  <TableCell colSpan={colSpan} sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress size={24} sx={{ color: '#000' }} />
                  </TableCell>
                </TableRow>
              ) : floorError ? (
                <TableRow sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}>
                  <TableCell colSpan={colSpan} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography sx={{ color: 'red', mb: 1 }}>
                      Failed to load floors. Please check the processor connection.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => dispatchFetchFloorsOnce(dispatch, fetchFloors, { force: true })}
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : localFloors.length === 0 ? (
                <TableRow sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}>
                  <TableCell colSpan={colSpan} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography sx={{ color: '#000' }}>
                      No floors created yet. Click &quot;Create Floor&quot; to add one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={localFloors.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localFloors.map((floor) => (
                    <SortableFloorRow
                      key={floor.id}
                      floor={floor}
                      dragEnabled={dragEnabled}
                      actionColor={buttonColor}
                      onEdit={(f) => navigate(`/editfloor/${f.id}`)}
                      onDelete={handleDelete}
                      onCorrectCoordinate={(f) => navigate(`/correct-coordinate/${f.id}`)}
                      onAreaCalculation={(f) => navigate(`/area-calculation/${f.id}`)}
                      showDeleteDialog={showDeleteDialog}
                    />
                  ))}
                </SortableContext>
              )}
              {reorderSaving ? (
                <TableRow>
                  <TableCell colSpan={colSpan} sx={{ py: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Saving order…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </DndContext>

      <Popover
        open={sortPanelOpen}
        anchorEl={sortPanelAnchor}
        onClose={handleSortPanelClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Floor sorting
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={manualSortEnabled}
                onChange={handleSortModeToggle}
                disabled={sortModeSaving}
                color="primary"
              />
            }
            label={manualSortEnabled ? 'Manual' : 'Auto'}
          />
          <Typography variant="caption" display="block" sx={{ mt: 1, color: '#666' }}>
            {manualSortEnabled && isSortModeActive
              ? 'Drag rows to set floor order. Click the sort button again when done.'
              : manualSortEnabled
                ? 'Switch to sorting mode with the button above to reorder floors.'
                : 'Floors are sorted automatically by name.'}
          </Typography>
        </Box>
      </Popover>

      <Snackbar
        open={showDeleteSuccess}
        autoHideDuration={3000}
        onClose={() => setShowDeleteSuccess(false)}
        message="Floor deleted successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: buttonColor,
            color: '#fff',
            borderRadius: '12px',
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          },
        }}
      />

      <Snackbar
        open={showDeleteError}
        autoHideDuration={5000}
        onClose={() => setShowDeleteError(false)}
        message={deleteErrorMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: '#d32f2f',
            color: '#fff',
            borderRadius: '12px',
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          },
        }}
      />

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={5000}
        onClose={() => setActionError('')}
        message={actionError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: '#d32f2f',
            color: '#fff',
            borderRadius: '12px',
            px: 3,
            py: 1.5,
          },
        }}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Floor"
        message={`Are you sure you want to delete floor "${floorToDelete?.floor_name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setFloorToDelete(null);
        }}
        confirmDisabled={deleting}
      />
    </>
  );
}
