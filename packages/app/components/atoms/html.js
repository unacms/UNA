import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { Platform, PlatformIOSStatic } from 'react-native'
import { WebView } from 'react-native-webview';

export default function ElementHtml(props) {
    if (Platform.OS == 'web'){
        return <div className="u-vanilla-html" dangerouslySetInnerHTML={{__html:props.data}} />
    }
    else{
        return <WebView style={{width:500, height:500, flex:1, borderWidth:1, borderColor:'#ff0000'}}
          originWhitelist={['*']}
          source={{ html: props.data }}
        />
    }
}
