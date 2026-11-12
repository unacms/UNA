// The update feed: latest.json, which the app reads at brand.json `updatesUrl` (src-tauri/src/updater.rs).
// It names the version, what is new, and for each system the package's address and its signature
// (the `.sig` file `tauri build` writes next to each package when it has the signing key).
//
//     node scripts/update-manifest.mjs --version 0.2.0 \
//         --base-url https://github.com/unacms/UNA/releases/download/desktop-v0.2.0 \
//         [--notes-file notes.md] [--date 2026-11-20T10:00:00Z] [--out latest.json] PACKAGE...
//
// A package is a macOS `.app.tar.gz` (its name says universal, aarch64 or x64), a Windows `-setup.exe`
// or `.msi`, or a Linux `.AppImage`, `.deb` or `.rpm`; each needs its `.sig` beside it. The keys are
// the updater's: `<os>-<arch>` and `<os>-<arch>-<installer>`, so an app installed from a .deb
// takes the .deb and one from an AppImage the AppImage.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The updater keys a package serves, from its file name. */
export function keysFor(name) {
    if (name.endsWith('.app.tar.gz')) {
        const arches = /universal/i.test(name) ? ['aarch64', 'x86_64'] : /aarch64|arm64/i.test(name) ? ['aarch64'] : /x64|x86_64/i.test(name) ? ['x86_64'] : [];
        return { installer: 'app', keys: arches.map((a) => `darwin-${a}`) };
    }
    if (/-setup\.exe$/i.test(name)) return { installer: 'nsis', keys: ['windows-x86_64'] };
    if (/\.msi$/i.test(name)) return { installer: 'msi', keys: ['windows-x86_64'] };
    if (/\.AppImage$/.test(name)) return { installer: 'appimage', keys: ['linux-x86_64'] };
    if (/\.deb$/.test(name)) return { installer: 'deb', keys: ['linux-x86_64'] };
    if (/\.rpm$/.test(name)) return { installer: 'rpm', keys: ['linux-x86_64'] };
    return { installer: null, keys: [] };
}

/** Which installer answers for `<os>-<arch>` without one: what an app installed some other way gets. */
const PLAIN_KEY_FROM = ['app', 'nsis', 'appimage'];

/**
 * latest.json for these packages. `packages`: [{ name, signature }]; `baseUrl`: where they are
 * downloaded from (the release's download address).
 */
export function manifest({ version, notes, date, baseUrl, packages }) {
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error(`not a version: ${version}`);
    if (!/^https:\/\//.test(baseUrl)) throw new Error(`the packages are downloaded over https: ${baseUrl}`);
    const platforms = {};
    for (const { name, signature } of packages) {
        const { installer, keys } = keysFor(name);
        if (!installer || !keys.length) throw new Error(`${name}: not a package the updater installs`);
        if (!signature.trim()) throw new Error(`${name}: no signature`);
        const entry = { url: `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(name)}`, signature: signature.trim() };
        for (const key of keys) {
            platforms[`${key}-${installer}`] = entry;
            if (PLAIN_KEY_FROM.includes(installer) || !platforms[key]) platforms[key] = entry;
        }
    }
    if (!Object.keys(platforms).length) throw new Error('no packages');
    const sorted = Object.fromEntries(Object.entries(platforms).sort(([a], [b]) => a.localeCompare(b)));
    return { version, notes: notes?.trim() || `${version}`, pub_date: date ?? new Date().toISOString(), platforms: sorted };
}

function main(argv) {
    const opts = { files: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--')) opts[arg.slice(2)] = argv[++i];
        else opts.files.push(arg);
    }
    const packages = opts.files.map((file) => {
        if (!existsSync(`${file}.sig`)) throw new Error(`${file}: no ${basename(file)}.sig beside it (was the signing key set for the build?)`);
        return { name: basename(file), signature: readFileSync(`${file}.sig`, 'utf8') };
    });
    const notes = opts['notes-file'] && existsSync(opts['notes-file']) ? readFileSync(opts['notes-file'], 'utf8') : undefined;
    const json = JSON.stringify(manifest({ version: opts.version, notes, date: opts.date, baseUrl: opts['base-url'], packages }), null, 2) + '\n';
    if (opts.out) writeFileSync(opts.out, json);
    else process.stdout.write(json);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        main(process.argv.slice(2));
    } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    }
}
