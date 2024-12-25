//import Video from 'react-native-video'; //EXPO 52 UPDATE
import {StyleSheet} from 'react-native';
/*
export default function ElementVideo(props) {
    return <></>
}*/

export default function ElementVideo({src, controls, cover, autoplay, muted}) {
   /* var styles = StyleSheet.create({
        backgroundVideo: {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: '100%',
            height: '100%',
        }
    });    
*/
    return ( <></>
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
    )
}
