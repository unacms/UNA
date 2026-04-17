/**
 * Wave / edge path helpers for NodeFlow variants.
 *
 * Three layers:
 *   - `buildWavePath({ anchors, ... })` — generic: takes an explicit array of
 *     anchor points (e.g. resolved handle positions) and emits an SVG `d`
 *     plus an arc-length estimate. Use this for the new edges API.
 *   - `samplePathPositions({ anchors, ... })` — arc-length-weighted sampler
 *     used to drive traveling markers (animated icons sliding along the line)
 *     on platforms that don't support SVG `<animateMotion>`.
 *   - `buildWaveLayout({ count, ... })` — legacy convenience that auto-lays
 *     nodes along the main axis and routes a single continuous wave through
 *     all centers. Internally builds anchors and delegates to `buildWavePath`.
 *
 * All helpers are pure JS — no React, no native modules — so they tree-shake
 * cleanly and can be reused by custom variants registered through
 * `app/customization/node-flow-variants.js`.
 */

/**
 * @typedef {{ x: number, y: number }} Point
 *
 * @typedef {Object} BuildWavePathInput
 * @property {Point[]} anchors                       Ordered anchor points the path must pass through (>= 2).
 * @property {number}  [amplitude=0]                 Peak perpendicular offset of the wave; `0` = straight polyline.
 * @property {boolean} [alternate=true]              Flip the perpendicular sign every segment so the wave undulates.
 * @property {-1 | 1}  [startSign=1]                 Initial perpendicular sign before alternation kicks in.
 *
 * @typedef {Object} BuildWavePathOutput
 * @property {string}  d                             SVG `d` string.
 * @property {number}  approxLength                  Polyline-sampled arc length for stroke-dash math.
 *
 * @typedef {Object} SampleInput
 * @property {Point[]} anchors
 * @property {number}  [amplitude=0]
 * @property {boolean} [alternate=true]
 * @property {-1 | 1}  [startSign=1]
 * @property {number}  [sampleCount=64]              Number of intervals in the resulting polyline (returns sampleCount+1 points).
 */

/**
 * Build an SVG path that passes through every anchor in order. Each segment
 * between consecutive anchors becomes a single cubic Bezier whose control
 * points are placed at the 1/3 and 2/3 marks along the segment and offset
 * perpendicular by `amplitude`. The perpendicular sign alternates each
 * segment when `alternate` is true so the curve undulates side to side
 * regardless of the segment direction (works for any anchor topology, not
 * just axis-aligned).
 *
 * @param {BuildWavePathInput} input
 * @returns {BuildWavePathOutput}
 */
export function buildWavePath({
    anchors,
    amplitude = 0,
    alternate = true,
    startSign = 1,
}) {
    if (!anchors || anchors.length < 2) {
        return { d: '', approxLength: 0 };
    }

    let d = `M ${fmt(anchors[0].x)} ${fmt(anchors[0].y)}`;
    let approxLength = 0;

    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        const sign = (alternate ? (i % 2 === 0 ? 1 : -1) : 1) * startSign;

        if (!amplitude) {
            d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
            approxLength += Math.hypot(b.x - a.x, b.y - a.y);
            continue;
        }

        const { c1, c2 } = perpendicularControls(a, b, sign * amplitude);
        d += ` C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(b.x)} ${fmt(b.y)}`;
        approxLength += approxBezierLength(a, c1, c2, b);
    }

    return { d, approxLength };
}

/**
 * Arc-length-weighted polyline sampling of the same wave the path renderer
 * draws. Returns `sampleCount + 1` points spaced uniformly along the total
 * arc length, suitable for driving an `Animated.Value` that translates a
 * marker icon along the line.
 *
 * @param {SampleInput} input
 * @returns {Point[]}
 */
