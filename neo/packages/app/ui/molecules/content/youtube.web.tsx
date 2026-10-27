import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import VideoThumb from 'app/ui/atoms/video-thumb';
import { cn, getYouTubeThumbUrl } from 'app/lib/util';
import type { YoutubeProps } from './youtube.types';

/** YouTube embed: a thumbnail until clicked, then the iframe, autoplaying since the click is the user gesture. */
export default function Youtube({ videoId, size }: YoutubeProps) {
    const { t } = useTranslation();
    // The id that was clicked, so a different video (an edited embed URL) waits for its own click.
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
        <View className={cn('aspect-video rounded sm:rounded-lg overflow-hidden', size == 'small' && 'max-w-xs')}>
            {activeId === videoId ? (
                <iframe className="absolute inset-0 w-full h-full border-0" src={'https://www.youtube.com/embed/' + videoId + '?autoplay=1'} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            ) : (
                <Pressable style={{ flex: 1 }} onPress={() => setActiveId(videoId)} accessibilityLabel={t('Play video')}>
                    <VideoThumb poster={getYouTubeThumbUrl(videoId)} hoverPreview={false} />
                </Pressable>
            )}
        </View>
    );
}
