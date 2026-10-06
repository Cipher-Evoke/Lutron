/**
 * Shared React.memo comparator for ConsumptionPieChart adapter props.
 * Returns true when props are equal (skip re-render).
 */
export function consumptionPieChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.onEmail !== nextProps.onEmail) return false;
  if (prevProps.onDownload !== nextProps.onDownload) return false;
  if (prevProps.exportControl !== nextProps.exportControl) return false;

  if ('chartSurface' in prevProps || 'chartSurface' in nextProps) {
    if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  }

  if (prevProps.areaGroups !== nextProps.areaGroups) return false;
  if (prevProps.areaIdToDisplayName !== nextProps.areaIdToDisplayName) return false;

  if (prevProps.data !== nextProps.data) {
    if (prevProps.data && nextProps.data) {
      try {
        if (JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)) {
          return true;
        }
      } catch (e) {
        // fall through
      }
    }
    return false;
  }

  return true;
}

/**
 * Memo comparator for pie row transforms (useMemo dependency audit).
 */
export function consumptionPieRowsMemoKey(data, areaGroups, areaIdToDisplayName) {
  try {
    return JSON.stringify({
      data,
      areaGroups,
      areaIdToDisplayName:
        areaIdToDisplayName instanceof Map
          ? Array.from(areaIdToDisplayName.entries())
          : areaIdToDisplayName,
    });
  } catch (e) {
    return `${data}-${areaGroups}-${areaIdToDisplayName}`;
  }
}

/**
 * Replicated legacy inline pie row builder from basic/advanced Dashboard.jsx.
 * Used only in parity tests — groups via special_area_groups only.
 */
export function legacyBasicAdvancedPieRows(data, areaGroups) {
  if (!data) return [];

  if (data.special_area_groups) {
    return data.special_area_groups.map((item) => {
      const backendPercentage = parseFloat(item.consumption_percentage?.replace(' %', '') || '0');
      return {
        name: item.name,
        value: backendPercentage,
        percentage: backendPercentage,
        actual_energy: item.actual_energy,
        consumption_percentage: item.consumption_percentage,
      };
    });
  }

  if (data.data && areaGroups) {
    const totalConsumption = Object.values(data.data).reduce((sum, value) => sum + value, 0);
    const groupedData = {};

    if (areaGroups.special_area_groups) {
      areaGroups.special_area_groups.forEach((group) => {
        groupedData[group.name] = { totalConsumption: 0, areas: [] };
      });
    }

    Object.entries(data.data).forEach(([areaName, consumptionValue]) => {
      let foundGroup = null;
      if (areaGroups.special_area_groups) {
        for (const group of areaGroups.special_area_groups) {
          if (group.areas && group.areas.some((area) => area.name === areaName)) {
            foundGroup = group.name;
            break;
          }
        }
      }

      if (foundGroup) {
        groupedData[foundGroup].totalConsumption += consumptionValue;
        groupedData[foundGroup].areas.push({ name: areaName, consumption: consumptionValue });
      } else {
        if (!groupedData.Other) {
          groupedData.Other = { totalConsumption: 0, areas: [] };
        }
        groupedData.Other.totalConsumption += consumptionValue;
        groupedData.Other.areas.push({ name: areaName, consumption: consumptionValue });
      }
    });

    return Object.entries(groupedData)
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
  }

  if (data.data) {
    const totalConsumption = Object.values(data.data).reduce((sum, value) => sum + value, 0);
    return Object.entries(data.data).map(([areaName, consumptionValue]) => {
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

  return [];
}
