/**
 * A block's title and padding sizes, Studio's "Title size" and "Padding" (Studio > Pages > block), as UNA sends them in
 * `title_size` and `padding_size`: '' is regular, 'compact' a step smaller and 'large' a step larger. Padding is 8px,
 * 16px or 24px around the block and between its title and content; the title is text-base, text-lg or text-xl with its
 * line height. UNA sends '' for a design box without that part. No app imports, so
 * `node --test packages/app/lib/block-size.test.ts` runs it from the NEO root.
 */

export type BlockSize = '' | 'compact' | 'large';

const SIZES: ReadonlySet<unknown> = new Set(['compact', 'large']);

/** `value` as a size; anything UNA doesn't send is the regular one (''). */
export function blockSize(value: unknown): BlockSize {
    return SIZES.has(value) ? (value as BlockSize) : '';
}

/** The theme key (`theme.blocks`) or responsive preset for `key` at `size`: `u-block-pad-x` → `u-block-pad-x-compact`. */
export function blockSizeKey(key: string, size: unknown): string {
    const sized = blockSize(size);
    return sized ? `${key}-${sized}` : key;
}

/** `classes` without their gap utilities (`gap-4`, `sm:gap-2`), for a block whose gap follows its padding size. */
export function withoutGap(classes: string): string {
    return String(classes || '')
        .split(/\s+/)
        .filter((token) => token && !/^(?:[a-z0-9-]+:)*gap-/.test(token))
        .join(' ');
}
