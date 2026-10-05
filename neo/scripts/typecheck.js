#!/usr/bin/env node
// Type-checks the TS files of packages/app (plus each app's own TS) once per platform,
// resolving `.web` / `.native` variants the way webpack and Metro do.
//
//   yarn typecheck            # web + native
//   yarn typecheck web        # one platform
//
// A base file shadowed by the platform variant (e.g. video.tsx next to video.web.tsx)
// never ships on that platform, so it is left out of that platform's run. JS files are
// not checked, only read for the types TS files import from them. `.ios` / `.android`
// files are added to the native run as extra roots: their own code is checked, but
// imports still resolve through `.native` / base files.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ts = require('typescript/package.json');
const tscBin = require.resolve('typescript/bin/tsc');

const PLATFORM_SUFFIXES = ['.web', '.native', '.ios', '.android'];
const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', 'dist', 'build']);

const PLATFORMS = {
    web: {
        extends: 'apps/next/tsconfig.json',
        suffix: '.web',
        dirs: ['packages/app', 'apps/next'],
        ambient: ['apps/next'],
        compilerOptions: { plugins: [], incremental: false },
    },
    native: {
        extends: 'tsconfig.json',
        suffix: '.native',
        extraSuffixes: ['.ios', '.android'],
        dirs: ['packages/app', 'apps/expo/app'],
        ambient: ['apps/expo'],
        compilerOptions: { strict: true },
    },
};

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

/** `foo.web.tsx` → { base: 'foo', platform: '.web' }; `foo.tsx` → { base: 'foo', platform: '' }. */
function parse(file) {
    const ext = path.extname(file);
    const stem = file.slice(0, -ext.length);
    const platform = PLATFORM_SUFFIXES.find((s) => stem.endsWith(s)) || '';
    return { ext, base: stem.slice(0, stem.length - platform.length), platform };
}

function filesFor({ suffix, extraSuffixes = [], dirs, ambient }) {
    const files = [];
    for (const dir of dirs) {
        for (const file of walk(path.join(root, dir))) {
            if (file.endsWith('.d.ts')) { files.push(file); continue; }
            const { ext, base, platform } = parse(file);
            if (ext !== '.ts' && ext !== '.tsx') continue;
            if (platform && platform !== suffix && !extraSuffixes.includes(platform)) continue;
            const shadowed = !platform && SOURCE_EXTS.some((e) => fs.existsSync(base + suffix + e));
            if (!shadowed) files.push(file);
        }
    }
    for (const dir of ambient) {
        for (const name of fs.readdirSync(path.join(root, dir))) {
            if (name.endsWith('.d.ts')) files.push(path.join(root, dir, name));
        }
    }
    return [...new Set(files)];
}

function run(name) {
    const platform = PLATFORMS[name];
    const cacheDir = path.join(root, 'node_modules', '.cache', 'neo-typecheck');
    fs.mkdirSync(cacheDir, { recursive: true });
    const configPath = path.join(cacheDir, `tsconfig.${name}.json`);
    const config = {
        extends: path.relative(cacheDir, path.join(root, platform.extends)).replace(/\\/g, '/'),
        compilerOptions: {
            noEmit: true,
            moduleSuffixes: [platform.suffix, ''],
            // apps/next still sets `baseUrl`, deprecated since TS 6.
            ...(parseInt(ts.version, 10) >= 6 ? { ignoreDeprecations: '6.0' } : {}),
            ...platform.compilerOptions,
        },
        include: [],
        files: filesFor(platform),
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`\n== typecheck ${name} (${config.files.length} files, TypeScript ${ts.version})`);
    const result = spawnSync(process.execPath, [tscBin, '-p', configPath, '--pretty'], { stdio: 'inherit' });
    return result.status === 0;
}

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(PLATFORMS);
const unknown = names.filter((n) => !PLATFORMS[n]);
if (unknown.length) {
    console.error(`Unknown platform: ${unknown.join(', ')} (expected: ${Object.keys(PLATFORMS).join(', ')})`);
    process.exit(2);
}

const failed = names.filter((n) => !run(n));
if (failed.length) {
    console.error(`\ntypecheck failed: ${failed.join(', ')}`);
    process.exit(1);
}
console.log('\ntypecheck passed');
