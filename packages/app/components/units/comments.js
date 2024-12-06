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
import useSWR from "swr";
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { stripTags, appSetting, getDataForMenu } from 'app/lib/util';
import Carousel from 'app/ui/molecules/carousel'
import { componentsMap } from 'app/ui/molecules/_map'
import { StarsView } from 'app/ui/atoms/stars';
import { Modal } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'

export default function UnitComments(props) {
    const { t } = useTranslation();
    let { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' });
    const [postData, setPostData] = useState(null);

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

    if (!data)
        return null;

    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + props.module + '","object_id":' + props.data.cmt_object_id + ',"action":"edit","id":' + props.data.cmt_id + '}', '', postData] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );


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
                <View key={`sp-${level}-${i}`} className="w-8">
                    {lvls[i + 1] && (
                        <View className="ml-[15px] w-0.5 flex-auto bg-neutral-100 dark:bg-neutral-800" />
                    )}
                    {i === level - 1 && (
                        <View className="ml-[15px] h-8 w-[23px] border-neutral-100 dark:border-neutral-800 border-l-2 border-b-2 absolute -top-3.5 rounded-bl-2xl flex-auto" />
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


    return (
        <View className='w-full'>
            <View className="flex-row gap-x-2">
                {cells}
                <View className="w-8 z-50 flex-0 relative">
                    <Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" showInfo="false" />
                    {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-[15px] top-0.5 flex-auto bg-neutral-100 dark:bg-neutral-800"></View>}
                </View>
                <View className=' flex-col flex-1 '>
                    <View className=' bg-bgritem dark:bg-bgritem-d rounded-xl px-3 py-1.5' >
                        <View className="flex-row items-center overflow-hidden">
                            <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <View><Text className="text-neutral-500 px-1">·</Text></View>
                            <Link href={data.cmt_url} className="flex items-center"><Time ts={data.cmt_time}></Time></Link>
                            {(maxLevel < data.cmt_level && appSetting('layout', 'show_in_reply_comments')) && parent?.data && <Row>
                                <Text className="text-neutral-500 px-1 text-sm ">· In reply to</Text>
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
                                <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} openSmall={false} textClassName="text-base text-neutral-600 dark:text-neutral-400" />
                               
                            </View>
                        }
                        <View className='text-neutral-900 dark:text-neutral-50 pb-0.5'>
                            <Html htmlStyles={{ fontSize: 14 }}  data={linkify(data.cmt_text)} />
                            {!!data.embed && <View><Embed data={data.embed} size="small" /></View>}
                            {!!data.cmt_mood && <StarsView rating={data.cmt_mood} starSize={20} />}
                        </View>
                        {(viewState.view != 'edited' && imageList.length > 0) && <View className='max-w-xs w-full'><Carousel data={imageList} /></View>}
                    </View>
                    {viewState.view != 'edited' && <View className=' flex-row w-full mb-1 items-center'>
                        {(!!currentUser && !!props.handleReply && !props.module.includes('_reviews')) ? <View className='mr-2'>
                            <Button align="start" title={t("Reply")} size="xs" startDecorator="ArrowBendLeftUp" variant="link" onPress={() => handleReply(data)} rounded />
                        </View> : <View></View>
                        }
                        {(!!currentUser && !props.handleReply && !props.module.includes('_reviews')) ? <View className='mr-2'>
                            <Link href={props.contentUrl + '#cmt_id=' + data.cmt_id}><Button align="start" title={t("Reply")} size="xs" startDecorator="ArrowBendLeftUp" variant="link" rounded /></Link>
                        </View> : <View></View>
                        }
                        <View className='flex-row flex-auto '>
                            <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{ show_action: true, show_counter: false, show_combined: false, button_size: 'xs', button_variant: 'link' }} />

                            <View className="ml-auto flex-row items-center gap-x-2">
                            <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{ show_action: false, show_counter: true, show_combined: false, button_size: 'xs', button_variant: 'link' }} />

                            <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} module={props.module} cmt_object_id={props.data.cmt_object_id} cmt_id={props.data.cmt_id} />
                                </View>
                        </View>
                    </View>
                    }
                </View>
            </View>
        </View>
    );
}

const MenuManage = ({ id, menu, setViewState, module, cmt_object_id, cmt_id }) => {
    const [menuData, setMenuData] = useState(false);

    if (menu.items)
        return <MenuManage_ id={id} menu={menu} setViewState={setViewState} module={module} cmt_object_id={cmt_object_id} cmt_id={cmt_id} />

    if (!menuData)
        return (
            <Button
                variant="text"
                size="xs"
                rounded
                startDecorator="DotsThreeOutline"
                onPress={() => {
                    setMenuData({...menu, items: [{'name': 'loader'}]});
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
                const Element = componentsMap[aItem.data.type];
                if (!!Element) {
                    sTitle= <Element mode="text" key={aItem.id ? aItem.id : aItem.name}   {...aItem.data} />
                }
            }

            if (aItem.name == 'loader') {
                sTitle= <Loading size="small" />
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
                <Button variant="text" size="xs" startDecorator="DotsThreeOutline" rounded />
            </DropdownMenu>

            {!!oReport && oReport}
        </>
    );
});