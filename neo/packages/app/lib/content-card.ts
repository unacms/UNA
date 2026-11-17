/**
 * What a content card (a post, an ad, a poll, a product, a file, a photo, an album, a video) shows, out of the data
 * UNA sends for it. The card itself is `UnitContentCard` in `components/units/helpers.js`; UNA's site draws the same
 * card (`modules/base/general/template/css/unit_content_card.css`).
 */
export type ContentImage = { src?: unknown; [key: string]: unknown } | null | undefined | false | '';

export type ContentCardData = {
    image?: ContentImage;
    cover?: ContentImage;
    price_text?: unknown;
    summary_plain?: unknown;
    date?: unknown;
    added?: unknown;
    created?: unknown;
    [key: string]: unknown;
} | null | undefined;

function hasSrc(image: ContentImage): image is { src: string; [key: string]: unknown } {
    return !!image && typeof image === 'object' && typeof image.src === 'string' && image.src !== '';
}

/**
 * The card's picture: the item's image, else its cover (a product's), else none. A card without one is a text card:
 * it draws no empty box in the picture's place.
 */
export function getContentCardImage(data: ContentCardData): { src: string; [key: string]: unknown } | null {
    if (hasSrc(data?.image)) return data.image;
    if (hasSrc(data?.cover)) return data.cover;
    return null;
}

/** The price as UNA formats it (the seller's currency, or "Free"); '' for an item that has none. */
export function getContentCardPrice(data: ContentCardData): string {
    const price = data?.price_text;
    return typeof price === 'string' ? price.trim() : '';
}

/** The summary in one line of text; '' for none. */
export function getContentCardSummary(data: ContentCardData): string {
    const text = data?.summary_plain;
    return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
}

/** When it was posted, in seconds; 0 for unknown. */
export function getContentCardTime(data: ContentCardData): number {
    for (const value of [data?.date, data?.added, data?.created]) {
        const ts = Number(value);
        if (Number.isFinite(ts) && ts > 0) return ts;
    }
    return 0;
}
