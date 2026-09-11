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

// Minimal zlib (RFC 1950/1951) codec so this file has no runtime deps.
// `inflate` decodes any deflate stream; `deflateStored` writes uncompressed
// blocks only — the icon is tiny and cached per avatar, so size is irrelevant.

const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

function readBits(br, n) {
    while (br.bitCnt < n) {
        if (br.pos >= br.bytes.length) throw new Error('zlib: unexpected end');
        br.bitBuf |= br.bytes[br.pos++] << br.bitCnt;
        br.bitCnt += 8;
    }
    const value = br.bitBuf & ((1 << n) - 1);
    br.bitBuf >>>= n;
    br.bitCnt -= n;
    return value;
}

/** Canonical Huffman table from code lengths (zlib "puff" layout). */
function buildHuffman(lengths) {
    const count = new Uint16Array(16);
    for (let i = 0; i < lengths.length; i++) count[lengths[i]]++;
    count[0] = 0;
    const offsets = new Uint16Array(16);
    for (let len = 1; len < 16; len++) offsets[len] = offsets[len - 1] + count[len - 1];
    const symbols = new Uint16Array(lengths.length);
    for (let sym = 0; sym < lengths.length; sym++) {
        if (lengths[sym]) symbols[offsets[lengths[sym]]++] = sym;
    }
    return { count, symbols };
}

function decodeSymbol(br, table) {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len < 16; len++) {
        code |= readBits(br, 1);
        const count = table.count[len];
        if (code - count < first) return table.symbols[index + (code - first)];
        index += count;
        first += count;
        first <<= 1;
        code <<= 1;
    }
    throw new Error('zlib: bad huffman code');
}

let fixedTables = null;
function getFixedTables() {
    if (!fixedTables) {
        const lit = new Uint8Array(288);
        lit.fill(8, 0, 144);
        lit.fill(9, 144, 256);
        lit.fill(7, 256, 280);
        lit.fill(8, 280, 288);
        fixedTables = { lit: buildHuffman(lit), dist: buildHuffman(new Uint8Array(30).fill(5)) };
    }
    return fixedTables;
}

function readDynamicTables(br) {
    const hlit = readBits(br, 5) + 257;
    const hdist = readBits(br, 5) + 1;
    const hclen = readBits(br, 4) + 4;
    const clLengths = new Uint8Array(19);
    for (let i = 0; i < hclen; i++) clLengths[CL_ORDER[i]] = readBits(br, 3);
    const clTable = buildHuffman(clLengths);
    const lengths = new Uint8Array(hlit + hdist);
    for (let i = 0; i < lengths.length; ) {
        const sym = decodeSymbol(br, clTable);
        if (sym < 16) {
            lengths[i++] = sym;
            continue;
        }
        let repeat;
        let value = 0;
        if (sym === 16) {
            if (i === 0) throw new Error('zlib: repeat with no previous length');
            value = lengths[i - 1];
            repeat = 3 + readBits(br, 2);
        } else if (sym === 17) {
            repeat = 3 + readBits(br, 3);
        } else {
            repeat = 11 + readBits(br, 7);
        }
        if (i + repeat > lengths.length) throw new Error('zlib: too many lengths');
        lengths.fill(value, i, i + repeat);
        i += repeat;
    }
    return {
        lit: buildHuffman(lengths.subarray(0, hlit)),
        dist: buildHuffman(lengths.subarray(hlit)),
    };
}

function inflate(input, expectedSize) {
    if ((input[0] & 0x0f) !== 8 || ((input[0] << 8) | input[1]) % 31 !== 0) {
        throw new Error('zlib: bad header');
    }
    if (input[1] & 0x20) throw new Error('zlib: preset dictionary unsupported');

    const br = { bytes: input, pos: 2, bitBuf: 0, bitCnt: 0 };
    let out = new Uint8Array(expectedSize || 64 * 1024);
    let outLen = 0;
    const ensure = (extra) => {
        if (outLen + extra <= out.length) return;
        const grown = new Uint8Array(Math.max(out.length * 2, outLen + extra));
        grown.set(out.subarray(0, outLen));
        out = grown;
    };

    let final = 0;
    do {
        final = readBits(br, 1);
        const type = readBits(br, 2);
        if (type === 0) {
            br.bitBuf = 0;
            br.bitCnt = 0;
            const len = input[br.pos] | (input[br.pos + 1] << 8);
            const nlen = input[br.pos + 2] | (input[br.pos + 3] << 8);
            if ((len ^ 0xffff) !== nlen) throw new Error('zlib: bad stored block');
            br.pos += 4;
            ensure(len);
            out.set(input.subarray(br.pos, br.pos + len), outLen);
            br.pos += len;
            outLen += len;
            continue;
        }
        if (type === 3) throw new Error('zlib: bad block type');
        const { lit, dist } = type === 1 ? getFixedTables() : readDynamicTables(br);
        for (;;) {
            const sym = decodeSymbol(br, lit);
            if (sym < 256) {
                ensure(1);
                out[outLen++] = sym;
                continue;
            }
            if (sym === 256) break;
            const li = sym - 257;
            if (li >= LEN_BASE.length) throw new Error('zlib: bad length code');
            const length = LEN_BASE[li] + readBits(br, LEN_EXTRA[li]);
            const di = decodeSymbol(br, dist);
            if (di >= DIST_BASE.length) throw new Error('zlib: bad distance code');
            const distance = DIST_BASE[di] + readBits(br, DIST_EXTRA[di]);
            if (distance > outLen) throw new Error('zlib: distance too far');
            ensure(length);
            for (let i = 0; i < length; i++) {
                out[outLen] = out[outLen - distance];
                outLen++;
            }
        }
    } while (!final);

    return outLen === out.length ? out : out.subarray(0, outLen);
}

function adler32(bytes) {
    let a = 1;
    let b = 0;
    for (let i = 0; i < bytes.length; i++) {
        a = (a + bytes[i]) % 65521;
        b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
}

function deflateStored(data) {
    const BLOCK = 0xffff;
    const blocks = Math.max(1, Math.ceil(data.length / BLOCK));
    const out = new Uint8Array(2 + blocks * 5 + data.length + 4);
    out[0] = 0x78;
    out[1] = 0x01;
    let pos = 2;
    for (let i = 0; i < blocks; i++) {
        const start = i * BLOCK;
        const len = Math.min(BLOCK, data.length - start);
        out[pos++] = i === blocks - 1 ? 1 : 0;
        out[pos++] = len & 0xff;
        out[pos++] = (len >>> 8) & 0xff;
        out[pos++] = ~len & 0xff;
        out[pos++] = (~len >>> 8) & 0xff;
        out.set(data.subarray(start, start + len), pos);
        pos += len;
    }
    writeU32(out, pos, adler32(data));
    return out;
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
    const bpp = colorType === 6 ? 4 : 3;
    const inflated = inflate(concatChunks(idat), (width * bpp + 1) * height);
    return {
        width,
        height,
        rgba: unfilter(inflated, width, height, bpp),
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
        writeChunk('IDAT', deflateStored(raw)),
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
