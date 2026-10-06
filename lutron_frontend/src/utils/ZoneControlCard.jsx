// src/screens/quickcontrols/ZoneControlCard.jsx
import React, { useEffect, useRef } from "react";
import { Box, Typography, Slider } from "@mui/material";

const isWhitetune = (type) =>
  ["whitetune", "white tune", "white_tune", "White Tune", "WhiteTune", "cct"].includes(
    (type || "").toLowerCase()
  );
const isDimmed = (type) => (type || "").toLowerCase() === "dimmed";
const isSwitched = (type) => (type || "").toLowerCase() === "switched";

export default function ZoneControlCard({ zone, values, onChange, disabled }) {
  // FIXED: Use actual values without hardcoded defaults
  const safeValues = {
    on_off: values?.on_off || zone.status || zone.on_off || 'Off',
    brightness: values?.brightness, // Use actual value, no default
    cct: values?.cct, // Use actual value, no default
    fadeTime: values?.fadeTime || '02',
    delayTime: values?.delayTime || '00'
  };

  // Switched: custom toggle
  if (isSwitched(zone.type)) {
    return (
      <div style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>{zone.name}</span>
          <button
            onClick={() => onChange({ on_off: safeValues.on_off === 'On' ? 'Off' : 'On' })}
            disabled={disabled}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              background: safeValues.on_off === 'On' ? '#4CAF50' : '#ccc',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 2,
              left: safeValues.on_off === 'On' ? 24 : 2,
              transition: 'left 0.2s'
            }} />
          </button>
        </div>
      </div>
    );
  }

  // Dimmed or Whitetune: sliders
  const brightnessMin = zone.brightness_min ?? 0;
  const brightnessMax = zone.brightness_max ?? 100;
  const cctMin = zone.cct_min ?? 2700;
  const cctMax = zone.cct_max ?? 7000;

  return (
    <div style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontWeight: 600 }}>{zone.name}</span>
      </div>

      {/* Brightness Slider - Using exact same Material-UI Slider as HeatMap */}
      <Box sx={{ position: 'relative', width: '85%', mb: 1 }}>
        <Slider
          min={brightnessMin}
          max={brightnessMax}
          value={safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}
          onChange={(_, v) => onChange({ brightness: v })}
          disabled={disabled}
          sx={{
            color: '#222',
            height: { xs: 2, md: 3 },
            '& .MuiSlider-thumb': {
              width: { xs: 8, md: 10 },
              height: { xs: 8, md: 10 },
              bgcolor: '#222',
              boxShadow: 'none',
            },
            '& .MuiSlider-rail': {
              height: { xs: 2, md: 3 },
              borderRadius: 1.5,
            },
            '& .MuiSlider-track': {
              height: { xs: 2, md: 3 },
              borderRadius: 1.5,
            },
          }}
        />
        <Typography
          fontSize={{ xs: 8, sm: 9, md: 10 }}
          fontWeight={700}
          sx={{
            position: 'absolute',
            top: { xs: -18, sm: -20, md: -22 },
            right: -8,
            color: '#807864',
            background: '#fff',
            px: 0.4,
            py: 0.1,
            borderRadius: 0.5,
            border: '1px solid #ddd',
            minWidth: 28,
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}%
        </Typography>
      </Box>

      {/* CCT Slider - Using exact same Material-UI Slider as HeatMap */}
      {isWhitetune(zone.type) && (
        <Box sx={{ position: 'relative', width: '85%', mt: 0.8, pl: { xs: 1, md: 2 } }}>
          <Slider
            min={cctMin}
            max={cctMax}
            value={safeValues.cct !== undefined ? safeValues.cct : cctMin}
            onChange={(_, v) => onChange({ cct: v })}
            disabled={disabled}
            sx={{
              color: '#FFD600',
              height: { xs: 2, md: 3 },
              '& .MuiSlider-thumb': {
                width: { xs: 8, md: 10 },
                height: { xs: 8, md: 10 },
                bgcolor: '#FFD600',
                boxShadow: 'none',
              },
              '& .MuiSlider-rail': {
                height: { xs: 2, md: 3 },
                borderRadius: 1.5,
              },
              '& .MuiSlider-track': {
                height: { xs: 2, md: 3 },
                borderRadius: 1.5,
              },
            }}
          />
          <Typography
            fontSize={{ xs: 8, sm: 9, md: 10 }}
            fontWeight={500}
            sx={{
              position: 'absolute',
              top: { xs: -18, sm: -20, md: -22 },
              right: -8,
              color: '#333',
              background: '#fff',
              px: 0.4,
              py: 0.1,
              borderRadius: 0.5,
              border: '1px solid #ddd',
              minWidth: 32,
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {safeValues.cct !== undefined ? safeValues.cct : cctMin}K
          </Typography>
        </Box>
      )}

      {/* Time inputs */}
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
            Fade Time
          </label>
          <input
            type="text"
            value={safeValues.fadeTime || "02"}
            onChange={(e) => onChange({ fadeTime: e.target.value })}
            disabled={disabled}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
            Delay Time
          </label>
          <input
            type="text"
            value={safeValues.delayTime || "00"}
            onChange={(e) => onChange({ delayTime: e.target.value })}
            disabled={disabled}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>
      </div>
    </div>
  );
}