export function samplePathPositions({
    anchors,
    amplitude = 0,
    alternate = true,
    startSign = 1,
    sampleCount = 64,
}) {
    if (!anchors || anchors.length < 2) return [];

    const segments = [];
    let totalLength = 0;
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        const sign = (alternate ? (i % 2 === 0 ? 1 : -1) : 1) * startSign;
        let segLen;
        let c1;
        let c2;
        const isLine = !amplitude;
        if (isLine) {
            c1 = a;
            c2 = b;
            segLen = Math.hypot(b.x - a.x, b.y - a.y);
        } else {
            ({ c1, c2 } = perpendicularControls(a, b, sign * amplitude));
            segLen = approxBezierLength(a, c1, c2, b);
        }
        segments.push({ a, b, c1, c2, len: segLen, isLine });
        totalLength += segLen;
    }

    const out = [];
    if (totalLength <= 0) {
        for (let i = 0; i <= sampleCount; i++) out.push({ ...anchors[0] });
        return out;
    }

    for (let i = 0; i <= sampleCount; i++) {
        const target = (i / sampleCount) * totalLength;
        let acc = 0;
        let chosen = segments[0];
        let local = 0;
        for (let s = 0; s < segments.length; s++) {
            const seg = segments[s];
            if (acc + seg.len >= target || s === segments.length - 1) {
                chosen = seg;
                local = seg.len > 0 ? (target - acc) / seg.len : 0;
                break;
            }
            acc += seg.len;
        }
        const t = clamp01(local);
        const pt = chosen.isLine
            ? {
                  x: chosen.a.x + (chosen.b.x - chosen.a.x) * t,
                  y: chosen.a.y + (chosen.b.y - chosen.a.y) * t,
              }
            : cubicAt(chosen.a, chosen.c1, chosen.c2, chosen.b, t);
        out.push(pt);
    }
    return out;
}

/**
 * Legacy convenience: auto-lay `count` evenly spaced node centers along the
 * main axis, then route a single continuous wave through them. Returns the
 * centers (so callers can position node bubbles) and the wave path.
 *
 * @param {Object} input
 * @param {number} input.count
 * @param {number} input.length
 * @param {number} input.crossSize
 * @param {number} [input.amplitude]
 * @param {'horizontal'|'vertical'} [input.orientation]
 * @param {number} [input.padStart]
 * @param {number} [input.padEnd]
 */
export function buildWaveLayout({
    count,
    length,
    crossSize,
    amplitude,
    orientation = 'horizontal',
    padStart = 0,
    padEnd = 0,
}) {
    const isHorizontal = orientation !== 'vertical';
    const cross = crossSize / 2;
    const amp = amplitude ?? Math.max(0, cross * 0.6);

    if (count <= 0) {
        return { centers: [], d: '', approxLength: 0 };
    }
    if (count === 1) {
        const onlyMain = padStart + Math.max(0, length - padStart - padEnd) / 2;
        const center = isHorizontal
            ? { x: onlyMain, y: cross }
            : { x: cross, y: onlyMain };
        return { centers: [center], d: '', approxLength: 0 };
    }

    const usable = Math.max(0, length - padStart - padEnd);
    const step = usable / (count - 1);
    const centers = [];
    for (let i = 0; i < count; i++) {
        const main = padStart + step * i;
        centers.push(isHorizontal ? { x: main, y: cross } : { x: cross, y: main });
    }

    const { d, approxLength } = buildWavePath({ anchors: centers, amplitude: amp });
    return { centers, d, approxLength };
}

/**
 * For each segment between consecutive anchors, return the position **and
 * tangent angle** at the segment's *visible* midpoint. The "visible" part
 * matters when an anchor sits inside a node bubble (e.g. a `via` handle at
 * `center`): the bubble paints over the path within `hideRadius` of that
 * anchor, so the visually unobstructed portion of the segment starts after
 * `hideRadius` arc length and ends `hideRadius` arc length before the next
 * anchor. The midpoint is then the arc-length midpoint of that trimmed
 * portion — i.e. centered in the actual gap between bubbles.
 *
 * Anchors with `hideRadius` undefined or `0` (e.g. handles on a node edge
 * like `right` / `left`) contribute no trimming, so endpoints stay flush.
 *
 * Useful for placing inline markers (arrows, dots, …) at the perceptual
 * midpoint of each gap rather than the geometric midpoint of each segment.
 *
 * @param {Object} input
 * @param {Array<{ x: number, y: number, hideRadius?: number }>} input.anchors
 * @param {number} [input.amplitude=0]
 * @param {boolean} [input.alternate=true]
 * @param {-1 | 1} [input.startSign=1]
 * @param {number} [input.samplesPerSegment=64]   Higher = more accurate trim.
 * @returns {Array<{ x: number, y: number, angle: number }>} angle in radians
 */
