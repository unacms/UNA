import { appSetting, md5, absoluteApiUrl } from 'app/lib/util'
import { useColorScheme } from 'react-native'; 
import { useEffect, useMemo } from 'react';

export default function ElementHtml(props) {
    const { data: propsData, className, htmlStyles } = props;
    const sClass = `u-vanilla-html font-default ${className}`;
    const scheme = useColorScheme();


    useEffect(() => {
        const handleMessage = (event) => {
            let data = false;
            if (event?.data && typeof event?.data === 'string')
                data = JSON.parse(event?.data)
            if (data){
                const iframe = document.querySelector(`iframe[id="${data[0]}"]`);
                if (iframe) {
                    if (iframe.style.height != `${data[1]}px`){
                        console.log('ifr', data[0], data[1], iframe.style.height);
                    //    iframe.style.height = `${data[1]}px`;
                       
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
        const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
        if (newData){
            newData = newData.replace(regex, (match, capture) => {
                let hash = md5(capture);
                return (
                    `<iframe scrolling="no" id=${hash} height=140 class="w-full max-w-xl h-30 mx-auto " src="${absoluteApiUrl("embeds")}${capture}&theme=${scheme}&hash=${hash}"></iframe>`
                );
            });
            newData = newData.replace(/(((<[^\/(br)>]*>)+[ \n(<br\s*\/*>)]*(<\/[^>]+>)+)+)/g, '');
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