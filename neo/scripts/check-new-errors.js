#!/usr/bin/env node
// Fails when a branch adds lint or typecheck errors compared with its base.
// `yarn lint` and `yarn typecheck` aren't clean on master yet, so CI can't ask
// for zero errors; it asks for no new ones (see AGENTS.md "Before you push").
//
//   node scripts/check-new-errors.js \
//     --lint <head-eslint.json> <base-eslint.json> \
//     --typecheck <head-typecheck.txt> <base-typecheck.txt>
//
// ESLint input is `eslint -f json` output; typecheck input is the text printed by
// scripts/typecheck.js. Errors are compared per file + rule (lint) or file + TS code
// (typecheck), ignoring line numbers, so unrelated edits that shift lines don't count.
// Warnings are ignored.

const fs = require('node:fs');

function args() {
    const out = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--lint' || argv[i] === '--typecheck') {
            out[argv[i].slice(2)] = [argv[i + 1], argv[i + 2]];
            i += 2;
        }
    }
    return out;
}

/** Path relative to the NEO root, whatever checkout the report came from. */
function rel(file) {
    const p = file.replaceAll('\\', '/');
    const m = p.match(/(?:^|\/)((?:apps|packages|scripts|crypto-shim)\/.*)$/);
    return m ? m[1] : p;
}

function lintCounts(file) {
    const counts = new Map();
    const where = new Map();
    for (const f of JSON.parse(fs.readFileSync(file, 'utf8'))) {
        for (const m of f.messages) {
            if (m.severity !== 2) continue;
            const key = `${rel(f.filePath)}\t${m.ruleId || 'parse-error'}`;
            counts.set(key, (counts.get(key) || 0) + 1);
            if (!where.has(key)) where.set(key, { line: m.line, message: m.message.split('\n')[0] });
        }
    }
    return { counts, where };
}

// tsc prints `file(12,5): error TS2532: ...` without a TTY and `file:12:5 - error TS2532: ...` with one.
const TSC_LINE = /^(.+?)(?:\((\d+),\d+\)|:(\d+):\d+)(?::| -) error (TS\d+): (.*)$/;

function typecheckCounts(file) {
    const counts = new Map();
    const where = new Map();
    const text = fs.readFileSync(file, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
    for (const raw of text.split(/\r?\n/)) {
        const m = raw.trim().match(TSC_LINE);
        if (!m) continue;
        const key = `${rel(m[1])}\t${m[4]}`;
        counts.set(key, (counts.get(key) || 0) + 1);
        if (!where.has(key)) where.set(key, { line: Number(m[2] || m[3]), message: m[5] });
    }
    return { counts, where };
}

function compare(label, head, base) {
    const added = [];
    for (const [key, n] of head.counts) {
        const before = base.counts.get(key) || 0;
        if (n > before) added.push({ key, n, before, ...head.where.get(key) });
    }
    const total = (c) => [...c.counts.values()].reduce((s, n) => s + n, 0);
    console.log(`${label}: ${total(base)} errors on base, ${total(head)} on this branch`);
    for (const a of added) {
        const [file, rule] = a.key.split('\t');
        const msg = `${rule}: ${a.n - a.before} new (${a.before} → ${a.n}). First: ${a.message}`;
        // GitHub annotation; paths are relative to the repo root, where NEO lives in neo/.
        console.log(`::error file=neo/${file},line=${a.line || 1},title=${label}::${msg}`);
        console.log(`  ${file}  ${msg}`);
    }
    return added.length;
}

const opts = args();
let failures = 0;
if (opts.lint) failures += compare('lint', lintCounts(opts.lint[0]), lintCounts(opts.lint[1]));
if (opts.typecheck) failures += compare('typecheck', typecheckCounts(opts.typecheck[0]), typecheckCounts(opts.typecheck[1]));
if (!opts.lint && !opts.typecheck) {
    console.error('usage: check-new-errors.js --lint <head.json> <base.json> --typecheck <head.txt> <base.txt>');
    process.exit(2);
}
if (failures) {
    console.log(`\n${failures} file/rule pair(s) gained errors. Fix them, or compare with master locally: yarn lint, yarn typecheck.`);
    process.exit(1);
}
console.log('\nno new errors');
