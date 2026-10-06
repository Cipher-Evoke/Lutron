import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAreaScenes, selectAreaScenes } from "../../redux/slice/settingsslice/heatmap/areaSettingsSlice";
import { BaseUrl } from "../../BaseUrl";
import { Box, Typography, Button, Slider } from "@mui/material";
import PaginatedList from '../../utils/PaginatedList';
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";

const Action = ({ areaId, onActionSelect, initialAction = null }) => {
  const dispatch = useDispatch();
  const areaScenes = useSelector(selectAreaScenes) || [];
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  
  // Action type and selection states
  const [selectedAction, setSelectedAction] = useState(initialAction?.type || "scene");
  const [selectedScene, setSelectedScene] = useState(initialAction?.scene || null);
  const [selectedOccupancy, setSelectedOccupancy] = useState(initialAction?.action || null);
  
  // Zone states
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState(null);
  // State for selected zone and its values
  const [selectedZoneId, setSelectedZoneId] = useState(initialAction?.zone?.id || "");
  // FIXED: Use flat structure for smooth slider updates
  const [zoneValues, setZoneValues] = useState(initialAction?.values || {});
  
  // Shade states
  const [shades, setShades] = useState([]);
  const [shadeValue, setShadeValue] = useState(initialAction?.value || 100);
  const [shadesLoading, setShadesLoading] = useState(false);
  const [shadesError, setShadesError] = useState(null);
  const [selectedShadeId, setSelectedShadeId] = useState(initialAction?.shade?.id ? String(initialAction.shade.id) : "");

  // Initialize with initialAction if provided
  useEffect(() => {
    if (initialAction) {
      setSelectedAction(initialAction.type);
      
      if (initialAction.type === "scene" && initialAction.scene) {
        setSelectedScene(initialAction.scene);
      } else if (initialAction.type === "zone" && initialAction.zone) {
        setSelectedZoneId(String(initialAction.zone.id));
        // FIXED: Set zone values directly for smooth slider updates - NO DEFAULTS
        if (initialAction.values) {
          const initialValues = {
            on_off: initialAction.values.on_off || 'On',
            // Only set brightness if it's actually provided
            brightness: initialAction.values.brightness !== undefined ? Number(initialAction.values.brightness) : undefined,
            // Only set cct if it's actually provided
            cct: initialAction.values.cct !== undefined ? Number(initialAction.values.cct) : undefined,
            fadeTime: initialAction.values.fadeTime || '02',
            delayTime: initialAction.values.delayTime || '00'
          };
          setZoneValues(initialValues);
        }
      } else if (initialAction.type === "occupancy" && initialAction.action) {
        setSelectedOccupancy(initialAction.action);
      } else if (initialAction.type === "shade" && initialAction.shade) {
        setSelectedShadeId(String(initialAction.shade.id));
        if (initialAction.value !== undefined) {
          // FIXED: Ensure shade value is properly converted to number
          const shadeValue = Number(initialAction.value);
          setShadeValue(shadeValue);
        }
      }
    }
  }, [initialAction]);

  // Auto-select first zone when zones are loaded and no zone is selected
  useEffect(() => {
    if (selectedAction === "zone" && zones.length > 0 && !selectedZoneId && !initialAction) {
      const firstZone = zones[0];
      handleZoneSelect(firstZone.id || firstZone.zone_id);
    }
  }, [zones, selectedAction, initialAction]);

  // When a zone is selected, initialize its values - FIXED to not override existing values
  useEffect(() => {
    if (selectedZoneId && zones.length > 0) {
      const zone = zones.find(z => String(z.id) === String(selectedZoneId));
      if (zone) {
        setZoneValues(prev => ({
          ...prev,
          // Only set defaults if the value is not already set (for editing existing actions)
          brightness: prev.brightness !== undefined ? prev.brightness : (zone.brightness_min ?? 0),
          cct: prev.cct !== undefined ? prev.cct : (zone.cct_min ?? 2700),
          fadeTime: prev.fadeTime ?? "02",
          delayTime: prev.delayTime ?? "00",
        }));
      }
    }
  }, [selectedZoneId, zones]);

  useEffect(() => {
    // Only reset if no initialAction is provided
    if (!initialAction) {
      setSelectedScene(null);
      setZoneValues({});
      setSelectedZoneId("");
      setSelectedOccupancy(null);
    }
    
    if (selectedAction === "scene" && areaId) {
      dispatch(fetchAreaScenes(Number(areaId)));
    }
    if (selectedAction === "zone" && areaId) {
      setZones([]);
      setZonesLoading(true);
      setZonesError(null);
      BaseUrl.post("/area/zone_status", { area_id: areaId })
        .then(res => {
          // Only show non-shade zones
          setZones((res.data?.zones || []).filter(z => (z.type || '').toLowerCase() !== 'shade'));
          setZonesLoading(false);
        })
        .catch(err => {
          setZonesError("Failed to fetch zones");
          setZonesLoading(false);
        });
    }
    if (selectedAction === "shade" && areaId) {
      setShades([]);
      setShadesLoading(true);
      setShadesError(null);
      BaseUrl.post("/area/zone_status", { area_id: areaId })
        .then(res => {
          // Only show shade zones
          setShades((res.data?.zones || []).filter(z => (z.type || '').toLowerCase() === 'shade'));
          setShadesLoading(false);
        })
        .catch(err => {
          setShadesError("Failed to fetch shades");
          setShadesLoading(false);
        });
    }
  }, [selectedAction, areaId, dispatch, initialAction]);

  // Auto-select first scene when scenes are loaded and no scene is selected
  useEffect(() => {
    if (selectedAction === "scene" && areaScenes.length > 0 && !selectedScene && !initialAction) {
      handleSceneSelect(areaScenes[0]);
    }
  }, [areaScenes, selectedAction, initialAction]);

  // Handler for action type change
  const handleActionChange = (e) => {
    const newValue = e.target.value;
    setSelectedAction(newValue);
    setSelectedScene(null);
    setZoneValues({});
    setSelectedZoneId("");
    setSelectedOccupancy(null);
    
    // Always reset parent selection when action type changes
    onActionSelect(null); // Reset parent selection
  };

  // Handler for scene selection
  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    onActionSelect({ type: "scene", scene }); // scene contains id and name
  };

  // FIXED: Zone value change handler for smooth slider updates
  const handleZoneValueChange = (changed) => {
    const updatedValues = {
      ...zoneValues,
      ...changed
    };
    
    setZoneValues(updatedValues);
    
    // Only notify parent for non-slider changes (fade/delay time) to prevent lag
    if (changed.fadeTime || changed.delayTime) {
      const zone = zones.find(z => String(z.id || z.zone_id) === String(selectedZoneId));
      if (zone) {
        onActionSelect({
          type: "zone",
          zone: zone,
          values: updatedValues
        });
      }
    }
  };

  // FIXED: Separate handler for slider changes that only updates local state
  const handleSliderChange = (type, value) => {
    const updatedValues = {
      ...zoneValues,
      [type]: value
    };

    setZoneValues(updatedValues);
  };

  // FIXED: Handler for when slider is released to notify parent
  const handleSliderChangeCommitted = (type, value) => {
    const updatedValues = {
      ...zoneValues,
      [type]: value
    };

    const zone = zones.find(z => String(z.id || z.zone_id) === String(selectedZoneId));
    if (zone) {
      onActionSelect({
        type: "zone",
        zone: zone,
        values: updatedValues
      });
    }
  };

  // Update the zone selection handler - FIXED to notify parent immediately
  const handleZoneSelect = (zoneId) => {
    const zone = zones.find(z => String(z.id || z.zone_id) === String(zoneId));
    if (!zone) return;
    
    setSelectedZoneId(String(zoneId));
    
    // Initialize zone values and notify parent immediately
    const initialValues = {
      on_off: zone.status || zone.on_off || 'On',
      brightness: zone.brightness_min !== undefined ? zone.brightness_min : undefined, // Don't default to 50
      cct: zone.cct_min !== undefined ? zone.cct_min : undefined, // Don't default to 2700
      fadeTime: '02',
      delayTime: '00'
    };
    
    setZoneValues(initialValues);
    
    // Notify parent immediately with initial values
    onActionSelect({
      type: "zone",
      zone: zone,
      values: initialValues
    });
  };

  // Handler for occupancy selection
  const handleOccupancySelect = (action) => {
    setSelectedOccupancy(action);
    onActionSelect({ type: "occupancy", action });
  };

  // Handler for shade group selection
  const handleShadeSelect = (shadeId) => {
    setSelectedShadeId(shadeId);
    setShadeValue(0); // Reset value on group change
    onActionSelect(null); // Reset parent
  };

  // Auto-select first shade when shades are loaded and no shade is selected
  useEffect(() => {
    if (selectedAction === "shade" && shades.length > 0 && !selectedShadeId && !initialAction) {
      const firstShade = shades[0];
      handleShadeSelect(String(firstShade.id || firstShade.zone_id));
    }
  }, [shades, selectedAction, initialAction]);

  // FIXED: Updated shade value change handler to immediately notify parent
  const handleShadeValueChange = (val) => {
    setShadeValue(val);
    if (selectedShadeId) {
      const selected = shades.find(s => String(s.id || s.zone_id) === String(selectedShadeId));
      if (selected) {
        const action = {
          type: "shade",
          shade: selected,
          value: val
        };
        onActionSelect(action);
      }
    }
  };

  // FIXED: Use exact same handler as HeatMap.jsx - NO ROUNDING
  const handleShadeSliderChange = (newValue) => {
    setShadeValue(newValue);
    
    if (selectedShadeId) {
      const selected = shades.find(s => String(s.id || s.zone_id) === String(selectedShadeId));
      if (selected) {
        const action = {
          type: "shade",
          shade: selected,
          value: newValue
        };
        onActionSelect(action);
      }
    }
  };

  return (
    <div style={{ minWidth: 300, color: "#222", fontFamily: "inherit" }}>
      <select
        id="action-select"
        value={selectedAction}
        onChange={handleActionChange}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid",
          background: "white",
          marginBottom: 16
        }}
      >
        <option value="scene">Scene</option>
        <option value="zone">Zone</option>
        <option value="occupancy">Occupancy</option>
        <option value="shade">Shade</option>
      </select>

      {selectedAction === "scene" && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Area Scenes</div>
          {Array.isArray(areaScenes) && areaScenes.length > 0 ? (
            <PaginatedList
              items={areaScenes}
              pageSize={6}
              renderItem={scene => (
                <li
                  key={scene.id || scene.scene_id}
                  style={{
                    padding: "6px 10px",
                    marginBottom: 4,
                    borderRadius: 4,
                    background: selectedScene && (selectedScene.id || selectedScene.scene_id) === (scene.id || scene.scene_id) ? "#a89c81" : "#f7f4ed",
                    color: selectedScene && (selectedScene.id || selectedScene.scene_id) === (scene.id || scene.scene_id) ? "#fff" : "#222",
                    cursor: "pointer",
                    border: "1px solid #a89c81"
                  }}
                  onClick={() => handleSceneSelect(scene)}
                >
                  {scene.name}
                </li>
              )}
              style={{ listStyle: "none", padding: 0, margin: 0, minHeight: 6 * 32 }}
            />
          ) : (
            <div style={{ color: "#a89c81", fontWeight: 500 }}>No scenes found for this area.</div>
          )}
        </div>
      )}

      {selectedAction === "zone" && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Zone</div>
          {zonesLoading && <div style={{ color: "#a89c81" }}>Loading zones...</div>}
          {zonesError && <div style={{ color: "red" }}>{zonesError}</div>}
          {!zonesLoading && !zonesError && (
            zones && zones.length > 0 ? (
              <>
                <select
                  value={selectedZoneId}
                  onChange={e => handleZoneSelect(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: `2px solid ${buttonColor}`,
                    marginBottom: 16,
                    fontSize: 16
                  }}
                >
                  {zones.map(z => (
                    <option key={z.id || z.zone_id} value={z.id || z.zone_id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                {selectedZoneId && (() => {
                  const zoneObj = zones.find(z => String(z.id || z.zone_id) === String(selectedZoneId));
                  if (!zoneObj) return null;

                  const brightnessMin = zoneObj.brightness_min ?? 0;
                  const brightnessMax = zoneObj.brightness_max ?? 100;
                  const cctMin = zoneObj.cct_min ?? 2700;
                  const cctMax = zoneObj.cct_max ?? 7000;
                  
                  // FIXED: Use actual zoneValues without any defaults - this is the key fix
                  const safeValues = {
                    on_off: zoneValues?.on_off || zoneObj.status || zoneObj.on_off || 'Off',
                    brightness: zoneValues?.brightness, // Use actual value, no default
                    cct: zoneValues?.cct, // Use actual value, no default
                    fadeTime: zoneValues?.fadeTime || '02',
                    delayTime: zoneValues?.delayTime || '00'
                  };

                  // Determine zone type for proper control display (matching heatmap logic)
                  const zoneType = (zoneObj.type || "").toLowerCase();
                  const isSwitched = zoneType === "switched";
                  const isDimmed = zoneType === "dimmed";
                  const isWhitetune = ['whitening', 'white tune', 'whitetune', 'white_tune', 'White Tune', 'WhiteTune'].includes(zoneType);

                  return (
                    <div style={{ padding: "8px", background: "#fff", borderRadius: "6px", border: "1px solid #ddd" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{zoneObj.name}</span>
                      </div>

                      {/* Switched Zone - Only On/Off Toggle (matching heatmap) */}
                      {isSwitched && (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "#666", minWidth: "60px" }}>Status</span>
                          <div
                            onClick={() => {
                              const newOnOff = safeValues.on_off === 'On' ? 'Off' : 'On';
                              handleZoneValueChange({ on_off: newOnOff });
                              const zone = zones.find(z => String(z.id || z.zone_id) === String(selectedZoneId));
                              if (zone) {
                                onActionSelect({
                                  type: "zone",
                                  zone: zone,
                                  values: { ...safeValues, on_off: newOnOff }
                                });
                              }
                            }}
                            style={{
                              width: "48px", // Increased width
                              height: "20px", // Reduced height
                              borderRadius: "999px",
                              background: "#fff", // White background
                              border: "1px solid #000", // Thin black border
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              padding: "1px",
                              position: "relative",
                              minWidth: "48px"
                            }}
                          >
                            <div
                              style={{
                                width: "16px", // Adjusted thumb size
                                height: "16px", // Adjusted thumb size
                                borderRadius: "50%",
                                background: safeValues.on_off === 'On' ? "#4caf50" : "#f44336", // Green for ON, red for OFF
                                transition: "all 0.2s",
                                transform: safeValues.on_off === 'On' ? "translateX(24px)" : "translateX(2px)", // Adjusted transform
                                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                position: "absolute",
                                left: "2px",
                                top: "2px"
                              }}
                            />
                            <span 
                              style={{ 
                                position: "absolute",
                                left: safeValues.on_off === 'On' ? "4px" : "26px", // Position text on opposite side of circle
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "9px", // Smaller font
                                fontWeight: 600,
                                color: "#222",
                                transition: "all 0.2s",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                maxWidth: "14px" // Limit text width to avoid overlap
                              }}
                            >
                              {safeValues.on_off === 'On' ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Dimmed Zone - Brightness + Fade/Delay (matching heatmap) */}
                      {isDimmed && (
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          {/* Brightness Slider */}
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#666", minWidth: "60px" }}>Brightness</span>
                                <div style={{ flex: 1, position: "relative" }}>
                                  <Slider
                                    min={brightnessMin}
                                    max={brightnessMax}
                                    value={safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}
                                    onChange={(_, v) => handleSliderChange('brightness', v)}
                                    onChangeCommitted={(_, v) => handleSliderChangeCommitted('brightness', v)}
                                    disabled={false}
                                    sx={{
                                      color: '#222',
                                      height: 3,
                                      '& .MuiSlider-thumb': {
                                        width: 12,
                                        height: 12,
                                        bgcolor: '#222',
                                        boxShadow: 'none',
                                        transition: 'none',
                                      },
                                      '& .MuiSlider-rail': {
                                        height: 3,
                                        borderRadius: 1.5,
                                      },
                                      '& .MuiSlider-track': {
                                        height: 3,
                                        borderRadius: 1.5,
                                      },
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, minWidth: "35px" }}>
                                  {safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Fade/Delay Time inputs */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "60px" }}>
                            <div>
                              <label style={{ fontSize: "10px", color: "#666", marginBottom: "1px", display: "block" }}>
                                Fade
                              </label>
                              <input
                                type="text"
                                value={safeValues.fadeTime || "02"}
                                onChange={(e) => handleZoneValueChange({ fadeTime: e.target.value })}
                                disabled={false}
                                style={{
                                  width: "50px",
                                  padding: "2px 4px",
                                  border: "1px solid #ddd",
                                  borderRadius: "2px",
                                  fontSize: "11px",
                                  textAlign: "center"
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", color: "#666", marginBottom: "1px", display: "block" }}>
                                Delay
                              </label>
                              <input
                                type="text"
                                value={safeValues.delayTime || "00"}
                                onChange={(e) => handleZoneValueChange({ delayTime: e.target.value })}
                                disabled={false}
                                style={{
                                  width: "50px",
                                  padding: "2px 4px",
                                  border: "1px solid #ddd",
                                  borderRadius: "2px",
                                  fontSize: "11px",
                                  textAlign: "center"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Whitetune Zone - Brightness + CCT + Fade/Delay (matching heatmap) */}
                      {isWhitetune && (
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        {/* Sliders Column */}
                        <div style={{ flex: 1 }}>
                            {/* Brightness Slider */}
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "12px", color: "#666", minWidth: "60px" }}>Brightness</span>
                              <div style={{ flex: 1, position: "relative" }}>
                                <Slider
                                  min={brightnessMin}
                                  max={brightnessMax}
                                  value={safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}
                                  onChange={(_, v) => handleSliderChange('brightness', v)}
                                  onChangeCommitted={(_, v) => handleSliderChangeCommitted('brightness', v)}
                                  disabled={false}
                                  sx={{
                                    color: '#222',
                                    height: 3,
                                    '& .MuiSlider-thumb': {
                                      width: 12,
                                      height: 12,
                                      bgcolor: '#222',
                                      boxShadow: 'none',
                                      transition: 'none',
                                    },
                                    '& .MuiSlider-rail': {
                                      height: 3,
                                      borderRadius: 1.5,
                                    },
                                    '& .MuiSlider-track': {
                                      height: 3,
                                      borderRadius: 1.5,
                                    },
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 600, minWidth: "35px" }}>
                                {safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}%
                              </span>
                            </div>
                          </div>

                            {/* CCT Slider */}
                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#666", minWidth: "60px" }}>CCT</span>
                                <div style={{ flex: 1, position: "relative" }}>
                                  <Slider
                                    min={cctMin}
                                    max={cctMax}
                                    value={safeValues.cct !== undefined ? safeValues.cct : cctMin}
                                    onChange={(_, v) => handleSliderChange('cct', v)}
                                    onChangeCommitted={(_, v) => handleSliderChangeCommitted('cct', v)}
                                    disabled={false}
                                    sx={{
                                      color: '#FFD600',
                                      height: 3,
                                      '& .MuiSlider-thumb': {
                                        width: 12,
                                        height: 12,
                                        bgcolor: '#FFD600',
                                        boxShadow: 'none',
                                        transition: 'none',
                                      },
                                      '& .MuiSlider-rail': {
                                        height: 3,
                                        borderRadius: 1.5,
                                      },
                                      '& .MuiSlider-track': {
                                        height: 3,
                                        borderRadius: 1.5,
                                      },
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, minWidth: "45px" }}>
                                  {safeValues.cct !== undefined ? safeValues.cct : cctMin}K
                                </span>
                              </div>
                            </div>
                        </div>

                          {/* Fade/Delay Time inputs */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "60px" }}>
                          <div>
                            <label style={{ fontSize: "10px", color: "#666", marginBottom: "1px", display: "block" }}>
                              Fade
                            </label>
                            <input
                              type="text"
                              value={safeValues.fadeTime || "02"}
                              onChange={(e) => handleZoneValueChange({ fadeTime: e.target.value })}
                              disabled={false}
                              style={{
                                width: "50px",
                                padding: "2px 4px",
                                border: "1px solid #ddd",
                                borderRadius: "2px",
                                fontSize: "11px",
                                textAlign: "center"
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "10px", color: "#666", marginBottom: "1px", display: "block" }}>
                              Delay
                            </label>
                            <input
                              type="text"
                              value={safeValues.delayTime || "00"}
                              onChange={(e) => handleZoneValueChange({ delayTime: e.target.value })}
                              disabled={false}
                              style={{
                                width: "50px",
                                padding: "2px 4px",
                                border: "1px solid #ddd",
                                borderRadius: "2px",
                                fontSize: "11px",
                                textAlign: "center"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={{ color: "#a89c81", fontWeight: 500 }}>No zones found for this area.</div>
            )
          )}
        </div>
      )}

      {selectedAction === "occupancy" && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["disabled", "auto", "vacancy"].map((action) => (
              <button
                key={action}
                style={{
                  borderRadius: 8,
                  minWidth: 100,
                  height: 45,
                  fontWeight: 700,
                  fontSize: 16,
                  background: selectedOccupancy === action ? buttonColor : "#fff",
                  color: selectedOccupancy === action ? "#fff" : buttonColor,
                  border: selectedOccupancy === action ? "none" : "1px solid #ccc",
                  boxShadow: "0 1px 4px #0001",
                  cursor: "pointer",
                  outline: "none"
                }}
                onClick={() => handleOccupancySelect(action)}
              >
                {action.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedAction === "shade" && (
        <>
          {/* Shade Group Dropdown */}
          <div style={{ marginBottom: 16 }}>
            <select
              value={selectedShadeId}
              onChange={(e) => handleShadeSelect(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: `2px solid ${buttonColor}`,
                fontSize: 16
              }}
            >
              {shades.map(sh => (
                <option key={sh.id || sh.zone_id} value={sh.id || sh.zone_id}>
                  {sh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preset Buttons + Slider */}
          {selectedShadeId && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              {/* Preset Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[100, 75, 50, 25, 0].map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleShadeValueChange(preset)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: shadeValue === preset ? `1px solid ${buttonColor}` : "1px solid #ccc",
                      background: shadeValue === preset ? buttonColor : "#fff",
                      color: shadeValue === preset ? "#fff" : buttonColor,
                      fontWeight: 600,
                      cursor: "pointer",
                      minWidth: 100,
                      textAlign: "left"
                    }}
                  >
                    {preset}% Open
                  </button>
                ))}
              </div>

              {/* Vertical Slider - EXACT COPY from HeatMap.jsx */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1} // Changed to 1 to avoid decimals
                    value={100 - (shadeValue ?? 0)}
                    onChange={e => handleShadeSliderChange(100 - Number(e.target.value))}
                    style={{
                      writingMode: "vertical-lr",
                      direction: "rtl",
                      width: 12,
                      height: 120,
                      margin: 0,
                      accentColor: "#222",
                      transform: 'scaleY(-1)'
                    }}
                  />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{Math.round(shadeValue ?? 0)}% Open</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Action;
