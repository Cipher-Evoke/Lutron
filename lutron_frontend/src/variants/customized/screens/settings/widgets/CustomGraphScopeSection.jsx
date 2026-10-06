/**
 * Optional per–custom-graph scope: floors and/or areas. Empty / inherit uses dashboard filters.
 * Labels always list real floor/area names (no "Combined areas" collapse).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Checkbox, FormControlLabel, Typography, CircularProgress } from "@mui/material";
import { fetchFloors, getLeafByFloorID, selectFloors, selectFloorLoading } from "../../../redux/slice/floor/floorSlice";
import { selectProfile } from "../../../redux/slice/auth/userlogin";
import { UseAuth } from "../../../customhooks/UseAuth";

function getAvailableFloors(floors, currentUserRole, userProfile) {
  if (currentUserRole === "Superadmin" || currentUserRole === "Admin") {
    return floors;
  }
  if (currentUserRole === "Operator" && userProfile && userProfile.floors) {
    const operatorFloorIds = userProfile.floors.map((f) => f.floor_id);
    return floors.filter((floor) => operatorFloorIds.includes(floor.id));
  }
  return floors;
}

const EMPTY_ID_LIST = [];

function traverseAreas(nodes, out) {
  if (!nodes || !Array.isArray(nodes)) return;
  for (const node of nodes) {
    if (!node) continue;
    if (node.area_id != null) {
      out.push({
        area_id: node.area_id,
        name: node.name || node.area_name || `Area ${node.area_id}`,
      });
    }
    if (node.children && node.children.length > 0) {
      traverseAreas(node.children, out);
    }
    if (node.areas && node.areas.length > 0) {
      traverseAreas(node.areas, out);
    }
  }
}

function areasFromLeaf(leafData) {
  const roots = leafData?.tree || leafData?.areas;
  if (!roots || !Array.isArray(roots)) return [];
  const out = [];
  traverseAreas(roots, out);
  return out;
}

/**
 * @param {object} props
 * @param {'inherit'|'custom'} props.mode
 * @param {(m: 'inherit'|'custom') => void} props.onModeChange
 * @param {{ floor_ids: number[], area_ids: number[] }} props.draft
 * @param {(d: { floor_ids: number[], area_ids: number[] }) => void} props.onDraftChange
 */
