/**
 * @typedef {Object} SavingsStrategyPieRow
 * @property {string} name
 * @property {number} value
 * @property {number} percentage
 */

/**
 * @typedef {Object} SavingsStrategyThemeTokens
 * @property {string} preset
 * @property {string} [outerBg]
 * @property {string} [outerBorder]
 * @property {string} [plotBg]
 * @property {string} [plotBorder]
 * @property {string} header
 * @property {string} chromeText
 * @property {string} centerLabel
 * @property {string} legend
 * @property {string} [tooltipBg]
 * @property {string} [tooltipBorder]
 * @property {string} tooltipText
 * @property {boolean} centerLabelShadow
 * @property {string} labelTextShadow
 * @property {boolean} useCssTooltipVars
 * @property {'embedded-light'|'standalone-dark'|'theme-aware'} paletteProfile
 */

/**
 * @typedef {Object} SavingsStrategyChartViewProps
 * @property {'custom-range-placeholder'|'loading'|'empty-null'|'empty-zero'|'ready'} status
 * @property {string} title
 * @property {import('react').ReactNode} displayTitle
 * @property {SavingsStrategyPieRow[]} [pieData]
 * @property {number} [centerLabelValue]
 * @property {SavingsStrategyThemeTokens} theme
 * @property {(strategyName: string) => string} getSegmentColor
 * @property {(segmentColor: string) => { textFill: string, lineStroke: string, textShadow?: string }} [resolveSegmentLabelColors]
 * @property {import('react').CSSProperties} [outerStyle]
 * @property {import('react').CSSProperties} [plotStyle]
 * @property {import('react').CSSProperties} [headerStyle]
 * @property {boolean} [showHeader]
 * @property {string} [loaderMessage]
 * @property {string} [emptyNullMessage]
 * @property {string} [emptyZeroMessage]
 * @property {import('react').ComponentType<{ height?: string, message?: string, light?: boolean }>} [LoaderComponent]
 * @property {string} [loaderHeight]
 * @property {boolean} [loaderLight]
 * @property {import('react').CSSProperties} [cssTooltipStyle]
 * @property {string} [cardClassName]
 */

export {};
