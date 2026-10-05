import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { View } from 'app/design/view'
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

function ElementVideoPlayer({ src, controls, cover, fill, autoplay, muted }: VideoProps & { src: string }) {
    const player = useVideoPlayer(src, player => {
        player.muted = muted ? true : false;
        player.loop = autoplay ? true : false;
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
    if (!props.src) return null;

    return <ElementVideoPlayer {...props} src={props.src} />;
}
