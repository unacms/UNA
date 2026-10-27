import { clearLinks, getYouTubeVideoId } from 'app/lib/util'

// block.tsx asks an entity text block whether it has anything to show before rendering it.
// The check lives apart from EntityText, so the registry can load EntityText on demand.

/** The text and YouTube video id an entity text shows, or false when it shows nothing. */
export const checkEntityText = (data) => {
    if (!data) return false
    const text = clearLinks(data.entry_text);
    const videoId = data.video_embed && getYouTubeVideoId(data.video_embed) || null;
    if (!text && !data.video && !data.image && !videoId)
        return false

    return {text: text, videoId: videoId}
}

/** `checkEmpty` of the entity_text element: an editable block always shows. */
export const entityTextCheckEmpty = (item) => {
    if (item?.editable || item?.data?.editable) {
        return checkEntityText(item.data) || true
    }
    return checkEntityText(item.data)
};
