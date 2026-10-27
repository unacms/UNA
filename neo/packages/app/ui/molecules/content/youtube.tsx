import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import VideoThumb from 'app/ui/atoms/video-thumb';
import { getYouTubeThumbUrl } from 'app/lib/util';
import YoutubePlayer from 'react-native-youtube-iframe';
import type { YoutubeProps } from './youtube.types';

/** YouTube embed: a thumbnail until pressed, then the player (a WebView each) starts playing. */
export default function Youtube({ videoId }: YoutubeProps) {
    const { t } = useTranslation();
    // The id that was pressed, so a different video (an edited embed URL) waits for its own press.
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
        <View className='aspect-video rounded overflow-hidden'>
            {activeId === videoId ? (
                <YoutubePlayer height="100%" videoId={videoId} play />
            ) : (
                <Pressable style={{ flex: 1 }} onPress={() => setActiveId(videoId)} accessibilityLabel={t('Play video')}>
                    <VideoThumb poster={getYouTubeThumbUrl(videoId)} />
                </Pressable>
            )}
        </View>
    );
}
