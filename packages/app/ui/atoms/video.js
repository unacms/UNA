
import Video from 'react-native-video';
import {StyleSheet} from 'react-native';

export default function ElementVideo(props) {
    return <></>
}

export default function ElementVideo(props) {
    var styles = StyleSheet.create({
        backgroundVideo: {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
        }
    });    

    return (
        <Video 
            controls={true}
            ref={(ref) => {
                this.player = ref
            }}        
            paused={true}
            autoplay={false}                                            
            onBuffer={this.onBuffer}    
            onError={this.videoError}        
            source={{uri:props.src}}    
            style={styles.backgroundVideo}
        />
    )
}
