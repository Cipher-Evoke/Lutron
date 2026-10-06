/**
 * @typedef {Object} EnergyChartThemeTokens
 * @property {string} preset
 * @property {string} plotBg
 * @property {string} [outerBg]
 * @property {string} [outerBorder]
 * @property {string} plotBorder
 * @property {string} tick
 * @property {string} axis
 * @property {string} grid
 * @property {string} header
 * @property {string} [tooltipBg]
 * @property {string} [tooltipBorder]
 * @property {string} tooltipText
 * @property {string} tooltipTitleBorder
 * @property {string} exportBtn
 * @property {string} [dropdownBg]
 * @property {string} [dropdownBorder]
 * @property {string} [dropdownText]
 * @property {string} [dropdownMuted]
 * @property {string} [dropdownSep]
 * @property {string} legend
 * @property {string} cursor
 * @property {string} dotStroke
 * @property {string} activeDotStroke
 * @property {string} emptyText
 * @property {boolean} useCssTooltipVars
 */

/**
 * @typedef {Object} EnergyLineChartConfig
 * @property {number} xAxisInterval
 * @property {number} xAxisTickCount
 * @property {number} xAxisFontSize
 * @property {number} dotSize
 * @property {number} activeDotSize
 * @property {number} strokeWidth
 */

/**
 * @typedef {Object} EnergyLineChartViewProps
 * @property {Array<Record<string, unknown>>} chartData
 * @property {string[]} seriesNames
 * @property {string[]} seriesColors
 * @property {EnergyLineChartConfig} chartConfig
 * @property {EnergyChartThemeTokens} theme
 * @property {string} dynamicUnit
 * @property {number|null|undefined} yAxisLimit
 * @property {(value: string, index: number) => string} formatXAxisLabel
 * @property {string} selectedDuration
 * @property {number} selectedAreaCount
 * @property {string} title
 * @property {string} currentDate
 * @property {string|null} [legendSeriesName]
 * @property {string} chartKey
 */

/**
 * @typedef {Object} EnergyChartCardShellProps
 * @property {'loading'|'empty'|'ready'} status
 * @property {'basic-energy'|'advanced-card'|'customized-builtin'} shellVariant
 * @property {EnergyChartThemeTokens} theme
 * @property {string} title
 * @property {string} [dynamicUnit]
 * @property {string} [emptyMessage]
 * @property {'message'|'blank'} [emptyStateVariant]
 * @property {import('react').ReactNode} [emptyStateExtras]
 * @property {import('react').ReactNode} [exportControl]
 * @property {import('react').ReactNode} [children]
 * @property {boolean} [loaderLight]
 * @property {string} [loaderHeight]
 * @property {import('react').CSSProperties} [outerStyleOverride]
 * @property {import('react').CSSProperties} [titleStyleOverride]
 * @property {import('react').CSSProperties} [plotStyleOverride]
 * @property {string} [loaderMessage]
 * @property {import('react').ReactNode} [blankChartPreview]
 */

export {};
