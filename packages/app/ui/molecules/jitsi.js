import { env } from 'app/lib/env';
import { View } from 'app/design/view'
import React from 'react'
import dynamic from 'next/dynamic'

export default function (props) {
    const WebView = React.memo(
        dynamic(() => import('react-native-webview'))
    )
    let u =  env('API_PROXY_URL').replace('/api', '/');
    console.log(u + 'jitsi')
    return <View className='w-full h-full'><WebView source={{ uri: u + 'jitsi' }} /></View>
}
