import { View } from 'app/design/view';
import YoutubePlayer from "react-native-youtube-iframe";

export default function Youtube({ videoId }) {

    return (
        <View className='aspect-video mt-3'>
            <YoutubePlayer
                className="absolute inset-0 w-full h-full"
                height="100%"
                videoId={videoId}
            />
        </View>
    );
}