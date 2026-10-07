import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Embed from 'app/ui/molecules/content/embed'
import { memo, useEffect, useMemo } from 'react'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher'
import { Icon } from 'app/ui/atoms/icon'
import { Pressable } from 'app/design/view'
import { ContentMore } from 'app/ui/molecules/content/content-more'
import { toUnaDisplayImageItem } from 'app/lib/image-helpers'
import { LAYOUT_BREAKPOINTS, stripTags } from 'app/lib/util'
import Carousel from 'app/ui/molecules/content/carousel'
import { PollItem } from 'app/components/elements/entity-poll'
import Html from 'app/ui/atoms/html'
import Video from 'app/ui/atoms/video';
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal'
import { appSetting } from 'app/lib/util'

export const LinkContent = memo(({ url, data }) => (
    <LinkOrModal href={url} showInModal={appSetting('browse', 'show_in_modal', data.type)} className=" ">
        <Text className="mr-auto bg-primary/20 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-secondary-foreground ">
            {data.content?.price
                ? data.content.price.replace('&#36;', '$')
                : 'Free'}
        </Text>
        <Text
            numberOfLines={2}
            className=" text-foreground web:hover:text-primary  text-lg sm:text-xl tracking-tight font-bold"
        >
            {data.content?.title || ''}
        </Text>
    </LinkOrModal>
))

export const UnitImages = memo(({ images }) => {
    const aImg = useMemo(() => {
        if (!images?.length) return []

        const photo = images
            .map((obj) => toUnaDisplayImageItem(obj))
            .filter(Boolean)

        const video = images
            .filter((item) => item.src_poster)
            .map((obj) => ({
                src: obj.src_mp4 || obj.src_mp4_hd,
                poster: obj.src_poster,
                type: 'video',
            }))

        return [...photo, ...video]
    }, [images])

    if (aImg.length === 0) return null // Or <></>

    return (
        <View className="w-full">
            <Carousel data={aImg} />
        </View>
    )
})

