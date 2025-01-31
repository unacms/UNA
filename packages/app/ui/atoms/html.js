import { useWindowDimensions, useColorScheme, View } from 'react-native'
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import RenderHtml, {
    HTMLContentModel,
    HTMLElementModel,
} from 'react-native-render-html'
import { mergeDeep } from 'app/lib/util';
import { appSetting, md5, absoluteApiUrl, getDomainFromUrl } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useState } from 'react';
import Video from 'app/ui/atoms/video';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useGlobalSearchParams } from 'expo-router';

const renderers = {
    iframe: IframeRenderer,
    video: (obj1, obj2) => {
        let link = obj1["tnode"].domNode?.attribs?.src ? obj1["tnode"].domNode.attribs.src : obj1["tnode"].domNode.children[0].attribs.src;
        return (
            <View className='w-full aspect-video'>
                <Video src={link} />
            </View>
        );
    },
};

const customHTMLElementModels = {
    iframe: iframeModel,
    video: HTMLElementModel.fromCustomModel({
        tagName: "video",
        mixedUAStyles: {
            alignSelf: "center",
        },
        contentModel: HTMLContentModel.block,
    }),
};

const customHTMLElementModelsCustom =(width, height) =>{ 
    return {
    iframe: iframeModel.extend({
        mixedUAStyles: {
          width: width,
          height: height - 110,
        },
      }),
    video: HTMLElementModel.fromCustomModel({
        tagName: "video",
        mixedUAStyles: {
            alignSelf: "center",
        },
        contentModel: HTMLContentModel.block,
    }),
}};

function onElement(element) {
    if (element?.parent?.children[0].name === 'p') {
        if (element?.parent?.children.length === 1)
            element.parent.children[0].attribs.class = 'firstP lastP';
        else
            element.parent.children[0].attribs.class = 'firstP'
    }
    if (element?.parent?.children[element.parent.children.length - 1].name === 'p' && element.parent.children.length > 1) {
        element.parent.children[element.parent.children.length - 1].attribs.class = 'lastP'
    }

}

const domVisitors = {
    // onElement: onElement
};

function addClassesToP(htmlString) {
    // Regular expression to match <p> tags
    const pTagRegex = /<p\b[^>]*>/g;
    let match;
    let pTags = [];

    // Find all <p> tag matches
    while ((match = pTagRegex.exec(htmlString)) !== null) {
        pTags.push(match.index);
    }

    // Check if there are any <p> tags
    if (pTags.length > 0) {
        // Add class1 to the first <p> tag
        let firstPIndex = pTags[0];
        htmlString = htmlString.slice(0, firstPIndex) + htmlString.slice(firstPIndex).replace('<p', '<p class="firstP"');

        // Add class2 to the last <p> tag if there are multiple <p> tags
        if (pTags.length > 1) {
            let lastPIndex = pTags[pTags.length - 1];
            // Recalculate lastPIndex after modifying the first <p>
            lastPIndex += '<p class="class1"'.length - 2; // Adjust length change due to added class
            htmlString = htmlString.slice(0, lastPIndex) + htmlString.slice(lastPIndex).replace('<p', '<p class="lastP"');
        } else {
            // If only one <p> tag, append class2 to the existing class1
            htmlString = htmlString.replace('class="firstP"', 'class="firstP lastP"');
        }
    }

    return htmlString;
}
/*
const logToReactNative = (message) => {
    window.ReactNativeWebView.postMessage(JSON.stringify({ log: message }));
};

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        logToReactNative(mutation.type);
        logToReactNative(mutation.target.tagName);
    });
    const height = document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
});

document.addEventListener("DOMContentLoaded", () => {

    logToReactNative('DOM loaded');
   observer.observe(document.body, {
    childList: true, 
    subtree: true, 
    attributes: true, 
    characterData: true
});
    logToReactNative('aaa')
     const height = document.body.scrollHeight;
  // window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
});

window.onload = () => {

const height = document.body.scrollHeight;
   window.ReactNativeWebView.postMessage(JSON.stringify({ height }));

       const element = document.querySelector('.b');
  const rect = element.getBoundingClientRect();
                       logToReactNative(rect.width+'----- = '+rect.height);
    observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
});

    
    window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
  };  

logToReactNative('aaa')


    setTimeout(() => {
         const element = document.querySelector('.b');
                       const rect = element.getBoundingClientRect();
                       logToReactNative(rect.width+'setTimeout b.height = '+rect.height);
                    }, 10000);

        document.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', (event) => {
                event.preventDefault();
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'link', 
                    url: anchor.href 
                }));
            });
        });
        true; // Required for injectedJavaScript to work on Android
        */
