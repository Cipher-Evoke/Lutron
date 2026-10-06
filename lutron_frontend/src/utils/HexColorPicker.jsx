import React from 'react';
import { Box } from '@mui/material';

const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
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

const HexColorPicker = ({
    colorMap,
    setColorMap,
    selectedColor,
    setSelectedColor,
    activeTarget,
    width = 200,
    height = 260,
    hexRadius = 8
}) => {
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = 2 * hexRadius;

    const handleColorClick = (color) => {
        setColorMap(prev => ({
            ...prev,
            [activeTarget]: color,
        }));
        setSelectedColor(color);
    };

    const getHexPoints = (cx, cy, r) => {
        return [...Array(6)].map((_, i) => {
            const angle = Math.PI / 3 * i;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    const renderHexGrid = () => {
        const hexCenterX = width / 2;
        const hexCenterY = height / 2.4;
        const hexRange = 5;
        const hexes = [];

        for (let q = -hexRange; q <= hexRange; q++) {
            for (let r = -hexRange; r <= hexRange; r++) {
                const s = -q - r;
                if (Math.abs(s) > hexRange) continue;

                const x = hexCenterX + hexWidth * (q + r / 2);
                const y = hexCenterY + hexHeight * (r * 0.866);

                const angle = Math.atan2(r, q);
                const distance = Math.sqrt(q * q + r * r + s * s) / 1.5;
                const hue = (angle * 180) / Math.PI + 180;
                const saturation = 80;
                const lightness = 50 + (1 - distance / hexRange) * 10;
                const color = `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness.toFixed(0)}%)`;

                hexes.push(
                    <g
                        key={`hex-${q}-${r}`}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => handleColorClick(color)}
                    >
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
        return hexes;
    };

    return (
        <Box sx={{ width, backgroundColor: 'white', borderRadius: 3, p: 2, boxShadow: 3, mx: 'auto' }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {renderHexGrid()}
            </svg>

            {/* Grayscale row rendered below SVG */}
            <Box className="gray-row" mt={-0.5} display="flex" justifyContent="center" flexWrap="wrap">
                {[...Array(15)].map((_, i) => {
                    const gray = `hsl(0, 0%, ${i * 7}%)`;
                    return (
                        <svg
                            key={`gray-${i}`}
                            width={hexWidth}
                            height={hexHeight}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleColorClick(gray)}
                        >
                            <polygon
                                points={getHexPoints(hexWidth / 2, hexHeight / 2, hexRadius)}
                                fill={gray}
                                stroke={normalizeColor(gray) === normalizeColor(selectedColor) ? '#000' : '#ccc'}
                                strokeWidth={normalizeColor(gray) === normalizeColor(selectedColor) ? 2 : 1}
                                className="hex"
                            />
                        </svg>
                    );
                })}

                {['#CDC0A0', '#807864', '#f2ff00', '#4318d1', "#006400"].map((color, i) => (
                    <svg
                        key={`extra-${i}`}
                        width={hexWidth}
                        height={hexHeight}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleColorClick(color)}
                    >
                        <polygon
                            points={getHexPoints(hexWidth / 2, hexHeight / 2, hexRadius)}
                            fill={color}
                            stroke={normalizeColor(color) === normalizeColor(selectedColor) ? '#000' : '#ccc'}
                            strokeWidth={normalizeColor(color) === normalizeColor(selectedColor) ? 2 : 1}
                            className="hex"
                        />
                    </svg>
                ))}
            </Box>

        </Box>
    );
};

export default HexColorPicker;










