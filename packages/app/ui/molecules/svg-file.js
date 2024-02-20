import { View } from 'app/design/view'
import React from 'react'
import dynamic from 'next/dynamic'
import { APP_URL } from 'app/config';

export default function (props) {
    const WebView = React.memo(
        dynamic(() => import('react-native-webview'))
    )
    return <View className='w-full h-full'><WebView source={{ uri: APP_URL + '/' + props.src }} /></View>
}
