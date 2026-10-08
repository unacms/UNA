import { uploadImage } from 'app/lib/util/upload'
import { genRnd } from 'app/lib/util/misc'
import { revokePastedBlobUri } from './editor-paste-images'
import { inlineUploadError, type InlineUploadResult } from './upload-inline-image'

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
): Promise<InlineUploadResult> {
    const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]='
        + `&a=upload_inline&uo=sys_html5&so=${VIDEO_STORAGE}&o=${VIDEO_STORAGE}`
        + `&vt=${VIDEO_MP4}&pt=${VIDEO_POSTER}&uid=${genRnd(8)}`

    return new Promise((resolve) => {
        uploadImage(
            video.uri,
            url,
            ({ result }) => {
                const data = result?.data || result
                if (!data?.link) console.warn('[editor] inline video upload rejected', result)
                resolve({ link: data?.link || null, error: data?.link ? null : inlineUploadError(data) })
            },
            { fileName: video.fileName, mimeType: video.mimeType },
            { onProgress },
        )
            .catch((err) => {
                console.warn('[editor] inline video upload failed', err)
                resolve({ link: null, error: null })
            })
            .finally(() => revokePastedBlobUri(video.uri))
    })
}

export type InlineSegment =
    | { type: 'html'; html: string }
    | ({ type: 'video'; src: string; poster: string } & InlineMediaLayout)
    | ({ type: 'embed'; url: string } & InlineMediaLayout)

export type InlineMediaAlign = 'left' | 'center' | 'right'

/** Size and paragraph alignment the editor gave the media image (`width`/`height`, `text-align`). */
export type InlineMediaLayout = { width?: number; height?: number; align?: InlineMediaAlign }

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

/** The embedded URL an editor image src carries (`toEmbedImageSrc`), `null` for a plain image. */
export function embedUrlFromImageSrc(src: string | null | undefined): string | null {
    const hash = src ? src.indexOf(`#${EMBED_MARK}`) : -1
    if (!src || hash < 0) return null
    try {
        const url = decodeURIComponent(src.slice(hash + 1 + EMBED_MARK.length))
        return isHttpUrl(url) ? url : null
    } catch {
        return null
    }
}

const decodeAmp = (s: string) => s.replace(/&amp;/g, '&')

/** Only http(s) URLs may be embedded: anything else (`javascript:`, `data:`…) is dropped. */
export function isHttpUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
        const { protocol } = new URL(url)
        return protocol === 'http:' || protocol === 'https:'
    } catch {
        return false
    }
}

const embedSegment = (url: string): InlineSegment | null => (isHttpUrl(url) ? { type: 'embed', url } : null)

const IMG = '(<img\\b[^>]*\\bsrc="([^"]+)"[^>]*>)'
// Legacy (link) format of the first builds: a paragraph with only a marked link.
const LINK = '<a\\b[^>]*\\bhref="([^"]+)"[^>]*>[^<]*</a>'
// Groups: 1 paragraph attributes, 2-3 its image tag and src, 4-5 a bare image tag and src, 6 a legacy link.
const MEDIA = new RegExp(`<p([^>]*)>\\s*${IMG}\\s*</p>|${IMG}|<p[^>]*>\\s*${LINK}\\s*</p>`, 'gi')

const dimension = (tag: string, name: string) => {
    const value = Number(tag.match(new RegExp(`\\b${name}="(\\d+)"`, 'i'))?.[1])
    return value > 0 ? value : undefined
}

function toLayout(imgTag: string | undefined, pAttrs: string | undefined): InlineMediaLayout {
    const align = pAttrs?.match(/text-align\s*:\s*(left|center|right)/i)?.[1]?.toLowerCase()
    return {
        width: imgTag ? dimension(imgTag, 'width') : undefined,
        height: imgTag ? dimension(imgTag, 'height') : undefined,
        align: align as InlineMediaAlign | undefined,
    }
}

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
            return embedSegment(decodeURIComponent(fragment.slice(EMBED_MARK.length)))
        } catch {
            return null
        }
    }
    // Legacy embed link: `URL#neo-embed` / `URL#frag&neo-embed`.
    if (isLink && /(^|&)neo-embed$/.test(fragment)) {
        return embedSegment(src.replace(/[#&]neo-embed$/, ''))
    }
    return null
}

/** Split post HTML into plain HTML chunks, inline editor videos and embeds. */
export function splitInlineMedia(html: string | null | undefined): InlineSegment[] {
    if (!html) return []
    const segments: InlineSegment[] = []
    let last = 0
    for (const match of html.matchAll(MEDIA)) {
        const found = toSegment(match[3] || match[5] || match[6], !!match[6])
        if (!found) continue
        const segment = found.type === 'html' ? found : { ...found, ...toLayout(match[2] || match[4], match[1]) }
        const index = match.index ?? 0
        if (index > last) segments.push({ type: 'html', html: html.slice(last, index) })
        segments.push(segment)
        last = index + match[0].length
    }
    if (last < html.length) segments.push({ type: 'html', html: html.slice(last) })
    return segments
}
