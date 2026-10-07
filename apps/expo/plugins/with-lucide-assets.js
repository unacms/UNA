const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Lucide icons as native vector template images.
 *
 * iOS: writes `Images.xcassets/Lucide/<kebab>.imageset` for every icon that
 * `lucide-react-native` exports, from the matching `lucide-static` SVGs, so
 * Expo UI buttons draw the same glyphs as JS via `Image assetName="Lucide/<kebab>"`.
 * Template rendering lets SwiftUI tint them like SF Symbols (liquid glass
 * vibrancy, selected tint) and the system caches the rasterized vectors — no
 * RN views or per-render bitmap decoding inside SwiftUI buttons.
 *
 * Android: writes `res/drawable/lucide_<snake>.xml` vector drawables (NativeTabs
 * `drawable`), which Material tints like its own icons.
 *
 * After a Lucide upgrade, refresh the runtime name map:
 *   node apps/expo/plugins/with-lucide-assets.js --manifest
 * Write assets into an existing native project without a full prebuild:
 *   node apps/expo/plugins/with-lucide-assets.js --ios apps/expo/ios/NEO/Images.xcassets
 *   node apps/expo/plugins/with-lucide-assets.js --android apps/expo/android/app/src/main/res
 */

// Bump when the SVG transform or imageset format changes to force a rewrite.
const GENERATOR_VERSION = 1;
// Bump when the SVG → vector drawable conversion changes.
const ANDROID_GENERATOR_VERSION = 1;
const NAMESPACE = 'Lucide';
const DRAWABLE_PREFIX = 'lucide_';
const MANIFEST_PATH = path.resolve(__dirname, '../../../packages/app/lib/platform/lucide-assets.ts');

// Lucide draws on a 24px grid with a 2px safe zone; strokes reach at most 1px
// past it. Cropping 1px keeps every glyph unclipped and makes it read closer to
// an SF Symbol at the same point size.
const VIEWBOX = '1 1 22 22';
const ASSET_SIZE = 22;

function toKebab(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Za-z])([0-9])/g, '$1-$2')
        .toLowerCase();
}

/** Package root — resolve the entry and walk up, since `exports` may hide `package.json`. */
function packageDir(name) {
    let dir = path.dirname(require.resolve(name, { paths: [__dirname] }));
    for (;;) {
        const pkg = path.join(dir, 'package.json');
        if (fs.existsSync(pkg) && JSON.parse(fs.readFileSync(pkg, 'utf8')).name === name) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) throw new Error(`with-lucide-assets: cannot locate ${name}`);
        dir = parent;
    }
}

function packageVersion(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
}

/** Map every exported icon name (aliases included) to its canonical kebab file name. */
function readLucideExports() {
    const dir = packageDir('lucide-react-native');
    const index = fs.readFileSync(path.join(dir, 'dist/esm/lucide-react-native.mjs'), 'utf8');
    const names = new Map();
    const re = /export \{([^}]*)\} from '\.\/icons\/([a-z0-9-]+)\.mjs'/g;
    let match;
    while ((match = re.exec(index))) {
        const kebab = match[2];
        const group = match[1].split(',').map((part) => part.trim().replace(/^default as /, ''));
        for (const name of group) {
            // Skip generated `FooIcon` / `LucideFoo` duplicates of a name in the same group.
            if (name.startsWith('Lucide') && group.includes(name.slice('Lucide'.length))) continue;
            if (name.endsWith('Icon') && group.includes(name.slice(0, -'Icon'.length))) continue;
            names.set(name, kebab);
        }
    }
    return names;
}

function toAssetSvg(svg) {
    return svg
        .replace(/<!--[\s\S]*?-->\s*/g, '')
        .replace(/\s+class="[^"]*"/, '')
        .replace(/viewBox="[^"]*"/, `viewBox="${VIEWBOX}"`)
        .replace(/\swidth="[^"]*"/, ` width="${ASSET_SIZE}"`)
        .replace(/\sheight="[^"]*"/, ` height="${ASSET_SIZE}"`)
        .replace(/currentColor/g, '#000000');
}

