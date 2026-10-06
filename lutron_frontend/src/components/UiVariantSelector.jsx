import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import {
  fetchInstallationUiVariantSettings,
  getUiVariant,
  syncUiVariantToBackend,
  prepareUiVariantSwitch,
  patchInstallationUiVariantSettings,
  readUiVariantLockedLocal,
  writeUiVariantLockedLocal,
  UI_VARIANT_LABELS,
  UI_VARIANTS,
  isSuperAdminRole,
} from '../utils/uiVariant';
import { remapPathnameForVariant } from '../utils/variantRouteMap';
import { invalidateThemeSessionCaches } from '../shared/utils/bootstrapFetchGuards';

/**
 * Resolve role the same way Theme / UseAuth do: localStorage `role`, then JWT,
 * then Redux profile. Preferring profile alone hid the variant dropdown when
 * profile.role differed from the Superadmin token used for FOFP access.
 */
function resolveUserRole(profileRole) {
  try {
    const stored = localStorage.getItem('role');
    if (stored != null && String(stored).trim() !== '') {
      return stored;
    }
    const token = localStorage.getItem('lutron');
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded?.role != null && String(decoded.role).trim() !== '') {
        return decoded.role;
      }
    }
  } catch {
    /* ignore */
  }
  if (profileRole != null && String(profileRole).trim() !== '') {
    return profileRole;
  }
  return null;
}

/**
 * Theme settings: switch Basic / Advanced / Customized (full page reload).
 * Visible to Super Admin only.
 */
const lightChromeSelectSx = {
  color: '#000',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.4)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
  '& .MuiSvgIcon-root': { color: '#000' },
  '&.Mui-disabled': {
    color: 'rgba(0, 0, 0, 0.45)',
  },
};

/**
 * @param {{ lightChrome?: boolean, compact?: boolean }} props
 * When lightChrome is true, label/select/menu use dark text (white panel).
 * When compact is true, vertical spacing is reduced (basic theme page).
 */
export default function UiVariantSelector({ lightChrome = false, compact = false }) {
  const profileRole = useSelector((state) => state.user?.profile?.role);
  const role = useMemo(() => resolveUserRole(profileRole), [profileRole]);
  const canSwitchVariant = isSuperAdminRole(role);

  const [uiVariant, setUiVariantState] = useState(() => getUiVariant());
  const [variantLocked, setVariantLocked] = useState(() => readUiVariantLockedLocal());
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [lockSaving, setLockSaving] = useState(false);
  const [lockError, setLockError] = useState('');

  useEffect(() => {
    if (!canSwitchVariant) {
      setSettingsLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const settings = await fetchInstallationUiVariantSettings();
      if (cancelled) return;
      if (settings) {
        setVariantLocked(settings.ui_variant_locked);
        writeUiVariantLockedLocal(settings.ui_variant_locked);
        if (
          settings.ui_variant_locked &&
          settings.ui_variant &&
          UI_VARIANTS.includes(settings.ui_variant)
        ) {
          setUiVariantState(settings.ui_variant);
        }
      }
      setSettingsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [canSwitchVariant]);

  const handleChange = async (e) => {
    if (variantLocked) return;
    const next = e.target.value;
    if (next === uiVariant) return;
    prepareUiVariantSwitch(next);
    setUiVariantState(next);
    invalidateThemeSessionCaches();
    const { pathname, search, hash } = window.location;
    const remapped = remapPathnameForVariant(pathname, next);
    if (remapped !== pathname) {
      window.history.replaceState(null, '', `${remapped}${search}${hash}`);
    }
    await syncUiVariantToBackend(next);
    window.location.reload();
  };

  const handleLockToggle = async (event) => {
    const nextLocked = event.target.checked;
    setLockError('');
    setLockSaving(true);
    const updates = {
      ui_variant_locked: nextLocked,
      ...(nextLocked ? { ui_variant: uiVariant } : {}),
    };
    const merged = await patchInstallationUiVariantSettings(updates);
    setLockSaving(false);
    if (!merged) {
      setLockError('Could not save lock setting. Try again.');
      return;
    }
    setVariantLocked(nextLocked);
    writeUiVariantLockedLocal(nextLocked);
  };

  if (!canSwitchVariant) {
    return null;
  }

  const selectDisabled = variantLocked || settingsLoading || lockSaving;
  const helperText = variantLocked
    ? 'UI variant is locked. Unlock to switch Basic, Advanced, or Customized.'
    : 'Changing the variant reloads the application with the selected interface.';

  return (
    <Box sx={{ mb: compact ? 0.5 : 2, maxWidth: 420 }}>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 0.75,
          fontWeight: 600,
          color: lightChrome ? '#000' : 'text.primary',
        }}
      >
        Application interface
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
        <Select
          id="lutron-ui-variant-select"
          value={uiVariant}
          onChange={handleChange}
          disabled={selectDisabled}
          inputProps={{ 'aria-label': 'Application variant' }}
          sx={lightChrome ? lightChromeSelectSx : undefined}
          MenuProps={
            lightChrome
              ? {
                  PaperProps: {
                    sx: {
                      bgcolor: '#fff',
                      color: '#000',
                      '& .MuiMenuItem-root': { color: '#000' },
                      '& .MuiMenuItem-root.Mui-selected': {
                        backgroundColor: 'rgba(21, 101, 192, 0.08)',
                        color: '#000',
                      },
                    },
                  },
                }
              : undefined
          }
        >
          {UI_VARIANTS.map((key) => (
            <MenuItem key={key} value={key}>
              {UI_VARIANT_LABELS[key]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        sx={{
          ml: 0,
          alignItems: 'flex-start',
          color: lightChrome ? '#000' : 'text.primary',
          '& .MuiFormControlLabel-label': {
            color: lightChrome ? 'rgba(0, 0, 0, 0.85)' : 'text.primary',
            fontSize: 14,
            lineHeight: 1.4,
          },
        }}
        control={
          <Switch
            checked={variantLocked}
            disabled={settingsLoading || lockSaving}
            onChange={handleLockToggle}
            color="primary"
            inputProps={{ 'aria-label': 'Lock UI variant' }}
          />
        }
        label={
          lockSaving
            ? 'Saving lock…'
            : variantLocked
              ? 'Lock UI variant (locked — switching disabled)'
              : 'Lock UI variant (allow switching)'
        }
      />

      {lockError ? (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {lockError}
        </Typography>
      ) : null}

      <Typography
        variant="caption"
        color={lightChrome ? 'text.primary' : 'text.secondary'}
        sx={{
          mt: 0.5,
          display: 'block',
          ...(lightChrome ? { color: 'rgba(0, 0, 0, 0.6)' } : {}),
        }}
      >
        {helperText}
      </Typography>
    </Box>
  );
}
