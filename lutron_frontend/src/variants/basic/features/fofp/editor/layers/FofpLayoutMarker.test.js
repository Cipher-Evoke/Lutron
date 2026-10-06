/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import FofpLayoutMarker, {
  resolveFofpLayoutMarkerLabel,
} from "./FofpLayoutMarker";

const basePosition = {
  zone_id: 42,
  area_id: 10,
  x: 100,
  y: 200,
  placement_source: "auto",
};

const renderMarker = (positionOverrides = {}) =>
  render(
    <svg>
      <FofpLayoutMarker
        p={{ ...basePosition, ...positionOverrides }}
        resolvedShape="circle"
        resolvedSize={5}
        previewBaseColor="#f2ff00"
        accentStroke="#1976d2"
        isEditing
        isSelected={false}
        isDragging={false}
        registerMarkerElement={() => {}}
        onPointerDown={() => {}}
        onPointerMove={() => {}}
        onPointerUp={() => {}}
        onContextMenu={() => {}}
      />
    </svg>
  );

describe("resolveFofpLayoutMarkerLabel", () => {
  it("returns trimmed zone_name when present", () => {
    expect(
      resolveFofpLayoutMarkerLabel({ zone_id: 1, zone_name: "  Lobby  " })
    ).toBe("Lobby");
  });

  it("falls back to Zone id when name missing", () => {
    expect(resolveFofpLayoutMarkerLabel({ zone_id: 7 })).toBe("Zone 7");
  });

  it("falls back to Zone when id and name missing", () => {
    expect(resolveFofpLayoutMarkerLabel({})).toBe("Zone");
  });
});

describe("FofpLayoutMarker", () => {
  it("renders SVG title with zone name only", () => {
    const { container } = renderMarker({ zone_name: "Desk Row" });
    const title = container.querySelector("title");
    expect(title).not.toBeNull();
    expect(title.textContent).toBe("Desk Row");
  });

  it("renders SVG title with zone id fallback", () => {
    const { container } = renderMarker({ zone_name: null });
    const title = container.querySelector("title");
    expect(title.textContent).toBe("Zone 42");
  });
});
