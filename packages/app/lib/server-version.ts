/**
 * Minimal server-version checks for `config.min_server_version` /
 * `config.stable_server_version` (replaces the `semver` package, ~300 KB in
 * the client bundle for two comparisons).
 *
 * Supports what the settings actually use: plain versions (`15.0.0`) and
 * `x` wildcards (`15.x.x`, `15.2.x`). Prerelease tags are ignored, like
 * `semver.coerce` did.
 */

/** "v15.1.0-beta.2" → [15, 1, 0]; null when there is no number at all. */
export function coerceVersion(input: string) {
    const m = String(input ?? '').match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
    if (!m) return null
    return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)]
}

function compare(a: any, b: any) {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
    }
    return 0
}

/** Parse a range like `15.x.x` into its lowest and highest concrete versions. */
function rangeBounds(range: any) {
    const parts = String(range ?? '').split('.')
    const low = [0, 0, 0]
    const high = [0, 0, 0]
    let wildcard = false
    for (let i = 0; i < 3; i++) {
        const p = parts[i]
        if (wildcard || p === undefined || /^[xX*]$/.test(p)) {
            wildcard = true
            low[i] = 0
            high[i] = Number.MAX_SAFE_INTEGER
        } else {
            const n = Number(p)
            if (Number.isNaN(n)) return null
            low[i] = n
            high[i] = n
        }
    }
    return { low, high }
}

/** `semver.ltr(version, range)`: version is lower than every version the range allows. */
export function isBelowRange(version: string, range: any) {
    const v = coerceVersion(version)
    const bounds = rangeBounds(range)
    if (!v || !bounds) return false
    return compare(v, bounds.low) < 0
}

/** `semver.gtr(version, range)`: version is higher than every version the range allows. */
export function isAboveRange(version: string, range: any) {
    const v = coerceVersion(version)
    const bounds = rangeBounds(range)
    if (!v || !bounds) return false
    return compare(v, bounds.high) > 0
}
