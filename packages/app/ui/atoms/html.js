import { useWindowDimensions, useColorScheme, View} from 'react-native'
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import RenderHtml from 'react-native-render-html'
import { mergeDeep } from '../../lib/util';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';

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
    const { colors } = Theme();
    let { width } = useWindowDimensions();
    
    const theme = useColorScheme();
    let tagsStyles = {
        body: {
            whiteSpace: 'normal',
            color: colors.default,
            fontSize: 16,
            lineHeight: 23,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop:0
        },
        a: {
            color: colors.primary
        },
        h1:{
            color: colors.default
        },
        h2:{
            color: colors.default
        },
        h3:{
            color: colors.default
        },
        h4:{
            color: colors.default
        }
    };
    
    const classesStyles = {
        firstP: {
            marginTop: 0,
            color: 'red'
        },
        lastP:{
            marginBottom: 0, 
        }
    }

    
    if(theme == 'dark'){
        let tagsStylesC = {
            body: {
                color: colors.default
            },
            p:{
                marginTop: 0,
            },
            a: {
                color: colors.primary
            },
            h1:{
                color: colors.default
            },
            h2:{
                color: colors.default
            },
            h3:{
                color: colors.default
            },
            h4:{
                color: colors.default
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
        //data = data.replace(regex, '<iframe  width="'+(width-32)+'" height="auto" src="https://ci.una.io/test3/oembed.php?html=1&a=get_link&l=$1"></iframe>');  
        data = data.replace(regex, function (match, capture) {
            // Customize the className based on the captured value
            let widthIfr = width-32
            let heightIfr = widthIfr * 9/16 + 80;
            if (capture.includes('twitter.com') ) {
                heightIfr = widthIfr * 1.6;
            }
            if (capture.includes('youtube.com') ) {
                heightIfr = widthIfr * 9/16 + 40;
            }
            return (
                '<iframe scrolling="no" width="'+widthIfr+'" height="'+heightIfr+'"  src="' + appSetting("urls", "embeds") + capture + '&theme=' + theme + '"></iframe>'
              );
            });  
    }

    if (!data)
        return <></>

    return (
        
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
      
    );
}
