import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import CustomGraphScopeSection from '../../../variants/customized/screens/settings/widgets/CustomGraphScopeSection';
import CustomGraphScopedGroupPicker from '../../../variants/customized/screens/settings/widgets/CustomGraphScopedGroupPicker';
import { pickCustomGraphScopeForStorage } from '../../../variants/customized/utils/mergeCustomGraphScopeIntoApiParams';
import { isCustomGraphGroupScope } from '../../../variants/customized/utils/filterGroupIdsByAreaGroupScope';
import {
  CUSTOM_GRAPH_API_PATH_OPTIONS,
  formatCustomGraphApiPathLabel,
} from '../../dashboard/customGraphs/customGraphConstants';

function FieldLabel({ children, useUsersModalShell, labelTypographySx, shellLabelSx }) {
  return (
    <Typography
      sx={
        useUsersModalShell
          ? {
              mb: 1,
              fontWeight: 500,
              color: 'var(--settings-panel-text, #1c2330)',
              ...shellLabelSx,
            }
          : { fontSize: 13, mb: 0.5, ...labelTypographySx }
      }
    >
      {children}
    </Typography>
  );
}

export default function AddCustomGraphDialog({
  open,
  onClose,
  onSave,
  saving = false,
  errorMessage = '',
  useUsersModalShell = false,
  modalShellSx,
  shellTitleSx,
  shellLabelSx,
  shellContentSx,
  shellScopeTypographySx,
  shellGroupPanelSx,
  shellGroupPanelTitleSx,
  fieldSx,
  selectMenuProps,
  textFieldVariant,
  selectVariant,
  labelTypographySx,
  helperTypographySx,
  primaryActionSx,
  dialogProps = {},
}) {
  const [page, setPage] = useState('energy');
  const [graphType, setGraphType] = useState('bar');
  const [name, setName] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [scopeMode, setScopeMode] = useState('inherit');
  const [scopeDraft, setScopeDraft] = useState({ floor_ids: [], area_ids: [] });
  const [scopeTarget, setScopeTarget] = useState('location');
  const [areaGroupIds, setAreaGroupIds] = useState([]);
  const [groupScope, setGroupScope] = useState('');
  const [scopedGroupIds, setScopedGroupIds] = useState([]);

  const resetForm = () => {
    setPage('energy');
    setGraphType('bar');
    setName('');
    setApiPath('');
    setScopeMode('inherit');
    setScopeDraft({ floor_ids: [], area_ids: [] });
    setScopeTarget('location');
    setAreaGroupIds([]);
    setGroupScope('');
    setScopedGroupIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const multiFloorEnergy =
      page === 'energy' &&
      scopeMode === 'custom' &&
      Array.isArray(scopeDraft.floor_ids) &&
      scopeDraft.floor_ids.length >= 2;

    const payload = {
      page,
      graph_type: multiFloorEnergy ? 'bar' : graphType,
      name: trimmed,
      ...(apiPath.trim() ? { api_path: apiPath.trim() } : {}),
      ...(scopeMode === 'custom' && scopeTarget === 'location'
        ? pickCustomGraphScopeForStorage(scopeDraft)
        : {}),
      ...(scopeTarget === 'group'
        ? { is_area_group_widget: true, custom_area_group_ids: areaGroupIds }
        : {}),
      ...(isCustomGraphGroupScope(groupScope) ? { group_scope: groupScope } : {}),
      ...(isCustomGraphGroupScope(groupScope) && scopedGroupIds.length > 0
        ? { scoped_group_ids: scopedGroupIds.slice() }
        : {}),
    };

    try {
      await onSave?.(payload);
      resetForm();
    } catch {
      /* parent shows error */
    }
  };

  const formFields = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small" sx={fieldSx}>
        <FieldLabel
          useUsersModalShell={useUsersModalShell}
          labelTypographySx={labelTypographySx}
          shellLabelSx={shellLabelSx}
        >
          Page
        </FieldLabel>
        <Select
          value={page}
          onChange={(e) => setPage(e.target.value)}
          MenuProps={selectMenuProps}
          variant={selectVariant}
        >
          <MenuItem value="energy">Energy</MenuItem>
          <MenuItem value="space">Space Utilization</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={fieldSx}>
        <FieldLabel
          useUsersModalShell={useUsersModalShell}
          labelTypographySx={labelTypographySx}
          shellLabelSx={shellLabelSx}
        >
          Graph Type
        </FieldLabel>
        <Select
          value={graphType}
          onChange={(e) => setGraphType(e.target.value)}
          MenuProps={selectMenuProps}
          variant={selectVariant}
        >
          <MenuItem value="bar">Bar</MenuItem>
          <MenuItem value="pie">Pie</MenuItem>
          <MenuItem value="line">Line</MenuItem>
          <MenuItem value="table">Table</MenuItem>
        </Select>
      </FormControl>

      <Box>
        {useUsersModalShell ? (
          <FieldLabel
          useUsersModalShell={useUsersModalShell}
          labelTypographySx={labelTypographySx}
          shellLabelSx={shellLabelSx}
        >
            Graph Name
          </FieldLabel>
        ) : null}
        <TextField
          label={useUsersModalShell ? undefined : 'Graph Name'}
          placeholder={useUsersModalShell ? 'Graph Name' : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          fullWidth
          variant={textFieldVariant}
          sx={fieldSx}
          helperText="Display name for the chart. Data uses the default API for the selected page unless you set a custom API path."
          FormHelperTextProps={helperTypographySx ? { sx: helperTypographySx } : undefined}
        />
      </Box>

      <FormControl fullWidth size="small" sx={fieldSx}>
        <FieldLabel
          useUsersModalShell={useUsersModalShell}
          labelTypographySx={labelTypographySx}
          shellLabelSx={shellLabelSx}
        >
          API Path (optional)
        </FieldLabel>
        <Select
          value={apiPath}
          onChange={(e) => setApiPath(e.target.value)}
          displayEmpty
          MenuProps={selectMenuProps}
          variant={selectVariant}
        >
          <MenuItem value="">Auto (choose from name keywords)</MenuItem>
          {CUSTOM_GRAPH_API_PATH_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>
              {formatCustomGraphApiPathLabel(p)}
            </MenuItem>
          ))}
        </Select>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            mt: 0.5,
            ...helperTypographySx,
          }}
        >
          Selecting an API lets you use any graph name. If left on Auto, the API is inferred from the name.
        </Typography>
      </FormControl>

      <FormControl fullWidth size="small" sx={fieldSx}>
        <FieldLabel
          useUsersModalShell={useUsersModalShell}
          labelTypographySx={labelTypographySx}
          shellLabelSx={shellLabelSx}
        >
          Scope Target
        </FieldLabel>
        <Select
          value={scopeTarget}
          onChange={(e) => setScopeTarget(e.target.value)}
          MenuProps={selectMenuProps}
          variant={selectVariant}
        >
          <MenuItem value="location">Floors / Areas</MenuItem>
          <MenuItem value="group">Area Groups</MenuItem>
        </Select>
      </FormControl>

      {scopeTarget === 'location' ? (
        <Box
          sx={
            useUsersModalShell
              ? {
                  '& .MuiTypography-root': {
                    color: 'var(--settings-panel-text, #232323)',
                  },
                  '& .MuiFormControlLabel-label': {
                    color: 'var(--settings-panel-text, #232323)',
                  },
                  ...shellScopeTypographySx,
                }
              : undefined
          }
        >
          <CustomGraphScopeSection
            mode={scopeMode}
            onModeChange={setScopeMode}
            draft={scopeDraft}
            onDraftChange={setScopeDraft}
          />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            border: '1px solid var(--users-border, rgba(0,0,0,0.12))',
            borderRadius: 1,
            bgcolor: useUsersModalShell
              ? 'var(--users-modal-inner-bg, #ffffff)'
              : 'rgba(0,0,0,0.02)',
            ...shellGroupPanelSx,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              mb: 1,
              fontWeight: 600,
              color: useUsersModalShell ? 'var(--settings-panel-text, #1c2330)' : undefined,
              ...shellGroupPanelTitleSx,
            }}
          >
            Select Area Groups
          </Typography>
          <CustomGraphScopedGroupPicker
            groupScope="user_only"
            value={areaGroupIds}
            onChange={setAreaGroupIds}
            disabled={saving}
          />
        </Box>
      )}

      {errorMessage ? (
        <Typography sx={{ color: '#b91c1c', fontSize: 13 }}>{errorMessage}</Typography>
      ) : null}
    </Box>
  );

  const dialogActions = (
    <DialogActions sx={useUsersModalShell ? { px: 2, pb: 2, gap: 1 } : undefined}>
      <Button
        onClick={handleClose}
        variant={useUsersModalShell ? 'outlined' : 'text'}
        sx={
          useUsersModalShell
            ? {
                textTransform: 'none',
                borderColor: 'var(--app-button, #232323)',
                color: 'var(--app-button, #232323)',
                backgroundColor: 'var(--users-input-bg, #fff)',
                borderRadius: '8px',
              }
            : { textTransform: 'none' }
        }
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={!name.trim() || saving}
        sx={
          useUsersModalShell
            ? {
                backgroundColor: 'var(--app-button, #232323)',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                '&:hover': { backgroundColor: 'var(--app-button, #232323)', opacity: 0.92 },
                '&.Mui-disabled': { backgroundColor: '#9aa3b0', color: '#fff' },
              }
            : { textTransform: 'none', ...primaryActionSx }
        }
      >
        Save
      </Button>
    </DialogActions>
  );

  if (useUsersModalShell) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        BackdropProps={{ sx: { backgroundColor: 'transparent' } }}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            maxHeight: '80vh',
          },
        }}
      >
        <Box
          className="users-modal-shell"
          sx={{
            background: 'var(--users-modal-bg, #d6dde8)',
            borderRadius: '16px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--users-border, rgba(74, 67, 52, 0.28))',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...modalShellSx,
          }}
        >
          <DialogTitle sx={{ color: 'var(--settings-panel-text, #2c2820)', pb: 1, ...shellTitleSx }}>
            <Typography component="span" variant="h6" sx={{ display: 'block', fontWeight: 600 }}>
              Add New Graph
            </Typography>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              maxHeight: 'calc(80vh - 120px)',
              overflowY: 'auto',
              padding: 2,
              borderColor: 'var(--users-border, #C5CDD8)',
              ...shellContentSx,
            }}
          >
            {formFields}
          </DialogContent>
          {dialogActions}
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth {...dialogProps}>
      <DialogTitle>Add New Graph</DialogTitle>
      <DialogContent dividers>{formFields}</DialogContent>
      {dialogActions}
    </Dialog>
  );
}
