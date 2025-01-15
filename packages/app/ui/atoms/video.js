import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { View } from 'app/design/view'

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 50,
    },
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
        player.play();
    });

    return (
        
        <View style={styles.contentContainer}>
            <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
        </View>
    )
}
/*<Video 
    controls={controls}
    ref={(ref) => {
        this.player = ref
    }}     
    resizeMode={cover? "cover"  : ''}
    muted  ={muted? true : false}    
    onBuffer={this.onBuffer}    
    onError={this.videoError}        
    source={{uri:src}}    
    style={styles.backgroundVideo}
/>*/