import { type CSSProperties, useEffect, useState } from 'react';

import type { Schema } from 'una-api';

import { Icon } from '../../components/icon';
import { list, t, tn } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';

type Media = Schema<'Media'>;

/** What the group of media is, for screen readers: the site keeps no alt text for them. */
export function mediaLabel(media: readonly Media[]): string {
    const photos = media.filter((m) => m.kind === 'image').length;
    const videos = media.length - photos;
    const parts: string[] = [];
    if (photos) parts.push(tn(photos, '{{count}} photo', '{{count}} photos'));
    if (videos) parts.push(tn(videos, '{{count}} video', '{{count}} videos'));
    return list(parts);
}

type Allowed = (url: string | null | undefined) => string | null;

/** Which copy a place shows: `thumb` small, `medium` in a feed or a message, `large` full size. */
export type PictureSize = 'thumb' | 'medium' | 'large';

/**
 * The picture to draw of an image at a size, or null: the copy of that size (Media.variants),
 * else the nearest other copy, else the original (`url`, which may be large), each only if
 * `allowed` (useMediaSrc) lets the page load it.
 */
export function pictureOf(m: Pick<Media, 'url' | 'variants'>, size: PictureSize, allowed: Allowed): string | null {
    const v = m.variants ?? {};
    const order: (string | undefined)[] =
        size === 'thumb'
            ? [v.thumb?.url, v.medium?.url, v.large?.url, m.url]
            : size === 'medium'
              ? [v.medium?.url, v.large?.url, m.url, v.thumb?.url]
              : [v.large?.url, m.url, v.medium?.url, v.thumb?.url];
    for (const url of order) {
        const src = allowed(url);
        if (src) return src;
    }
    return null;
}

/**
 * A video to play: its MP4 copy once converted, or (a video of another module, which the site
 * gives no copies) the file itself; never the upload while it is still being converted.
 */
export function videoOf(m: Pick<Media, 'url' | 'variants' | 'state'>, allowed: Allowed): { src: string; poster: string | undefined } | null {
    if (m.state !== 'ready') return null;
    const src = allowed(m.variants?.mp4?.url) ?? (m.variants?.mp4 ? null : allowed(m.url));
    return src ? { src, poster: allowed(m.variants?.poster?.url) ?? undefined } : null;
}

/** The CSS aspect ratio of one media item, from its size when the site knows it. */
export function aspectRatio(m: Pick<Media, 'width' | 'height'>): string {
    return m.width && m.height ? `${m.width} / ${m.height}` : '4 / 3';
}

/** A photo's alt text: UNA stores none, so where it is in the post and whose it is. */
export function photoAlt(index: number, count: number, by: string | null | undefined): string {
    if (count > 1) return by ? t('Photo {{n}} of {{total}} by {{name}}', { n: index + 1, total: count, name: by }) : t('Photo {{n}} of {{total}}', { n: index + 1, total: count });
    return by ? t('Photo by {{name}}', { name: by }) : t('Photo');
}

type Props = {
    media: readonly Media[];
    /** In the detail pane: the larger images. */
    large?: boolean;
    /** Whose post it is, for the photos' alt text ("Photo 2 of 3 by Lily Carter"). */
    by?: string | null;
    /**
     * Photos open full size: each one is a button, called with the photo's index among the
     * post's photos (videos keep their own controls).
     */
    onOpen?: (photoIndex: number) => void;
};

/**
 * The photos of a post that a lightbox can show, in order: only those with a picture `allowed`
 * (useMediaSrc) lets the page load, so "Open photo 2 of 3" counts photos that show.
 */
export function photosOf(media: readonly Media[], allowed: Allowed): Media[] {
    return media.filter((m) => m.kind === 'image' && m.state !== 'failed' && !!pictureOf(m, 'large', allowed));
}

/**
 * The items a post shows (four at most): those with something to draw, and those still being
 * converted or that failed, which draw their box with a note (never a broken image).
 */
export function shownMedia(media: readonly Media[], allowed: Allowed): Media[] {
    return media.filter((m) => m.state !== 'ready' || !!(m.kind === 'video' ? videoOf(m, allowed) : pictureOf(m, 'medium', allowed))).slice(0, 4);
}

/** The box of an item that can't be drawn: converting, failed, or a picture that did not load. */
function MediaNote({ kind, style, processing }: { kind: Media['kind']; style?: CSSProperties; processing?: boolean }) {
    return (
        <div className="media-note" style={style} data-media-state={processing ? 'processing' : 'failed'}>
            {processing ? <span className="spinner" aria-hidden="true" /> : <Icon name="circle-alert" size={20} />}
            {/* while converting, the post's one status region says it */}
            <span aria-hidden={processing || undefined}>{processing ? t('Processing video…') : kind === 'video' ? t('This video could not be processed') : t('Photo unavailable')}</span>
        </div>
    );
}

