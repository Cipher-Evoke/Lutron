import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDispatch, useSelector } from 'react-redux';
import AddCustomGraphDialog from '../customGraph/AddCustomGraphDialog';
import {
  CUSTOM_GRAPH_VARIANTS,
  CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT,
} from '../../dashboard/customGraphs/customGraphConstants';
import {
  deleteCustomGraphVisibility,
  enableCustomGraphOnCreate,
  isCustomGraphVisible,
  setCustomGraphVisible,
} from '../../dashboard/customGraphs/customGraphVisibility';
import { buildCustomGraphWidgetKey } from '../../dashboard/customGraphs/customGraphStorage';
import {
  premiumSelectMenuProps,
  usersFormFieldSx,
} from '../../../variants/advanced/screens/settings/Users/userSelectMenuProps';

const ADVANCED_CUSTOM_GRAPH_FIELD_SX = {
  ...usersFormFieldSx,
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--users-input-bg, #fff)',
    borderRadius: '8px',
    color: 'var(--users-input-text, rgba(0, 0, 0, 0.87))',
  },
  '& .MuiOutlinedInput-root fieldset': {
    borderColor: 'var(--users-border, #C5CDD8)',
  },
  '& .MuiOutlinedInput-root:hover fieldset': {
    borderColor: 'var(--home-tab-active-color, #3D4A5C)',
  },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
    borderColor: 'var(--home-tab-active-color, #3D4A5C)',
    borderWidth: 1.5,
  },
};

const ADVANCED_CUSTOM_GRAPH_DIALOG_PROPS = {
  useUsersModalShell: true,
  fieldSx: ADVANCED_CUSTOM_GRAPH_FIELD_SX,
  selectMenuProps: premiumSelectMenuProps,
  textFieldVariant: 'outlined',
  selectVariant: 'outlined',
  labelTypographySx: {
    color: 'var(--settings-panel-text, #1c2330)',
  },
  helperTypographySx: {
    color: 'var(--settings-panel-muted-text, rgba(0,0,0,0.6))',
  },
};

/**
 * Settings panel: Add New Graph + visibility toggles for basic/advanced Rename Widget.
 */
export default function CustomGraphSettingsPanel({
  variant,
  fetchCustomGraphs,
  createCustomGraph,
  deleteCustomGraph,
  selectCustomGraphs,
  selectCustomGraphsLoading,
  selectCustomGraphsError,
}) {
  const dispatch = useDispatch();
  const customGraphs = useSelector(selectCustomGraphs);
  const customGraphsLoading = useSelector(selectCustomGraphsLoading);
  const customGraphsError = useSelector(selectCustomGraphsError);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [snackbar, setSnackbar] = useState(false);
  const [visibilityTick, setVisibilityTick] = useState(0);

  useEffect(() => {
    dispatch(fetchCustomGraphs());
  }, [dispatch, fetchCustomGraphs]);

  useEffect(() => {
    const refresh = () => setVisibilityTick((t) => t + 1);
    window.addEventListener(CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT, refresh);
  }, []);

  const energyGraphs = useMemo(
    () =>
      (Array.isArray(customGraphs) ? customGraphs : []).filter(
        (g) => String(g?.page || '').toLowerCase() === 'energy'
      ),
    [customGraphs]
  );

  const spaceGraphs = useMemo(
    () =>
      (Array.isArray(customGraphs) ? customGraphs : []).filter(
        (g) => String(g?.page || '').toLowerCase() === 'space'
      ),
    [customGraphs]
  );

  const isGraphVisible = useCallback(
    (page, graphId) => {
      void visibilityTick;
      return isCustomGraphVisible(variant, page, graphId, true);
    },
    [variant, visibilityTick]
  );

  const handleToggle = (page, graphId, visible) => {
    setCustomGraphVisible(variant, page, graphId, visible);
  };

  const handleSaveGraph = async (payload) => {
    setSaveError('');
    try {
      const created = await dispatch(createCustomGraph(payload)).unwrap();
      await dispatch(fetchCustomGraphs()).unwrap();
      enableCustomGraphOnCreate(variant, payload.page, created?.id);
      setDialogOpen(false);
      setSnackbar(true);
    } catch (e) {
      const msg =
        typeof e === 'string' ? e : e?.message || 'Failed to add new graph';
      setSaveError(msg);
      throw e;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await dispatch(deleteCustomGraph(deleteId)).unwrap();
      deleteCustomGraphVisibility(variant, deleteId);
      await dispatch(fetchCustomGraphs()).unwrap();
      setDeleteOpen(false);
      setDeleteId('');
    } catch {
      /* ignore */
    }
  };

  const renderGraphRow = (g, page) => {
    const id = String(g?.id ?? '');
    const widgetKey = buildCustomGraphWidgetKey(id);
    return (
      <Box
        key={widgetKey}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 0.5,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <FormControlLabel
          sx={{ ml: 0, flex: 1, minWidth: 0 }}
          control={
            <Switch
              checked={isGraphVisible(page, id)}
              onChange={(e) => handleToggle(page, id, e.target.checked)}
              color="primary"
            />
          }
          label={g?.name || 'Custom graph'}
        />
        <IconButton
          size="small"
          aria-label="Delete graph"
          onClick={() => {
            setDeleteId(id);
            setDeleteOpen(true);
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const addGraphButtonLabel =
    variant === 'basic' || variant === 'advanced' ? 'Add Widget' : 'Add New Graph';

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #e5e7eb' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Custom Energy &amp; Space graphs</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setSaveError('');
            setDialogOpen(true);
          }}
          sx={{ textTransform: 'none' }}
        >
          {addGraphButtonLabel}
        </Button>
      </Box>
      <Typography sx={{ color: 'rgba(0,0,0,0.7)', fontSize: 13, mb: 2, lineHeight: 1.45 }}>
        Add bar, pie, line, or table charts to the Energy and Space Utilization dashboards.
        Built-in widget rename and visibility above are unchanged.
      </Typography>
      {customGraphsError ? (
        <Typography sx={{ color: '#b91c1c', fontSize: 12, mb: 1 }}>
          {typeof customGraphsError === 'string' ? customGraphsError : 'Failed to load custom graphs'}
        </Typography>
      ) : null}
      {energyGraphs.length > 0 ? (
        <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.5 }}>Energy</Typography>
      ) : null}
      {energyGraphs.map((g) => renderGraphRow(g, 'energy'))}
      {spaceGraphs.length > 0 ? (
        <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.5, mt: 1.5 }}>Space Utilization</Typography>
      ) : null}
      {spaceGraphs.map((g) => renderGraphRow(g, 'space'))}
      {energyGraphs.length === 0 && spaceGraphs.length === 0 ? (
        <Typography sx={{ color: 'rgba(0,0,0,0.54)', fontSize: 13 }}>No custom graphs yet.</Typography>
      ) : null}

      <AddCustomGraphDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveGraph}
        saving={customGraphsLoading}
        errorMessage={saveError}
        {...(variant === 'advanced' ? ADVANCED_CUSTOM_GRAPH_DIALOG_PROPS : {})}
      />

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={
          variant === 'advanced' ? { className: 'users-modal-shell' } : undefined
        }
      >
        <DialogTitle>Delete graph</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: 14 }}>Delete this custom graph?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar ? (
        <Typography sx={{ color: '#15803d', fontSize: 12, mt: 1 }}>
          Graph added successfully.
        </Typography>
      ) : null}
    </Box>
  );
}

export { CUSTOM_GRAPH_VARIANTS };
