import Image from '../../ui/atoms/image'
import Link from '../../ui/atoms/link'
import Time from '../../ui/atoms/time'
import Profile from '../../ui/molecules/profile'
import { useState, useMemo } from 'react'
import { useCurrentUser } from 'app/context/user'
import Html from '../../ui/atoms/html'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { StyleSheet } from 'react-native'
import { Platform, Image as ImageNative } from 'react-native'
import { Button } from 'app/design/controls'
import Menu from '../menu'
import { truncateHTML, stripTags, menuItemsByName, FeedbackHaptics, appSetting, linkify2 } from 'app/lib/util'
import dynamic from 'next/dynamic'
import React from 'react'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from '../../lib/fetcher';
import Form from 'app/components/elements/form';
import useSWR from "swr";
import {componentsMap} from  'app/ui/molecules/_map';


function DefaultUnit(data) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({view: ''});
    const [postData, setPostData] = useState(null);
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')

    if (data.sFirstImg) {
        ImageNative.getSize(data.sFirstImg, (width, height) => {
            if (width > height) setImageAspect('aspect-video')
        })
    }

    let styles = StyleSheet.create({})

    if (Platform.OS != 'web') {
        styles = StyleSheet.create({
            card_image: {
                borderRadius: 0,
            },
        })
    }

    let url = '/' + data.url
    let bIsTimelineContent = data?.type?.includes('timeline') ? true : false
    let bIsGroupContent = (data.type == "bx_groups" || data.type == "bx_events") && data.action == "added";

    let bIsTitle = data?.content?.title && data?.content?.title?.trim() != ''
    let sShort = truncateHTML(data.content.text, 380)
    let sLong = truncateHTML(data.content.text, 10000000)

    let bIsLong =
        data?.content?.text && stripTags(sShort.trim()) != stripTags(sLong.trim())

        //TODO EDIT TIMELINE
    let { data: dynamicData, error } = useSWR(
            postData ? ['/api.php?r=bx_timeline/get_edit_form/&params[]=' + data.id, '', postData] : null,
            fetcher,
            !true ? undefined : {
                revalidateIfStale: false,
                revalidateOnFocus: false,
                revalidateOnReconnect: false
            }
    );
        
    if (dynamicData?.data?.item){
        data = dynamicData.data.item
    }

    const onFormSubmit = (formData, d) => {
        setViewState({view: ''});
        setPostData(formData);
    }

    const handleMenuManageSelect = async (oItem, event) => {
        switch(oItem.name) {
            case 'item-edit':
                const result1 = await fetcher('/api.php?r=bx_timeline/get_edit_form/&params[]=' + data.id);
                setViewState({view: 'edited', data:result1.data.form});
                break;

            case 'item-delete':
                const result = await fetcher('/api.php?r=bx_timeline/delete/&params[]=' + data.id);    
                setViewState({view: 'deleted'});
                break;
        }
    }

    const ItemInfo = ({data}) => {

        let l = (appSetting('lang_keys', 'feed_type_' + data.type) ? appSetting('lang_keys', 'feed_type_' + data.type) : '') + ' ' + (appSetting('lang_keys', 'feed_action_' + data.action) ? appSetting('lang_keys', 'feed_action_' + data.action) : '');
        if (l != ' ')
            return <View className='ml-1'><Text className="text-neutral-600 dark:text-neutral-400 text-sm">·  {l}</Text></View>;
            
        return <></>
    }

    const aMenuManageItems = !!currentUser ? data?.menu_manage && menuItemsByName(data.menu_manage?.object, data.menu_manage?.items).map((aItem) => {
        return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: aItem.title
        };
    }) : [];

    if (viewState.view == 'deleted')
        return (<></>);

    
    let tlContent = '';
    if (bIsTimelineContent){
        tlContent = data.content.text;//truncateHTML(data.content.text, 380);
        if (data.content.images_attach.length == 0){
            let link = linkify2(data.content.text);
            if (link){
                tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
            }
        }
    }
    return (
        <View className="max-w-5xl w-full mx-auto ">
            <View className="mt-2 sm:mx-4 sm:mt-4 group duration-200 overflow-hidden sm:rounded-lg    
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    hover:shadow-sm active:shadow-none 
                    active:translate-y-0.5 border-y sm:border
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive"
            >
            <View className="flex-auto flex-row items-top p-4">
                <Profile
                    {...data.author_data}
                    showLink={true}
                    displayType="unit"
                    displaySize="base"
                    showInfo={
                        <Row className='items-center'>
                            <Link href={url}>
                                <Time className="" ts={data.date}></Time>
                            </Link>
                            <ItemInfo data={data}/>
                        </Row>
                    }
                />
                <View className="flex-auto    justify-end flex-row gap-x-2 my-auto">
                    {data.author_actions.map((item, index) => {
                        const Element = componentsMap[item.type];
                        if(!Element)
                            return;

                        return (
                            <Element key={`action-${index}`} {...item} />
                        ); 
                    })}
                    {aMenuManageItems?.length > 0 && 
                        <DropdownMenu items={aMenuManageItems} onSelect={handleMenuManageSelect}>
                            <Button id="mm-button" variant="outline" size="sm" rounded startDecorator="DotsThreeOutline" onPress={() => {FeedbackHaptics('Medium');}} />
                        </DropdownMenu>
                    }
                </View>
            </View>

            <View className="flex-col ">
                {viewState.view == 'edited' && (
                    <View className='w-full'>
                        <Form {...viewState.data} classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"    onFormSubmit={onFormSubmit} />
                        <View className='mx-4  mb-4'><Button title="Cancel" fullWidth size ="base" startDecorator="X" variant="outline"    onPress={() =>    setViewState({view: ''})}  /></View>
                    </View>
                )}

                { bIsGroupContent && (
                    <View className=" flex-col md:flex-row mx-0.5 sm:mx-4 overflow-hidden rounded-lg bg-backgrounditem dark:bg-backgrounditem-dark p-1">
                        {data.mainImage && (
                            <View className="w-full md:w-1/3  ">
                                <View className="w-full aspect-video   " style={styles.card_image}>
                                    <Image
                                        {...data.mainImage}
                                        alt={data.title}
                                        view="cover"
                                        className=" rounded u-cover "
                                        sizes="(max-width:768px) 100vw, 500px"
                                    />
                                </View>
                            </View>
                        )}
                        <View className="flex-auto p-2 md:p-4  flex-col    ">
                            <Link href={url} className="">
                                <Text numberOfLines={1} className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase  tracking-tight" >
                                    { data.content.visibility != '3' ? <>PRIVATE</> : <>PUBLIC</> }
                                    { data.content.members > -1 && <> · {data.content.members} MEMBERS </> }
                                    { data.content.date_start && <> · <Time stylesName="text-xs flex-none" ts={data.content.date_start}></Time> 
                                        {data.content.date_end && <>- <Time stylesName="text-xs flex-none" ts={data.content.date_end}></Time></>}
                                        </>
                                    }
                                </Text>
                                <Text numberOfLines={2} className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-dark text-xl tracking-tight font-bold">
                                    {data.content.title}
                                </Text>
                            </Link>
                            {!showFull ? (
                                <View>
                                    <View className="flex-col gap-y-3 relative">
                                        
                                        
                                            <Text
                                                className="text-neutral-950 dark:text-neutral-50  text-sm "
                                                numberOfLines={2}
                                            >
                                                {data.content.text}
                                            </Text>
                                        
                                    </View>
                                    {!!data.sFirstImg && (
                                        <View
                                            className={
                                                imageAspect + ' w-full rounded mt-4 overflow-hidden'
                                            }
                                        >
                                            <Image
                                                src={data.sFirstImg}
                                                alt={data.title}
                                                view="cover"
                                            />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View className="flex-col relative">
                                    <Html data={data.content.text} />
                                </View>
                            )}
                        </View>
                    </View>
                    ) 
                }

                 {(viewState.view != 'edited') && (
                    <>
                        {(!bIsGroupContent) && (
                            <><View className="  flex-col md:flex-row-reverse ">
                            {data.mainImage && (
                                <View className="w-full px-0.5 sm:px-4 md:w-1/3 mb-3  md:mb-auto md:pr-4 ">
                                    <View className="w-full aspect-video    " style={styles.card_image}>
                                        <Image
                                            {...data.mainImage}
                                            alt={data.title}
                                            view="cover"
                                            className=" u-cover rounded"
                                            sizes="(max-width:768px) 100vw, 500px"
                                        />
                                    </View>
                                </View>
                            )}
                            <View className="flex-auto px-4    flex-col    ">
                                {bIsTitle && (
                                    <Link href={url} className="">
                                        <Text
                                            numberOfLines={2}
                                            className=" duration-200 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-dark text-xl tracking-tight font-bold"
                                        >
                                            {data.content.title}
                                        </Text>
                                    </Link>
                                )}
                                {!showFull ? (
                                    <View>
                                        <View className="flex-col gap-y-3 relative">
                                            
                                            {bIsTimelineContent && (
                                                <View>
                                                    <HtmlMemo tlContent={tlContent} />
                                                    {data.showMore && !showFull && bIsLong && (
                                                        <View className=" items-start w-full border-b py-2 border-bordercolor dark:border-bordercolor-dark ">
                                                            <Button
                                                                title="More"
                                                                onPress={(e) => {
                                                                    setShowFull(true)
                                                                    e.preventDefault()
                                                                }}
                                                                startDecorator="ArrowFatLineDown"
                                                                size="xs"
                                                                solid
                                                                rounded
                                                                variant="outline"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                            {!bIsTimelineContent && (
                                                <Text
                                                    className="text-neutral-950 dark:text-neutral-50 pt-2 text-sm sm:text-base"
                                                    numberOfLines={3}
                                                >
                                                    {data.content.text}
                                                </Text>
                                            )}
                                        </View>
                                        {!!data.sFirstImg && (
                                            <View
                                                className={
                                                    imageAspect + ' w-full rounded mt-4 overflow-hidden'
                                                }
                                            >
                                                <Image
                                                    src={data.sFirstImg}
                                                    alt={data.title}
                                                    view="cover"
                                                />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="flex-col relative">
                                        <Html data={data.content.text} />
                                    </View>
                                )}
                            </View>
                        </View>
                        {bIsTimelineContent && (
                            <View className="">
                                <UnitImages images={data.content.images_attach} />
                            </View>
                        )}</>
                        )}
                        <View className="flex-col    relative px-0 pb-4 mt-4">
                            <View className=" flex-row    px-4 flex-auto">
                                <Menu
                                    {...data.menu_actions}
                                    displayType="button"
                                    params={{
                                        show_action: true,
                                        show_counter: true,
                                        show_combined: true,
                                    }}
                                />
                            </View>
                        </View>
                    </>)}
                </View>
            </View>
        </View>
    )
}

function SmallUnit(data) {
    let url = '/' + data.url

    return (
        <Link href={url} className="w-full" emulate={true}>
            <View className=" flex-row p-2 sm:p-3 sm:mx-4 sm:mt-2 group duration-200 overflow-hidden sm:rounded-lg     
                bg-backgroundcard dark:bg-backgroundcard-dark 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive
                mt-[1px] 
                active:translate-y-0.5
                border-bordercolorcard dark:border-bordercolorcard-dark 
                sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover" >
                <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                    <Profile
                        {...data.author_data}
                        displayType="unit_wo_info"
                        displaySize="lg"
                    />
                </View>
                <View className="flex-auto flex-col my-auto ">
                    <View className="flex-row gap-2">
                        <Text className="text-sm flex-auto    font-semibold text-neutral-800 dark:text-neutral-200">
                            {data.author_data.display_name}
                        </Text>
                        <Time className="text-sm flex-none" ts={data.date}></Time>
                    </View>
                    <Text className="flex-auto text-lg font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50" numberOfLines={1}>
                        {data.content.title}
                    </Text>
                    <View className="flex-row    w-full items-end content-end">
                        <Text className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50" numberOfLines={1}>
                            {data.plainText}
                        </Text>
                        <View className="flex-none bg-primary dark:bg-primary-dark rounded-full    my-auto h-min px-1.5">
                            {data.cmts.count > 0 && (
                                <Text className="text-xs text-white dark:text-black font-medium">
                                    {data.cmts.count}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Link>
    )
}

function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = React.memo(
            dynamic(() => import('../../ui/molecules/carousel'))
        )
        return <Carousel data={aImg} />
    }, [b])
    return computedData
}

function HtmlMemo({ tlContent }) {
    const computedData = useMemo(() => {
        return <Html data={tlContent} />
    }, [])
    return computedData
}

function UnitImages(images) {
    if (images?.images.length == 0) return <></>

    let aImg = images?.images.map((obj) => {
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

export default function UnitFeed(props) {
    let data = props.data

    data.mainImage = null
    if (data?.content?.images)
        data.mainImage =
            data.content.images.length > 0 ? data.content.images[0] : null

    data.comments = null
    if (data?.cmts?.data?.length > 0) {
        data.comments = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data
    }

    /* data.sFirstImg = '';
                let sImages = [];
                
                const regex = /<img.*?src=['"](.*?)['"]/g;

                let match;
                while (match = regex.exec('<div>' + data.content.text + '</div>')) {
                        sImages.push(match[1]);
                }
                if (sImages.length > 0){
                        data.sFirstImg = sImages[0]
                }

                data.showMore = false;
                data.plainTextFull = '';
                data.plainText = '';

                if (data.content.text){
                        data.plainTextFull = stripTags(data.content.text);
                        data.plainText = data.plainTextFull.substr(0,200);
                        
                        if (data.plainText != data.plainTextFull || sImages.length > 1){
                                data.showMore = true;
                        }
                }
*/
    data.showMore = true
    let unit = props.mode == '' ? DefaultUnit(data) : SmallUnit(data)

    return <>{unit}</>
}