export default function CustomGraphScopeSection({ mode, onModeChange, draft, onDraftChange }) {
  const dispatch = useDispatch();
  const floors = useSelector(selectFloors);
  const floorsLoadStatus = useSelector(selectFloorLoading);
  const floorsLoading = floorsLoadStatus === "loading";
  const userProfile = useSelector(selectProfile);
  const { role: currentUserRole } = UseAuth();

  const [expandedFloorIds, setExpandedFloorIds] = useState(new Set());
  const [nameByAreaId, setNameByAreaId] = useState({});
  /** Per-floor area trees (avoids relying on single global `leafData` while picking areas). */
  const [treesByFloorId, setTreesByFloorId] = useState({});
  /** Latest trees for async loaders (avoid stale "already loaded" skips). */
  const treesByFloorIdRef = useRef({});
  const loadInFlightRef = useRef(new Set());

  useEffect(() => {
    treesByFloorIdRef.current = treesByFloorId;
  }, [treesByFloorId]);

  useEffect(() => {
    dispatch(fetchFloors());
  }, [dispatch]);

  const availableFloors = useMemo(
    () => getAvailableFloors(floors, currentUserRole, userProfile),
    [floors, currentUserRole, userProfile]
  );

  const mergeNames = useCallback((pairs) => {
    if (!pairs.length) return;
    setNameByAreaId((prev) => {
      const next = { ...prev };
      for (const { id, name } of pairs) {
        next[id] = name;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const pairs = [];
    Object.values(treesByFloorId).forEach((data) => {
      for (const a of areasFromLeaf(data)) {
        pairs.push({ id: a.area_id, name: a.name });
      }
    });
    if (pairs.length) mergeNames(pairs);
  }, [treesByFloorId, mergeNames]);

  const loadTreeForFloor = useCallback(
    async (fid) => {
      const id = Number(fid);
      const existing = treesByFloorIdRef.current[id];
      if (existing && (existing.tree || existing.areas)) return;
      if (loadInFlightRef.current.has(id)) return;
      loadInFlightRef.current.add(id);
      try {
        const data = await dispatch(getLeafByFloorID(id)).unwrap();
        setTreesByFloorId((prev) => ({ ...prev, [id]: data }));
      } catch {
        // allow retry
      } finally {
        loadInFlightRef.current.delete(id);
      }
    },
    [dispatch]
  );

  const floor_ids = Array.isArray(draft?.floor_ids) ? draft.floor_ids : EMPTY_ID_LIST;
  const area_ids = Array.isArray(draft?.area_ids) ? draft.area_ids : EMPTY_ID_LIST;

  const floorIdsKey = useMemo(
    () => [...floor_ids].map(Number).sort((a, b) => a - b).join(","),
    [floor_ids]
  );

  /** Expand + fetch trees for saved floor scope so area checkboxes can render. */
  useEffect(() => {
    if (mode !== "custom" || !floorIdsKey) return;
    const ids = floorIdsKey.split(",").map((x) => Number(x));
    setExpandedFloorIds((prev) => new Set([...prev, ...ids]));
    ids.forEach((fid) => {
      loadTreeForFloor(fid);
    });
  }, [mode, floorIdsKey, loadTreeForFloor]);

  /**
   * When only area_ids are stored (no whole floors), load each floor's tree once so we can
   * show names, validate ids, and prune orphans — areas must belong to a loaded floor tree.
   */
  useEffect(() => {
    if (mode !== "custom") return;
    if (floor_ids.length > 0) return;
    if (!area_ids.length) return;
    let cancelled = false;
    (async () => {
      for (const floor of availableFloors) {
        if (cancelled) break;
        await loadTreeForFloor(floor.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, floor_ids.length, area_ids.length, availableFloors, loadTreeForFloor]);

  const toggleFloor = async (floorId) => {
    const id = Number(floorId);
    const has = floor_ids.includes(id);

    // Additive logic: Just toggle this floor ID in the list
    const nextFloors = has ? floor_ids.filter((x) => x !== id) : [...floor_ids, id];
    onDraftChange({
      ...draft,
      floor_ids: nextFloors,
    });

    if (!has) {
      setExpandedFloorIds(prev => new Set(prev).add(id));
      await loadTreeForFloor(id);
    }
  };

  const toggleArea = (areaId, areaName) => {
    const id = Number(areaId);
    mergeNames([{ id, name: areaName }]);

    // Additive logic: Just toggle this area ID in the list
    const has = area_ids.includes(id);
    const nextAreas = has ? area_ids.filter((x) => x !== id) : [...area_ids, id];

    // Partial floor: if user picks specific areas on a floor, that floor must not stay in
    // `floor_ids` (whole-floor). Keeps draft consistent and matches dashboard aggregation.
    let nextFloors = floor_ids;
    if (!has) {
      let floorForArea = null;
      for (const [fidStr, data] of Object.entries(treesByFloorId)) {
        const areas = areasFromLeaf(data || {});
        if (areas.some((a) => Number(a.area_id) === id)) {
          floorForArea = Number(fidStr);
          break;
        }
      }
      if (floorForArea != null && floor_ids.includes(floorForArea)) {
        nextFloors = floor_ids.filter((x) => x !== floorForArea);
      }
    }

    onDraftChange({
      ...draft,
      floor_ids: nextFloors,
      area_ids: nextAreas,
    });
  };

  const floorRows = availableFloors.map((floor) => {
    const fid = floor.id;
    const floorChecked = floor_ids.includes(fid);
    const expanded = expandedFloorIds.has(fid);
    const areas = expanded ? areasFromLeaf(treesByFloorId[fid] || {}) : [];

    return (
      <Box key={fid} sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", py: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Checkbox
            size="small"
            checked={floorChecked}
            onChange={() => toggleFloor(fid)}
            disabled={mode !== "custom"}
          />
          <Typography
            component="span"
            sx={{ fontSize: 13, cursor: "pointer", flex: 1 }}
            onClick={() => {
              if (mode !== "custom") return;
              setExpandedFloorIds(prev => {
                const next = new Set(prev);
                if (next.has(fid)) next.delete(fid);
                else next.add(fid);
                return next;
              });
              if (!expanded) {
                loadTreeForFloor(fid);
              }
            }}
          >
            {floor.floor_name || floor.name || `Floor ${fid}`}
          </Typography>
        </Box>
        {expanded && floorChecked && (
          <Typography sx={{ fontSize: 11, color: "text.secondary", pl: 4, pb: 0.5 }}>
            Whole floor is used; clear floor checkboxes to pick individual areas.
          </Typography>
        )}
        {expanded && !floorChecked && areas.length === 0 && (
          <Typography sx={{ fontSize: 11, color: "text.secondary", pl: 3, py: 0.5 }}>
            Loading areas…
          </Typography>
        )}
        {expanded && !floorChecked && areas.length > 0 && (
          <Box sx={{ pl: 3, maxHeight: 160, overflowY: "auto" }}>
            {areas.map((a) => (
              <Box key={a.area_id} sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  size="small"
                  checked={area_ids.includes(a.area_id)}
                  onChange={() => toggleArea(a.area_id, a.name)}
                  disabled={mode !== "custom"}
                />
                <Typography sx={{ fontSize: 12 }}>{a.name}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  });

  const summaryParts = [];
  for (const fid of floor_ids) {
    const f = availableFloors.find((x) => x.id === fid);
    summaryParts.push(f?.floor_name || f?.name || `Floor ${fid}`);
  }
  for (const aid of area_ids) {
    let label = nameByAreaId[aid] || `Area ${aid}`;
    for (const [fid, data] of Object.entries(treesByFloorId)) {
      const hit = areasFromLeaf(data || {}).find((a) => Number(a.area_id) === Number(aid));
      if (hit) {
        const f = availableFloors.find((x) => x.id === Number(fid));
        const fn = f?.floor_name || f?.name || `Floor ${fid}`;
        label = `${fn} / ${label}`;
        break;
      }
    }
    summaryParts.push(label);
  }

  return (
    <Box sx={{ mt: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={mode === "custom"}
            onChange={(_, c) => {
              onModeChange(c ? "custom" : "inherit");
              if (!c) {
                onDraftChange({ floor_ids: [], area_ids: [] });
                setExpandedFloorIds(new Set());
              }
            }}
            size="small"
          />
        }
        label={
          <Typography sx={{ fontSize: 13 }}>
            Limit this graph to specific floors or areas (optional). Leave off to use dashboard filters.
          </Typography>
        }
      />

      {mode === "custom" && (
        <>
          {floorsLoading && availableFloors.length === 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: 12 }}>Loading floors…</Typography>
            </Box>
          ) : availableFloors.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>No floors available.</Typography>
          ) : (
            <Box
              sx={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 1,
                maxHeight: 260,
                overflowY: "auto",
                bgcolor: "rgba(0,0,0,0.02)",
              }}
            >
              <Box sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", py: 0.75, px: 0.5, bgcolor: "rgba(0,0,0,0.03)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Checkbox
                    size="small"
                    checked={availableFloors.length > 0 && floor_ids.length === availableFloors.length}
                    indeterminate={floor_ids.length > 0 && floor_ids.length < availableFloors.length}
                    onChange={() => {
                      if (floor_ids.length === availableFloors.length) {
                        onDraftChange({ floor_ids: [], area_ids: area_ids });
                      } else {
                        onDraftChange({ floor_ids: availableFloors.map(f => f.id), area_ids: [] });
                      }
                    }}
                    disabled={mode !== "custom"}
                  />
                  <Typography
                    component="span"
                    sx={{ fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1 }}
                    onClick={() => {
                      if (mode !== "custom") return;
                      if (floor_ids.length === availableFloors.length) {
                        onDraftChange({ floor_ids: [], area_ids: area_ids });
                      } else {
                        onDraftChange({ floor_ids: availableFloors.map(f => f.id), area_ids: [] });
                      }
                    }}
                  >
                    Select All Floors
                  </Typography>
                </Box>
              </Box>
              {floorRows}
            </Box>
          )}

          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
            <Typography sx={{ fontSize: 12, width: "100%", color: "text.secondary" }}>
              Selected (names):
            </Typography>
            {summaryParts.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>None — will use dashboard filters.</Typography>
            ) : (
              summaryParts.map((label, i) => (
                <Typography
                  key={`${label}-${i}`}
                  component="span"
                  sx={{
                    fontSize: 11,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: "rgba(0,0,0,0.06)",
                    mr: 0.25,
                    mb: 0.25,
                  }}
                >
                  {label}
                </Typography>
              ))
            )}
          </Box>

          <Button
            size="small"
            sx={{ mt: 0.75, textTransform: "none", fontSize: 12 }}
            onClick={() => {
              onDraftChange({ floor_ids: [], area_ids: [] });
              setExpandedFloorIds(new Set());
            }}
          >
            Clear selection
          </Button>
        </>
      )}
    </Box>
  );
}
