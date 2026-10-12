/**
 * Free-picked emoji reactions (UNA "Many" mode) are stored as `e_<hex code points>`,
 * e.g. `e_1f600` for 😀 or `e_2764_fe0f` for ❤️. Same format as
 * `BxDolVoteReactions::encodeEmoji()` on the UNA side.
 */

const CODE_RE = /^e(?:_[0-9a-f]{1,6})+$/;

export function isEmojiReactionCode(name: string): boolean {
    return CODE_RE.test(name);
}

/** The emoji for an `e_…` code, or null. */
export function emojiFromReactionCode(name: string): string | null {
    if (!isEmojiReactionCode(name)) return null;

    const codes = name
        .split('_')
        .slice(1)
        .map((hex) => parseInt(hex, 16));
    if (codes.some((code) => code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff))) return null;

    return String.fromCodePoint(...codes);
}

export function reactionCodeFromEmoji(emoji: string): string {
    return 'e_' + Array.from(emoji, (char) => (char.codePointAt(0) ?? 0).toString(16)).join('_');
}

/** Compare emoji without variation selectors (U+FE0E / U+FE0F). */
export function emojiKey(emoji: string): string {
    return emoji.replace(/[︎️]/g, '');
}
