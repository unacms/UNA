// Reading brand.json and putting it into the files that carry it (apply.mjs, src/lib/brand.test.ts).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The icons the bundle takes, all in brand/icons. */
export const BUNDLE_ICONS = ['icons/32x32.png', 'icons/128x128.png', 'icons/128x128@2x.png', 'icons/icon.icns', 'icons/icon.ico'];

/**
 * macOS's icon catalog, compiled from an Icon Composer file by compile-icon.sh: with it macOS 26
 * shows the icon's light, dark, clear and tinted versions; without it, icon.icns. Optional.
 */
export const ICON_CATALOG = 'icons/Assets.car';

/** The icon in ICON_CATALOG (Info.plist's CFBundleIconName). */
export const ICON_CATALOG_NAME = 'AppIcon';

/** src-tauri/Info.plist, which Tauri merges into the bundle's: the catalog's icon, or nothing. */
export function brandedInfoPlist(iconCatalog) {
    if (!iconCatalog) return null;
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- Written by brand/apply.mjs: the icon in brand/${ICON_CATALOG}. -->
<plist version="1.0">
<dict>
	<key>CFBundleIconName</key>
	<string>${ICON_CATALOG_NAME}</string>
</dict>
</plist>
`;
}

const SCHEME = /^[a-z][a-z0-9+.-]*$/;

/** UNA's own app: its identifier, and where its updates come from. A client project changes both. */
export const UNA_IDENTIFIER = 'app.unacms.desktop';
export const UNA_UPDATES_URL = 'https://github.com/unacms/UNA/releases/download/desktop-latest/latest.json';

/** Whether a value is a public key of `tauri signer generate` (minisign's, base64 of its two lines). */
export function isUpdatesPubkey(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(value)) return false;
    const text = Buffer.from(value, 'base64').toString('utf8');
    return /^untrusted comment: [^\n]*\nRW[A-Za-z0-9+/]{54}={0,2}\n?$/.test(text);
}
const IDENTIFIER = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

/** brand.json, checked: a missing or malformed value stops the build instead of shipping. */
export function readBrand(text = readFileSync(fileURLToPath(new URL('./brand.json', import.meta.url)), 'utf8')) {
    const brand = JSON.parse(text);
    const problems = [];
    for (const key of ['name', 'identifier', 'scheme', 'description', 'issuesUrl', 'updatesUrl', 'updatesPubkey']) if (typeof brand[key] !== 'string' || !brand[key].trim()) problems.push(`${key} is missing`);
    if (typeof brand.identifier === 'string' && !IDENTIFIER.test(brand.identifier)) problems.push('identifier is a reverse domain name, such as com.example.app');
    if (typeof brand.scheme === 'string' && !SCHEME.test(brand.scheme)) problems.push('scheme is lower-case letters, digits, +, . or -, starting with a letter');
    if (typeof brand.scheme === 'string' && ['http', 'https', 'file', 'mailto', 'una-media', 'tauri', 'ipc'].includes(brand.scheme)) problems.push(`scheme ${brand.scheme} is taken`);
    if (typeof brand.issuesUrl === 'string' && !/^https:\/\//.test(brand.issuesUrl)) problems.push('issuesUrl is an https address');
    if (typeof brand.updatesUrl === 'string' && !/^https:\/\/[^/]+\//.test(brand.updatesUrl)) problems.push('updatesUrl is an https address');
    if (typeof brand.updatesPubkey === 'string' && brand.updatesPubkey.trim() && !isUpdatesPubkey(brand.updatesPubkey)) problems.push('updatesPubkey is the public key `tauri signer generate` wrote (one line of base64)');
    // another app on UNA's updates would be replaced by UNA's app at its first update
    if (brand.identifier !== UNA_IDENTIFIER && brand.updatesUrl === UNA_UPDATES_URL) problems.push(`updatesUrl is UNA's: give your app its own (brand/README.md, Updates)`);
    if (problems.length) throw new Error(`brand/brand.json: ${problems.join('; ')}`);
    return {
        name: brand.name,
        identifier: brand.identifier,
        scheme: brand.scheme,
        description: brand.description,
        issuesUrl: brand.issuesUrl,
        updatesUrl: brand.updatesUrl,
        updatesPubkey: brand.updatesPubkey,
    };
}

/** tauri.conf.json with the brand in it; iconCatalog: brand/icons/Assets.car exists. */
export function brandedConfig(config, brand, iconCatalog = false) {
    const next = structuredClone(config);
    next.productName = brand.name;
    next.identifier = brand.identifier;
    for (const window of next.app?.windows ?? []) window.title = brand.name;
    next.plugins = {
        ...next.plugins,
        'deep-link': { ...next.plugins?.['deep-link'], desktop: { schemes: [brand.scheme] } },
        updater: { ...next.plugins?.updater, endpoints: [brand.updatesUrl], pubkey: brand.updatesPubkey },
    };
    next.bundle = { ...next.bundle, shortDescription: brand.description, icon: BUNDLE_ICONS.map((icon) => `../brand/${icon}`) };
    const files = { ...next.bundle.macOS?.files };
    if (iconCatalog) files['Resources/Assets.car'] = `../brand/${ICON_CATALOG}`;
    else delete files['Resources/Assets.car'];
    next.bundle.macOS = { ...next.bundle.macOS, files };
    if (!Object.keys(files).length) delete next.bundle.macOS.files;
    return next;
}

/** index.html with the brand's name as its first title. */
export function brandedIndex(html, brand) {
    const escaped = brand.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return html.replace(/<title>[^<]*<\/title>/, `<title>${escaped}</title>`);
}
