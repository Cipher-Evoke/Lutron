// components/ColorPickerCard.jsx
import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';

const hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    const toHex = n => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const normalizeColor = (color) => {
    if (typeof color === 'string' && color.startsWith('hsl')) {
        const [h, s, l] = color.match(/\d+/g).map(Number);
        return hslToHex(h, s, l);
    }
    return color;
};

const ColorPickerCard = ({ titleList, defaultMap, onSave }) => {
    const [colorMap, setColorMap] = useState(defaultMap);
    const [activeTarget, setActiveTarget] = useState(titleList[0]);
    const [selectedColor, setSelectedColor] = useState(defaultMap[titleList[0]]);

    const handleColorClick = (color) => {
        setColorMap((prev) => ({ ...prev, [activeTarget]: color }));
        setSelectedColor(color);
    };

    const handleSave = () => {
        const hexMap = {};
        for (const key in colorMap) {
            hexMap[key.toLowerCase()] = normalizeColor(colorMap[key]);
        }
        onSave(hexMap);
    };

    const renderHexGrid = () => {
        const hexRadius = 10;
        const hexHeight = Math.sqrt(3) * hexRadius;
        const hexWidth = 2 * hexRadius;
        const hexCenterX = 130;
        const hexCenterY = 120;
        const hexRange = 4;
        let hexes = [];

        const getHexPoints = (cx, cy, r) => {
            return [...Array(6)].map((_, i) => {
                const angle = Math.PI / 3 * i;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                return `${x},${y}`;
            }).join(' ');
        };

        for (let q = -hexRange; q <= hexRange; q++) {
            for (let r = -hexRange; r <= hexRange; r++) {
                const s = -q - r;
                if (Math.abs(s) > hexRange) continue;
                const x = hexCenterX + hexWidth * (q + r / 2);
                const y = hexCenterY + hexHeight * (r * 0.866);
                const angle = Math.atan2(r, q);
                const distance = Math.sqrt(q * q + r * r + s * s) / 1.5;
                const hue = (angle * 180) / Math.PI + 180;
                const color = `hsl(${hue.toFixed(0)}, 80%, ${50 + (1 - distance / hexRange) * 10}%)`;

                hexes.push(
                    <g key={`hex-${q}-${r}`} transform={`translate(${x}, ${y})`} onClick={() => handleColorClick(color)} className="hex-group">
                        <polygon
                            points={getHexPoints(0, 0, hexRadius)}
                            fill={color}
                            stroke={normalizeColor(color) === normalizeColor(selectedColor) ? '#000' : '#fff'}
                            strokeWidth={normalizeColor(color) === normalizeColor(selectedColor) ? 2 : 1}
                            className="hex"
                        />
                    </g>
                );
            }
        }

        const grayHexCount = 14;
        const spacingFactor = 1.15;
        const grayStartX = hexCenterX - (grayHexCount / 2) * (hexWidth / spacingFactor);
        const grayY1 = hexCenterY + hexRange * hexHeight + 20;
        const grayY2 = grayY1 + hexHeight * 1.1;

        for (let i = 0; i < grayHexCount; i++) {
            const dark = `hsl(0, 0%, ${Math.round((i / (grayHexCount - 1)) * 50)}%)`;
            const light = `hsl(0, 0%, ${50 + Math.round((i / (grayHexCount - 1)) * 50)}%)`;

            [dark, light].forEach((color, idx) => {
                const x = grayStartX + i * (hexWidth / spacingFactor);
                const y = idx === 0 ? grayY1 : grayY2;
                hexes.push(
                    <g key={`${idx === 0 ? 'gray1' : 'gray2'}-${i}`} transform={`translate(${x}, ${y})`} onClick={() => handleColorClick(color)}>
                        <polygon
                            points={getHexPoints(0, 0, hexRadius)}
                            fill={color}
                            stroke={normalizeColor(color) === normalizeColor(selectedColor) ? '#000' : '#ccc'}
                            strokeWidth={normalizeColor(color) === normalizeColor(selectedColor) ? 2 : 0.8}
                            className="hex"
                        />
                    </g>
                );
            });
        }

        return hexes;
    };

    return (
        <Box sx={{ width: 290 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                {titleList.map(label => (
                    <Button
                        key={label}
                        className={`tab ${activeTarget === label ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTarget(label);
                            setSelectedColor(colorMap[label]);
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </Box>

            <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 1 }}>
                <svg width={260} height={230} viewBox="0 0 260 230">
                    {renderHexGrid()}
                </svg>
            </Box>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, backgroundColor: selectedColor, borderRadius: 1, border: '1px solid #ccc' }} />
                <span style={{ fontSize: 12 }}>{activeTarget} Color: {normalizeColor(selectedColor)}</span>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                    onClick={handleSave}
                    style={{
                        padding: '6px 14px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    Save
                </Button>
            </Box>
        </Box>
    );
};

export default ColorPickerCard;
