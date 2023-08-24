import { env } from 'app/lib/env';
import { View, Row } from 'app/design/view'
import React from 'react'

export default function FormPost(props) {
    const WebView = React.memo(
        dynamic(() => import('react-native-webview'))
    )
    let otherH = Dimensions.get('window').height;
    let u =  env('API_PROXY_URL').replace('/api', '/');
    return <View className='w-full max-w-5xl ' style={{height:otherH - 150}}><WebView source={{ uri: u + 'create-post?empty=true' }} /></View>
}
