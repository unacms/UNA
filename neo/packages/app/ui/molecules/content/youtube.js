import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import VideoThumb from 'app/ui/atoms/video-thumb';
import { getYouTubeThumbUrl } from 'app/lib/util';
import YoutubePlayer from "react-native-youtube-iframe";

/** YouTube embed: a thumbnail until pressed, then the player (a WebView each) starts playing. */
export default function Youtube({ videoId }) {
    const { t } = useTranslation();
    const [active, setActive] = useState(false);

    return (
        <View className='aspect-video rounded overflow-hidden'>
            {active ? (
                <YoutubePlayer
                    className="absolute inset-0 w-full h-full"
                    height="100%"
                    videoId={videoId}
                    play
                />
            ) : (
                <Pressable style={{ flex: 1 }} onPress={() => setActive(true)} accessibilityLabel={t('Play video')}>
                    <VideoThumb poster={getYouTubeThumbUrl(videoId)} />
                </Pressable>
            )}
        </View>
    );
}
