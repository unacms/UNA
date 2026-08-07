import { appSetting } from 'app/config'

/** Class on `<html>` when web superellipse corners are enabled. */
export const CORNER_SMOOTH_CLASS = 'neo-corner-smooth'

const DEFAULT_FACTOR = 1.6
const DEFAULT_FULL_FACTOR = 1

function readConfig() {
    const cfg = appSetting('theme', 'corner_smoothing')
    if (!cfg || typeof cfg !== 'object') {
        return {
            enabled: true,
            factor: DEFAULT_FACTOR,
            full_factor: DEFAULT_FULL_FACTOR,
        }
    }

    const factor = Number(cfg.factor)
    const fullFactor = Number(cfg.full_factor)

    return {
        enabled: cfg.enabled !== false,
        factor: Number.isFinite(factor) && factor > 0 ? factor : DEFAULT_FACTOR,
        full_factor: Number.isFinite(fullFactor) && fullFactor > 0 ? fullFactor : DEFAULT_FULL_FACTOR,
    }
}

const config = readConfig()

export const cornerSmoothingEnabled = config.enabled
export const cornerSmoothingFactor = config.factor
export const cornerSmoothingFullFactor = config.full_factor

/**
 * Props for Next root `<html>`: toggles smooth corners and injects CSS vars
 * consumed by `global.web.css` (`--neo-corner-superellipse-*`).
 */
export function getCornerSmoothingHtmlProps() {
    if (!cornerSmoothingEnabled) {
        return { className: undefined, style: undefined }
    }

    return {
        className: CORNER_SMOOTH_CLASS,
        style: {
            '--neo-corner-superellipse-factor': String(cornerSmoothingFactor),
            '--neo-corner-superellipse-full-factor': String(cornerSmoothingFullFactor),
        },
    }
}

/** iOS `borderCurve: 'continuous'` — same on/off as web superellipse. */
export const iosContinuousCurveStyle = cornerSmoothingEnabled
    ? { borderCurve: 'continuous' }
    : null
