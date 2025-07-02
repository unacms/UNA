import { useMemo, useRef, memo, useCallback } from 'react';
import { Platform } from 'react-native';
import { menuItemsByName, linkify, FeedbackHaptics } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import Html from 'app/ui/atoms/html';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { ContentMore } from 'app/ui/molecules/contentmore';
import Embed from 'app/ui/molecules/embed'
import Menu from 'app/components/menu';
import { useCurrentUser } from 'app/context/user';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import React from 'react';
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect } from 'react';
import Form from 'app/components/elements/form';
//import useSWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { stripTags, appSetting, getDataForMenu } from 'app/lib/util';
import Carousel from 'app/ui/molecules/carousel'
import { getComponent } from 'app/components/registry';
import { StarsView } from 'app/ui/atoms/stars';
import { Modal } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
import { Animated, StyleSheet } from 'react-native';
import { Theme } from 'app/design/theme';

export default function UnitComments(props) {
    const { t } = useTranslation();
    const { colors } = Theme();
    let { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' });
    const [postData, setPostData] = useState(null);

    const entryAnim = useRef(new Animated.Value(0)).current; // Base animation value, starts at 0 (hidden/offset)
    const [didAnimateIn, setDidAnimateIn] = useState(false);
    const selectionAnimationValue = useRef(new Animated.Value(0)).current;

    let level = props.level || 0
    let lvls = props.lvls || []
    let data = props.data;
    let items = props.items;
    let view = props.view;
    let files = props.files;
    let maxLevel = props.max_level;
    let parent = props.parent;

    const handleReply = useCallback((data, isNoReaction) => {
        if (!isNoReaction)
            FeedbackHaptics('Medium');
        props.handleReply(data);
    },
        [props.handleReply]
    );

    useEffect(() => {
        if (props.replyId == "cmt_id=" + data.cmt_id) {
            handleReply(data, true);
        }
    }, [props.replyId])

    useEffect(() => {
        if (props.selectedId == data.cmt_id) {
            selectionAnimationValue.setValue(0); // Reset before blinking
            Animated.sequence([
                Animated.timing(selectionAnimationValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(selectionAnimationValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(selectionAnimationValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(selectionAnimationValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(selectionAnimationValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(selectionAnimationValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [props.selectedId, data.cmt_id, selectionAnimationValue, colors.primary]);

    useEffect(() => {
        if (props.isNewComment && !didAnimateIn) {
            // New comment, and hasn't animated in yet
            entryAnim.setValue(0); // Explicitly start from 0
            Animated.spring(entryAnim, {
                toValue: 1, // Animate to 1 (visible/final position)
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }).start(() => {
                setDidAnimateIn(true);
            });
        } else if (!props.isNewComment && !didAnimateIn) {
            // Not a new comment, and hasn't "animated in" (e.g., initial mount of an old comment)
            entryAnim.setValue(1); // Set directly to visible state
            setDidAnimateIn(true); // Mark as "animated in" because it's in its final state
        } else if (didAnimateIn) {
            // Already animated in, ensure it stays at the final state (value 1)
            // This handles cases where isNewComment might change after initial animation/setup
            entryAnim.setValue(1);
        }
    }, [props.isNewComment, didAnimateIn, entryAnim]);

    const interpolatedSelectionBackground = selectionAnimationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', colors.primary],
    });

    const entryStyle = {
        opacity: entryAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        }),
        transform: [
            {
                translateY: entryAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                }),
            },
            {
                scale: entryAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.95, 1.05, 1],
                }),
            },
        ],
    };

    if (!data)
        return null;

    /* let { data: dynamicData, error } = useSWR(
         postData ? ['/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + props.module + '","object_id":' + props.data.cmt_object_id + ',"action":"edit","id":' + props.data.cmt_id + '}', '', postData] : null,
         fetcher,
         !true ? undefined : {
             revalidateIfStale: false,
             revalidateOnFocus: false,
             revalidateOnReconnect: false
         }
     );*/
    const { data: dynamicData, error } = useFetchForm('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + props.module + '","object_id":' + props.data.cmt_object_id + ',"action":"edit","id":' + props.data.cmt_id + '}', postData);


    if (dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id]) {
        data = dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id].data;
        files = dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id].files;
    }

    const onFormSubmit = useCallback((formData) => {
        setViewState({ view: '' });
        setPostData(formData);
    }, []);


    const cells = useMemo(() => {
        const cellsArray = [];
        const effectiveLevel = Math.min(level, maxLevel);
        for (let i = 0; i < effectiveLevel; i++) {
            cellsArray.push(
                <View key={`sp-${level}-${i}`} className="w-11">
                    {lvls[i + 1] && (
                        <View className="ml-[19px] w-0.5 flex-auto bg-neutral-100 dark:bg-neutral-800" />
                    )}
                    {i === level - 1 && (
                        <View className="ml-[21px] h-[37px] w-[29px] border-neutral-100 dark:border-neutral-800 border-l-2 border-b-2 absolute -top-[14px] rounded-bl-[22px] flex-auto" />
                    )}
                </View>
            );
        }
        return cellsArray;
    }, [level, maxLevel, lvls]);


    const imageList = useMemo(
        () =>
            files.map((obj) => ({
                src: obj.file,
                width: obj.width,
                height: obj.height,
                type: 'image',
            })),
        [files]
    );

    if (viewState.view == 'deleted')
        return (<></>);

    if (viewState.view == 'edited')
        return <Modal
            title={t("Edit comment")}
            onVisible={true}
            outerClickClose={false}
            onClose={() => {
                setViewState({ view: '' })
            }}
            transparent={true}
            headerBorder={true}
        >
            <View className="p-2">
                <Form {...viewState.data} classContainerName="flex-row flex-wrap w-full  items-start justify-between" onFormSubmit={onFormSubmit} />
            </View>
        </Modal>
    const isSelected = props.selectedId == data.cmt_id;
    const Wrapper = Animated.View;
    
    const combinedStyles = [
        { width: '100%' },
        entryStyle, // Apply entry animations (opacity, transform)
        isSelected ? { backgroundColor: interpolatedSelectionBackground } : {},
    ];


    return (
        <Wrapper style={combinedStyles}>
            <View className='w-full px-2 sm:px-3 lg:px-4 '>
                <View className="flex-row gap-x-2">
                    {cells}
                    <View className="w-11 z-50 flex-0 relative">

                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />

                        {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-[21px] top-0.5 flex-auto bg-neutral-100 dark:bg-neutral-800"></View>}
                    </View>
                    <View className=' flex-col flex-1 '>
                        <View className=' bg-bgritem dark:bg-bgritem-d rounded-[22px] p-3 flex-col gap-y-1' >
                            <View className="flex-row items-center overflow-hidden">
                                <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                <View><Text className="text-neutral-400 dark:text-neutral-600 px-1">·</Text></View>
                                <Link href={data.cmt_url} className="flex items-center"><Time ts={data.cmt_time}></Time></Link>
                                {!!data.cmt_mood && <><View><Text className="text-neutral-400 dark:text-neutral-600 px-1">·</Text></View><StarsView rating={data.cmt_mood} starSize={20} /></>}
                                {(maxLevel < data.cmt_level && appSetting('comments', 'in_reply')) && parent?.data && <Row>
                                    <Text className="text-neutral-400 dark:text-neutral-600 px-1 text-sm ">· In reply to</Text>
                                    <Profile {...parent.data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                    {false && <Text className="text-neutral-500 px-1 text-sm whitespace-nowrap text-ellipsis overflow-hidden"> {stripTags(parent?.data?.cmt_text)}</Text>}
                                </Row>}

                            </View>
                            {
                                (view == 'flat' && data.cmt_parent_id > 0) && <View className='   border border-bdr dark:border-bdr-d  rounded-md p-2 my-1'>
                                    <View className="flex-row items-baseline" >
                                        <View><Text className='text-xs text-neutral-800 dark:text-neutral-200'>In Reply to </Text></View>
                                        <View className=" "></View>
                                    </View>
                                    <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} openSmall={false} textClassName=" text-base text-neutral-600 dark:text-neutral-400" />

                                </View>
                            }
                            <View className='text-neutral-900 dark:text-neutral-50 '>
                                <Html htmlStyles={{ fontSize: 16 }} customClassName='u-vanilla-html-small' data={linkify(data.cmt_text)} />
                                {!!data.embed && <View><Embed data={data.embed} size="small" /></View>}

                            </View>
                            {(viewState.view != 'edited' && imageList.length > 0) && <View className='max-w-xs w-full'><Carousel data={imageList} /></View>}
                        </View>
                        {viewState.view != 'edited' && <View className=' flex-row w-full mb-3 mt-0.5 items-center'>
                            {(!!currentUser && !!props.handleReply && !props.module.includes('_reviews')) ? <View className='mr-2 '>
                                <Button align="start" title={t("Reply")} size="xs" startDecorator="MessageCircle" variant="text" onPress={() => handleReply(data)} rounded />
                            </View> : <View></View>
                            }
                            {(!!currentUser && !props.handleReply && !props.module.includes('_reviews')) ? <View className='mr-2 '>
                                <Link href={props.contentUrl + '#cmt_id=' + data.cmt_id}><Button align="start" title={t("Reply")} size="xs" startDecorator="MessageCircle" variant="text" rounded /></Link>
                            </View> : <View></View>
                            }
                            <View className='flex-row flex-auto '>
                                <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{ show_action: true, show_counter: false, show_combined: false, button_size: 'xs', button_variant: 'text' }} />

                                <View className="ml-auto flex-row items-center gap-x-2">
                                    <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{ show_action: false, show_counter: true, show_combined: false, button_size: 'xs', button_variant: 'text' }} />

                                    <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} module={props.module} cmt_object_id={props.data.cmt_object_id} cmt_id={props.data.cmt_id} />
                                </View>
                            </View>
                        </View>
                        }
                    </View>
                </View>
            </View>
        </Wrapper>
    );
}

