/**
 * Optional multi-select: limit by-group charts to specific Manage Area Groups (`scoped_group_ids`).
 */
import React, { useMemo } from "react";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { selectAreaGroups } from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { CUSTOM_GRAPH_GROUP_SCOPES } from "../../../utils/filterGroupIdsByAreaGroupScope";

function getGroupId(g) {
  return g?.group_id ?? g?.area_group_id ?? g?.id ?? g?.groupId;
}

export default function CustomGraphScopedGroupPicker({
  groupScope,
  value = [],
  onChange,
  disabled = false,
  dark = false,
}) {
  const areaGroupsRaw = useSelector(selectAreaGroups);

  const rows = useMemo(() => {
    const areaGroups = areaGroupsRaw || {};
    const s = String(groupScope || "").trim();
    let lists = [];
    if (s === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_ONLY) {
      lists = [...(areaGroups.special_area_groups || [])];
    } else if (s === CUSTOM_GRAPH_GROUP_SCOPES.USER_ONLY) {
      lists = [...(areaGroups.user_area_groups || [])];
    } else if (s === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_AND_USER) {
      lists = [
        ...(areaGroups.special_area_groups || []),
        ...(areaGroups.user_area_groups || []),
      ];
    }
    const seen = new Set();
    const out = [];
    for (const g of lists) {
      const id = getGroupId(g);
      if (id == null || seen.has(String(id))) continue;
      seen.add(String(id));
      const name = String(g?.name ?? g?.group_name ?? "").trim() || `Group ${id}`;
      out.push({ id, name });
    }
    return out;
  }, [areaGroupsRaw, groupScope]);

  if (!groupScope || rows.length === 0) return null;

  const selected = new Set((value || []).map((x) => String(x)));

  const toggle = (rawId) => {
    const key = String(rawId);
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const ids = Array.from(next).map((k) => {
      const n = Number(k);
      return Number.isFinite(n) && String(n) === k ? n : k;
    });
    onChange?.(ids);
  };

  const hintSx = dark
    ? { fontSize: 11, color: "rgba(255,255,255,0.65)", mt: 0.5 }
    : { fontSize: 11, color: "text.secondary", mt: 0.5 };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography sx={{ fontSize: 13, mb: 0.5, color: dark ? "rgba(255,255,255,0.9)" : undefined }}>
        Area groups to include (optional)
      </Typography>
      {rows.map((r) => (
        <FormControlLabel
          key={String(r.id)}
          control={
            <Checkbox
              size="small"
              checked={selected.has(String(r.id))}
              onChange={() => toggle(r.id)}
              disabled={disabled}
            />
          }
          label={r.name}
          sx={{ display: "flex", alignItems: "center", color: dark ? "rgba(255,255,255,0.9)" : undefined }}
        />
      ))}
      <Typography sx={hintSx}>
        Leave all unchecked to include every group matching the filter above. Check specific groups to limit this
        chart to only those groups.
      </Typography>
    </Box>
  );
}
