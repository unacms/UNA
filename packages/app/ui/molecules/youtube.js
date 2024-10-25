import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { memo, useState, useCallback } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import YoutubePlayer from "react-native-youtube-iframe";
import { Button } from 'app/design/controls';



export default function Youtube({ videoId }) {
    const [playing, setPlaying] = useState(false);
//TODO square aspect ratio

    return (
        <View>
            <YoutubePlayer

                height={300}

                videoId={videoId}

            />

        </View>
    );
}