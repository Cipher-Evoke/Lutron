/**
 * Pie chart payload normalization for total_consumption_by_group widgets.
 * Extracted from customized utils — behavior unchanged.
 */

function buildAreaGroupIdNameMap(areaGroupsState) {
  const lists = [
    ...(areaGroupsState?.special_area_groups || []),
    ...(areaGroupsState?.user_area_groups || []),
  ];
  const byId = new Map();
  for (const g of lists) {
    if (!g || typeof g !== 'object') continue;
    const id = g.group_id ?? g.id ?? g.groupId;
    if (id == null) continue;
    const name =
      g.name != null && String(g.name).trim() !== '' ? String(g.name).trim() : null;
    if (name) {
      byId.set(String(id), name);
      byId.set(Number(id), name);
    }
  }
  return byId;
}

function nameFromAreaGroupLookup(lookupById, id) {
  if (id == null || !lookupById) return null;
  return lookupById.get(String(id)) ?? lookupById.get(Number(id)) ?? null;
}

function getAreaIdsFromGroup(group) {
  if (!group?.floors) return [];
  return group.floors.flatMap((f) => f.area_ids || []);
}

export function normalizeTotalConsumptionByGroupPayload(raw) {
  if (raw == null || typeof raw !== 'object') {
    return { data: {} };
  }
  if (raw.status === 'error') {
    return raw;
  }

  let out = { ...raw };

  const pullFrom = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    if (Array.isArray(obj.special_area_groups)) {
      out.special_area_groups = obj.special_area_groups;
    }
    if (Array.isArray(obj.user_area_groups)) {
      out.user_area_groups = obj.user_area_groups;
    }
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const vals = Object.values(obj.data);
      if (
        vals.length > 0 &&
        vals.every((v) => typeof v === 'number' || v === null || v === undefined)
      ) {
        out.data = { ...obj.data };
      }
    }
  };

  pullFrom(raw);
  if (raw.data && typeof raw.data === 'object') {
    pullFrom(raw.data);
    const d = raw.data;
    const skip = new Set([
      'special_area_groups',
      'user_area_groups',
      'status',
      'message',
      'detail',
      'data',
    ]);
    const map = {};
    for (const [k, v] of Object.entries(d)) {
      if (skip.has(k)) continue;
      if (typeof v === 'number') map[k] = v;
    }
    if (Object.keys(map).length > 0 && (!out.data || Object.keys(out.data).length === 0)) {
      out.data = map;
    }
  }

  if (raw.result && typeof raw.result === 'object') {
    pullFrom(raw.result);
  }

  if (out.data && typeof out.data === 'object' && !Array.isArray(out.data)) {
    const coerced = {};
    for (const [k, v] of Object.entries(out.data)) {
      if (typeof v === 'number' && !Number.isNaN(v)) {
        coerced[k] = v;
      } else if (v != null && v !== '') {
        const n = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, ''));
        if (!Number.isNaN(n)) coerced[k] = n;
      }
    }
    if (Object.keys(coerced).length > 0) {
      out.data = coerced;
    }
  }

  return out;
}

export function sumAbsoluteWhFromTotalConsumptionByGroupPayload(raw) {
  const chartData = normalizeTotalConsumptionByGroupPayload(raw);
  if (!chartData || chartData.status === 'error') return null;

  if (chartData.data && typeof chartData.data === 'object' && !Array.isArray(chartData.data)) {
    let sum = 0;
    let any = false;
    for (const v of Object.values(chartData.data)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        sum += v;
        any = true;
      } else if (v != null && v !== '') {
        const n = parseFloat(String(v).replace(/,/g, ''));
        if (Number.isFinite(n)) {
          sum += n;
          any = true;
        }
      }
    }
    return any ? sum : null;
  }

  if (Array.isArray(chartData.special_area_groups) && chartData.special_area_groups.length > 0) {
    const keys = [
      'total_consumption',
      'consumption',
      'consumption_wh',
      'wh',
      'energy_wh',
      'value',
    ];
    let sum = 0;
    let any = false;
    for (const item of chartData.special_area_groups) {
      if (!item || typeof item !== 'object') continue;
      for (const key of keys) {
        const rawV = item[key];
        if (rawV == null || rawV === '') continue;
        const n = typeof rawV === 'number' ? rawV : parseFloat(String(rawV).replace(/,/g, ''));
        if (Number.isFinite(n)) {
          sum += n;
          any = true;
          break;
        }
      }
    }
    return any ? sum : null;
  }

  return null;
}

export function isTotalConsumptionByGroupApiPath(apiPath) {
  const p = String(apiPath || '')
    .toLowerCase()
    .split('?')[0];
  return (
    p.includes('total_consumption/by_group') || p.includes('total_consumption%2fby_group')
  );
}