function Photo({ src, alt, size, style, onOpen, openLabel }: { src: string; alt: string; size: { width?: number; height?: number }; style?: CSSProperties; onOpen?: () => void; openLabel?: string }) {
    const picture = usePicture(src);
    if (!picture.src) return <MediaNote kind="image" style={style} />;
    const img = <img src={picture.src} alt={onOpen ? '' : alt} loading="lazy" decoding="async" {...size} onError={picture.onError} onLoad={picture.onLoad} />;
    if (!onOpen) return <div className="media-photo" style={style}>{img}</div>;
    return (
        <button type="button" className="media-open" style={style} onClick={onOpen} aria-label={openLabel} aria-haspopup="dialog">
            {img}
        </button>
    );
}

function Video({ src, poster, size, style }: { src: string; poster: string | undefined; size: { width?: number; height?: number }; style?: CSSProperties }) {
    const [started, setStarted] = useState(false);
    return (
        <div className="media-video" style={style}>
            <video src={src} poster={poster} controls preload="none" {...size} onPlay={() => setStarted(true)} />
            {started ? null : (
                <span className="media-play" aria-hidden="true">
                    <Icon name="play" size={20} strong />
                </span>
            )}
        </div>
    );
}

/**
 * The videos whose conversion was said already ("Processing video…"), by their ids: a post that
 * scrolls away and back in a virtualized feed mounts again, and says it once, not each time.
 */
const saidProcessing = new Set<string>();

/**
 * "Processing video…" for screen readers, once per post: the region is there (empty) whenever
 * the post has a video, and the words go in after it mounted, which is what a live region needs
 * to be read out.
 */
function useProcessingNote(processingIds: string): string {
    const [note, setNote] = useState('');
    useEffect(() => {
        if (!processingIds || saidProcessing.has(processingIds)) return;
        saidProcessing.add(processingIds);
        // a task later: the empty region is in the accessibility tree first
        const timer = setTimeout(() => setNote(t('Processing video…')), 0);
        return () => clearTimeout(timer);
    }, [processingIds]);
    return processingIds ? note : '';
}

/**
 * A post's photos and videos. Every box has its size before anything loads (the single item
 * from its width and height, else 4:3 with the photo contained; a grid in square cells), so
 * nothing moves when images arrive and the virtualized list's row heights hold. A video still
 * being converted, one that failed, and a photo that does not load draw the same box with a
 * note instead.
 */
export function MediaGrid({ media, large = false, by, onOpen }: Props) {
    const allowed = useMediaSrc();
    const shown = shownMedia(media, allowed);
    const processingIds = shown
        .filter((m) => m.state === 'processing')
        .map((m) => m.id)
        .join(' ');
    const processingNote = useProcessingNote(processingIds);
    if (!shown.length) return null;
    const single = shown.length === 1;
    const photos = photosOf(media, allowed);
    const allPhotos = shown.filter((m) => m.kind === 'image').length;
    const hasVideo = shown.some((m) => m.kind === 'video');

    return (
        <div className={`media media-${shown.length}`} role="group" aria-label={mediaLabel(shown)}>
            {shown.map((m) => {
                const style = single ? { aspectRatio: aspectRatio(m) } : undefined;
                const size = { width: m.width ?? undefined, height: m.height ?? undefined };
                if (m.state === 'processing') return <MediaNote key={m.id} kind={m.kind} style={style} processing />;
                if (m.state === 'failed') return <MediaNote key={m.id} kind={m.kind} style={style} />;
                if (m.kind === 'video') {
                    const video = videoOf(m, allowed);
                    if (!video) return <MediaNote key={m.id} kind="video" style={style} />;
                    return <Video key={m.id} src={video.src} poster={video.poster} size={size} style={style} />;
                }
                const src = pictureOf(m, large ? 'large' : 'medium', allowed);
                if (!src) return <MediaNote key={m.id} kind="image" style={style} />;
                const at = shown.filter((x) => x.kind === 'image').indexOf(m);
                const photo = onOpen ? photos.indexOf(m) : -1;
                return (
                    <Photo
                        key={m.id}
                        src={src}
                        alt={photoAlt(at, allPhotos, by)}
                        size={size}
                        style={style}
                        onOpen={photo < 0 ? undefined : () => onOpen?.(photo)}
                        openLabel={photo < 0 ? undefined : photos.length > 1 ? t('Open photo {{n}} of {{total}}', { n: photo + 1, total: photos.length }) : t('Open the photo')}
                    />
                );
            })}
            {/* said once per post, not per item, in a region that is there before its words */}
            {hasVideo ? (
                <span className="sr-only" role="status">
                    {processingNote}
                </span>
            ) : null}
        </div>
    );
}
