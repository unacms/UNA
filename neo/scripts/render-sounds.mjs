#!/usr/bin/env node
/*
 * Renders the Cuelume cues the native app plays into WAV files.
 *
 *   node scripts/render-sounds.mjs                  # every cue in CUES, into the default folder
 *   node scripts/render-sounds.mjs --out <dir>      # somewhere else
 *   node scripts/render-sounds.mjs --only toggle    # some cues only
 *
 * Web plays Cuelume (npm `cuelume`, MIT) live with Web Audio. React Native has no
 * Web Audio, so the native app plays these files instead (`default/sounds.js`).
 * Each cue plays in headless Chrome with Cuelume's AudioContext replaced by an
 * OfflineAudioContext (48 kHz stereo), so the file is what a browser plays,
 * through Cuelume's own output bus, limiter and room. Trailing silence under
 * -70 dBFS is trimmed and the file is written as 16-bit stereo WAV.
 *
 * Files are named <cue>[-<emphasis>][-back].wav; normal emphasis adds nothing.
 * The same names are the keys of `Sounds` (see `lib/sound/cue-key.ts`).
 * Math.random in the page is seeded from the file name, so a rerun writes the
 * same bytes. Rerender after bumping `cuelume` in package.json.
 *
 * Chrome: $CHROME, else Google Chrome from /Applications.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CUELUME_DIR = path.join(ROOT, 'node_modules', 'cuelume');
const SAMPLE_RATE = 48000;
const RENDER_SECONDS = 3; // longer than any cue's tail
const FLOOR_DB = -70; // trailing samples under this are cut
const KEEP_MS = 5; // kept after the last sample above the floor

// What the native app plays; keep in step with `default/sounds.js`.
const CUES = [
    { cue: 'toggle' },
    { cue: 'toggle', direction: 'back' },
    { cue: 'open', emphasis: 'subtle' },
    { cue: 'close', emphasis: 'subtle' },
    { cue: 'navigate', emphasis: 'subtle' },
    { cue: 'success', emphasis: 'subtle' },
    { cue: 'ready' },
    { cue: 'ready', emphasis: 'subtle' },
    { cue: 'error' },
];

const args = process.argv.slice(2);
const option = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : fallback;
};
const OUT = path.resolve(ROOT, option('--out', 'packages/app/customization/resources/sounds'));
const ONLY = option('--only', '').split(',').filter(Boolean);

function fileName({ cue, emphasis, direction }) {
    const e = emphasis && emphasis !== 'normal' ? `-${emphasis}` : '';
    const d = direction === 'back' ? '-back' : '';
    return `${cue}${e}${d}`;
}

// ---- the page ---------------------------------------------------------------

// Runs in the page: seeds Math.random, swaps AudioContext for an offline one,
// loads a fresh copy of Cuelume (each job has its own tab, so its own module
// state), plays the cue and returns both channels as base64 float32.
const pageRender = async (seed, cue, options, sampleRate, seconds) => {
    let s = seed >>> 0;
    Math.random = () => {
        // mulberry32
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const offline = new OfflineAudioContext({ numberOfChannels: 2, length: Math.ceil(sampleRate * seconds), sampleRate });
    // Cuelume plays at once only on a running context.
    Object.defineProperty(offline, 'state', { get: () => 'running', configurable: true });
    offline.resume = () => Promise.resolve();
    window.AudioContext = function AudioContext() {
        return offline;
    };
    // It stays silent until the page has had a user gesture.
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true, isActive: true }, configurable: true });
    const cuelume = await import('/cuelume/index.js');
    // Its cleanup timers disconnect the cue's nodes; offline they would cut the tail.
    const realTimeout = window.setTimeout;
    window.setTimeout = () => 0;
    cuelume.play(cue, options);
    window.setTimeout = realTimeout;
    const buffer = await offline.startRendering();
    const out = [];
    for (let c = 0; c < 2; c++) {
        const bytes = new Uint8Array(buffer.getChannelData(c).buffer);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        out.push(btoa(bin));
    }
    return out;
};

// Serves Cuelume's ESM build to the page.
function serve() {
    const dist = path.join(CUELUME_DIR, 'dist');
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/') {
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end('<!doctype html><title>render</title>');
            return;
        }
        const file = path.join(dist, path.normalize(url.pathname.replace(/^\/cuelume\//, '')));
        if (!url.pathname.startsWith('/cuelume/') || !file.startsWith(dist + path.sep) || !fs.existsSync(file)) {
            res.writeHead(404);
            res.end();
            return;
        }
        res.writeHead(200, { 'content-type': 'text/javascript' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ---- Chrome over the DevTools protocol --------------------------------------

function findChrome() {
    const candidates = [
        process.env.CHROME,
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
    ];
    const found = candidates.find((p) => p && fs.existsSync(p));
    if (!found) throw new Error('No Chrome found: set CHROME=/path/to/chrome');
    return found;
}

async function launch() {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-sounds-chrome-'));
    const proc = spawn(findChrome(), ['--headless', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--mute-audio', 'about:blank'], {
        stdio: ['ignore', 'ignore', 'pipe'],
    });
    const wsUrl = await new Promise((resolve, reject) => {
        let err = '';
        proc.stderr.on('data', (d) => {
            err += d;
            const m = err.match(/DevTools listening on (ws:\/\/\S+)/);
            if (m) resolve(m[1]);
        });
        proc.on('exit', (code) => reject(new Error(`Chrome exited (${code}): ${err}`)));
    });
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
    };
    const send = (method, params = {}, sessionId) =>
        new Promise((resolve, reject) => {
            const msgId = ++id;
            pending.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
        });
    // One tab per job: a fresh module map, so every cue plays as a page's first sound.
    const evaluateInNewTab = async (url, expression) => {
        const { targetId } = await send('Target.createTarget', { url });
        try {
            const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
            const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
            if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
            return r.result.value;
        } finally {
            await send('Target.closeTarget', { targetId });
        }
    };
    const close = async () => {
        ws.close();
        const exited = new Promise((resolve) => proc.once('exit', resolve));
        proc.kill();
        await exited;
        fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    };
    return { evaluateInNewTab, close };
}

// ---- files ------------------------------------------------------------------

function seedFor(name) {
    // FNV-1a
    let h = 0x811c9dc5;
    for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
    return h;
}

function toWav(left, right) {
    const floor = 10 ** (FLOOR_DB / 20);
    let last = 0;
    let peak = 0;
    for (let i = left.length - 1; i >= 0; i--) {
        if (Math.abs(left[i]) > floor || Math.abs(right[i]) > floor) {
            last = i;
            break;
        }
    }
    const frames = Math.min(left.length, last + 1 + Math.round((KEEP_MS / 1000) * SAMPLE_RATE));
    const data = Buffer.alloc(frames * 4);
    let clipped = 0;
    const q = (v) => {
        peak = Math.max(peak, Math.abs(v));
        if (v > 1 || v < -1) clipped++;
        return Math.max(-32768, Math.min(32767, Math.round(v * 32768)));
    };
    for (let i = 0; i < frames; i++) {
        data.writeInt16LE(q(left[i]), i * 4);
        data.writeInt16LE(q(right[i]), i * 4 + 2);
    }
    const head = Buffer.alloc(44);
    head.write('RIFF', 0);
    head.writeUInt32LE(36 + data.length, 4);
    head.write('WAVE', 8);
    head.write('fmt ', 12);
    head.writeUInt32LE(16, 16);
    head.writeUInt16LE(1, 20); // PCM
    head.writeUInt16LE(2, 22); // stereo
    head.writeUInt32LE(SAMPLE_RATE, 24);
    head.writeUInt32LE(SAMPLE_RATE * 4, 28);
    head.writeUInt16LE(4, 32);
    head.writeUInt16LE(16, 34);
    head.write('data', 36);
    head.writeUInt32LE(data.length, 40);
    return { wav: Buffer.concat([head, data]), frames, clipped, peak };
}

const floats = (b64) => {
    const buf = Buffer.from(b64, 'base64');
    return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
};

// ---- run --------------------------------------------------------------------

if (!fs.existsSync(path.join(CUELUME_DIR, 'package.json'))) {
    console.error('cuelume is not installed: run yarn install');
    process.exit(1);
}
const { version } = JSON.parse(fs.readFileSync(path.join(CUELUME_DIR, 'package.json'), 'utf8'));
const jobs = CUES.filter((job) => !ONLY.length || ONLY.includes(job.cue));

fs.mkdirSync(OUT, { recursive: true });
const server = await serve();
const pageUrl = `http://127.0.0.1:${server.address().port}/`;
const chrome = await launch();
const failed = [];
try {
    for (const job of jobs) {
        const name = fileName(job);
        const options = { emphasis: job.emphasis ?? 'normal', ...(job.direction ? { direction: job.direction } : {}) };
        const call = `(${pageRender})(${seedFor(name)}, ${JSON.stringify(job.cue)}, ${JSON.stringify(options)}, ${SAMPLE_RATE}, ${RENDER_SECONDS})`;
        try {
            const [l, r] = await chrome.evaluateInNewTab(pageUrl, call);
            const { wav, frames, clipped, peak } = toWav(floats(l), floats(r));
            if (frames <= Math.round((KEEP_MS / 1000) * SAMPLE_RATE) + 1) throw new Error('silent');
            fs.writeFileSync(path.join(OUT, `${name}.wav`), wav);
            const ms = Math.round((frames / SAMPLE_RATE) * 1000);
            const db = (20 * Math.log10(peak)).toFixed(1);
            console.log(`${name}.wav  ${ms} ms  peak ${db} dBFS  ${(wav.length / 1024).toFixed(1)} KB${clipped ? `  ${clipped} samples clipped` : ''}`);
        } catch (e) {
            failed.push(`${name}: ${e.message}`);
        }
    }
} finally {
    await chrome.close();
    server.close();
}
console.log(`cuelume ${version}: wrote ${jobs.length - failed.length} files to ${path.relative(ROOT, OUT)}`);
if (failed.length) {
    console.error(`failed:\n  ${failed.join('\n  ')}`);
    process.exit(1);
}
