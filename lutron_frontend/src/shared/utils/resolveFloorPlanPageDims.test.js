import {
  getAreasCoordinateExtent,
  scorePageDimsFit,
  resolveFloorPlanPageDims,
} from './resolveFloorPlanPageDims';

describe('resolveFloorPlanPageDims', () => {
  const landscapeCoords = [
    {
      coordinates: [
        { x: 100, y: 50 },
        { x: 3200, y: 50 },
        { x: 3200, y: 1400 },
        { x: 100, y: 1400 },
      ],
    },
  ];

  const portraitCoords = [
    {
      coordinates: [
        { x: 100, y: 50 },
        { x: 1400, y: 50 },
        { x: 1400, y: 3200 },
        { x: 100, y: 3200 },
      ],
    },
  ];

  test('getAreasCoordinateExtent reads flat and ring shapes', () => {
    const flat = getAreasCoordinateExtent(landscapeCoords);
    expect(flat.maxX).toBe(3200);
    expect(flat.maxY).toBe(1400);

    const rings = getAreasCoordinateExtent([
      {
        coordinates: [
          [
            { x: 10, y: 20 },
            { x: 30, y: 20 },
            { x: 30, y: 40 },
          ],
        ],
      },
    ]);
    expect(rings.maxX).toBe(30);
    expect(rings.maxY).toBe(40);
  });

  test('rotated 270 with landscape CSV picks swapped dims', () => {
    const page = {
      originalWidth: 1537,
      originalHeight: 3409,
      rotate: 270,
    };
    const dims = resolveFloorPlanPageDims(page, landscapeCoords);
    expect(dims.source).toBe('rotated');
    expect(dims.width).toBe(3409);
    expect(dims.height).toBe(1537);
  });

  test('rotated 270 with portrait CSV keeps media box', () => {
    const page = {
      originalWidth: 1537,
      originalHeight: 3409,
      rotate: 270,
    };
    const dims = resolveFloorPlanPageDims(page, portraitCoords);
    expect(dims.source).toBe('media');
    expect(dims.width).toBe(1537);
    expect(dims.height).toBe(3409);
  });

  test('unrotated page stays on media box even with landscape-ish coords', () => {
    const page = {
      originalWidth: 3319,
      originalHeight: 1537,
      rotate: 0,
    };
    const dims = resolveFloorPlanPageDims(page, landscapeCoords);
    expect(dims.source).toBe('media');
    expect(dims.width).toBe(3319);
    expect(dims.height).toBe(1537);
  });

  test('no areas + rotate 90 defaults to rotated viewport', () => {
    const page = { originalWidth: 1000, originalHeight: 2000, rotate: 90 };
    const dims = resolveFloorPlanPageDims(page, []);
    expect(dims.width).toBe(2000);
    expect(dims.height).toBe(1000);
    expect(dims.source).toBe('rotated');
  });

  test('score prefers containing box', () => {
    const extent = { maxX: 3000, maxY: 1400, minX: 0, minY: 0, count: 4 };
    const landscape = scorePageDimsFit(extent, 3409, 1537);
    const portrait = scorePageDimsFit(extent, 1537, 3409);
    expect(landscape).toBeGreaterThan(portrait);
  });
});
