import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import { cn } from 'app/lib/util';
import type { VideoThumbProps } from './video-thumb.types';

/**
 * Feed/gallery tile for a video: the poster and a play badge. No player is created here
 * (an expo-video player per tile buffers even when paused); the parent opens the
 * lightbox on press and plays there.
 */
export default function VideoThumb({ poster, className }: VideoThumbProps) {
    return (
        <View className={cn('relative w-full h-full overflow-hidden bg-muted', className)}>
            {/* No poster: the muted background and the play badge are the placeholder. */}
            {!!poster && <Image src={poster} alt="" view="cover" />}
            <View className="pointer-events-none absolute inset-0 items-center justify-center">
                <View className="rounded-full bg-black/50 p-3">
                    <Icon icon="Play" size={20} color="white" fill="white" />
                </View>
            </View>
        </View>
    );
}
