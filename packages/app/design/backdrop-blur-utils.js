/**
 * Perceptual backdrop-blur calibration for NEO View.
 *
 * Tailwind `--blur-*` px (web CSS) and expo-blur `intensity` (native) are not
 * interchangeable — the same number looks heavier on web (true backdrop-filter)
 * and lighter on native (UIVisualEffectView snapshot). Settings below tune each
 * engine so `backdrop-blur-*` reads similarly in chrome (headers, menus).
 *
 * Only *bare* tokens (e.g. `backdrop-blur-lg`) are bridged to inline style /
 * expo-blur. Variant-prefixed tokens (`max-sm:backdrop-blur-lg`, `dark:…`,
 * `hover:…`, `web:…`) stay in className so Tailwind breakpoints and states work.
 *
 * Tailwind reference px: xs 4, sm 8, md 12, lg 16, xl 24, 2xl 40, 3xl 64.
 */
const BACKDROP_BLUR_CALIBRATION = [
    ['backdrop-blur-3xl', { webPx: 24, nativeIntensity: 85 }],
    ['backdrop-blur-2xl', { webPx: 16, nativeIntensity: 65 }],
    ['backdrop-blur-xl', { webPx: 10, nativeIntensity: 45 }],
    ['backdrop-blur-lg', { webPx: 8, nativeIntensity: 32 }],
    ['backdrop-blur-md', { webPx: 6, nativeIntensity: 24 }],
    ['backdrop-blur-sm', { webPx: 4, nativeIntensity: 16 }],
    ['backdrop-blur-xs', { webPx: 2, nativeIntensity: 10 }],
    ['backdrop-blur', { webPx: 4, nativeIntensity: 16 }],
]

const BACKDROP_BLUR_TOKEN = 'backdrop-blur'

function splitClassTokens(className = '') {
    return className.trim().split(/\s+/).filter(Boolean)
}

/** True when the utility has no Tailwind variant prefix (only optional `!`). */
function isBareBackdropBlurToken(token = '') {
    const withoutImportant = token.replace(/^!+/, '')
    const blurIdx = withoutImportant.indexOf(BACKDROP_BLUR_TOKEN)
    if (blurIdx === -1) return false
    return withoutImportant.slice(0, blurIdx).length === 0
}

function getBareBackdropBlurToken(className = '') {
    for (const token of splitClassTokens(className)) {
        if (!isBareBackdropBlurToken(token)) continue
        const withoutImportant = token.replace(/^!+/, '')
        for (const [blurToken] of BACKDROP_BLUR_CALIBRATION) {
            if (withoutImportant === blurToken) return blurToken
        }
    }
    return null
}

function resolveBackdropBlur(className = '') {
    const bareToken = getBareBackdropBlurToken(className)
    if (!bareToken) return null
    return BACKDROP_BLUR_CALIBRATION.find(([token]) => token === bareToken)?.[1] ?? null
}

export function getBackdropBlurIntensity(className = '') {
    const calibration = resolveBackdropBlur(className)
    return calibration?.nativeIntensity ?? 0
}

export function getBackdropBlurWebPx(className = '') {
    const calibration = resolveBackdropBlur(className)
    return calibration?.webPx ?? 0
}

/** Remove only bare backdrop-blur utilities; keep variant-prefixed classes. */
export function stripBackdropBlurClasses(className = '') {
    return splitClassTokens(className)
        .filter((token) => !isBareBackdropBlurToken(token))
        .join(' ')
}
