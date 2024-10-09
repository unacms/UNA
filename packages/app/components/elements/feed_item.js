import { View } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import Menu from 'app/components/menu';
import { useState, useEffect, useMemo } from 'react'
import Carousel from 'app/ui/molecules/carousel'
import { useLayoutData } from 'app/context/layout';
import Embed from 'app/ui/molecules/embed'
import { storageSet, getDataFromCache  } from 'app/lib/util';
import { Platform } from 'react-native'

export default function ElementFeedItem({ data }) {
    const { layoutData } = useLayoutData();
    const [content, setContent] = useState(data.event.content)
    const isWeb = Platform.OS == 'web' ? true : false;
    useEffect(() => {
        if (layoutData && layoutData.type == 'feed_item:content') {
            setContent(layoutData.data.content)
        }
    }, [layoutData]);

    if (isWeb){
        const sKey = 'feed_' + data.event.id;
        const dataCache = getDataFromCache('li:data', sKey)
        if (dataCache){
            dataCache.ts = -1;
        }
        storageSet('li:data', sKey, dataCache)
    }

    let tlContent = '';

    tlContent = content.text;//truncateHTML(data.content.text, 380);
    if (content.images_attach.length == 0) {
        /*let link = linkify2(data.event.content.text);
        if (link){
            tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
        }*/
       /* if (content.embed) {
            tlContent = tlContent + content.embed
        }*/
    }

    let content_attach = [];
    if (content.images_attach && content.images_attach.length > 0) {
        content_attach = content_attach.concat(content.images_attach);
    }
    if (content.videos_attach && content.videos_attach.length > 0) {
        content_attach = content_attach.concat(content.videos_attach);
    }

    function UnitImages(images) {

        const aImg = useMemo(() => {
            if (!images?.images || images?.images?.length === 0) return [];
    
            let photo = images.images.filter(item => item.src).map((obj) => ({
                src: obj.src_orig ? obj.src_orig : obj.src,
                width: obj.width,
                height: obj.height,
                type: 'image',
            }));
    
            let video = images.images.filter(item => item.src_poster).map((obj) => ({
                src: obj.src_poster ? obj.src_poster : obj.src_poster,
                type: 'video',
            }));
            return [...photo, ...video]
        }, [images]);

        return (
            
                <Carousel data={aImg} />
            
        )
    }

    return (
        <View className="relative sm:my-0 w-full mx-auto max-w-5xl">
            <View className="my-4">
                <Html data={tlContent} />
                {!!content.embed && <Embed data={content.embed}/>}
            </View>
            <UnitImages images={content_attach} />
            {
                data.event.menu_actions.items.length > 0 && (<View className=" flex-row items-center">
                    <View className=" flex-row flex-auto flex-wrap text-wrap ">
                        <Menu {...data.event.menu_actions} displayType="element" showMatched={true} params={{ show_action: true, show_counter: true, show_combined: true }} />
                    </View>
                </View>)
            }
        </View>
    )
}