export function getSegmentMidpoints({
    anchors,
    amplitude = 0,
    alternate = true,
    startSign = 1,
    samplesPerSegment = 64,
}) {
    if (!anchors || anchors.length < 2) return [];

    const out = [];
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        const sign = (alternate ? (i % 2 === 0 ? 1 : -1) : 1) * startSign;
        const hideA = Math.max(0, a.hideRadius ?? 0);
        const hideB = Math.max(0, b.hideRadius ?? 0);

        const isLine = !amplitude;
        let c1;
        let c2;
        if (isLine) {
            c1 = a;
            c2 = b;
        } else {
            ({ c1, c2 } = perpendicularControls(a, b, sign * amplitude));
        }

        // Sample the segment uniformly in t (t-uniform is fine for our
        // gentle waves — the curve doesn't loop back, so distance from
        // each anchor is monotonic-ish along the curve).
        const samples = [{ x: a.x, y: a.y, len: 0 }];
        let totalLen = 0;
        for (let s = 1; s <= samplesPerSegment; s++) {
            const t = s / samplesPerSegment;
            const pt = isLine
                ? { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
                : cubicAt(a, c1, c2, b, t);
            const last = samples[samples.length - 1];
            totalLen += Math.hypot(pt.x - last.x, pt.y - last.y);
            samples.push({ x: pt.x, y: pt.y, len: totalLen });
        }

        // Find the arc-length where the curve first leaves the start
        // anchor's hide-radius (visible start).
        let visStart = 0;
        if (hideA > 0) {
            for (let s = 1; s < samples.length; s++) {
                if (Math.hypot(samples[s].x - a.x, samples[s].y - a.y) >= hideA) {
                    visStart = samples[s].len;
                    break;
                }
            }
        }
        // Find the arc-length where the curve last is outside the end
        // anchor's hide-radius (visible end).
        let visEnd = totalLen;
        if (hideB > 0) {
            for (let s = samples.length - 1; s > 0; s--) {
                if (Math.hypot(samples[s].x - b.x, samples[s].y - b.y) >= hideB) {
                    visEnd = samples[s].len;
                    break;
                }
            }
        }
        if (visEnd <= visStart) {
            // Bubbles overlap on the path (degenerate case). Fall back to
            // the geometric midpoint so we still emit something sensible.
            visStart = 0;
            visEnd = totalLen;
        }

        const target = (visStart + visEnd) / 2;
        let chosenIdx = 0;
        for (let s = 1; s < samples.length; s++) {
            if (samples[s].len >= target) {
                chosenIdx = s;
                break;
            }
        }
        const chosen = samples[chosenIdx];
        const prev = samples[Math.max(0, chosenIdx - 1)];
        const next = samples[Math.min(samples.length - 1, chosenIdx + 1)];
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        out.push({ x: chosen.x, y: chosen.y, angle });
    }
    return out;
}

function perpendicularControls(a, b, signedAmplitude) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular obtained by rotating the segment direction 90° CCW.
    const px = -dy / len;
    const py = dx / len;
    return {
        c1: { x: a.x + dx / 3 + px * signedAmplitude, y: a.y + dy / 3 + py * signedAmplitude },
        c2: { x: a.x + (2 * dx) / 3 + px * signedAmplitude, y: a.y + (2 * dy) / 3 + py * signedAmplitude },
    };
}

function fmt(n) {
    return Math.round(n * 1000) / 1000;
}

function clamp01(n) {
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
}

function approxBezierLength(p0, p1, p2, p3, samples = 16) {
    let len = 0;
    let prev = p0;
    for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const pt = cubicAt(p0, p1, p2, p3, t);
        len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        prev = pt;
    }
    return len;
}

function cubicAt(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    return {
        x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
        y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
    };
}
