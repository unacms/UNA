#!/usr/bin/env node
/*
 * Finds t('…') keys used in the code that have no entry in a translation file.
 *
 *   node scripts/check-translations.js          # checks ru (default)
 *   node scripts/check-translations.js ru en    # any languages from
 *                                               # packages/app/default/translations/
 *
 * Only literal keys are checked — t('Cancel'), i18n.t("Save"). Calls with
 * variables or template literals (t('item_' + type)) are counted as "dynamic"
 * and listed separately, so you can eyeball those groups by hand.
 *
 * i18next plural forms are understood: t('members', { count }) is satisfied by
 * members_1 / members_2 / members_plural / members_other.
 *
 * Exit code 1 when something is missing, so it can run in CI.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const translationsDir = path.join(root, 'packages', 'app', 'default', 'translations')
const scanRoots = ['packages', 'apps'].map((d) => path.join(root, d))
const skip = /node_modules|[\\/]\.next[\\/]|[\\/]\.expo[\\/]|[\\/]ios[\\/]|[\\/]android[\\/]/

// Keys added at runtime (customization/translation.js) — never in the JSON.
const RUNTIME_KEYS = new Set(['lang_auto'])

// t('…') / t("…") / i18n.t('…'). Group 2 = literal key; groups 3/4 = dynamic.
const CALL_RE = /(?<![\w$.])(?:i18n\.)?t\(\s*(?:(['"])((?:\\.|(?!\1).)*)\1|(`)|([^)'"`\s][^)]*))/g

const literal = new Map() // key → Set<file>
const dynamic = new Map() // prefix → Set<file>

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (skip.test(p)) continue
        if (entry.isDirectory()) walk(p)
        else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) scan(p)
    }
}

function scan(file) {
    const src = fs.readFileSync(file, 'utf8')
    const rel = path.relative(root, file).replace(/\\/g, '/')
    let m
    while ((m = CALL_RE.exec(src))) {
        if (m[2] !== undefined) {
            const key = m[2].replace(/\\(.)/g, '$1')
            // t('format_' + x): the `+` is *inside* the call, the literal is
            // only a prefix of a computed key → dynamic.
            // t('Add ') + x: the `+` is *outside*, 'Add ' is a real key.
            const after = src.slice(m.index + m[0].length).trimStart()
            if (after.startsWith('+')) {
                add(dynamic, key, rel)
            } else {
                add(literal, key, rel)
            }
        } else {
            add(dynamic, (m[4] || '`…`').trim().slice(0, 40), rel)
        }
    }
}

function add(map, key, file) {
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(file)
}

function hasKey(dict, key) {
    return key in dict
        || `${key}_plural` in dict
        || `${key}_other` in dict
        || `${key}_1` in dict
}

function report(lang) {
    const file = path.join(translationsDir, `${lang}.json`)
    if (!fs.existsSync(file)) {
        console.error(`no such translation file: ${path.relative(root, file)}`)
        return 1
    }
    const dict = JSON.parse(fs.readFileSync(file, 'utf8'))
    const missing = [...literal.keys()]
        .filter((k) => !RUNTIME_KEYS.has(k) && !hasKey(dict, k))
        .sort((a, b) => a.localeCompare(b))

    console.log(`\n[${lang}] literal keys: ${literal.size}, missing: ${missing.length}`)
    for (const key of missing) {
        const files = [...literal.get(key)]
        const where = files.slice(0, 2).join(', ') + (files.length > 2 ? ` (+${files.length - 2})` : '')
        console.log(`  ${JSON.stringify(key)}   ← ${where}`)
    }
    return missing.length ? 1 : 0
}

scanRoots.forEach(walk)

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['ru']
let exitCode = 0
for (const lang of langs) exitCode |= report(lang)

if (dynamic.size) {
    console.log(`\ndynamic keys (check their groups by hand): ${dynamic.size}`)
    for (const [prefix, files] of [...dynamic.entries()].sort()) {
        console.log(`  ${JSON.stringify(prefix)}   ← ${[...files][0]}`)
    }
}

process.exit(exitCode)
