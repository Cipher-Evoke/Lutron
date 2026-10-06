import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, CircularProgress } from '@mui/material';
import AreaSizeLoadTree from './AreaSizeLoadTree';
import SettingsLayout from '../settings/SettingsLayout';
import { areaSizeMuted, areaSizePageShellSx, areaSizeText } from '../../utils/areaSizeLoadStyles';

const AreaSizeLoad = () => {
    const isLoading = useSelector((state) => state.groupOccupancy?.loading || false);
    const areaData = useSelector((state) => state.groupOccupancy?.areaLoad);
    const hasData = areaData && (areaData.floors?.length > 0 || areaData.total);

    return (
        <SettingsLayout>
            <Box sx={areaSizePageShellSx}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: areaSizeText,
                                mb: 2,
                                fontWeight: 600,
                                fontSize: { xs: 18, sm: 20, md: 22 },
                                letterSpacing: 0.3,
                                flexShrink: 0,
                            }}
                        >
                            Area Details
                        </Typography>

                        {isLoading && !hasData ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 220,
                                    flex: 1,
                                    flexDirection: 'column',
                                    gap: 2,
                                    borderRadius: '12px',
                                    border: '1px solid var(--settings-panel-border, #C5CDD8)',
                                    backgroundColor: 'var(--users-table-container-bg, #d6dde8)',
                                }}
                            >
                                <CircularProgress
                                    size={48}
                                    sx={{ color: 'var(--app-button, #3d4a5c)' }}
                                />
                                <Typography variant="body1" sx={{ color: areaSizeMuted, fontSize: 16 }}>
                                    Calculating area data...
                                </Typography>
                            </Box>
                        ) : (
                            <AreaSizeLoadTree />
                        )}
            </Box>
        </SettingsLayout>
    );
};

export default AreaSizeLoad;
