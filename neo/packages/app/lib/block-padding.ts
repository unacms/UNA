/**
 * A block's padding size, Studio's "Padding" (Studio > Pages > block), as UNA sends it in `padding_size`:
 * '' is the regular 16px, 'compact' 8px and 'relaxed' 24px, around the block and between its title and content.
 * UNA sends '' for a design box without padding. No app imports, so
 * `node --test packages/app/lib/block-padding.test.ts` runs it from the NEO root.
 */

export type BlockPaddingSize = '' | 'compact' | 'relaxed';

const SIZES: readonly BlockPaddingSize[] = ['compact', 'relaxed'];

/** `value` as a padding size; anything UNA doesn't send is the regular one (''). */
export function blockPaddingSize(value: unknown): BlockPaddingSize {
    return SIZES.includes(value as BlockPaddingSize) ? (value as BlockPaddingSize) : '';
}

/** The theme key (`theme.blocks`) or responsive preset for `key` at `size`: `u-block-pad-x` → `u-block-pad-x-compact`. */
export function blockPaddingKey(key: string, size: unknown): string {
    const sized = blockPaddingSize(size);
    return sized ? `${key}-${sized}` : key;
}

/** `classes` without their gap utilities (`gap-4`, `sm:gap-2`), for a block whose gap follows its padding size. */
export function withoutGap(classes: string): string {
    return String(classes || '')
        .split(/\s+/)
        .filter((token) => token && !/^(?:[a-z0-9-]+:)*gap-/.test(token))
        .join(' ');
}
