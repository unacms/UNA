import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { View } from 'app/design/view'

const styles = StyleSheet.create({
   
    video: {
        width: '100%',
        height: '100%',
    },
});

export default function ElementVideo({ src, controls, cover, autoplay, muted }) {
    if (!src) return null;
    
    const player = useVideoPlayer(src, player => {
        player.muted = muted ? true : false;
        player.loop = autoplay ? true : false;
       // player.play();
    });

    return (
        <View className="aspect-video" >
            <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
        </View>
    )
}
