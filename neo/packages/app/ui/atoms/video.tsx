import { useState } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { View, Pressable } from 'app/design/view'
import VideoThumb from 'app/ui/atoms/video-thumb';
import type { VideoProps } from './video.types'

const styles = StyleSheet.create({
    video: {
        width: '100%',
        height: '100%',
    },
    fill: {
        width: '100%',
        height: '100%',
    },
});

function ElementVideoPlayer({ src, controls, cover, fill, autoplay, muted, startPlaying }: VideoProps & { src: string, startPlaying?: boolean }) {
    const player = useVideoPlayer(src, player => {
        player.muted = muted ? true : false;
        player.loop = autoplay ? true : false;
        // Same as web's autoPlay: start as soon as the player exists (it plays once the source loads).
        // startPlaying: the user tapped the poster, so play once without looping.
        if (autoplay || startPlaying) player.play();
    });

    // fill = stretch to parent (lightbox). Keep aspect-video by default so existing callers keep height.
    if (fill) {
        return (
            <View style={styles.fill}>
                <VideoView
                    style={styles.video}
                    player={player}
                    contentFit={cover ? 'cover' : 'contain'}
                    nativeControls={Boolean(controls)}
                    fullscreenOptions={{ enable: true }}
                    allowsPictureInPicture={false}
                />
            </View>
        );
    }

    return (
        <View className="aspect-video">
            <VideoView
                style={styles.video}
                player={player}
                nativeControls={Boolean(controls)}
                fullscreenOptions={{ enable: true }}
                allowsPictureInPicture={false}
            />
        </View>
    )
}

export default function ElementVideo(props: VideoProps) {
    const [started, setStarted] = useState(false);

    if (!props.src) return null;

    // With a poster and no autoplay, show the poster until the user taps it, like web's preload="none".
    // An expo-video player buffers as soon as it exists, so a feed would otherwise create one per row.
    if (props.poster && !props.autoplay && !started) {
        return (
            <Pressable
                className={props.fill ? 'w-full h-full' : 'w-full aspect-video'}
                accessibilityRole="button"
                onPress={() => setStarted(true)}
            >
                <VideoThumb poster={props.poster} />
            </Pressable>
        );
    }

    return <ElementVideoPlayer {...props} src={props.src} startPlaying={started} />;
}
