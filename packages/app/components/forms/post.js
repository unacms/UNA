import { View, Row } from 'app/design/view'
import React from 'react'
//import dynamic from 'next/dynamic'
import { Dimensions } from 'react-native';
import { APP_URL } from 'app/config';

export default function FormPost(props) {
    /*const WebView = React.memo(
        dynamic(() => import('react-native-webview'))
    )*/
    const WebView = React.memo(
        lazy(() => import('react-native-webview'))
    );
    let otherH = Dimensions.get('window').height;
    return <View className='w-full max-w-5xl ' style={{ height: otherH - 120 }}><WebView source={{ uri: APP_URL + '/create-post?empty=true' }} /></View>
}
