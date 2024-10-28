import { View, Row } from 'app/design/view'
import { memo, useState, useCallback } from "react";
import YoutubePlayer from "react-native-youtube-iframe";

export default function Youtube({ videoId }) {

    return (
        <View className='aspect-video'>
            <YoutubePlayer
            className="absolute inset-0 w-full h-full"
                height="100%"
                videoId={videoId}
            />
        </View>
    );
}