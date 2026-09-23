import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { View } from 'app/design/view'

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

export type VideoProps = {
    src?: string | null;
    controls?: boolean;
    cover?: boolean;
    /** Stretch to parent (lightbox) instead of the default aspect-video box. */
    fill?: boolean;
    /** Callers pass `true` or the legacy `"autoplay"` string. */
    autoplay?: boolean | string;
    /** Callers pass `true` or the legacy `"muted"` string. */
    muted?: boolean | string;
    poster?: string;
    video_embed?: unknown;
    className?: string;
};

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
