import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import { cn } from 'app/lib/util';
import type { VideoThumbProps } from './video-thumb.types';

// Long enough that scrolling or moving the pointer across the feed doesn't start downloads.
const HOVER_PREVIEW_DELAY_MS = 500;

/** Mouse-driven device, motion allowed, Data Saver off. */
function canHoverPreview() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !connection?.saveData;
}

/**
 * Feed/gallery tile for a video: the poster and a play badge, no `<video>` element.
 * Playback belongs to the lightbox the parent opens on press. With a mouse, a long hover
 * mounts a muted looping preview; leaving unmounts it, which also stops the download.
 */
export default function VideoThumb({ src, poster, sizes, hoverPreview = true, className }: VideoThumbProps) {
    const [previewing, setPreviewing] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancel = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        setPreviewing(false);
    }, []);

    useEffect(() => cancel, [cancel]);

    const onPointerEnter = useCallback((e: React.PointerEvent) => {
        if (!hoverPreview || !src || e.pointerType !== 'mouse' || !canHoverPreview()) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setPreviewing(true), HOVER_PREVIEW_DELAY_MS);
    }, [hoverPreview, src]);

    return (
        <div
            className={cn('relative w-full h-full overflow-hidden bg-muted', className)}
            onPointerEnter={onPointerEnter}
            onPointerLeave={cancel}
        >
            {/* No poster: the muted background and the play badge are the placeholder. */}
            {!!poster && <Image src={poster} alt="" view="cover" sizes={sizes} />}

            {previewing && src && (
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={src}
                    poster={poster || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden
                />
            )}

            {!previewing && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-3">
                        <Icon icon="Play" size={20} color="white" fill="white" />
                    </div>
                </div>
            )}
        </div>
    );
}