export function buildTotalConsumptionByGroupPieRows(raw, areaGroups, areaIdToDisplayName) {
  const map = areaIdToDisplayName instanceof Map ? areaIdToDisplayName : new Map();

  const chartData = normalizeTotalConsumptionByGroupPayload(raw);

  const hasData =
    chartData &&
    ((chartData.special_area_groups && chartData.special_area_groups.length > 0) ||
      (chartData.data && Object.keys(chartData.data).length > 0));

  if (!hasData) return [];

  let pieData = [];

  const allAreaGroupsListForPie = [
    ...(areaGroups?.special_area_groups || []),
    ...(areaGroups?.user_area_groups || []),
  ];

  const groupIdToName = buildAreaGroupIdNameMap(areaGroups);

  if (chartData.special_area_groups && chartData.special_area_groups.length > 0) {
    pieData = chartData.special_area_groups.map((item) => {
      const backendPercentage = parseFloat(
        String(item.consumption_percentage || '')
          .replace(/ %/g, '')
          .replace('%', '')
          .trim() || '0'
      );
      let displayName = item.name;
      if (displayName == null || String(displayName).trim() === '') {
        const gid = item.group_id ?? item.id ?? item.groupId;
        if (gid != null) {
          displayName =
            nameFromAreaGroupLookup(groupIdToName, gid) ||
            allAreaGroupsListForPie.find(
              (x) =>
                x &&
                x.group_id != null &&
                (String(x.group_id) === String(gid) || Number(x.group_id) === Number(gid))
            )?.name ||
            `Group ${gid}`;
        } else {
          displayName = 'Unknown';
        }
      }
      return {
        name: displayName,
        value: backendPercentage,
        percentage: backendPercentage,
        actual_energy: item.actual_energy,
        consumption_percentage: item.consumption_percentage,
      };
    });
  } else if (chartData.data && allAreaGroupsListForPie.length > 0) {
    const totalConsumption = Object.values(chartData.data).reduce((sum, value) => sum + value, 0);

    const groupedData = {};

    allAreaGroupsListForPie.forEach((group) => {
      if (group && group.name) {
        groupedData[group.name] = { totalConsumption: 0, areas: [] };
      }
    });

    const resolveGroupForAreaName = (areaName) => {
      for (const group of allAreaGroupsListForPie) {
        if (!group?.name) continue;
        if (group.areas?.some((a) => a.name === areaName)) {
          return group.name;
        }
        const ids = getAreaIdsFromGroup(group);
        for (const aid of ids) {
          const label =
            map.get(aid) ?? map.get(Number(aid)) ?? map.get(String(aid));
          if (label === areaName) return group.name;
        }
      }
      return null;
    };

    const resolveGroupFromDataKey = (dataKey) => {
      const keyStr = String(dataKey).trim();
      const byId = allAreaGroupsListForPie.find(
        (x) =>
          x &&
          x.group_id != null &&
          (String(x.group_id) === keyStr || Number(x.group_id) === Number(keyStr))
      );
      if (byId?.name) return String(byId.name).trim();
      const fromMap = nameFromAreaGroupLookup(groupIdToName, keyStr);
      if (fromMap) return fromMap;
      const n = Number(keyStr);
      if (!Number.isNaN(n) && keyStr !== '') {
        const fromMapN = nameFromAreaGroupLookup(groupIdToName, n);
        if (fromMapN) return fromMapN;
      }
      return resolveGroupForAreaName(keyStr);
    };

    Object.entries(chartData.data).forEach(([areaName, consumptionValue]) => {
      const foundGroup = resolveGroupFromDataKey(areaName);

      if (foundGroup && groupedData[foundGroup]) {
        groupedData[foundGroup].totalConsumption += consumptionValue;
        groupedData[foundGroup].areas.push({ name: areaName, consumption: consumptionValue });
      } else if (foundGroup) {
        groupedData[foundGroup] = {
          totalConsumption: consumptionValue,
          areas: [{ name: areaName, consumption: consumptionValue }],
        };
      } else {
        if (!groupedData.Other) {
          groupedData.Other = { totalConsumption: 0, areas: [] };
        }
        groupedData.Other.totalConsumption += consumptionValue;
        groupedData.Other.areas.push({ name: areaName, consumption: consumptionValue });
      }
    });

    pieData = Object.entries(groupedData)
      .filter(([, groupData]) => groupData.totalConsumption > 0)
      .map(([groupName, groupData]) => {
        const percentageValue =
          totalConsumption > 0 ? (groupData.totalConsumption / totalConsumption) * 100 : 0;

        let actualEnergy;
        if (groupData.totalConsumption >= 1000000) {
          actualEnergy = `${(groupData.totalConsumption / 1000000).toFixed(2)} MWh`;
        } else if (groupData.totalConsumption >= 1000) {
          actualEnergy = `${(groupData.totalConsumption / 1000).toFixed(2)} kWh`;
        } else {
          actualEnergy = `${groupData.totalConsumption.toFixed(2)} Wh`;
        }

        return {
          name: groupName,
          value: percentageValue,
          percentage: percentageValue,
          actual_energy: actualEnergy,
          consumption_percentage: `${percentageValue.toFixed(2)} %`,
        };
      });
  } else if (chartData.data && Object.keys(chartData.data).length > 0) {
    const totalConsumption = Object.values(chartData.data).reduce((sum, value) => sum + value, 0);

    pieData = Object.entries(chartData.data).map(([areaName, consumptionValue]) => {
      const percentage = totalConsumption > 0 ? (consumptionValue / totalConsumption) * 100 : 0;
      let actualEnergy;
      if (consumptionValue >= 1000000) {
        actualEnergy = `${(consumptionValue / 1000000).toFixed(2)} MWh`;
      } else if (consumptionValue >= 1000) {
        actualEnergy = `${(consumptionValue / 1000).toFixed(2)} kWh`;
      } else {
        actualEnergy = `${consumptionValue.toFixed(2)} Wh`;
      }

      return {
        name: areaName,
        value: percentage,
        percentage,
        actual_energy: actualEnergy,
        consumption_percentage: `${percentage.toFixed(2)} %`,
      };
    });
  }

  return pieData;
}
