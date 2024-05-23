import { View } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { linkify2 } from 'app/lib/util'
import Menu from 'app/components/menu';
import { useState,  useEffect, useContext } from 'react'
import Carousel from 'app/ui/molecules/carousel'
import { LayoutData } from 'app/context/layout';


export default function ElementFeedItem({data}) {
    const { layoutData, setLayoutData } = useContext(LayoutData);
    const [content, setContent] = useState(data.event.content)

    useEffect(() => {
        if (layoutData && layoutData.type == 'feed_item:content') {
            setContent(layoutData.data.content)
        }
    }, [layoutData]);

    let tlContent = '';

    tlContent = content.text;//truncateHTML(data.content.text, 380);
    if (content.images_attach.length == 0){
        /*let link = linkify2(data.event.content.text);
        if (link){
            tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
        }*/
        if (content.embed){
            tlContent = tlContent + content.embed
        }
    }

    let content_attach = [];
    if (content.images_attach && content.images_attach.length > 0 ) {
        content_attach = content_attach.concat(content.images_attach);
    }
    if (content.videos_attach && content.videos_attach.length > 0 ) {
        content_attach = content_attach.concat(content.videos_attach);
    }

    function UnitImages(images) {

        if (images?.images?.length == 0) 
            return <></>
    
        let aImg = images?.images?.map((obj) => {
            return {
                src: obj.src_orig? obj.src_orig : obj.src,
                width: obj.width,
                height: obj.height,
                type: 'image',
            }
        })
    
        return (
            <View className="w-full px-0.5 sm:px-4">
                <Carousel data={aImg} />
            </View>
        )
    }

    return (
    <View className="relative sm:my-0 bg-bgrcard w-full mx-auto max-w-5xl">             
        <View className="my-4">
            <Html data={tlContent} />
        </View>
        <UnitImages images={content_attach} />
        <View className="my-4 flex-row items-center">
            <View className=" flex-row flex-auto flex-wrap text-wrap ">
                <Menu {...data.event.menu_actions} displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true}} />
            </View>
        </View>
    </View>
    )
}