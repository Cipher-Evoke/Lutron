import React, { useMemo, useState } from 'react';
import { createSingleFlight } from '../../../../../shared/utils/createSingleFlight';
import { toSafeReactText } from '../../../../../utils/safeReactText';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { darken } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';

import {
  manualAddProcessor,
  scanProcessorsByIp,
} from '../../../redux/slice/processor/processorSlice';
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { getProcessorsTableHeaderStyles } from './processorsTableStyles';

/**
 * Dialog used in Settings → Processors → "Add by IP".
 */
const AddByIpDialog = ({ open, onClose, onAdded }) => {
  const dispatch = useDispatch();
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const { rowSx: headerRowSx, cellSx: processorsTableHeaderSx } =
    getProcessorsTableHeaderStyles(appTheme);

  const [rawIps, setRawIps] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [rowDetails, setRowDetails] = useState({});

  const addedCount = useMemo(
    () => results.filter((r) => r.reachable && r.processor_id).length,
    [results],
  );

  const resetState = () => {
    setRawIps('');
    setResults([]);
    setError('');
    setScanning(false);
    setRowDetails({});
  };

  const handleClose = () => {
    if (scanning) return;
    if (addedCount > 0 && typeof onAdded === 'function') {
      onAdded(addedCount);
    }
    resetState();
    onClose?.();
  };

  const handleScan = async () => {
    const text = rawIps.trim();
    if (!text) {
      setError('Paste at least one IPv4 address.');
      return;
    }
    setError('');
    setScanning(true);
    try {
      const data = await dispatch(scanProcessorsByIp({ raw: text })).unwrap();
      const list = Array.isArray(data) ? data : [];
      setResults(list);
      const seed = {};
      list.forEach((_, idx) => {
        seed[idx] = {
          system: '',
          serial: '',
          mac: '',
          saving: false,
          saved: false,
          error: '',
        };
      });
      setRowDetails(seed);
      if (list.length === 0) {
        setError('No valid IPv4 addresses were found in the input.');
      }
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Scan failed.');
      setResults([]);
      setRowDetails({});
    } finally {
      setScanning(false);
    }
  };

  const updateRowField = (idx, field, value) => {
    setRowDetails((prev) => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || {}),
        [field]: value,
        saved: false,
        error: '',
      },
    }));
  };

  const runSaveRowOnce = useMemo(() => createSingleFlight(), []);
  const handleSaveRow = (idx, row) =>
    runSaveRowOnce(async () => {
    const detail = rowDetails[idx] || {};
    const system = (detail.system || '').trim();
    const serial = (detail.serial || '').trim();
    const mac = (detail.mac || '').trim();

    if (!system && !serial && !mac) {
      setRowDetails((prev) => ({
        ...prev,
        [idx]: {
          ...(prev[idx] || {}),
          error: 'Fill at least one field before saving.',
          saved: false,
        },
      }));
      return;
    }

    setRowDetails((prev) => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), saving: true, error: '', saved: false },
    }));

    try {
      await dispatch(
        manualAddProcessor({ ipv4: row.ip, system, serial, mac }),
      ).unwrap();
      setRowDetails((prev) => ({
        ...prev,
        [idx]: { ...(prev[idx] || {}), saving: false, saved: true, error: '' },
      }));
    } catch (e) {
      setRowDetails((prev) => ({
        ...prev,
        [idx]: {
          ...(prev[idx] || {}),
          saving: false,
          saved: false,
          error: typeof e === 'string' ? e : 'Save failed.',
        },
      }));
    }
  });

  const renderStatusChip = (row) => {
    if (row.reachable && row.processor_id) {
      return <Chip label="Added" color="success" size="small" />;
    }
    if (row.reachable) {
      return <Chip label="Reachable" color="info" size="small" />;
    }
    return <Chip label="Unreachable" color="default" size="small" variant="outlined" />;
  };

  const renderPortChip = (ok) =>
    ok ? (
      <Chip label="OK" color="success" size="small" />
    ) : (
      <Chip label="—" size="small" variant="outlined" />
    );

  const inputSx = { '& .MuiInputBase-input': { fontSize: 12, py: 0.6 } };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Add Processors by IP</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          Paste one IPv4 address per line (commas accepted). The server will
          check LEAP (8081) and LAP (8083); reachable processors are added to
          the table. After scanning you can optionally fill in System / Serial
          / MAC for each added row — providing MAC is recommended because the
          post-handshake enrichment uses it to populate model and area.
        </Typography>

        <TextField
          label="Static IPv4 addresses"
          placeholder={'172.24.20.143\n172.24.21.135\n172.24.21.136'}
          value={rawIps}
          onChange={(e) => setRawIps(e.target.value)}
          multiline
          minRows={4}
          maxRows={10}
          fullWidth
          disabled={scanning}
          sx={{ mb: 1.5 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {toSafeReactText(error)}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleScan}
            disabled={scanning}
            startIcon={scanning ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: buttonColor,
              color: '#fff',
              textTransform: 'none',
              '&:hover': { backgroundColor: darken(buttonColor, 0.12) },
            }}
          >
            {scanning ? 'Scanning…' : 'Scan & Add'}
          </Button>
        </Box>

        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 1, overflow: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1080 }}>
              <TableHead>
                <TableRow sx={headerRowSx}>
                  {[
                    'IP',
                    'LEAP 8081',
                    'LAP 8083',
                    'Latency (ms)',
                    'Status',
                    'System',
                    'Serial',
                    'MAC',
                    'Save',
                  ].map((h) => (
                    <TableCell key={h} sx={processorsTableHeaderSx}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, idx) => {
                  const d = rowDetails[idx] || {};
                  const editable = row.reachable && row.processor_id;
                  const saving = !!d.saving;
                  const saved = !!d.saved;
                  return (
                    <TableRow
                      key={`${row.ip}-${idx}`}
                      sx={{
                        '&:nth-of-type(odd) td': { backgroundColor: '#fafafa' },
                        '&:nth-of-type(even) td': { backgroundColor: '#fff' },
                      }}
                    >
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {row.ip}
                      </TableCell>
                      <TableCell align="center">{renderPortChip(row.leap_8081)}</TableCell>
                      <TableCell align="center">{renderPortChip(row.lap_8083)}</TableCell>
                      <TableCell align="center">
                        {row.latency_ms !== null && row.latency_ms !== undefined
                          ? row.latency_ms
                          : '—'}
                      </TableCell>
                      <TableCell align="center">{renderStatusChip(row)}</TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          variant="outlined"
                          placeholder="AthenaProcessor"
                          value={d.system || ''}
                          disabled={!editable || saving}
                          onChange={(e) => updateRowField(idx, 'system', e.target.value)}
                          sx={{ ...inputSx, minWidth: 140 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          variant="outlined"
                          placeholder="092F3D7B"
                          value={d.serial || ''}
                          disabled={!editable || saving}
                          onChange={(e) => updateRowField(idx, 'serial', e.target.value)}
                          sx={{ ...inputSx, minWidth: 120 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          variant="outlined"
                          placeholder="44:6b:1f:1f:9f:a2"
                          value={d.mac || ''}
                          disabled={!editable || saving}
                          onChange={(e) => updateRowField(idx, 'mac', e.target.value)}
                          sx={{ ...inputSx, minWidth: 150 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {editable ? (
                          <Button
                            size="small"
                            variant={saved ? 'outlined' : 'contained'}
                            color={saved ? 'success' : 'primary'}
                            onClick={() => handleSaveRow(idx, row)}
                            disabled={saving}
                            startIcon={
                              saving ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : saved ? (
                                <CheckIcon fontSize="small" />
                              ) : null
                            }
                            sx={{
                              minWidth: 88,
                              textTransform: 'none',
                              ...(saved
                                ? {}
                                : {
                                    backgroundColor: buttonColor,
                                    '&:hover': {
                                      backgroundColor: darken(buttonColor, 0.12),
                                    },
                                  }),
                            }}
                          >
                            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                        {d.error && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            {d.error}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {results.length > 0 && (
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
            {addedCount} of {results.length} reachable and added.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={scanning} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddByIpDialog;
