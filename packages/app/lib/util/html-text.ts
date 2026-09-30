import i18n from 'i18next';
import { UNA_URL, APP_URL } from 'app/config';

// Named entities: all of HTML 4 (what UNA and editors emit) plus &apos;. The
// full HTML5 table (2000+ names, the `html-entities` package) cost ~13 KB gz on
// every page; unknown names are left as written.
const LATIN1_ENTITIES = // U+00A0..U+00FF in order
    'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml';
const GREEK_UPPER = 'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho _ Sigma Tau Upsilon Phi Chi Psi Omega'; // U+0391..
const GREEK_LOWER = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigmaf sigma tau upsilon phi chi psi omega'; // U+03B1..
const OTHER_ENTITIES: Record<string, number> = {
    quot: 34, amp: 38, apos: 39, lt: 60, gt: 62,
    OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732,
    thetasym: 977, upsih: 978, piv: 982,
    ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207,
    ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222,
    dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243,
    lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364,
    image: 8465, weierp: 8472, real: 8476, trade: 8482, alefsym: 8501,
    larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629,
    lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660,
    forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715,
    prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736,
    and: 8743, or: 8744, cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776,
    ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839,
    oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971,
    lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830,
};
// &#128;..&#159; mean Windows-1252 characters in HTML (e.g. &#150; is an en dash).
const WINDOWS_1252: Record<number, number> = {
    128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240,
    138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226,
    150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376,
};

let namedEntities: Record<string, string> | null = null;
// Legacy names (Latin-1 + amp/lt/gt/quot) also decode without `;`, as a prefix: `&copy2` → `©2`.
let legacyEntities: Set<string> | null = null;

function getNamedEntities(): Record<string, string> {
    if (namedEntities) return namedEntities;
    const map: Record<string, string> = {};
    const addRun = (names: string, first: number) => names.split(' ').forEach((name, i) => {
        if (name !== '_') map[name] = String.fromCharCode(first + i);
    });
    addRun(LATIN1_ENTITIES, 0xa0);
    addRun(GREEK_UPPER, 0x391);
    addRun(GREEK_LOWER, 0x3b1);
    for (const [name, code] of Object.entries(OTHER_ENTITIES)) map[name] = String.fromCodePoint(code);
    legacyEntities = new Set([...LATIN1_ENTITIES.split(' '), 'amp', 'lt', 'gt', 'quot']);
    return (namedEntities = map);
}

function decodeNamed(match: string, name: string): string {
    const entities = getNamedEntities();
    if (match.endsWith(';') && entities[name]) return entities[name];
    for (let len = Math.min(name.length, 6); len >= 2; len--) {
        const prefix = name.slice(0, len);
        if (legacyEntities!.has(prefix)) return entities[prefix] + match.slice(1 + len);
    }
    return match;
}

function decodeCodePoint(code: number): string {
    if (WINDOWS_1252[code]) return String.fromCodePoint(WINDOWS_1252[code]!);
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '�';
    return String.fromCodePoint(code);
}

/** Decode HTML entities (`&amp;`, `&#8212;`, `&#x2014;`, `&laquo;`) into characters. */
export function decodeText(str: string): string {
    if (!str) return '';
    if (str.indexOf('&') === -1) return str;
    return str.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));?/g, (match, dec, hex, name) => {
        if (dec) return decodeCodePoint(parseInt(dec, 10));
        if (hex) return decodeCodePoint(parseInt(hex, 16));
        return decodeNamed(match, name);
    });
}

export const htmlDecode = decodeText; // Alias for backward compatibility

export function truncateString(str: string, num: number): string {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}

/** Cut HTML to `maxLength` text chars (and `maxLines`), closing any open tags. */
export function truncateHTML(html: string | null | undefined, maxLength: number, maxLines: number | null = null): string {
    if (!html) return '';

    let textLength = 0;
    let lineCount = 0;
    let truncated = '';

    // Regex to find tags and text fragments
    const tagOrTextRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi;
    let match: RegExpExecArray | null;

    // Stack to track open tags
    const tags: string[] = [];

    // Walk HTML and truncate text content to maxLength or maxLines
    while ((match = tagOrTextRegex.exec(html))) {
        const part = match[0];

        if (part[0] === '<') {
            // If this is a tag, check whether it is opening or closing
            const tagName = match[1]!.toLowerCase();
            const isClosingTag = part[1] === '/';

            if (!isClosingTag) {
                // Check if this tag starts a new line
                if (/br|p|div|li|h[1-6]|section|article|header|footer/.test(tagName)) {
                    lineCount++;
                    if (maxLines !== null && lineCount > maxLines) break;
                }

                if (!/br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr/.test(tagName)) {
                    tags.push(tagName);
                }
            } else if (isClosingTag) {
                const lastIndex = tags.lastIndexOf(tagName);
                if (lastIndex !== -1) {
                    tags.splice(lastIndex, 1);
                }
            }

            // Append tag to result without incrementing text counter
            truncated += part;
        } else {
            // Text fragment
            // Check for explicit line breaks in text
            const textLines = part.split(/\r\n|\r|\n/);
            let textPartTruncated = '';

            for (let i = 0; i < textLines.length; i++) {
                if (i > 0 || (lineCount === 0 && textLines[i]!.trim().length > 0)) {
                    lineCount++;
                    if (maxLines !== null && lineCount > maxLines) break;
                }

                if (i > 0) textPartTruncated += '\n';

                const remainingChars = maxLength - textLength;
                const line = textLines[i]!;

                if (line.length > remainingChars) {
                    textPartTruncated += line.substring(0, remainingChars);
                    textLength += remainingChars;
                    break;
                } else {
                    textPartTruncated += line;
                    textLength += line.length;
                }
            }

            truncated += textPartTruncated;

            if (maxLines !== null && lineCount > maxLines) break;
            if (textLength >= maxLength) break;
        }
    }

    // Close all unclosed tags
    while (tags.length) {
        truncated += `</${tags.pop()}>`;
    }

    return truncated;
}

