/**
 * @typedef {Object} ConsumptionPieRow
 * @property {string} name
 * @property {number} value
 * @property {number} percentage
 * @property {string} actual_energy
 * @property {string} consumption_percentage
 */

/**
 * @typedef {Object} PieChartThemeTokens
 * @property {string} preset
 * @property {string} [outerBg]
 * @property {string} [outerBorder]
 * @property {string} [plotBg]
 * @property {string} [plotBorder]
 * @property {string} header
 * @property {string} exportBtn
 * @property {string} [dropdownBg]
 * @property {string} [dropdownBorder]
 * @property {string} [dropdownText]
 * @property {string} [dropdownMuted]
 * @property {string} [dropdownSep]
 * @property {string} tooltipBg
 * @property {string} tooltipBorder
 * @property {string} tooltipText
 * @property {string} legend
 * @property {string} centerLabel
 * @property {string} emptyText
 * @property {string} [errorText]
 * @property {boolean} [centerLabelShadow]
 * @property {boolean} useCssTooltipVars
 */

/**
 * @typedef {Object} ConsumptionPieChartViewProps
 * @property {ConsumptionPieRow[]} pieData
 * @property {string[]} segmentColors
 * @property {PieChartThemeTokens} theme
 * @property {(segmentColor: string) => { textFill: string, lineStroke: string, textShadow?: string }} [resolveSegmentLabelColors]
 * @property {import('react').CSSProperties} [cssTooltipStyle]
 */

/**
 * @typedef {Object} PieChartCardShellProps
 * @property {'loading'|'empty'|'error'|'zero-segments'|'ready'} status
 * @property {'basic-energy'|'advanced-card'|'customized-builtin'} shellVariant
 * @property {PieChartThemeTokens} theme
 * @property {string} title
 * @property {string} [emptyMessage]
 * @property {string} [errorMessage]
 * @property {string} [zeroSegmentsMessage]
 * @property {import('react').ReactNode} [exportControl]
 * @property {import('react').ReactNode} [children]
 * @property {boolean} [loaderLight]
 * @property {string} [loaderHeight]
 * @property {string} [loaderMessage]
 * @property {import('react').ComponentType<{ height?: string, message?: string, light?: boolean }>} [LoaderComponent]
 * @property {import('react').CSSProperties} [outerStyleOverride]
 * @property {import('react').CSSProperties} [titleStyleOverride]
 * @property {import('react').CSSProperties} [plotStyleOverride]
 * @property {import('react').CSSProperties} [cardShellStyle]
 */

export {};
