import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import VideoThumb from 'app/ui/atoms/video-thumb';
import { cn, getYouTubeThumbUrl } from 'app/lib/util';

/** YouTube embed: a thumbnail until clicked, then the iframe, autoplaying since the click is the user gesture. */
export default function Youtube({ videoId, size }) {
    const { t } = useTranslation();
    const [active, setActive] = useState(false);

    return (
        <View className={cn('aspect-video rounded sm:rounded-lg overflow-hidden', size == 'small' && 'max-w-xs')}>
            {active ? (
                <iframe className="absolute inset-0 w-full h-full" src={"https://www.youtube.com/embed/" + videoId + "?autoplay=1"} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            ) : (
                <Pressable style={{ flex: 1 }} onPress={() => setActive(true)} accessibilityLabel={t('Play video')}>
                    <VideoThumb poster={getYouTubeThumbUrl(videoId)} hoverPreview={false} />
                </Pressable>
            )}
        </View>
    )
}
