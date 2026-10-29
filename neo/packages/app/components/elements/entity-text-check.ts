import { clearLinks, getYouTubeVideoId } from 'app/lib/util'

// block.tsx asks an entity text block whether it has anything to show before rendering it.
// The check lives apart from EntityText, so the registry can load EntityText on demand.

/** The fields of an entity text block's data that decide whether it shows anything. */
export type EntityTextData = {
    entry_text?: string | null;
    video?: unknown;
    image?: unknown;
    video_embed?: string | null;
    editable?: boolean;
};

/** What an entity text shows: its text without UNA links, and a YouTube video id. */
export type EntityTextContent = { text: string | null | undefined; videoId: string | null };

/** The text and YouTube video id an entity text shows, or null when it shows nothing. */
export function checkEntityText(data: EntityTextData | null | undefined): EntityTextContent | null {
    if (!data) return null;
    const text = clearLinks(data.entry_text);
    const videoId = data.video_embed ? getYouTubeVideoId(data.video_embed) : null;
    if (!text && !data.video && !data.image && !videoId)
        return null;

    return { text, videoId };
}

/** `checkEmpty` of the entity_text element: whether the block shows anything. An editable block always does. */
export function entityTextCheckEmpty(item: { editable?: boolean; data?: EntityTextData | null } | null | undefined): boolean {
    return !!(item?.editable || item?.data?.editable) || checkEntityText(item?.data) !== null;
}
