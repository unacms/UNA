// Props shared by video.tsx (native) and video.web.tsx.

export type VideoProps = {
    src?: string | null;
    controls?: boolean;
    cover?: boolean;
    /** Stretch to parent (lightbox) instead of the default aspect-video box. */
    fill?: boolean;
    /** Callers pass `true` or the legacy `"autoplay"` string. */
    autoplay?: boolean | string;
    /** Callers pass `true` or the legacy `"muted"` string. */
    muted?: boolean | string;
    poster?: string;
    /**
     * Web, no poster: seconds into the video to load as the still frame instead
     * of the first one (often black or a title card). Uses a `#t=` media fragment,
     * so playback would start there too — only for thumbnails that don't play inline.
     */
    previewTime?: number;
    video_embed?: unknown;
    className?: string;
};
