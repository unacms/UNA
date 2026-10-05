// Props shared by video-thumb.tsx (native) and video-thumb.web.tsx.

export type VideoThumbProps = {
    /** Video URL. Web only, and only fetched for the hover preview. */
    src?: string | null;
    /** Still image (UNA `src_poster`). Without one the tile is a plain placeholder and nothing is downloaded. */
    poster?: string | null;
    /** Web: `sizes` for the poster image, sized to the tile. */
    sizes?: number | string;
    /** Web: play a muted preview after a long hover with a mouse. Default true. */
    hoverPreview?: boolean;
    className?: string;
};
