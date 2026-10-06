import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import HexColorPicker from '../../../utils/HexColorPicker';
import { createSingleFlight } from '../../../../../shared/utils/createSingleFlight';
import { buildFofpThemeSaveKey } from '../../../../../shared/utils/themeSettingsSaveKey';
import {
    fetchFofpConfig,
    updateFofpConfig,
    selectFofpConfig,
    selectFofpConfigError,
} from '../../../redux/slice/fofp/fofpSlice';
import {
    DEFAULT_FOFP_MARKER_COLOR,
    normalizeFofpHex,
    resolveFofpThemePickerColor,
} from '../../heatmap/fofpColorUtils';
import {
    CUSTOMIZED_THEME_PICKER_HEX,
    themePickerCardCellSx,
    themePickerCardColumnSx,
    themePickerCardSx,
} from './themePickerLayout';

/**
 * FOFP marker color card for Settings → Theme (isolated from app/heatmap pickers).
 */
const FofpThemeColorCard = ({
    renderTabs,
    dynamicButtonColor,
    actionButtonLabel,
    onSaveMessage,
}) => {
    const dispatch = useDispatch();
    const runSaveOnce = useMemo(() => createSingleFlight(), []);
    const lastSavedKeyRef = useRef(null);
    const fofpConfig = useSelector(selectFofpConfig);
    const fofpConfigError = useSelector(selectFofpConfigError);
    const [activeFofpTab, setActiveFofpTab] = useState('FOFP');
    const [saving, setSaving] = useState(false);
    const [fofpColorMap, setFofpColorMap] = useState({
        FOFP: DEFAULT_FOFP_MARKER_COLOR,
    });
    const [selectedFofpColor, setSelectedFofpColor] = useState(DEFAULT_FOFP_MARKER_COLOR);

    useEffect(() => {
        dispatch(fetchFofpConfig());
    }, [dispatch]);

    useEffect(() => {
        if (fofpConfig?.marker_color) {
            const hex = normalizeFofpHex(fofpConfig.marker_color);
            setFofpColorMap({ FOFP: hex });
            setSelectedFofpColor(hex);
            lastSavedKeyRef.current = buildFofpThemeSaveKey(hex);
        }
    }, [fofpConfig?.marker_color]);

    const handleFofpColorSave = async () => runSaveOnce(async () => {
        const color = resolveFofpThemePickerColor(fofpColorMap.FOFP);
        const saveKey = buildFofpThemeSaveKey(color);
        if (lastSavedKeyRef.current === saveKey) {
            onSaveMessage('No changes to save');
            return;
        }
        setSaving(true);
        try {
            const saved = await dispatch(updateFofpConfig({ marker_color: color })).unwrap();
            const hex = normalizeFofpHex(saved?.marker_color || color);
            setFofpColorMap({ FOFP: hex });
            setSelectedFofpColor(hex);
            lastSavedKeyRef.current = buildFofpThemeSaveKey(hex);
            onSaveMessage('FOFP color saved successfully.');
        } catch {
            onSaveMessage('Failed to save FOFP color.');
        } finally {
            setSaving(false);
        }
    });

    return (
        <Box sx={themePickerCardCellSx}>
            <Box sx={themePickerCardColumnSx}>
            <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ color: 'text.primary', mb: 1, minHeight: 28, lineHeight: 1.4, visibility: 'hidden' }}
                aria-hidden
            >
                &nbsp;
            </Typography>
            <Box
                className="color-picker-card"
                sx={themePickerCardSx}
                data-testid="fofp-theme-color-card"
            >
                {renderTabs(
                    ['FOFP'],
                    activeFofpTab,
                    setActiveFofpTab,
                    fofpColorMap,
                    setSelectedFofpColor
                )}
                {fofpConfigError && (
                    <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: 'block', mb: 1 }}
                        data-testid="fofp-theme-config-error"
                    >
                        {fofpConfigError}
                    </Typography>
                )}
                <HexColorPicker
                    colorMap={fofpColorMap}
                    setColorMap={setFofpColorMap}
                    selectedColor={selectedFofpColor}
                    setSelectedColor={setSelectedFofpColor}
                    activeTarget={activeFofpTab}
                    width={CUSTOMIZED_THEME_PICKER_HEX.width}
                    height={CUSTOMIZED_THEME_PICKER_HEX.height}
                    hexRadius={CUSTOMIZED_THEME_PICKER_HEX.hexRadius}
                />
                <Box mt={2} display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 40 }}>
                    <Button
                        className="save-button"
                        onClick={handleFofpColorSave}
                        disabled={saving}
                        data-testid="fofp-theme-color-save"
                        sx={{
                            backgroundColor: dynamicButtonColor,
                            color: actionButtonLabel,
                            fontWeight: 'bold',
                            px: 4,
                            py: 1,
                            borderRadius: 1,
                        }}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </Box>
            </Box>
            </Box>
        </Box>
    );
};

export default FofpThemeColorCard;
