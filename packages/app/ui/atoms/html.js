import React, { useState, useEffect } from 'react';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useWindowDimensions } from 'react-native';
import WebView from 'react-native-webview';
import { appSetting, md5, absoluteApiUrl, getDomainFromUrl } from 'app/lib/util';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { Theme } from 'app/design/theme';

const calculateEstimatedHeight = (htmlContent, fontSize, width, lineHeight) => {
    let additionalLines = 0;

    // Увеличьте высоту для каждого заголовка
    additionalLines += (htmlContent.match(/<h[1-6]>/g) || []).length * 2; // +2 строки на заголовок

    // Увеличьте высоту для списков
    additionalLines += (htmlContent.match(/<ul>|<ol>/g) || []).length * 3; // +3 строки на список

    const averageCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor((width - 24) / averageCharWidth);
    const totalLines = Math.ceil(htmlContent.length / charsPerLine);

    return (totalLines + additionalLines) * lineHeight/2.5 ; // 20px — запас
};

export default function ElementHtml(props) {
    let fontSize = 16;
    let lineHeight = 20;
    if (customClassName == 'u-vanilla-html-small') {
        fontSize = 14;
        lineHeight = 18;
    }

    const rootUrl = appSetting('config', 'native_app_images_url');
    const glob = useGlobalSearchParams();
    const routerExpo = useRouter();
    const htmlContent = props.data;
    const { width, height } = useWindowDimensions();

    
    const [webViewHeight, setWebViewHeight] = useState(calculateEstimatedHeight(htmlContent, fontSize, width, lineHeight));
    const { colors } = Theme();
    let customClassName = props.customClassName ? props.customClassName : '';
   
    
    const styles = `
    body {
       background-color: transparent;
        white-space: normal;
        color: ${colors.default};
        font-size: ${fontSize}px;
        line-height: ${lineHeight}px;
        margin: 0;
        padding: 0;
    }

    a {
        color: ${colors.primary};
        text-decoration: none;
    }

    h1, h2, h3, h4 {
        color: ${colors.default};
    }

    p {
        margin-top: 5px;
        margin-bottom: 5px;
    }

    ul, ol {
        margin: 0;
        padding: 0;
    }

    p.firstP {
        margin-top: 0;
    }

    p.lastP {
        margin-bottom: 0;
    }

    .bx-menthion-link {
        color: ${colors.primary};
        text-decoration: none;
    }

    .bx-embeded-link {
        color: ${colors.default};
    }

    .link {
        color: ${colors.primary};
        text-decoration: none;
    }

    .bx-embeded {
        line-height: 18px;
        font-size: 14px;
    }
`;
    const onMessage = async (event) => {

        // set window height
        const message = JSON.parse(event.nativeEvent.data);

        if (message.height) {
            setWebViewHeight(message.height);
        }
        // process links
        if (message.type === 'link') {
            const url = message.url;
            const domain = getDomainFromUrl(url);
            if (domain && domain !== rootUrl) {
                await WebBrowser.openBrowserAsync(url);
            } else {
                routerExpo.push({
                    pathname: '/' + glob.name,
                    params: { url: url.replace(`${rootUrl}/`, '') },
                });
            }
        }
    };

    const injectedJavaScript = `
        const logToReactNative = (message) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ log: message }));
        };

        setTimeout(() => {
            const height = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
        }, 100);

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
    `;
    if (!htmlContent) return null;

    return (
        <WebView
            originWhitelist={['*']}
            source={{
                html: `<!DOCTYPE html >
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${styles}</style>
        </head>
        <html style="width:${width - 24}px">
        <body style="width:${width - 24}px">
        ${htmlContent}
        </body>
        </html>` }}

            onMessage={onMessage}
            style={{ height: webViewHeight + 4, backgroundColor: 'transparent' }}
            injectedJavaScript={injectedJavaScript}

            javaScriptEnabled={true}
            mixedContentMode="compatibility"
            domStorageEnabled={true}
            javaScriptEnabledAndroid={true}
            scalesPageToFit={true}
            scrollEnabled={false}
            automaticallyAdjustContentInsets={true}
            mediaPlaybackRequiresUserAction={true}
            startInLoadingState={false}


        />
    );
}