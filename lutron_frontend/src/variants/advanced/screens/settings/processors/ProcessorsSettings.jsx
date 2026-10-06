import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  CircularProgress,
  Alert,
  Snackbar,
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { UseAuth } from '../../../customhooks/UseAuth';
import SettingsLayout from '../SettingsLayout';
import {
  fetchProcessorsListAll,
  discoverProcessors,
  toggleHandshakeStatus,
  processorHandshake,
  pingProcessorTerminal,
} from '../../../redux/slice/processor/processorSlice';
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { darken } from '@mui/material/styles';
import AddByIpDialog from './AddByIpDialog';
import { getProcessorsTableHeaderCellSx } from './processorsTableStyles';
import { getThemeButtonColor } from '../../../utils/themePageBackground';

const ProcessorsSettings = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { role: currentUserRole } = UseAuth();

  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const processorsTableHeaderSx = getProcessorsTableHeaderCellSx();

  const { processorsListAll, listAllStatus, listAllError, discoverStatus } = useSelector(
    (state) => state.processor
  );

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [handshakeProcessorId, setHandshakeProcessorId] = useState(null);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [pingBusyId, setPingBusyId] = useState(null);
  const [addByIpOpen, setAddByIpOpen] = useState(false);

  const pageBusy = handshakeProcessorId !== null;
  const listLoading = listAllStatus === 'loading';
  const discoverLoading = discoverStatus === 'loading';

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadList = useCallback(() => {
    dispatch(fetchProcessorsListAll());
  }, [dispatch]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleDiscover = async () => {
    const result = await dispatch(discoverProcessors());
    if (discoverProcessors.fulfilled.match(result)) {
      showSnackbar('Discovery completed.', 'success');
      dispatch(fetchProcessorsListAll());
    } else {
      const msg = result.payload?.message || 'No processor found.';
      showSnackbar(msg, result.payload?.status === 404 ? 'info' : 'error');
    }
  };

  const handleRefresh = () => {
    loadList();
  };

  const handleToggleHandshake = async (row) => {
    if (row.handshake_status === null || pageBusy || toggleBusyId === row.id) return;
    setToggleBusyId(row.id);
    try {
      await dispatch(toggleHandshakeStatus(row.id)).unwrap();
      showSnackbar('Handshake status updated.', 'success');
      loadList();
    } catch (e) {
      showSnackbar(typeof e === 'string' ? e : 'Could not toggle handshake status.', 'error');
    } finally {
      setToggleBusyId(null);
    }
  };

  const handleHandshake = async (processorId) => {
    if (pageBusy) return;
    setHandshakeProcessorId(processorId);
    try {
      const data = await dispatch(processorHandshake(processorId)).unwrap();
      const msg = data?.message || 'Certificate handshake completed successfully.';
      showSnackbar(msg, 'success');
      loadList();
    } catch (e) {
      const text = typeof e === 'string' ? e : 'Handshake failed.';
      const isTimeout =
        text.toLowerCase().includes('timeout') || text.toLowerCase().includes('timed out');
      showSnackbar(text, isTimeout ? 'warning' : 'error');
      loadList();
    } finally {
      setHandshakeProcessorId(null);
    }
  };

  const handlePing = async (processorId) => {
    if (pageBusy || pingBusyId !== null) return;
    setPingBusyId(processorId);
    try {
      await dispatch(pingProcessorTerminal(processorId)).unwrap();
      showSnackbar('Ping terminal started on the API server (if supported).', 'success');
    } catch (e) {
      showSnackbar(typeof e === 'string' ? e : 'Ping terminal failed.', 'error');
    } finally {
      setPingBusyId(null);
    }
  };

  return (
    <>
      {pageBusy && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal - 1,
            backgroundColor: 'rgba(0,0,0,0.15)',
            pointerEvents: 'all',
          }}
        />
      )}

      <SettingsLayout>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MemoryIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '14px', sm: '16px', md: '18px' },
                    }}
                  >
                    Processors
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleDiscover}
                    disabled={pageBusy || discoverLoading || listLoading}
                    startIcon={discoverLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                    sx={{
                      backgroundColor: buttonColor,
                      color: '#fff',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: darken(buttonColor, 0.12) },
                    }}
                  >
                    {discoverLoading ? 'Discovering…' : 'Discover Processor'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setAddByIpOpen(true)}
                    disabled={pageBusy || listLoading}
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: buttonColor,
                      color: '#fff',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: darken(buttonColor, 0.12) },
                    }}
                  >
                    Add by IP
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleRefresh}
                    disabled={pageBusy || listLoading}
                    startIcon={<RefreshIcon />}
                    sx={{
                      backgroundColor: buttonColor,
                      color: '#fff',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: darken(buttonColor, 0.12) },
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {listAllError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {listAllError}
                </Alert>
              )}

              {listLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!listLoading && !listAllError && processorsListAll.length > 0 && (
                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: 1,
                    boxShadow: 1,
                    overflow: 'auto',
                    maxHeight: 640,
                    backgroundColor: 'var(--users-table-container-bg, #fff)',
                    border: '1px solid var(--users-border, #C5CDD8)',
                  }}
                >
                  <Table size="small" sx={{ minWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        {['SI.NO', 'IPv4', 'System', 'Serial', 'Handshake status', 'Handshake', 'Ping'].map(
                          (h) => (
                            <TableCell key={h} sx={processorsTableHeaderSx}>
                              {h}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {processorsListAll.map((row, index) => {
                        const sid = row.id;
                        const hs = row.handshake_status;
                        const toggleDisabled =
                          hs === null || hs === undefined || pageBusy || toggleBusyId === sid;
                        const switchChecked = hs === true;
                        const rowHandshakeLoading = handshakeProcessorId === sid;
                        return (
                          <TableRow
                            key={sid ?? index}
                            sx={{
                              '&:nth-of-type(odd) td': { backgroundColor: 'var(--users-table-row-bg, #fafafa)' },
                              '&:nth-of-type(even) td': { backgroundColor: 'var(--users-table-row-bg, #fff)' },
                              '&:hover td': { backgroundColor: 'rgba(0,0,0,0.03)' },
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {sid}
                            </TableCell>
                            <TableCell align="center">{row.ipv4 ?? '—'}</TableCell>
                            <TableCell align="center">{row.system ?? '—'}</TableCell>
                            <TableCell align="center">{row.serial ?? '—'}</TableCell>
                            <TableCell align="center">
                              <Switch
                                checked={switchChecked}
                                disabled={toggleDisabled}
                                onChange={() => handleToggleHandshake(row)}
                                inputProps={{
                                  'aria-label': `Handshake status for processor ${sid}`,
                                }}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#81c784',
                                  },
                                  '& .MuiSwitch-switchBase': { color: hs === false ? '#c62828' : undefined },
                                  '& .MuiSwitch-track':
                                    hs === false ? { backgroundColor: '#ffcdd2' } : undefined,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="contained"
                                size="small"
                                disabled={pageBusy || rowHandshakeLoading}
                                onClick={() => handleHandshake(sid)}
                                sx={{
                                  minWidth: 130,
                                  backgroundColor: buttonColor,
                                  textTransform: 'none',
                                  '&:hover': { backgroundColor: darken(buttonColor, 0.12) },
                                }}
                              >
                                {rowHandshakeLoading ? (
                                  <>
                                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                                    Handshaking…
                                  </>
                                ) : (
                                  'Handshake'
                                )}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={pageBusy || pingBusyId !== null}
                                onClick={() => handlePing(sid)}
                                sx={{
                                  minWidth: 88,
                                  textTransform: 'none',
                                  borderColor: '#8d7b5e',
                                  color: '#5d4d38',
                                }}
                              >
                                {pingBusyId === sid ? <CircularProgress size={16} /> : 'Ping'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {!listLoading && !listAllError && processorsListAll.length === 0 && (
                <Box
                  sx={{
                    py: 6,
                    textAlign: 'center',
                    color: 'text.secondary',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Typography>No processors in the database.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Use Discover Processor to scan the network.
                  </Typography>
                </Box>
              )}
      </SettingsLayout>

      <AddByIpDialog
        open={addByIpOpen}
        onClose={() => setAddByIpOpen(false)}
        onAdded={(count) => {
          if (count > 0) {
            showSnackbar(
              `${count} processor${count === 1 ? '' : 's'} added.`,
              'success',
            );
            loadList();
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProcessorsSettings;
