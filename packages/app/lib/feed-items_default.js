import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Embed from 'app/ui/molecules/embed'
import React, { memo, useEffect } from 'react'
import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher'
import { Icon } from 'app/ui/atoms/icon';
import { Pressable } from 'app/design/view';
import { ContentMore } from 'app/ui/molecules/contentmore';
import { LinkContent, UnitImages } from 'app/lib/feed-helpers'
import { LAYOUT_BREAKPOINTS, stripTags } from 'app/lib/util'

export const GroupView = memo(({data, styles, url, isCompact}) => {
    const pref = isCompact ? '' : 'md:';
    return (<View className={isCompact ? " flex-row space-x-2 mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1" : " flex-col md:flex-row space-x-2 overflow-hidden rounded-lg bg-bgritem dark:bg-bgritem-d p-1 my-3"}>
        {data.mainImage && (
            <View className={isCompact ? "w-64" : "w-full md:w-1/3 "}>
                <View
                    className="w-full aspect-video"
                    style={styles.card_image}
                >
                    <Image
                        {...data.mainImage}
                        alt={data.title}
                        view="cover"
                        className=" rounded u-cover "
                        sizes={LAYOUT_BREAKPOINTS.md}
                    />
                </View>
            </View>
        )}
        <View className="flex-auto px-2  pb-2 my-auto flex-col">
            <Link href={url} className="">
                <Text
                    numberOfLines={1}
                    className=" text-neutral-600 dark:text-neutral-400 text-xs uppercase tracking-tight overflow-hidden"
                >
                   
                   
                    {data.content.date_start && (
                        <>
                            
                            <Time
                                stylesName="text-xs flex-none"
                                ts={data.content.date_start}
                            ></Time>
                            {data.content.date_end && (
                                <>
                                    {' - '}
                                    <Time
                                        stylesName="text-xs flex-none"
                                        ts={data.content.date_end}
                                    ></Time>
                                </>
                            )}
                        </>
                    )}
                </Text>
                <Text
                    numberOfLines={2}
                    className=" text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-lg sm:text-xl tracking-tight font-bold"
                >
                    {data.content.title}
                </Text>
            </Link>
            <View>
                <View className="flex-col relative">
                    <Text
                        className="text-neutral-800 dark:text-neutral-200 text-base "
                        numberOfLines={3}
                    >
                        {stripTags(data.content.text)}
                    </Text>
                </View>
            </View>
        </View>
    </View>);
});

export const AdView = memo(({data, styles, url, isCompact}) => {

    useEffect(() => {
        (async () => {
            if (data?.content?.register_impression) {
                await fetcher('/api.php?r=' + data.content.register_impression);
            }
        })();
    }, []);

    
    return <View className=" flex-col md:flex-row space-x-2  overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1 my-3">
        {data.mainImage && (
            <View className="w-full md:w-1/3  ">
                <View
                    className="w-full aspect-video   "
                    style={styles.card_image}
                >
                    <Image
                        {...data.mainImage}
                        alt={data.title}
                        view="cover"
                        className=" rounded u-cover "
                        sizes={LAYOUT_BREAKPOINTS.md}
                    />
                </View>
            </View>
        )}
        <View className="flex-auto p-2 my-auto flex-col">
            {data?.content?.register_click ? (
        <Pressable onPress={async () => { await fetcher('/api.php?r=' + data.content.register_click) }}>
            <LinkContent url={url} data={data} />
        </Pressable>
    ) : (
        <LinkContent url={url} data={data} />
    )}
            <View>
                <View className="flex-col relative">
                    <Text
                        className="text-neutral-800 dark:text-neutral-200 pb-4 text-base "
                        numberOfLines={3}
                    >
                        {data.content.text}
                    </Text>
                </View>

            </View>
        </View>
    </View>
})

export const MarketView = memo(({data, styles, url, isCompact}) => {
    return <View className=" flex-col md:flex-row space-x-2  overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
        {data.mainImage && (
            <View className="w-full md:w-1/3  ">
                <View
                    className="w-full aspect-video   "
                    style={styles.card_image}
                >
                    <Image
                        {...data.mainImage}
                        alt={data.title}
                        view="cover"
                        className=" rounded u-cover "
                        sizes={LAYOUT_BREAKPOINTS.md}
                    />
                </View>
            </View>
        )}
        <View className="flex-auto p-2 my-auto flex-col    ">
            <Link href={url} className="">
                <Text className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-white">
                    {data.content.price_recurring > 0 ? data.content.price_recurring + '$/' + data.content.duration_recurring : (data.content.price_single > 0 ? data.content.price_single + '$' : 'Free')}
                </Text>

                <Text
                    numberOfLines={2}
                    className=" text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-lg sm:text-xl tracking-tight font-bold"
                >
                    {data.content.title}
                </Text>
            </Link>
            <View>
                <View className="flex-col relative">
                    <Text
                        className="text-neutral-800 dark:text-neutral-200 pb-4 text-base "
                        numberOfLines={3}
                    >
                        {data.content.text}
                    </Text>
                </View>

            </View>
        </View>
    </View>
})

export const DefaultView = memo(({data, styles, bIsTitle, bIsTimelineContent, content_attach, files_attach, url, isCompact}) => {
    let imgs = content_attach;
   
    return <>
        <View className={isCompact ? "flex-row-reverse" : " flex-col "}>
            {data.mainImage && (
                <View className={isCompact ? " w-48 mb-auto pr-4" : "w-full mt-3"}>
                    <View
                        className="w-full aspect-video    "
                        style={styles.card_image}
                    >
                        <Image
                            {...data.mainImage}
                            alt={data.title}
                            view="cover"
                            className=" u-cover rounded-xl "
                            sizes={LAYOUT_BREAKPOINTS.md}
                        />
                    </View>
                </View>
            )}
            <View className="flex-auto my-auto flex-col py-[8px] ">
                {bIsTitle && (
                    <Link href={url} className="">
                        <Text
                            numberOfLines={3}
                            className="  text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-lg sm:text-xl tracking-tight font-bold"
                        >
                            {data.content.title}
                        </Text>
                    </Link>
                )}
                <View>
                    <View className="flex-col relative ">
                        {bIsTimelineContent && (
                            <View className={' ' + ((data.content.text && content_attach.length > 0) ? ' pb-2 ' : '')}>
                                <ContentMore id={'feed-' + data.id} showLink={data?.content?.images_attach?.length == 0} content={data.content.text ? data.content.text : ''} numberOfLines={3} openSmall={false} textClassName=" text-neutral-800 dark:text-neutral-200 text-base " />
                                {!!data.content.embed && <View className=''><Embed data={data.content.embed} /></View>}
                            </View>
                        )}
                        {!bIsTimelineContent && (
                            <Text
                                className="text-neutral-800 dark:text-neutral-200 text-base"
                                numberOfLines={3}
                            >
                                {stripTags(data.content.text)}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </View>
        {bIsTimelineContent && (

            <UnitImages images={imgs} />

        )}
        {files_attach.map((item, index) => {
            return <Link key={"att" + index} target='_blank' href={item.url}><Row className='gap-x-2 w-full items-center p-3 bg-bgritem dark:bg-bgritem-d rounded-lg mt-1'><Text className="text-sm text-neutral-700 dark:text-neutral-300"><Icon icon="File" className="w-6 h-6" size={24} /></Text><Text className="text-sm text-neutral-700 dark:text-neutral-300">{item.title}</Text></Row></Link>
        })}
    </>
});