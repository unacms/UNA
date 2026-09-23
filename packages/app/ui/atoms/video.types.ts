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
    video_embed?: unknown;
    className?: string;
};
