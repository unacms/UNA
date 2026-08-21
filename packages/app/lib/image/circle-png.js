import pako from 'pako';

const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function readU32(bytes, offset) {
    return (
        ((bytes[offset] << 24) |
            (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) |
            bytes[offset + 3]) >>>
        0
    );
}

function writeU32(bytes, offset, value) {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
}

function concatChunks(chunks) {
    let total = 0;
    for (const chunk of chunks) total += chunk.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function bytesToBase64(bytes) {
    const chunk = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
}

function unfilter(inflated, width, height, bpp) {
    const stride = width * bpp;
    const rgba = new Uint8Array(width * height * 4);
    let src = 0;
    let prev = new Uint8Array(stride);
    const row = new Uint8Array(stride);

    for (let y = 0; y < height; y++) {
        const filter = inflated[src++];
        for (let i = 0; i < stride; i++) {
            const raw = inflated[src++];
            const left = i >= bpp ? row[i - bpp] : 0;
            const up = prev[i];
            const upLeft = i >= bpp ? prev[i - bpp] : 0;
            if (filter === 1) row[i] = (raw + left) & 0xff;
            else if (filter === 2) row[i] = (raw + up) & 0xff;
            else if (filter === 3) row[i] = (raw + ((left + up) >> 1)) & 0xff;
            else if (filter === 4) row[i] = (raw + paeth(left, up, upLeft)) & 0xff;
            else row[i] = raw;
        }
        if (bpp === 4) {
            rgba.set(row, y * stride);
        } else {
            for (let x = 0; x < width; x++) {
                const di = (y * width + x) * 4;
                const si = x * 3;
                rgba[di] = row[si];
                rgba[di + 1] = row[si + 1];
                rgba[di + 2] = row[si + 2];
                rgba[di + 3] = 255;
            }
        }
        prev = row.slice();
    }
    return rgba;
}

function decodePng(bytes) {
    for (let i = 0; i < PNG_SIG.length; i++) {
        if (bytes[i] !== PNG_SIG[i]) throw new Error('invalid png');
    }
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idat = [];
    while (offset + 12 <= bytes.length) {
        const length = readU32(bytes, offset);
        const type = String.fromCharCode(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7],
        );
        const data = bytes.subarray(offset + 8, offset + 8 + length);
        if (type === 'IHDR') {
            width = readU32(data, 0);
            height = readU32(data, 4);
            bitDepth = data[8];
            colorType = data[9];
            if (data[12]) throw new Error('interlaced png');
        } else if (type === 'IDAT') {
            idat.push(data);
        } else if (type === 'IEND') {
            break;
        }
        offset += 12 + length;
    }
    if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error('unsupported png');
    }
    const inflated = pako.inflate(concatChunks(idat));
    return {
        width,
        height,
        rgba: unfilter(inflated, width, height, colorType === 6 ? 4 : 3),
    };
}

function writeChunk(type, data) {
    const chunk = new Uint8Array(12 + data.length);
    writeU32(chunk, 0, data.length);
    chunk[4] = type.charCodeAt(0);
    chunk[5] = type.charCodeAt(1);
    chunk[6] = type.charCodeAt(2);
    chunk[7] = type.charCodeAt(3);
    chunk.set(data, 8);
    const crcBytes = chunk.subarray(4, 8 + data.length);
    writeU32(chunk, 8 + data.length, crc32(crcBytes));
    return chunk;
}

function encodePng(width, height, rgba) {
    const ihdr = new Uint8Array(13);
    writeU32(ihdr, 0, width);
    writeU32(ihdr, 4, height);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const raw = new Uint8Array((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        const dest = y * (width * 4 + 1);
        raw[dest] = 0;
        raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), dest + 1);
    }
    const parts = [
        new Uint8Array(PNG_SIG),
        writeChunk('IHDR', ihdr),
        writeChunk('IDAT', pako.deflate(raw)),
        writeChunk('IEND', new Uint8Array(0)),
    ];
    return concatChunks(parts);
}

function applyCircleMask(rgba, width, height) {
    const cx = (width - 1) / 2;
    const cy = (height - 1) / 2;
    const radius = Math.min(width, height) / 2;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const dist = Math.hypot(x - cx, y - cy);
            if (dist >= radius) {
                rgba[i + 3] = 0;
            } else if (dist > radius - 1) {
                rgba[i + 3] = Math.round(rgba[i + 3] * (radius - dist));
            }
        }
    }
    return rgba;
}

/** PNG base64 → circular PNG base64 (transparent corners). */
export function pngBase64WithCircleMask(base64) {
    const { width, height, rgba } = decodePng(base64ToBytes(base64));
    return bytesToBase64(encodePng(width, height, applyCircleMask(rgba, width, height)));
}