export const GroupView = memo(({ data, styles, url, isCompact }) => {
    const pref = isCompact ? '' : 'md:'
    return (
        <View
            className={
                isCompact
                    ? ' flex-row gap-3 2xl:gap-4 mx-4 overflow-hidden rounded-lg bg-muted/50  p-1'
                    : ' flex-col md:flex-row gap-3 2xl:gap-4 overflow-hidden rounded-lg bg-muted/50 p-1.5'
            }
        >
            {data.mainImage && (
                <View className={isCompact ? 'w-64' : 'w-full md:w-1/3 '}>
                    <View
                        className="w-full aspect-video  overflow-hidden rounded "
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
            <View className="flex-auto my-auto flex-col">
               <LinkOrModal href={url} showInModal={appSetting('browse', 'show_in_modal', data.type)} className=" ">
                    <Text
                        numberOfLines={1}
                        className=" text-muted-foreground  text-xs uppercase tracking-tight overflow-hidden"
                    >
                        {data.content?.date_start && (
                            <>
                                <Time
                                    stylesName="text-xs flex-none"
                                    ts={data.content?.date_start}
                                ></Time>
                                {data.content?.date_end && (
                                    <>
                                        {' - '}
                                        <Time
                                            stylesName="text-xs flex-none"
                                            ts={data.content?.date_end}
                                        ></Time>
                                    </>
                                )}
                            </>
                        )}
                    </Text>
                    <Text
                        numberOfLines={2}
                        className=" text-foreground web:hover:text-primary text-lg sm:text-xl tracking-tight font-bold"
                    >
                        {data.content?.title || ''}
                    </Text>
                </LinkOrModal>

                <Text
                    className="text-card-foreground text-base leading-6"
                    numberOfLines={3}
                >
                    {stripTags(data.content?.text || '')}
                </Text>

            </View>
        </View>
    )
})

export const AdView = memo(({ data, styles, url, isCompact }) => {
    useEffect(() => {
        ; (async () => {
            if (data?.content?.register_impression) {
                await fetcher('/api.php?r=' + data.content.register_impression)
            }
        })()
    }, [])

    return (
        <View className=" flex-col md:flex-row space-x-2 overflow-hidden rounded-xl bg-muted/50  p-1">
            {data.mainImage && (
                <View className="w-full md:w-1/3 overflow-hidden rounded-lg">
                    <View
                        className="w-full aspect-video "
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
                    <Pressable
                        onPress={async () => {
                            if (data.content?.register_click) {
                                await fetcher(
                                    '/api.php?r=' + data.content.register_click
                                )
                            }
                        }}
                    >
                        <LinkContent url={url} data={data} />
                    </Pressable>
                ) : (
                    <LinkContent url={url} data={data} />
                )}
                <View>
                    <View>
                        <Text
                            className="text-secondary-foreground  pb-4 text-base leading-6"
                            numberOfLines={3}
                        >
                            {data.content?.text || ''}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
})

export const MarketView = memo(({ data, styles, url, isCompact }) => {
    return (
        <View className=" flex-col md:flex-row space-x-2  overflow-hidden rounded-lg bg-muted/50 p-1">
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
                <LinkOrModal href={url} showInModal={appSetting('browse', 'show_in_modal', data.type)} className=" ">
                    <Text className="mr-auto bg-primary/20 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-white">
                        {(data.content?.price_recurring || 0) > 0
                            ? (data.content?.price_recurring || 0) +
                            '$/' +
                            (data.content?.duration_recurring || '')
                            : (data.content?.price_single || 0) > 0
                                ? (data.content?.price_single || 0) + '$'
                                : 'Free'}
                    </Text>

                    <Text
                        numberOfLines={2}
                        className=" text-foreground web:hover:text-primary  text-lg sm:text-xl tracking-tight font-bold"
                    >
                        {data.content?.title || ''}
                    </Text>
                </LinkOrModal>
                <View>
                    <View>
                        <Text
                            className="text-secondary-foreground  pb-4 text-base leading-6"
                            numberOfLines={3}
                        >
                            {data.content?.text || ''}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
})

export const PostsView = memo(({ data, styles, url, isCompact, content_attach, fulltext }) => {
    const imgs = content_attach
    return (
        <View className={isCompact ? 'flex-row-reverse gap-x-3' : 'w-full gap-y-3'}>
            {data.mainImage && (
                <View className={isCompact ? 'w-28 flex-none' : 'w-full mb-1'}>
                    <View
                        className="w-full aspect-5/2 rounded-lg overflow-hidden"
                        style={styles.card_image}
                    >
                        <Image
                            {...data.mainImage}
                            alt={data.title}
                            view="cover"
                            className="u-cover "
                            sizes={LAYOUT_BREAKPOINTS.md}
                        />
                    </View>
                </View>
            )}
            <View className="flex-auto gap-y-1">
                {data.content?.title && (
                    <LinkOrModal href={url} showInModal={appSetting('browse', 'show_in_modal', data.type)}>
                        <Text
                            numberOfLines={isCompact ? 3 : 2}
                            className="text-card-foreground web:hover:text-foreground text-xl font-bold leading-tight font-title"
                        >
                            {data.content.title}
                        </Text>
                    </LinkOrModal>
                )}
                {data.content?.text ? (
                    fulltext ? (
                        <Html data={data.content.text} />
                    ) : (
                        <ContentMore
                            id={'feed-' + data.id}
                            showLink={!data.mainImage}
                            content={data.content.text}
                            numberOfLines={isCompact ? 2 : 4}
                            numberOfSymbols={400}
                            openSmall={false}
                            showLess={true}
                            customClassName="u-vanilla-html-small"
                        />
                    )
                ) : null}
                {!!data.content?.embed && (
                    <View className="rounded-lg overflow-hidden w-full">
                        <Embed data={typeof data.content.embed !== 'string' ? data.content.embed : { url: data.content.embed }} />
                    </View>
                )}
                {!isCompact && <UnitImages images={imgs} />}
            </View>
        </View>
    )
})

export const DefaultView = memo(
    ({
        data,
        styles,
        bIsTitle,
        bIsTimelineContent,
        content_attach,
        files_attach,
        url,
        isCompact,
        fulltext,
    }) => {
        const imgs = content_attach
        return (

            <View className={isCompact ? 'flex-row-reverse' : ' w-full gap-y-3'}>
                {data.mainImage && (
                    <View
                        className={
                            isCompact
                                ? ' w-48 mb-auto pr-4'
                                : 'w-full mb-3 '
                        }
                    >
                        <View
                            className="w-full aspect-video  rounded-lg overflow-hidden  "
                            style={styles.card_image}
                        >
                            <Image
                                {...data.mainImage}
                                alt={data.title}
                                view="cover"
                                className=" u-cover rounded-lg overflow-hidden"
                                sizes={LAYOUT_BREAKPOINTS.md}
                            />
                        </View>
                    </View>
                )}

                {bIsTitle && (
                    <LinkOrModal href={url} showInModal={appSetting('browse', 'show_in_modal', data.type)} className=" ">
                        <Text
                            numberOfLines={3}
                            className=" text-card-foreground web:hover:text-foreground text-xl font-bold leading-tight font-title tracking-tight"
                        >
                            {data.content?.title || ''}
                        </Text>
                    </LinkOrModal>
                )}

                {bIsTimelineContent && (
                    <View className="max-w-full">
                        {fulltext ? (
                            <Html
                                data={
                                    data.content?.text
                                        ? data.content.text
                                        : ''
                                }
                            />
                        ) : (
                            <ContentMore
                                id={'feed-' + data.id}
                                showLink={
                                    data?.content?.images_attach
                                        ?.length == 0
                                }
                                content={
                                    data.content?.text
                                        ? data.content.text
                                        : ''
                                }
                                numberOfLines={5}
                                numberOfSymbols={600}
                                openSmall={false}
                                showLess={true}
                                customClassName="u-vanilla-html-small"
                            />
                        )}

                    </View>
                )}
                {!bIsTimelineContent && (
                    <Text
                        className="text-secondary-foreground text-sm"
                        numberOfLines={3}
                    >
                        {stripTags(data.content?.text || '')}
                    </Text>
                )}
                {!!data.content?.embed && (
                    <View className="rounded-lg overflow-hidden w-full ">
                        <Embed data={typeof data.content.embed !== 'string' ? data.content.embed : { url: data.content.embed }} />
                    </View>
                )}
                {(data.content?.videos?.length > 0 && data.content?.videos[0]?.src_mp4) && (
                    <View className='w-full aspect-video rounded-lg overflow-hidden'>
                        <Video poster={data.content?.videos[0].src_poster} src={data.content?.videos[0].src_mp4} cover={true} controls={true} muted={"muted"} />
                    </View>
                )}
                {data.content?.polls_attach &&
                    data.content.polls_attach.map((item, index) => {
                        return (
                            <View className="mt-4" key={'att' + index}>
                                <PollItem
                                    results_url="/api.php?r=bx_timeline/get_block_poll_results"
                                    data={item}
                                    showTitle={true}
                                />
                            </View>
                        )
                    })}
                {bIsTimelineContent && <UnitImages images={imgs} />}
                {files_attach.map((item, index) => {
                    return (
                        <Link
                            key={'att' + index}
                            target="_blank"
                            href={item.url}
                        >
                            <Row className="gap-x-2 w-full items-center p-3 bg-muted  rounded-lg mt-1">
                                <Text className="text-sm text-muted-foreground ">
                                    <Icon
                                        icon="File"
                                        className="w-6 h-6"
                                        size={24}
                                    />
                                </Text>
                                <Text className="text-sm text-muted-foreground ">
                                    {item.title}
                                </Text>
                            </Row>
                        </Link>
                    )
                })}
            </View>
        )
    }
)

export const PollView = memo(
    ({
        data,
        styles,
        bIsTitle,
        bIsTimelineContent,
        content_attach,
        files_attach,
        url,
        isCompact,
    }) => {
        return (
            <>
                <View className={isCompact ? 'flex-row-reverse' : ' flex-col '}>
                    {data.mainImage && (
                        <View
                            className={
                                isCompact ? ' w-48 mb-auto pr-4' : 'w-full mt-3'
                            }
                        >
                            <View
                                className="w-full aspect-video    "
                                style={styles.card_image}
                            >
                                <Image
                                    {...data.mainImage}
                                    alt={data.title}
                                    view="cover"
                                    className=" u-cover rounded-lg overflow-hidden"
                                    sizes={LAYOUT_BREAKPOINTS.md}
                                />
                            </View>
                        </View>
                    )}
                    {bIsTitle && (
                        <Link href={url} className="mb-3">
                            <Text
                                numberOfLines={3}
                                className="  text-secondary-foreground web:hover:text-foreground text-lg tracking-tight font-bold"
                            >
                                {data.content?.title || ''}
                            </Text>
                        </Link>
                    )}
                    <PollItem data={data.content} />
                </View>
            </>
        )
    }
)
