import { useMemo, useRef } from 'react';
import { menuItemsByName, linkify, FeedbackHaptics } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import Html from 'app/ui/atoms/html';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { ContentMore } from 'app/ui/molecules/contentmore';
import Menu from 'app/components/menu';
import { useCurrentUser } from 'app/context/user';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import React from 'react';
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import Form from 'app/components/elements/form';
import useSWR from "swr";
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { stripTags, appSetting } from 'app/lib/util';
import Carousel from 'app/ui/molecules/carousel'
import { componentsMap } from 'app/ui/molecules/_map'
import { KeyboardAvoidingView } from 'react-native';
import { StarsView } from 'app/ui/atoms/stars';

export default function UnitComments(props) {
    const { t } = useTranslation();
    let { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' });
    const [postData, setPostData] = useState(null);

    let level = props.level ? props.level : 0
    let lvls = props.lvls ? props.lvls : []
    let data = props.data;
    let items = props.items;
    let view = props.view;
    let files = props.files;
    let maxLevel = props.max_level;
    let parent = props.parent;

    // request form for reply
    const handleReply = async (data) => {
        FeedbackHaptics('Medium');
        props.handleReply(data);
    };

    if (!data)
        return (<View></View>);

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

    const onFormSubmit = (formData, d) => {
        setViewState({ view: '' });
        setPostData(formData);
    }

    const refReport = useRef(null);
    const [reportTitle, setReportTitle] = useState(null);
    const handleManageMenuSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const result1 = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + props.module + '","object_id":' + props.data.cmt_object_id + ',"action":"edit","id":' + props.data.cmt_id + '}');
                setViewState({ view: 'edited', data: result1.data.form });
                break;

            case 'item-delete':
                const result = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + props.module + '","object_id":' + props.data.cmt_object_id + ',"action":"remove","id":' + props.data.cmt_id + '}');
                setViewState({ view: 'deleted' });
                props.handleDelete();
                break;

            case 'item-report':
                refReport.current.report(event);
                break;
        }
    }

    let cells = [];

    let l = level < maxLevel ? level : maxLevel;
    for (let i = 0; i < l; i++) {
        cells.push(<View key={'sp-' + level + '-' + i} className='w-8'>{  /*i+'-'+level+'-'+lvls[i]+'-'+lvls.length*/}
            {(lvls[i + 1]) && <View className="ml-[15px] w-0.5 flex-auto  bg-neutral-100 dark:bg-neutral-800"></View>}
            {(i == level - 1) && <View className="ml-[15px] h-6 w-6 border-neutral-100 dark:border-neutral-800  border-l-2 border-b-2 absolute -top-1.5 rounded-bl-2xl flex-auto"></View>}
        </View>)
    };
    let oReport = undefined;
    const aMenuManageItems = menuItemsByName('comments_manage_menu', data.menu_manage.items, currentUser).map(
        (aItem) => {
            let sTitle = aItem.title;
            if (!!aItem.display_type && aItem.display_type == 'element') {
                const Element = componentsMap[aItem.data.type];
                if (!!Element) {
                    sTitle = aItem.data?.action ? aItem.data?.action.title : 'Report';
                    if (!!reportTitle)
                        sTitle = reportTitle;

                    oReport = (
                        <View className="w-0 h-0" style={{ opacity: 0 }}>
                            <Element key={aItem.id ? aItem.id : aItem.name} ref={refReport} onChangeTitle={setReportTitle} {...aItem.data} />
                        </View>
                    );
                }
            }

            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: sTitle,
            }
        }
    );

    let aImg = files.map(obj => {
        return {
            src: obj.file,
            width: obj.width,
            height: obj.height,
            type: 'image'
        };
    });

    const TabFlashList = React.forwardRef((props, ref) => {

        if (getNumCols(0) != numColumns)
            setNumColumns(getNumCols(0));

        return (
            <UniList
                {...props}
                useWindowScroll
                numColumns={numColumns}
                onEndReached={handleEndReached}
            />
        );
    });

    if (viewState.view == 'deleted')
        return (<></>);



    return (
        <View className='w-full'>
            <View className="flex-row gap-x-2 ">
                {cells}
                <View className="w-8 z-50 flex-0 ">
                    <Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" showInfo="false" />
                    {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-[15px]  flex-auto bg-neutral-100 dark:bg-neutral-800"><Text>&nbsp;</Text></View>}
                </View>
                <View className='flex-1 flex-col mb-2 '>
                    <View className='bg-bgritem dark:bg-bgritem-d rounded-xl  px-2 py-1.5 mb-0.5 u-vanilla-html-small' >
                        <View className="flex-row flex-1 items-center overflow-hidden">
                            <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <View><Text className="text-neutral-500 px-1">·</Text></View>
                            <Link href={data.cmt_url} className="flex items-center"><Time ts={data.cmt_time}></Time></Link>
                            {(maxLevel < data.cmt_level && appSetting('layout', 'show_in_reply_comments')) && parent?.data && <Row>
                                <Text className="text-neutral-500 px-1 text-xs">· In reply to</Text>
                                <Profile {...parent.data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                {false && <Text className="text-neutral-500 px-1 text-sm whitespace-nowrap text-ellipsis overflow-hidden"> {stripTags(parent?.data?.cmt_text)}</Text>}
                            </Row>}

                        </View>
                        {
                            (view == 'flat' && data.cmt_parent_id > 0) && <View className='   border border-bdr dark:border-bdr-d  rounded-md p-2 my-1'>
                                <View className="flex-row items-baseline" >
                                    <View><Text className='text-sm text-neutral-800 dark:text-neutral-200'>In Reply to </Text></View>
                                    <View className=" "></View>
                                </View>
                                <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} openSmall={false} textClassName="text-base text-neutral-600 dark:text-neutral-400" />
                            </View>
                        }
                        <View className='text-neutral-900 dark:text-neutral-50'>
                            {viewState.view == 'edited' ? (
                                <View className='-translate-y-5'>
                                    <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                                        <View className='ml-auto mb-2'><Button align="start" title="Cancel" size="xs" startDecorator="X" variant="outline" onPress={() => setViewState({ view: '' })} rounded /></View>
                                        <Form {...viewState.data} classContainerName="flex-row flex-wrap w-full  items-start justify-between" onFormSubmit={onFormSubmit} />
                                    </KeyboardAvoidingView>
                                </View>
                            ) : <Html htmlStyles={{ fontSize: 14 }} customClassName='u-vanilla-html-small' data={linkify(data.cmt_text)} />}
                            {!!data.cmt_mood && <StarsView rating={data.cmt_mood} starSize={20} />}
                        </View>
                        {(viewState.view != 'edited' && aImg.length > 0) && <View className=' max-w-lg'><Carousel data={aImg} /></View>}
                    </View>
                    {viewState.view != 'edited' && <View className=' mb-1 flex-row w-full  items-center'>
                        {(!!currentUser && !!props.handleReply && !props.module.includes('_reviews')) ? <View className='mr-2'>
                            <Button align="start" title={t("Reply")} size="xs" startDecorator="ArrowBendLeftUp" variant="text" onPress={() => handleReply(data)} rounded />
                        </View> : <View className='mr-2'></View>}
                        <View className='flex-row flex-auto '>
                            <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{ show_action: true, show_counter: true, show_combined: true, display_size: 'xs', button_variant: 'text' }} />
                            {!!currentUser && !!aMenuManageItems.length &&
                                <View className="ml-auto flex-none">
                                    <DropdownMenu items={aMenuManageItems.map((aItem) => {
                                        return {
                                            id: aItem.id ? aItem.id : aItem.name,
                                            name: aItem.name,
                                            link: aItem.link,
                                            title: aItem.title
                                        };
                                    })} onSelect={handleManageMenuSelect}>
                                        <Button variant="text" size="xs" startDecorator="DotsThreeOutline" onPress={() => { FeedbackHaptics('Medium'); }} rounded />
                                    </DropdownMenu>
                                </View>
                            }
                            {!!oReport && oReport}

                        </View>
                    </View>
                    }
                </View>
            </View>
        </View>
    );
}