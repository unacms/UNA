import { useState, useContext, useRef } from 'react'
import CardDataContext from 'app/context/card'
import { CardData } from 'app/context/card'
import Image from '../../ui/atoms/image'
import Link from '../../ui/atoms/link'
import Profile from '../../ui/molecules/profile'
import { getImageSizes, FeedbackHaptics } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Menu from 'app/components/menu'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import Time from '../../ui/atoms/time'
import { Button, Modal } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect';
import {componentsMap} from  'app/ui/molecules/_map';

export default function Unit(props) {
    function channelUnit() {
        let sMeta = <></>
        if (data?.meta)
        sMeta = (
            <View className="pb-2">
                <Menu
                    {...data.meta}
                    displayType="mixed"
                    params={{ showVertical: true }}
                />
            </View>
        )

        return (
                <Card margin=" mb-2 sm:mx-2 " rounded=" rounded-2xl ">
                    <View className="flex-col gap-y-4 ">
                        <Link className="" href={data.url}>
                            <View className="flex-col w-full ">
                                <View className=" w-full p-1 aspect-video ">
                                    <View className="w-full aspect-square mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                                        {data.cover && ( <Image
                                                {...data.cover}
                                                alt={data.title}
                                                view="cover"
                                                className="absolute u-cover"
                                                sizes={imageSizes}
                                            />
                                        )}
                                    </View>
                                </View>
                                <View className="flex-col flex-auto gap-y-2 p-4  ">
                                    <View className=" flex-row flex-wrap gap-x-2 gap-y-2   ">
                                        {data?.date_start && (
                                            <Text  className=" bg-bgritem dark:bg-bgritem-d rounded-lg  px-2 py-1 flex-none flex-auto text-neutral-600 dark:text-neutral-400">
                                                {data.date_start && (
                                                    <>
                                                        <Time stylesName="text-sm flex-none" ts={data.date_start}></Time>
                                                        {data.date_end && (<> 
                                                                <Text className="text-sm flex-none"> - </Text>
                                                                <Time stylesName="text-sm flex-none" ts={data.date_end} ></Time>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </Text>
                                        )}
                                        <Text  className="my-auto text-sm flex-auto font-semibold text-neutral-600 dark:text-neutral-400">{data.visibility != '3' ? <>Private</> : <>Public</>}</Text>
                                    </View>
                                    <View className=" sm:h-12  ">
                                        <Text numberOfLines={2} className=" tracking-tight leading-tight text-base font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d ">
                                            {data.title}
                                        </Text>
                                    </View>
                                    <Text className=" flex-none text-neutral-600 dark:text-neutral-400">
                                        {data.members_count} members
                                    </Text>
                                    <View className="flex-row w-full gap-x-2 ">                
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            title="Join"
                                            className=" my-auto "
                                            fullWidth={true}
                                        />                  
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            
                                            className=" my-auto "
                                            startDecorator="DotsThreeOutline"
                                            
                                        />
                                    </View>
                                </View>
                            </View>
                        </Link>
                        {data?.meta && (
                            <View className="px-4 pb-4 mt-auto ">
                                <Menu
                                    {...data.meta}
                                    displayType="mixed"
                                    params={{
                                        showVertical: true,
                                        button_size: 'base',
                                        button_full_width: true,
                                        button_rounded: false,
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </Card>
        )
    }

    function eventUnit() {
        const redirectdRef = useRef();
        const [ popupVisible, setPopupVisible ] = useState(false);

        const handleClick = (event, sUrl) => {
            event.preventDefault();

            redirectdRef.current.redirect(sUrl)
        }

        const handleClickMore = (event) => {
            event.preventDefault();

            FeedbackHaptics('Medium');
            setPopupVisible(true); 
        }

        let oMenuItemPrimary = undefined;
        let oMenuItemsMore = undefined;
        if( data?.meta) {
            //--- Primary button
            const sPrimary = 'join';
            oMenuItemPrimary = data.meta.items.filter((aItem) => aItem.name == sPrimary).shift();
            if(!oMenuItemPrimary) {
                oMenuItemPrimary = {
                    title: 'View',
                    onPress: (event) => {
                        handleClick(event, data.url);
                    }
                };
            }

            if(oMenuItemPrimary?.data && oMenuItemPrimary.data?.type) {
                const Element = componentsMap[oMenuItemPrimary.data.type];
                if(!!Element) {
                    const oElementParams = {...oMenuItemPrimary.data, ...{primary: true, params: {button_rounded: false, button_full_width: true, on_done: (sAction, oData) => {
                        //--- Do something after the primary action was performed.
                    }}}};

                    oMenuItemPrimary = (
                        <Element key={oMenuItemPrimary.id ? oMenuItemPrimary.id : oMenuItemPrimary.name} {...oElementParams} />
                    );
                }
            }
            else
                oMenuItemPrimary = (
                    <Button
                        variant="primary"
                        size="sm"
                        title={oMenuItemPrimary.title}
                        className=" my-auto "
                        startDecorator={oMenuItemPrimary?.icon ? oMenuItemPrimary.icon : false}
                        fullWidth={true}
                        onPress={oMenuItemPrimary?.onPress}
                    />
                );

            //--- More menu
            oMenuItemsMore = {...data.meta, ...{
                items: data.meta.items.filter((aItem) => aItem.name != sPrimary),
                params: {
                    showVertical: true,
                    button_size: 'base',
                    button_full_width: true,
                    button_rounded: false,
                    on_do: (sAction) => {
                        setPopupVisible(false);
                    }
                }
            }};
        }

        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card margin=" mb-2 sm:mx-2 " rounded=" rounded-2xl ">
                    <View className="flex-col gap-y-4 ">
                        <Link className="" href={data.url}>
                            <View className="flex-col w-full ">
                                <View className=" w-full p-1  ">
                                    <View className="w-full mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                                        {data.cover && ( <Image
                                                {...data.cover}
                                                alt={data.title}
                                                view="cover"
                                                className="absolute u-cover"
                                                sizes={imageSizes}
                                            />
                                        )}
                                    </View>
                                </View>
                                <View className="flex-col flex-auto gap-y-2 p-4  ">
                                    <View className=" flex-row flex-wrap gap-x-2 gap-y-2   ">
                                        {data?.date_start && (
                                            <Text  className=" bg-bgritem dark:bg-bgritem-d rounded-lg  px-2 py-1 flex-none flex-auto text-neutral-600 dark:text-neutral-400">
                                                {data.date_start && (
                                                    <>
                                                        <Time stylesName="text-sm flex-none" ts={data.date_start}></Time>
                                                        {data.date_end && (<> 
                                                                <Text className="text-sm flex-none"> - </Text>
                                                                <Time stylesName="text-sm flex-none" ts={data.date_end} ></Time>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </Text>
                                        )}
                                        <Text  className="my-auto text-sm flex-auto font-semibold text-neutral-600 dark:text-neutral-400">{data.visibility != '3' ? <>Private</> : <>Public</>}</Text>
                                    </View>
                                    <View className=" sm:h-12  ">
                                        <Text numberOfLines={2} className=" tracking-tight leading-tight text-base font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d ">
                                            {data.title}
                                        </Text>
                                    </View>
                                    <Text className=" flex-none text-neutral-600 dark:text-neutral-400">
                                        {data.members_count} members
                                    </Text>
                                    <View className="flex-row w-full gap-x-2 ">                
                                        {oMenuItemPrimary}
                                        {!!oMenuItemsMore && oMenuItemsMore.items.length > 0 && (
                                            <>
                                                <Button variant="outline" size="sm" className=" my-auto " startDecorator="DotsThreeOutline" onPress={(event) => handleClickMore(event)} />
                                                <Modal key="more-popup"  onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                                                    <Menu
                                                        displayType="mixed"
                                                        {...oMenuItemsMore}
                                                    />
                                                </Modal>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </Link>
                    </View>
                </Card>
            </>
        )
    }

    function defaultUnit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="sm"
                showInfo="false"
            />
        )

        return (
            <>
                <Card margin="mb-2 mx-2" rounded="rounded-2xl">
                    <View className="flex-col">
                        <View className="flex-col w-full">
                            <Link href={data.url}>
                                <View
                                    className={
                                    data.image
                                        ? 'flex-row-reverse sm:flex-col w-full p-1'
                                        : 'flex-col w-full p-1'
                                    }
                                >
                                    {data.image ? (
                                        <View className="aspect-video rounded-xl overflow-hidden w-2/5 sm:w-full">
                                            <Image
                                                {...data.image}
                                                alt={data.title}
                                                view="cover"
                                                className="u-cover"
                                                sizes={imageSizes}
                                            />
                                        </View>
                                    ) : (
                                        <View
                                            className={`sm:aspect-video ${
                                            !data.image &&
                                            'sm:bg-gradient-to-b from-bgritem to-bgrcard dark:from-bgritem-d dark:to-transparent justify-end'
                                            } rounded-xl overflow-hidden w-2/5 w-full gap-y-2 pt-3 px-3`}
                                        >
                                            <Text numberOfLines={5} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                                                {data.title}
                                            </Text>
                                        </View>
                                    )}
                                    <View className="flex-auto flex-col mb-auto">
                                        <View
                                            className={`flex-auto flex-col ${
                                            data.image ? 'h-32' : 'sm:h-32'
                                            } gap-y-2 p-3`}
                                        >
                                            {data.image && (
                                                <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                                                    {data.title}
                                                </Text>
                                            )}
                                            <Text numberOfLines={data.image ? 3 : 6} className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm">
                                                {data.summary_plain}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Link>
                        <View className=" mb-auto px-4 pb-3 sm:pt-0">{sMeta}</View>
                    </View>
                </View>
            </Card>
        </>
        )
    }

    function forumUnit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="sm"
                showInfo="false"
            />
        )

        return (
            <>
                <Card margin="mb-2 mx-4" rounded="rounded-2xl">
                    <View className="flex-col">
                        <View className="flex-col w-full">
                            <Link href={data.url}>
                                <View
                                    className={
                                    data.image
                                        ? 'flex-row-reverse sm:flex-col w-full p-1'
                                        : 'flex-col w-full p-1'
                                    }
                                >
                                    
                                    <View className="flex-auto flex-col mb-auto">
                                        <View
                                            className={`flex-auto flex-col gap-y-2 p-3`}
                                        >
                                            {data.image && (
                                                <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                                                    {data.title}
                                                </Text>
                                            )}
                                            <Text numberOfLines={data.image ? 3 : 6} className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm">
                                                {data.summary_plain}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Link>
                        <View className=" mb-auto px-4 pb-3 sm:pt-0">{sMeta}</View>
                    </View>
                </View>
            </Card>
        </>
        )
    }

    function marketUnit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="sm"
                showInfo="false"
            />
        )
        let cover_raw = data.cover_raw.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
            return String.fromCharCode(parseInt(grp, 16));
        });
        return (
            <>
                <Card margin="mb-2 mx-2" rounded="rounded-2xl">
                    <View className="flex-col gap-y-4">
                        <View className="flex-col w-full">
                            <Link href={data.url}>
                                <View className="w-full p-1">
                                        <View className="w-full mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                                            { cover_raw.trim() != '' &&  <div dangerouslySetInnerHTML={{__html:cover_raw}}></div> } 
                                            { cover_raw.trim() == '' && <Image
                                                {...data.cover}
                                                alt={data.title}
                                                view="cover"
                                                className="u-cover"
                                                sizes={imageSizes}
                                            /> }
                                        </View>
                                        <View  className="flex-auto flex-col px-2 py-3 gap-y-2 h-32 ">
                                             
                                            <Row className='justify-between'>
                                                <View className='flex-col gap-y-3'>
                                                    <Text  className="mr-auto bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                                                        {data.price_recurring > 0 ? data.price_recurring + '$/' + data.duration_recurring : (data.price_single > 0 ? data.price_single + '$' : 'Free')}
                                                    </Text>
                                                     <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                                                    {data.title}
                                                    </Text>
                                                </View>
                                                {data.image && (
                                                <View className='h-14 w-14 aspect-square overflow-hidden border border-bdr dark:border-bdr-d rounded-lg'>
                                                
                                                    <Image
                                                        {...data.image}
                                                        alt={data.title}
                                                        view="cover"
                                                        nobg={true}
                                                    
                                                        sizes={imageSizes}
                                                    />

                                                </View>
                                                )}
                                            </Row>
                                            
                                            <Text numberOfLines={1} className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm">
                                                {data.summary_plain}
                                            </Text>
                                           
                                        </View>
                                    
                                </View>
                            </Link>
                        <View className=" mb-auto px-4 pb-3 sm:pt-0">{sMeta}</View>
                        </View>
                </View>
            </Card>
        
        </>
        )
    }

    function UnitPerson(props) {
        const redirectdRef = useRef();
        const [ popupVisible, setPopupVisible ] = useState(false);

        let data = props.data
        const { cardData, setCardData } = useContext(CardData)
        if (!!cardData?.hidden) return
            const imageSizes = getImageSizes()

        const handleClick = (event, sUrl) => {
            event.preventDefault();

            redirectdRef.current.redirect(sUrl)
        }

        const handleClickMore = (event) => {
            event.preventDefault();

            FeedbackHaptics('Medium');
            setPopupVisible(true); 
        }

        let oMenuItemPrimary = undefined;
        let oMenuItemsMore = undefined;
        if( data?.meta) {
            let sPrimary = '', sSecondary = '', sExclude = '';

            switch(props.unitType) {
                case 'person_friends':
                    oMenuItemPrimary = {
                        title: 'Message',
                        icon: 'ChatTeardropDots',
                        onPress: (event) => {
                            handleClick(event, '/messenger');
                        }
                    };
                    break;

                case 'person_friends_recommendations':
                    sPrimary = 'befriend';
                    break;

                case 'browse_friend_requests':
                    sPrimary = 'befriend';
                    break;

                case 'person_friend_requested':
                    sPrimary = 'unfriend';
                    break;

                case 'person_following_recommendations':
                    sPrimary = 'subscribe';
                    break;

                case 'person_followers':
                    sPrimary = 'subscribe';
                    sSecondary = 'unsubscribe';
                    break;

                case 'person_following':
                    sPrimary = 'unsubscribe';
                    break;

                default:
                    oMenuItemPrimary = {
                        title: 'View',
                        onPress: (event) => {
                            handleClick(event, data.url);
                        }
                    };
            }

            if(!oMenuItemPrimary) {
                sExclude = sPrimary;
                oMenuItemPrimary = data.meta.items.filter((aItem) => aItem.name == sPrimary).shift();
                if(!oMenuItemPrimary) {
                    sExclude = sSecondary;
                    oMenuItemPrimary = data.meta.items.filter((aItem) => aItem.name == sSecondary).shift();
                }
            }

            if(!!oMenuItemPrimary) {
                if(oMenuItemPrimary?.data && oMenuItemPrimary.data?.type) {
                    const Element = componentsMap[oMenuItemPrimary.data.type];
                    if(!!Element) {
                        const oElementParams = {...oMenuItemPrimary.data, ...{primary: true, params: {button_rounded: false, button_full_width: true, on_done: (sAction, oData) => {
                            //--- Do something after the primary action was performed.
                        }}}};

                        oMenuItemPrimary = (
                            <Element key={oMenuItemPrimary.id ? oMenuItemPrimary.id : oMenuItemPrimary.name} {...oElementParams} />
                        );
                    }
                }
                else
                    oMenuItemPrimary = (
                        <Button
                            variant="primary"
                            size="sm"
                            title={oMenuItemPrimary.title}
                            className=" my-auto "
                            startDecorator={oMenuItemPrimary?.icon ? oMenuItemPrimary.icon : false}
                            fullWidth={true}
                            onPress={oMenuItemPrimary?.onPress}
                        />
                    );
            }

            //--- More menu
            oMenuItemsMore = {...data.meta, ...{
                items: data.meta.items.filter((aItem) => aItem.name != sPrimary),
                params: {
                    showVertical: true,
                    button_size: 'base',
                    button_full_width: true,
                    button_rounded: false,
                    on_do: (sAction) => {
                        setPopupVisible(false);
                    }
                }
            }};
        }

        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card margin="sm:mx-2 mb-2 " rounded="rounded-2xl">
                    <Link className="group " href={data.url}>
                        <View className="flex-row sm:flex-col">
                            <View className="sm:aspect-square p-1 w-1/3 sm:w-full rounded-xl ">
                                <Image
                                    src={data?.image?.src}
                                    alt={data.title}
                                    view="cover"
                                    className="absolute u-cover rounded-xl"
                                    sizes={imageSizes}
                                    />
                            </View>
                            <View className="flex-col p-4 gap-y-4 flex-auto ">
                                <Text numberOfLines={1} className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d">
                                    {data.title}
                                </Text>
                                {(props.unitType == 'person_followers' || props.unitType == 'person_following' || props.unitType == 'person_following_recommendations') ? 
                                    <Text className=" flex-auto text-neutral-600 dark:text-neutral-400">{ data?.followers_count + ' followers'}</Text>
                                    :
                                    <Text className=" flex-auto text-neutral-600 dark:text-neutral-400">{ data.mutual_friends_count > 0 ? data?.mutual_friends_count + ' mutual friends' : data?.friends_count + ' friends'}</Text>
                                }
                                <View className="flex-row w-full gap-x-2 ">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemsMore && oMenuItemsMore.items.length > 0 && (
                                        <>
                                            <Button variant="outline" size="sm" className=" my-auto " startDecorator="DotsThreeOutline" onPress={(event) => handleClickMore(event)} />
                                            <Modal key="more-popup"  onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                                                <Menu
                                                    displayType="mixed"
                                                    {...oMenuItemsMore}
                                                />
                                            </Modal>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Link>  
                </Card>
            </>
        )
    }

    let data = props.data

    const imageSizes = getImageSizes()
    const module = !!data?.module ? data.module : props.module
    
    switch (module) {
        case 'bx_groups':
        case 'bx_events':
            return eventUnit()
        case 'bx_channels':
            return channelUnit()
        case 'bx_market':
               return marketUnit()
        case 'bx_forum':
            return forumUnit()
        case 'bx_persons':
            return (
                <CardDataContext>
                    <UnitPerson {...props} />
                </CardDataContext>
            )

        default:
            return defaultUnit()
    }
    
}

/*
* TODO "Friends" card - Add "mutual friends" count, remove "remove friend" and UNfollow. Add "MORE" button (icon only) that shows all actions 
* TODO "Friend Suggestions" card - Add "mutual friends" count, change "remove friend" and UNfollow to single "MORE" button (icon only) that shows all actions 
* TODO "Friends" card - Add "mutual friends" count, change "remove friend" and UNfollow to single "MORE" button (icon only) that shows all actions 
*/