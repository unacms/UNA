import { appSetting, md5, absoluteApiUrl } from 'app/lib/util'
import { useColorScheme } from 'react-native'; 
import { useEffect, useMemo } from 'react';

export default function ElementHtml(props) {
    const { data: propsData, className, htmlStyles } = props;
    const sCustomClass = props.customClassName ? props.customClassName : 'u-vanilla-html'
    const sClass = `${sCustomClass} font-default ${className}`;
    const scheme = useColorScheme();


    function removeNestedATags(html) {
        let regex = /<a [^>]*>[^<]*<a [^>]*>(.*?)<\/a>/g;
    
        // Function to replace only the innermost <a> tags
        function replaceInnermostATags(match) {
            // Remove the innermost <a> tag but leave the content
            return match.replace(/<a [^>]*>(.*?)<\/a>/, '$1');
        }
    
        // Keep replacing while there are nested <a> tags
        while (regex.test(html)) {
            html = html.replace(regex, replaceInnermostATags);
        }
    
        return html;
    }

    useEffect(() => {
        const handleMessage = (event) => {
            let data = false;
            if (event?.data && typeof event?.data === 'string')
                data = JSON.parse(event?.data)
            if (data){
                const iframe = document.querySelector(`iframe[id="${data[0]}"]`);
                if (iframe) {
                    if (iframe.style.height != `${data[1]}px`){
                       // console.log('ifr', data[0], data[1], iframe.style.height);
                       iframe.style.height = `${data[1]}px`;
                       
                    }
                }
            }
        };

        window.addEventListener("message", handleMessage, false);

        // Cleanup function
        return () => {
            window.removeEventListener("message", handleMessage, false);
        };
    }, []);

    const data = useMemo(() => {
        let newData = propsData;
        if (newData){
            newData = newData.replace(/<a(.*?)class="bx-mention-link(.*?)"[^>]*><\/a>/g, '');
            newData = removeNestedATags(newData);

        }
        
        if (newData){
            const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
            newData = newData.replace(regex, (match, capture) => {
                let hash = md5(capture);
                return (
                    `<iframe scrolling="no" id=${hash} height=140 class="w-full h-30 mx-auto " src="${absoluteApiUrl("embeds")}${capture}&theme=${scheme}&hash=${hash}"></iframe>`
                );
            });
            newData = newData.replace(/<([a-z]+)(?:\s[^>]*)?>((?:\s|<br\s*\/?>)*)<\/\1>/gi, '');
            newData = newData.replace('/(<br\s*\/?>\s*){2,}/i', '<br>', newData);
        }
        return newData;
    }, [propsData, scheme]);

    return (
        <div>
            <div className={sClass} dangerouslySetInnerHTML={{__html:data}} style={htmlStyles}/>
        </div>
    );
}