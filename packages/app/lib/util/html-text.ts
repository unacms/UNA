import i18n from 'i18next';
import { decode } from 'html-entities';
import { UNA_URL, APP_URL } from 'app/config';

export function decodeText(str: string): string {
    return decode(str);
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
