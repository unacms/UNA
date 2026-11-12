// Write brand/brand.json into the files Tauri and Vite read as they are: src-tauri/tauri.conf.json
// (the app's name, identifier, window title, link scheme, description, icons), index.html (the
// page's first title) and src-tauri/Info.plist (macOS's icon catalog, only while
// brand/icons/Assets.car exists). Run it after changing brand.json or the icons:
//
//     node brand/apply.mjs          # write
//     node brand/apply.mjs --check  # exit 1 when a file disagrees (src/lib/brand.test.ts does the same)
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { ICON_CATALOG, brandedConfig, brandedIndex, brandedInfoPlist, readBrand } from './brand.mjs';

const root = new URL('..', import.meta.url);
const iconCatalog = existsSync(new URL(`brand/${ICON_CATALOG}`, root));
const files = [
    ['src-tauri/tauri.conf.json', (text, brand) => JSON.stringify(brandedConfig(JSON.parse(text), brand, iconCatalog), null, 2) + '\n'],
    ['index.html', (text, brand) => brandedIndex(text, brand)],
    ['src-tauri/Info.plist', () => brandedInfoPlist(iconCatalog)],
];

const brand = readBrand();
const check = process.argv.includes('--check');
let wrong = 0;
for (const [path, update] of files) {
    const url = new URL(path, root);
    const text = existsSync(url) ? readFileSync(url, 'utf8') : null;
    const next = update(text, brand);
    if (next === text) continue;
    if (check) {
        console.error(`${path} does not have the brand of brand/brand.json: run node brand/apply.mjs`);
        wrong++;
    } else if (next === null) {
        rmSync(url);
        console.log(`${path}: removed`);
    } else {
        writeFileSync(url, next);
        console.log(`${path}: written`);
    }
}
process.exit(wrong ? 1 : 0);
