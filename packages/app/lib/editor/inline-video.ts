import { uploadImage } from 'app/lib/util/upload'
import { genRnd } from 'app/lib/util/misc'
import { revokePastedBlobUri } from './editor-paste-images'

/** UNA editor video storage + transcoders (`sys_videos_editor*`, see UNA install SQL). */
const VIDEO_STORAGE = 'sys_videos_editor'
const VIDEO_MP4 = 'sys_videos_editor_mp4'
const VIDEO_POSTER = 'sys_videos_editor_poster'

/**
 * Upload one body video through `upload_inline`: UNA stores it, queues mp4 + poster
 * transcoding and returns stable `image_transcoder.php` links that redirect once ready.
 */
export function uploadInlineVideo(
    video: { uri: string; fileName?: string; mimeType?: string },
    onProgress?: (fraction: number) => void,
): Promise<{ link: string; poster: string } | null> {
    const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]='
        + `&a=upload_inline&uo=sys_html5&so=${VIDEO_STORAGE}&o=${VIDEO_STORAGE}`
        + `&vt=${VIDEO_MP4}&pt=${VIDEO_POSTER}&uid=${genRnd(8)}`

    return new Promise((resolve) => {
        uploadImage(
            video.uri,
            url,
            ({ result }) => {
                const data = result?.data || result
                resolve(data?.link ? { link: data.link, poster: data.poster || '' } : null)
            },
            { fileName: video.fileName, mimeType: video.mimeType },
            { onProgress },
        )
            .catch((err) => {
                console.warn('[editor] inline video upload failed', err)
                resolve(null)
            })
            .finally(() => revokePastedBlobUri(video.uri))
    })
}

export type InlineSegment =
    | { type: 'html'; html: string }
    | { type: 'video'; src: string; poster: string }
    | { type: 'embed'; url: string }

/*
 * Video and embeds go into the body as images — the only atomic node of the editors on
 * web, iOS and Android (deleted as a whole, shown as a preview):
 * - video: the poster transcoder link `image_transcoder.php?o=sys_videos_editor_poster&h=ID`;
 * - embed: the page image (or UNA's embed-na.png) with the URL in a `#neo-embed=` fragment.
 * The post view swaps them for a player / embed card.
 */
const EMBED_MARK = 'neo-embed='

/** Image src for an embed: the preview image carrying the embedded URL in its fragment. */
export function toEmbedImageSrc(image: string, url: string) {
    return `${image.split('#')[0]}#${EMBED_MARK}${encodeURIComponent(url)}`
}

/** Poster image src for an uploaded editor video (its mp4 link from `upload_inline`). */
export function toVideoPosterSrc(mp4Link: string) {
    return mp4Link.replace(`o=${VIDEO_MP4}&`, `o=${VIDEO_POSTER}&`)
}

const decodeAmp = (s: string) => s.replace(/&amp;/g, '&')

const IMG = '<img\\b[^>]*\\bsrc="([^"]+)"[^>]*>'
// Legacy (link) format of the first builds: a paragraph with only a marked link.
const LINK = '<a\\b[^>]*\\bhref="([^"]+)"[^>]*>[^<]*</a>'
const MEDIA = new RegExp(`<p[^>]*>\\s*${IMG}\\s*</p>|${IMG}|<p[^>]*>\\s*${LINK}\\s*</p>`, 'gi')

function toSegment(rawSrc: string | undefined, isLink: boolean): InlineSegment | null {
    if (!rawSrc) return null
    const src = decodeAmp(rawSrc)
    const video = src.match(new RegExp(`image_transcoder\\.php\\?o=(${VIDEO_POSTER}|${VIDEO_MP4})&h=\\d+`))
    if (video && (isLink ? video[1] === VIDEO_MP4 : video[1] === VIDEO_POSTER)) {
        const poster = isLink ? toVideoPosterSrc(src) : src
        return { type: 'video', src: poster.replace(`o=${VIDEO_POSTER}&`, `o=${VIDEO_MP4}&`), poster }
    }
    const hash = src.indexOf('#')
    if (hash < 0) return null
    const fragment = src.slice(hash + 1)
    if (!isLink && fragment.startsWith(EMBED_MARK)) {
        try {
            return { type: 'embed', url: decodeURIComponent(fragment.slice(EMBED_MARK.length)) }
        } catch {
            return null
        }
    }
    // Legacy embed link: `URL#neo-embed` / `URL#frag&neo-embed`.
    if (isLink && /(^|&)neo-embed$/.test(fragment)) {
        return { type: 'embed', url: src.replace(/[#&]neo-embed$/, '') }
    }
    return null
}

/** Split post HTML into plain HTML chunks, inline editor videos and embeds. */
export function splitInlineMedia(html: string | null | undefined): InlineSegment[] {
    if (!html) return []
    const segments: InlineSegment[] = []
    let last = 0
    for (const match of html.matchAll(MEDIA)) {
        const segment = toSegment(match[1] || match[2] || match[3], !!match[3])
        if (!segment) continue
        const index = match.index ?? 0
        if (index > last) segments.push({ type: 'html', html: html.slice(last, index) })
        segments.push(segment)
        last = index + match[0].length
    }
    if (last < html.length) segments.push({ type: 'html', html: html.slice(last) })
    return segments
}