function writeJson(file, data) {
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** Write the `Lucide` namespace into `assetsDir`. Skips when version and generator are unchanged. */
function writeLucideAssets(assetsDir) {
    const staticDir = packageDir('lucide-static');
    const version = packageVersion(staticDir);
    const stamp = `${version}+${GENERATOR_VERSION}`;
    const outDir = path.join(assetsDir, NAMESPACE);
    // Keep the stamp outside the catalog so actool never sees an unknown file.
    const stampFile = path.join(path.dirname(assetsDir), `.lucide-assets-${NAMESPACE}`);
    if (fs.existsSync(outDir) && fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) {
        return { written: 0, skipped: true, version };
    }

    const kebabs = new Set(readLucideExports().values());
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    writeJson(path.join(outDir, 'Contents.json'), {
        info: { author: 'xcode', version: 1 },
        properties: { 'provides-namespace': true },
    });

    let written = 0;
    for (const kebab of kebabs) {
        const svgFile = path.join(staticDir, 'icons', `${kebab}.svg`);
        if (!fs.existsSync(svgFile)) continue;
        const setDir = path.join(outDir, `${kebab}.imageset`);
        fs.mkdirSync(setDir);
        fs.writeFileSync(path.join(setDir, `${kebab}.svg`), toAssetSvg(fs.readFileSync(svgFile, 'utf8')));
        writeJson(path.join(setDir, 'Contents.json'), {
            images: [{ filename: `${kebab}.svg`, idiom: 'universal' }],
            info: { author: 'xcode', version: 1 },
            properties: {
                'preserves-vector-representation': true,
                'template-rendering-intent': 'template',
            },
        });
        written++;
    }
    fs.writeFileSync(stampFile, stamp);
    return { written, skipped: false, version };
}

function toDrawableName(kebab) {
    return `${DRAWABLE_PREFIX}${kebab.replace(/-/g, '_')}`;
}

function svgAttrs(source) {
    const attrs = {};
    const re = /([a-zA-Z][\w-]*)="([^"]*)"/g;
    let match;
    while ((match = re.exec(source))) attrs[match[1]] = match[2];
    return attrs;
}

function num(value, fallback = 0) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
}

/** Full ellipse as two arcs — vector drawables only take `<path>`. */
function ellipsePath(cx, cy, rx, ry) {
    return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
}

function rectPath(x, y, w, h, rx, ry) {
    if (!rx && !ry) return `M${x} ${y}h${w}v${h}h${-w}z`;
    rx = Math.min(rx || ry, w / 2);
    ry = Math.min(ry || rx, h / 2);
    return `M${x + rx} ${y}h${w - 2 * rx}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${h - 2 * ry}`
        + `a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${-(w - 2 * rx)}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}`
        + `v${-(h - 2 * ry)}a${rx} ${ry} 0 0 1 ${rx} ${-ry}z`;
}

function pointsPath(points, close) {
    const nums = points.trim().split(/[\s,]+/).map(Number);
    let d = '';
    for (let i = 0; i + 1 < nums.length; i += 2) d += `${i === 0 ? 'M' : 'L'}${nums[i]} ${nums[i + 1]}`;
    return close ? `${d}z` : d;
}

function elementPath(tag, a) {
    switch (tag) {
        case 'path': return a.d;
        case 'circle': return ellipsePath(num(a.cx), num(a.cy), num(a.r), num(a.r));
        case 'ellipse': return ellipsePath(num(a.cx), num(a.cy), num(a.rx), num(a.ry));
        case 'line': return `M${num(a.x1)} ${num(a.y1)}L${num(a.x2)} ${num(a.y2)}`;
        case 'rect': return rectPath(num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx), num(a.ry));
        case 'polyline': return pointsPath(a.points || '', false);
        case 'polygon': return pointsPath(a.points || '', true);
        default: return null;
    }
}

