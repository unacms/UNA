import { useWindowDimensions } from 'react-native'
import RenderHtml from 'react-native-render-html'
import { colors } from 'app/design/tailwind/theme'
// import { WebView } from 'react-native-webview'


function onElement(element) {
  console.log(element);
}

const domVisitors = {
  onElement: onElement
};

export default function ElementHtml(props) {

    const { width } = useWindowDimensions();

    const tagsStyles = {
      body: {
        whiteSpace: 'normal',
        color: 'gray',//colors.primary['content-dark']
      },
      a: {
        color: 'green'
      }
    };
    return (
        <RenderHtml
          contentWidth={width}
          tagsStyles={tagsStyles}
          source={{html: props.data}}
          //domVisitors={domVisitors}
        />
    );
/*
    return <WebView style={{width:500, height:25, flex:1, borderWidth:1, borderColor:'#ff0000'}}
      originWhitelist={['*']}
      source={{ html: props.data }}
    />
*/
}
