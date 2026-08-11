import i18n from 'i18next';
import { decode } from 'html-entities';
import { UNA_URL, APP_URL } from 'app/config';

export function decodeText(str) {
    return decode(str);
}

export const htmlDecode = decodeText; // Alias for backward compatibility

export function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}

export function truncateHTML(html, maxLength, maxLines = null) {
    if (!html) return '';

    let textLength = 0;
    let lineCount = 0;
    let truncated = '';

    // Regex to find tags and text fragments
    const tagOrTextRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi;
    let match;

    // Stack to track open tags
    const tags = [];

    // Walk HTML and truncate text content to maxLength or maxLines
    while ((match = tagOrTextRegex.exec(html))) {
        const part = match[0];

        if (part[0] === '<') {
            // If this is a tag, check whether it is opening or closing
            const tagName = match[1].toLowerCase();
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
                if (i > 0 || (lineCount === 0 && textLines[i].trim().length > 0)) {
                    lineCount++;
                    if (maxLines !== null && lineCount > maxLines) break;
                }

                if (i > 0) textPartTruncated += '\n';

                const remainingChars = maxLength - textLength;
                const line = textLines[i];

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

export function firstLetterCap(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function reverseHtml(str) {
    var ph = String.fromCharCode(206);
    var result = str.split('').reverse().join('');
    while (result.indexOf('<') > -1) {
        result = result.replace('<', ph);
    }
    while (result.indexOf('>') > -1) {
        result = result.replace('>', '<');
    }
    while (result.indexOf(ph) > -1) {
        result = result.replace(ph, '>');
    }
    return result;
}

function getPlural(key, count) {

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

export function tp(key, count, isHideData = false) {
    let ct = count;
    if (isHideData)
        ct = '';
    return i18n.t(getPlural(key, count), { count: ct });
}

export function linkify2(text, excluded = []) {
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

export function linkify3(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function clearLinks(text) {
    if (!text)
        return text;
    const regex = new RegExp(escapeRegExp(UNA_URL), 'g');
    return text.replace(regex, '/');
}

export function linkify(text, attrs = '', htmlSpecialChars = false) {
    return clearLinks(text.replace(/<span contenteditable="false">(.*?)<\/span>/g, '$1'));
    // todo improve
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;

    const anchorRegex = /<a [^>]*>[^<]*<\/a>/g;

    const anchors = [...text.matchAll(anchorRegex)];

    if (htmlSpecialChars)
        text = text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

    let matches = Array.from(text.matchAll(urlRegex)).reverse();

    matches.forEach(match => {
        let url = match[0];
        let attrsLocal = attrs;

        let withinAnchor = anchors.some(anchor => match.index > anchor.index && match.index < anchor.index + anchor[0].length);
        if (withinAnchor) return;

        if (!/^https?:\/\//.test(url)) {
            url = 'http://' + url;
        }

        text = text.slice(0, match.index) + '<a ' + attrsLocal + ' href="' + url + '">' + match[0] + '</a>' + text.slice(match.index + match[0].length);
    });

    // email pattern
    const mailPattern = /([A-z0-9._-]+@[A-z0-9_-]+\.[A-z0-9_.-]+)/g;
    matches = Array.from(text.matchAll(mailPattern)).reverse();
    matches.forEach(match => {
        let withinAnchor = anchors.some(anchor => match.index > anchor.index && match.index < anchor.index + anchor[0].length);
        if (withinAnchor) return;
        text = text.slice(0, match.index) + '<a href="mailto:' + match[0] + '">' + match[0] + '</a>' + text.slice(match.index + match[0].length);
    });

    return text;
}

export function isEmoji(s) {
    const emojiRegex = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
    return !!s.match(emojiRegex);
}

export function stripTags(s) {
    if (s)
        return String(s).replace(/(<([^>]+)>)/ig, '').replace(/\s+/g, ' ');

    return s;
}

/**
 * True when rich-editor HTML has visible text or user-created line breaks.
 * Ignores TipTap/enriched empty states: one <br>, trailing ProseMirror <br>, empty <p>.
 */
export function editorHtmlHasContent(html) {
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
export function stripTagsWithLinks(s, allowed = ['a', 'p', 'br']) {
    if (s) {
        const allowedTags = allowed.join('|');
        const regex = new RegExp(`<(?!(\\/?)(${allowedTags})(?=>|\\s.*>))\\/?.*?>`, 'ig');
        return String(s).replace(regex, '').replace(/\s+/g, ' ');
    }
    return s;
}

export function removeEmptyTags(html) {
    return html.replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, '');
}