/**
 * Lucide SVG → Android vector drawable. Full 24dp viewport (Material icons use
 * the same grid and 2dp padding), black strokes that the tab bar re-tints.
 */
function toVectorDrawable(svg) {
    const root = svgAttrs(svg.match(/<svg\b([^>]*)>/)?.[1] || '');
    const paths = [];
    const re = /<(path|circle|ellipse|line|rect|polyline|polygon)\b([^>]*?)\/?>/g;
    let match;
    while ((match = re.exec(svg))) {
        const a = { ...root, ...svgAttrs(match[2]) };
        const d = elementPath(match[1], a);
        if (!d) continue;
        const filled = a.fill && a.fill !== 'none';
        paths.push(
            `    <path\n`
            + `        android:pathData="${d}"\n`
            + `        android:fillColor="${filled ? '#FF000000' : '#00000000'}"\n`
            + `        android:strokeColor="#FF000000"\n`
            + `        android:strokeWidth="${num(a['stroke-width'], 2)}"\n`
            + `        android:strokeLineCap="${a['stroke-linecap'] || 'round'}"\n`
            + `        android:strokeLineJoin="${a['stroke-linejoin'] || 'round'}" />`,
        );
    }
    return `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by apps/expo/plugins/with-lucide-assets.js — do not edit. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
${paths.join('\n')}
</vector>
`;
}

/** Write `lucide_*.xml` into `<resDir>/drawable`. Skips when version and generator are unchanged. */
function writeLucideDrawables(resDir) {
    const staticDir = packageDir('lucide-static');
    const version = packageVersion(staticDir);
    const stamp = `${version}+${ANDROID_GENERATOR_VERSION}`;
    const outDir = path.join(resDir, 'drawable');
    // Outside `res/` so aapt never sees it.
    const stampFile = path.join(path.dirname(resDir), `.lucide-drawables`);
    const existing = fs.existsSync(outDir)
        ? fs.readdirSync(outDir).filter((f) => f.startsWith(DRAWABLE_PREFIX) && f.endsWith('.xml'))
        : [];
    if (existing.length && fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) {
        return { written: 0, skipped: true, version };
    }

    fs.mkdirSync(outDir, { recursive: true });
    for (const file of existing) fs.rmSync(path.join(outDir, file));
    let written = 0;
    for (const kebab of new Set(readLucideExports().values())) {
        const svgFile = path.join(staticDir, 'icons', `${kebab}.svg`);
        if (!fs.existsSync(svgFile)) continue;
        fs.writeFileSync(
            path.join(outDir, `${toDrawableName(kebab)}.xml`),
            toVectorDrawable(fs.readFileSync(svgFile, 'utf8')),
        );
        written++;
    }
    // Referenced by name from JS only — keep them if `shrinkResources` is enabled.
    fs.mkdirSync(path.join(resDir, 'raw'), { recursive: true });
    fs.writeFileSync(
        path.join(resDir, 'raw', `${DRAWABLE_PREFIX}keep.xml`),
        '<?xml version="1.0" encoding="utf-8"?>\n'
        + `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="@drawable/${DRAWABLE_PREFIX}*" />\n`,
    );
    fs.writeFileSync(stampFile, stamp);
    return { written, skipped: false, version };
}

