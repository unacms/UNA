import { cn } from 'app/lib/util';
import type { VideoProps } from './video.types';

export default function ElementVideo({ src, controls, cover, fill, autoplay, muted, poster, className }: VideoProps) {
    if (!src) return null;

    // fill = stretch to parent (thumbnail / lightbox), same as native. Legacy `cover` keeps the background-video look.
    const videoClass = fill
        ? cn('w-full h-full', cover ? 'object-cover' : 'object-contain', className)
        : cn(cover ? 'background-video' : '', className);

    // No hardcoded `type`: the browser sniffs the container, so non-mp4 uploads (webm etc.) still play.
    return (
        <video
            {...(poster ? { poster: poster } : {})}
            className={videoClass}
            controls={controls}
            autoPlay={!!autoplay}
            muted={!!muted}
            playsInline
            preload="metadata"
        >
            <source src={src.toString()} />
        </video>
    )
}
