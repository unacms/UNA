import { View } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { linkify2 } from 'app/lib/util'
import Menu from 'app/components/menu';
import React, { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

export default function ElementFeedItem({data}) {
    let tlContent = '';

    tlContent = data.event.content.text;//truncateHTML(data.content.text, 380);
    if (data.event.content.images_attach.length == 0){
        let link = linkify2(data.event.content.text);
        if (link){
            tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
        }
    }

    let content_attach = [];
    if (data.event.content.images_attach && data.event.content.images_attach.length > 0 ) {
        content_attach = content_attach.concat(data.event.content.images_attach);
    }
    if (data.event.content.videos_attach && data.event.content.videos_attach.length > 0 ) {
        content_attach = content_attach.concat(data.event.content.videos_attach);
    }

    function CarouselMemo({ aImg, b }) {
        const computedData = useMemo(() => {
            const Carousel = React.memo(
                dynamic(() => import('app/ui/molecules/carousel'))
            )
            return <Carousel data={aImg} />
        }, [b])
        return computedData
    }

    function UnitImages(images) {

        if (images?.images?.length == 0) 
            return <></>
    
        let aImg = images?.images?.map((obj) => {
            return {
                src: obj.src_orig,
                type: 'image',
            }
        })
    
        return (
            <View className="w-full ">
                <CarouselMemo aImg={aImg} />
            </View>
        )
    }

    return (
    <View className="relative sm:my-0 bg-bgrcard dark:bg-bgrcard-d border-b border-bdr dark:border-bdr-d w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Html data={tlContent} />
        </View>
        <UnitImages images={content_attach} />
        <View className="m-4 flex-row items-center">
            <View className=" flex-row gap-x-8 flex-auto flex-wrap ">
            <Menu {...data.event.menu_actions} displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true}} />
            </View>
        </View>
    </View>
    )
}