import { useWindowDimensions, useColorScheme, View} from 'react-native'
/*import {
    useHtmlIframeProps,
    HTMLIframe,
    iframeModel
  } from '@native-html/iframe-plugin';*/
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import RenderHtml from 'react-native-render-html'
import { mergeDeep } from '../../lib/util';

/*const IframeRenderer = function IframeRenderer(props) {
    const iframeProps = useHtmlIframeProps(props);
    // Do customize the props here; wrap with your own container...
    return <View className="w-24 bg-red-500"><HTMLIframe {...iframeProps} /></View>;
  };
*/
const renderers = {
    iframe: IframeRenderer
  };
  
  const customHTMLElementModels = {
    iframe: iframeModel
  };

function onElement(element) {
    if (element.parent.children[0] === 'p') {
        element.parent.children[0] = {class: 'firstP'}
    }
    if (element.parent.children[element.parent.children.length-1] === 'p') {
        element.parent.children[element.parent.children.length-1].attribs = {class: 'lastP'}
    }
}

const domVisitors = {
  onElement: onElement
};

export default function ElementHtml(props) {
    let { width } = useWindowDimensions();
    
    const theme = useColorScheme();
    let tagsStyles = {
        body: {
            whiteSpace: 'normal',
            color: '#374151',
            fontSize: 16,
            lineHeight: 24,
            margin: 0,
        },
        a: {
            color: 'red'
        },
        h1:{
            color: '#111827'
        },
        h2:{
            color: '#111827'
        },
        h3:{
            color: '#111827'
        },
        h4:{
            color: '#111827'
        }
    };
    
    const classesStyles = {
        firstP: {
            marginTop: 0,
        },
        lastP:{
            marginBottom: 0, 
        }
    }

    
    if(theme == 'dark'){
        let tagsStylesC = {
            body: {
                color: '#d1d5db',
            },
            
            a: {
                color: 'green'
            },
            h1:{
                color: '#f3f4f6'
            },
            h2:{
                color: '#f3f4f6'
            },
            h3:{
                color: '#f3f4f6'
            },
            h4:{
                color: '#f3f4f6'
            }
        };
        tagsStyles = mergeDeep(tagsStyles, tagsStylesC); 
    }

    if (props.htmlStyles)
        tagsStyles = mergeDeep(tagsStyles, props.htmlStyles);

    let data = props.data;
   
    if (data){
        var pattern = /<p>(\s|(&nbsp))*<\/p>/gmi;
        data = data.replace(pattern,'');
        const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
        data = data.replace(regex, '<iframe  width="'+(width-32)+'" height="auto" src="https://ci.una.io/test3/oembed.php?html=1&a=get_link&l=$1"></iframe>');    
    }

    if (!data)
        return <></>

    return (
        <View className="w-full">
            <RenderHtml
                renderers={renderers}
                WebView={WebView}
                customHTMLElementModels={customHTMLElementModels}
                defaultWebViewProps={
                    {
                        bounces:false,         // IOS Only
                        dataDetectorTypes:'link',
                        scalesPageToFit:true,
                        scrollEnabled:true,
                        automaticallyAdjustContentInsets:true,
                        mediaPlaybackRequiresUserAction:true,
                    
                    }
                }
                renderersProps={{
                    iframe: {
                    scalesPageToFit: true,
                    webViewProps: {
                        /* Any prop you want to pass to iframe WebViews */
                    }
                    }
                }}
                contentWidth={width}
                tagsStyles={tagsStyles}
                classesStyles={classesStyles} 
                source={{html: data}}
                domVisitors={domVisitors}
            />
        </View>
    );
}