const MenuManage = ({ id, menu, setViewState, module, cmt_object_id, cmt_id }) => {
    const [menuData, setMenuData] = useState(false);

    if (!menu.object)
        return null;

    if (menu.items)
        return <MenuManage_ id={id} menu={menu} setViewState={setViewState} module={module} cmt_object_id={cmt_object_id} cmt_id={cmt_id} />

    if (!menuData)
        return (
            <Button
                variant="text"
                size="xs"
                rounded
                startDecorator="Ellipsis"
                onPress={() => {
                    if (Platform.OS === 'web')
                        setMenuData({ ...menu, items: [{ 'name': 'loader' }] });
                    getDataForMenu(menu, setMenuData);
                }}
            />
        );

    return <MenuManage_ id={id} menu={menuData} defaultOpen={true} setViewState={setViewState} module={module} cmt_object_id={cmt_object_id} cmt_id={cmt_id} />

}

const MenuManage_ = memo(({ id, menu, setViewState, defaultOpen, module, cmt_object_id, cmt_id }) => {
    let { currentUser, setCurrentUser } = useCurrentUser()

    //const refReport = useRef(null);
    //const [reportTitle, setReportTitle] = useState(null);
    const handleManageMenuSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const result1 = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + module + '","object_id":' + cmt_object_id + ',"action":"edit","id":' + cmt_id + '}');
                setViewState({ view: 'edited', data: result1.data.form });
                break;

            case 'item-delete':
                const result = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + module + '","object_id":' + cmt_object_id + ',"action":"remove","id":' + cmt_id + '}');
                setViewState({ view: 'deleted' });
                props.handleDelete();
                break;

            /* case 'item-report':
                 refReport.current.report(event);
                 break;*/
        }
    }

    let oReport = undefined;
    // const aMenuManageItems = menuItemsByName('comments_manage_menu', data.menu_manage.items, currentUser).map(
    const aMenuManageItems = !!currentUser ? menu && menuItemsByName('comments_manage_menu', menu?.items, currentUser).map(
        (aItem) => {
            let sTitle = aItem.title;
            if (!!aItem.display_type && aItem.display_type == 'element') {
                const Element = getComponent('molecule', String(aItem.data.type));
                if (!!Element) {
                    sTitle = <Element mode="dropdown-menu" key={aItem.id ? aItem.id : aItem.name}   {...aItem.data} />
                }
            }

            if (aItem.name == 'loader') {
                sTitle = <Loading size="small" />
            }

            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: sTitle,
            }
        }
    ) : [];

    return aMenuManageItems?.length > 0 && (
        <>
            <DropdownMenu defaultOpen={defaultOpen} items={aMenuManageItems.map((aItem) => {
                return {
                    id: aItem.id ? aItem.id : aItem.name,
                    name: aItem.name,
                    link: aItem.link,
                    title: aItem.title
                };
            })} onSelect={handleManageMenuSelect}>
                <Button variant="text" size="xs" startDecorator="Ellipsis" rounded />
            </DropdownMenu>
            {!!oReport && oReport}
        </>
    );
});