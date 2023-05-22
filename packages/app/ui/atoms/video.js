
import Video from 'react-native-video';
import {StyleSheet} from 'react-native';
export default function ElementVideo(props) {
  var styles = StyleSheet.create({
    backgroundVideo: { 
      height:'100%',
      width:400
    },
  });  
  return (
        <Video 
        controls={true}
        ref={(ref) => {
          this.player = ref
        }}    
        paused={true}
        autoplay={false}                       // Store reference
        onBuffer={this.onBuffer}                // Callback when remote video is buffering
        onError={this.videoError}    
        source={{uri:props.src}}  
        style={styles.backgroundVideo}
        />
    )
}