/** Runtime map: canonical kebab list + names whose kebab `toKebab()` can't derive. */
function writeLucideManifest(file = MANIFEST_PATH) {
    const staticDir = packageDir('lucide-static');
    const version = packageVersion(staticDir);
    const names = readLucideExports();
    const kebabs = [...new Set(names.values())]
        .filter((kebab) => fs.existsSync(path.join(staticDir, 'icons', `${kebab}.svg`)))
        .sort();
    const available = new Set(kebabs);
    const aliases = {};
    for (const [name, kebab] of [...names.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        if (available.has(kebab) && toKebab(name) !== kebab) aliases[name] = kebab;
    }
    const source = `// Generated by apps/expo/plugins/with-lucide-assets.js — do not edit.
// Regenerate after a Lucide upgrade: node apps/expo/plugins/with-lucide-assets.js --manifest

/** lucide-static version the iOS \`${NAMESPACE}\` asset catalog was generated from. */
export const LUCIDE_ASSETS_VERSION = '${version}';

/** Canonical kebab names of every \`${NAMESPACE}/<kebab>\` imageset. */
export const LUCIDE_ASSET_KEBABS = '${kebabs.join(',')}';

/** Icon names (incl. aliases) whose kebab differs from \`lucideKebab(name)\`. */
export const LUCIDE_ASSET_ALIASES: Record<string, string> = ${JSON.stringify(aliases, null, 4)};

let kebabSet: Set<string> | null = null;

/** Same rule as the generator: \`MessageSquare\` → \`message-square\`, \`Building2\` → \`building-2\`. */
export function lucideKebab(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Za-z])([0-9])/g, '$1-$2')
        .toLowerCase();
}

/** \`${NAMESPACE}/<kebab>\` for a Lucide icon name that has a native asset, else null. */
export function lucideAssetName(name: unknown): string | null {
    if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(name)) return null;
    kebabSet ??= new Set(LUCIDE_ASSET_KEBABS.split(','));
    const kebab = LUCIDE_ASSET_ALIASES[name] ?? lucideKebab(name);
    return kebabSet.has(kebab) ? \`${NAMESPACE}/\${kebab}\` : null;
}

/** Android \`${DRAWABLE_PREFIX}<snake>\` drawable resource for a Lucide icon name, else null. */
export function lucideDrawableName(name: unknown): string | null {
    const asset = lucideAssetName(name);
    return asset ? \`${DRAWABLE_PREFIX}\${asset.slice(${NAMESPACE.length + 1}).replace(/-/g, '_')}\` : null;
}
`;
    fs.writeFileSync(file, source);
    return { file, icons: kebabs.length, aliases: Object.keys(aliases).length, version };
}

function withLucideAssets(config) {
    config = withDangerousMod(config, [
        'ios',
        async (config) => {
            const { platformProjectRoot, projectName } = config.modRequest;
            writeLucideAssets(path.join(platformProjectRoot, projectName, 'Images.xcassets'));
            return config;
        },
    ]);
    return withDangerousMod(config, [
        'android',
        async (config) => {
            writeLucideDrawables(path.join(config.modRequest.platformProjectRoot, 'app/src/main/res'));
            return config;
        },
    ]);
}

module.exports = withLucideAssets;
module.exports.writeLucideAssets = writeLucideAssets;
module.exports.writeLucideDrawables = writeLucideDrawables;
module.exports.writeLucideManifest = writeLucideManifest;

if (require.main === module) {
    const args = process.argv.slice(2);
    const iosIndex = args.indexOf('--ios');
    if (iosIndex !== -1) {
        const result = writeLucideAssets(path.resolve(args[iosIndex + 1]));
        console.log(result.skipped
            ? `Lucide ${result.version}: assets up to date`
            : `Lucide ${result.version}: wrote ${result.written} imagesets`);
    }
    const androidIndex = args.indexOf('--android');
    if (androidIndex !== -1) {
        const result = writeLucideDrawables(path.resolve(args[androidIndex + 1]));
        console.log(result.skipped
            ? `Lucide ${result.version}: drawables up to date`
            : `Lucide ${result.version}: wrote ${result.written} vector drawables`);
    }
    if (args.includes('--manifest')) {
        const result = writeLucideManifest();
        console.log(`Lucide ${result.version}: manifest with ${result.icons} icons, ${result.aliases} aliases → ${path.relative(process.cwd(), result.file)}`);
    }
}