export function firstLetterCap(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function getPlural(key: string, count: number): string {

    let lastDigit = count % 10;
    let lastTwoDigits = count % 100;

    if (count == 0)
        return key + '_0';

    if (count == 1) {
        return key + '_1';
    }
    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        return key + '_2';
    }
    return key + '_plural';
}

/** Translate a plural key (`key_0` / `key_1` / `key_2` / `key_plural`) with `{ count }`. */
export function tp(key: string, count: number, isHideData = false): string {
    let ct: number | string = count;
    if (isHideData)
        ct = '';
    // `count: ''` (isHideData) hides the number in the string; i18next types expect a number.
    return i18n.t(getPlural(key, count), { count: ct as number });
}

/** Last external (non-own-domain) URL in the text, skipping `excluded`; null if none. */
export function linkify2(text: string, excluded: string[] = []): string | null {
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
    let matches = Array.from(text.matchAll(urlRegex)).reverse();
    for (let match of matches) {
        if ([APP_URL, UNA_URL].every(domain => !match[0].includes(domain))) {
            const url = match[0];
            if (!excluded.some(ex => url.includes(ex))) {
                return url;
            }
        }
    }
    return null;
}

export function linkify3(inputText: string): string {
    var replacedText: string, replacePattern1: RegExp, replacePattern2: RegExp, replacePattern3: RegExp;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/** Turn absolute own-site (UNA_URL) links into root-relative ones. */
export function clearLinks<T extends string | null | undefined>(text: T): T {
    if (!text)
        return text;
    const regex = new RegExp(escapeRegExp(UNA_URL), 'g');
    return text!.replace(regex, '/') as T;
}

/** Unwrap mention spans and relativize own links. `attrs` / `htmlSpecialChars` are legacy, unused. */
export function linkify(text: string, attrs = '', htmlSpecialChars = false): string {
    return clearLinks(text.replace(/<span contenteditable="false">(.*?)<\/span>/g, '$1'));
}

export function isEmoji(s: string): boolean {
    const emojiRegex = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
    return !!s.match(emojiRegex);
}

export function stripTags(s: any): any {
    if (s)
        return String(s).replace(/(<([^>]+)>)/ig, '').replace(/\s+/g, ' ');

    return s;
}

export function looksLikeHtml(s: unknown): boolean {
    return /<[a-z][\s\S]*>/i.test(String(s ?? ''));
}

/**
 * True when rich-editor HTML has visible text or user-created line breaks.
 * Ignores TipTap/enriched empty states: one <br>, trailing ProseMirror <br>, empty <p>.
 */
export function editorHtmlHasContent(html: unknown): boolean {
    if (!html || typeof html !== 'string') return false
    if (stripTags(html).trim().length > 0) return true

    const inner = html
        .replace(/^<html>/i, '')
        .replace(/<\/html>$/i, '')
        .trim()
        .replace(/<br[^>]*\bProseMirror-trailingBreak\b[^>]*>/gi, '')

    const emptyParagraphRegex = /<p[^>]*>(?:\s|&nbsp;|<br[^>]*\/?>)*<\/p>/gi
    const emptyParagraphs = inner.match(emptyParagraphRegex) || []
    if (emptyParagraphs.length > 1) return true

    const withoutEmptyPs = inner.replace(emptyParagraphRegex, '').trim()
    const standaloneBrCount = (withoutEmptyPs.match(/<br\b/gi) || []).length
    if (standaloneBrCount > 1) return true

    // Single <br> with no other markup is the normalized empty document — not content.
    if (standaloneBrCount === 1 && !withoutEmptyPs.replace(/<br\b[^>]*\/?>/gi, '').trim()) {
        return false
    }

    return withoutEmptyPs.length > 0
}

/*export function stripTagsWithLinks(s) {
    if (s)
        return String(s).replace(/<(?!\/?(a|p|br)(?=>|\s.*>))\/?.*?>/ig, '').replace(/\s+/g, ' ');

    return s;
}*/
export function stripTagsWithLinks(s: any, allowed: string[] = ['a', 'p', 'br']): any {
    if (s) {
        const allowedTags = allowed.join('|');
        const regex = new RegExp(`<(?!(\\/?)(${allowedTags})(?=>|\\s.*>))\\/?.*?>`, 'ig');
        return String(s).replace(regex, '').replace(/\s+/g, ' ');
    }
    return s;
}

export function removeEmptyTags(html: string): string {
    return html.replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, '');
}