export default function ElementHtml(props) {
    const glob = useGlobalSearchParams();
    const routerExpo = useRouter();
    const { colors } = Theme();
    const [iframeH, setIframeH] = useState({});
    let { width, height } = useWindowDimensions();
    let customClassName = props.customClassName ? props.customClassName : '';
    let fontSize = 16;
    let lineHeight = 22;
    if (customClassName == 'u-vanilla-html-small') {
        fontSize = 14;
        lineHeight = 18;
    }

    const theme = useColorScheme();
    let tagsStyles = {
        body: {
            whiteSpace: 'normal',
            color: colors.default,
            fontSize: fontSize,
            lineHeight: lineHeight,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,

        },
        a: {
            color: colors.primary,
            textDecorationLine: 'none',
        },
        h1: {
            color: colors.default
        },
        h2: {
            color: colors.default
        },
        h3: {
            color: colors.default
        },
        h4: {
            color: colors.default
        },
        /* p: {
             margin: 2
         },*/
        p: {
            marginTop: 8,
            marginBottom: 8,

        },
        ul: {
            margin: 0,
            padding: 0
        },
        ol: {
            padding: 0
        }
    };

    const classesStyles = {
        firstP: {
            marginTop: 0,
        },
        lastP: {
            marginBottom: 0,

        },
        'bx-menthion-link': {
            color: colors.primary,
            textDecorationLine: 'none',
        },
        'bx-embeded-link': {
            color: colors.default
        },
        'link': {
            color: colors.primary,
            textDecorationLine: 'none',
        }
        , 'bx-embeded': {
            lineHeight: 18,
            fontSize: 14,
        }

    }


    if (props.htmlStyles)
        tagsStyles = mergeDeep(tagsStyles, props.htmlStyles);

    let data = props.data;

    if (data) {
        var pattern = /<p>(\s|(&nbsp))*<\/p>/gmi;
        data = data.replace(pattern, '');
        const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
        data = data.replace(regex, function (match, capture) {
            // Customize the className based on the captured value
            let widthIfr = width - 32
            let heightIfr = widthIfr * 9 / 16 + 4;

            let hash = md5(capture);
            let item = iframeH[hash];
            heightIfr = 120;
            if (item && !capture.includes('youtube.com')) {
                heightIfr = item[0];
            }

            if (item && !capture.includes('oembed.php')) {
                heightIfr = widthIfr * 0.3;
            }

            return (
                '<iframe scrolling="no" width="' + widthIfr + '" height="' + heightIfr + '"  src="' + absoluteApiUrl("embeds") + capture + '&theme=' + theme + '&hash=' + hash + '"></iframe>'
            );
        });
    }

    if (!data)
        return <></>

    const onMessage = (event) => {
        let a = {};
        b = event.nativeEvent.data;
        let data = JSON.parse(event.nativeEvent.data)
        a[data[0]] = [data[1], data[2]];
        //setIframeH({...iframeH, ...a})
    };



    if (data && !props.pureHtml) {
        data = data.replace(/<([a-z]+)(?:\s[^>]*)?>((?:\s|<br\s*\/?>)*)<\/\1>/gi, '');
        data = data.replace('/(<br\s*\/?>\s*){2,}/i', '<br>', data);
    }
    data = data.replace(/<br\s*\/?>\s*$/, '');
    data = addClassesToP(data);

    const onPress = async (event, url, htmlAttribs, target) => {
        const rootUrl = appSetting('config', 'native_app_images_url');// MAY BE NEED TO CHANGE
        const domain = getDomainFromUrl(url);

        if (domain !== '' && domain !== rootUrl) {
            let result = await WebBrowser.openBrowserAsync(url);
        } else {
            routerExpo.push({
                pathname: '/' + glob.name,
                params: { url: '/' + url.replace(rootUrl+'/', '') }
            });
        }
    };

    return (
        <RenderHtml
            renderers={renderers}
            ignoredDomTags={[]}
            WebView={WebView}
            customHTMLElementModels={props.pureHtml? customHTMLElementModelsCustom(width, height) : customHTMLElementModels}
            defaultWebViewProps={
                {
                    bounces: false,         // IOS Only
                    dataDetectorTypes: 'link',
                    scalesPageToFit: true,
                    scrollEnabled: true,
                    automaticallyAdjustContentInsets: true,
                    mediaPlaybackRequiresUserAction: true,

                }
            }
            renderersProps={{
                iframe: {
                    scalesPageToFit: true,
                    webViewProps: {
                        onMessage: onMessage
                    }
                },
                a: {
                    onPress(event, url, htmlAttribs, target) {
                        onPress(event, url, htmlAttribs, target);
                    }
                },
               
            }}
            defaultTextProps={{ selectable: true }} 
            contentWidth={width}
            tagsStyles={tagsStyles}
            classesStyles={classesStyles}
            source={{ html: data }}
            domVisitors={domVisitors}
        />

    );
}
