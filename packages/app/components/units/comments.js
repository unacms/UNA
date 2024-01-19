import { useMemo } from 'react';
import { menuItemsByName, linkify, FeedbackHaptics } from 'app/lib/util';
import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import Html from 'app/ui/atoms/html';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { ContentMore } from 'app/ui/molecules/contentmore';
import Menu from 'app/components/menu';
import { useCurrentUser } from 'app/context/user';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import dynamic from 'next/dynamic'
import React from 'react';
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import Form from 'app/components/elements/form';
import useSWR from "swr";
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'

function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = React.memo(dynamic(() => import('app/ui/molecules/carousel')));
      return  <Carousel data={aImg}/>
    }, [b]); 
    return computedData;
}

export default function UnitComments(props) {
    const { t } = useTranslation();
    let { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({view: ''});
    const [postData, setPostData] = useState(null);

    let level = props.level ? props.level : 0
    let lvls= props.lvls ? props.lvls : []
    let data = props.data;
    let items = props.items;
    let view = props.view;
    let files = props.files;

    // request form for reply
    const handleReply = async (id, author, text) => {
        FeedbackHaptics('Medium');
        props.handleReply(id, author, text);
    };

    let sCommentClass = " bg-neutral-500/10 border border-neutral-500/10 rounded-lg px-2.5 u-vanilla-html-small ";

    if (!data)
        return (<View></View>);
                
    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=system/get_data_api/TemplCmtsServices/&params[]={"module":"'+props.module+'","object_id":'+props.data.cmt_object_id+',"action":"edit","id":'+props.data.cmt_id+'}', '', postData] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

      
    if (dynamicData?.data?.browse?.data?.data[0]['i'+props.data.cmt_id]){
        data = dynamicData?.data?.browse?.data?.data[0]['i'+props.data.cmt_id].data;
        files = dynamicData?.data?.browse?.data?.data[0]['i'+props.data.cmt_id].files;
    }

    const onFormSubmit = (formData, d) => {
        setViewState({view: ''});
        setPostData(formData);
    }

    const  handleManageMenuSelect = async (oItem, event) => {
        switch(oItem.name) {
            case 'item-edit':
                const result1 = await fetcher('/api.php?r=system/get_data_api/TemplCmtsServices/&params[]={"module":"'+props.module+'","object_id":'+props.data.cmt_object_id+',"action":"edit","id":'+props.data.cmt_id+'}');
                setViewState({view: 'edited', data:result1.data.form});
                break;

            case 'item-delete':
                const result = await fetcher('/api.php?r=system/get_data_api/TemplCmtsServices/&params[]={"module":"'+props.module+'","object_id":'+props.data.cmt_object_id+',"action":"remove","id":'+props.data.cmt_id+'}');
                setViewState({view: 'deleted'});
                props.handleDelete();
                break;
        }
    }

    let cells = [];
    for (let i = 0; i < level; i++){
        cells.push(<View key={'sp-'+level+'-'+i} className='w-10'>{  /*i+'-'+level+'-'+lvls[i]+'-'+lvls.length*/}
        {(lvls[i+1]) && <View className="ml-[19px] w-0.5 flex-auto  bg-neutral-100 dark:bg-neutral-800"></View> }
        {(i == level - 1) && <View className="ml-[19px] h-[21px] w-8 border-neutral-100 dark:border-neutral-800  border-l-2 border-b-2 absolute top-0 rounded-bl-xl flex-auto"></View> }
    </View>)
    };   

    const aMenuManageItems = menuItemsByName('comments_manage_menu', data.menu_manage.items, currentUser);

    let aImg = files.map(obj => {
        return {
            src: obj.file,
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
            <View  className="flex-row gap-x-2 ">
                {cells}
                <View className="w-10 flex-0 ">
                    <Profile {...data.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                    {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-[19px]  flex-auto bg-neutral-100 dark:bg-neutral-800"><Text>&nbsp;</Text></View> }
                </View>
                <View className='flex-1 flex-col gap-y-1 mb-2'>
                    <View className={sCommentClass + ' py-2'} >
                        <View className="flex-row flex-1 items-center mb-0.5">
                            <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <View><Text className="text-neutral-500 px-1">·</Text></View>
                            <Link href={data.cmt_url} className="flex items-center"><Time className="" ts={data.cmt_time}></Time></Link>
                        </View>
                        {
                            (view == 'flat' && data.cmt_parent_id > 0) && <View   className='   border border-bdr dark:border-bdr-d  rounded-md p-2 my-1'>
                                <View  className="flex-row items-baseline" >
                                    <View><Text className='text-sm text-neutral-800 dark:text-neutral-200'>In Reply to </Text></View>
                                    <View className=" "><Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" /></View>
                                </View>
                                <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} openSmall={false} textClassName="text-base text-neutral-600 dark:text-neutral-400"/>
                            </View>
                        }
                        <View>
                            {viewState.view == 'edited' ? (
                                <View className='-translate-y-6'>
                                    <View className='ml-auto mb-2'><Button align="start" title="Cancel"  size ="xs" startDecorator="X" variant="outline"  onPress={() =>  setViewState({view: ''})} rounded /></View>
                                    <Form {...viewState.data} classContainerName="flex-row flex-wrap w-full  items-start justify-between"  onFormSubmit={onFormSubmit} />
                                </View>
                            ) : <Html data={linkify(data.cmt_text)} /> }
                        </View>
                        { (viewState.view != 'edited'  && aImg.length > 0) && <View className='w-full aspect-square  mb-6'>
                                <CarouselMemo aImg={aImg}/>
                            </View>
                        }
                    </View>
                    { viewState.view != 'edited' && <View className=' mb-1 flex-row w-full justify-between items-center'>
                        { !!currentUser && !!props.handleReply ? <View className='mr-2'>
                            <Button align="start" title={t("Reply")} size ="xs" startDecorator="ArrowBendLeftUp" variant="outline"  onPress={() => handleReply(data.cmt_id, data.author_data.display_name, data.cmt_text)} rounded />
                        </View> : <View className='mr-2'></View> }
                        <View className='flex-row'>
                            <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true, display_size: 'xs'}} />
                            {!!currentUser && !!aMenuManageItems.length && 
                            <View className="ml-2">
                                <DropdownMenu items={aMenuManageItems.map((aItem) => {
                                    return {
                                        id: aItem.id ? aItem.id : aItem.name,
                                        name: aItem.name,
                                        link: aItem.link,
                                        title: aItem.title
                                    };
                                })} onSelect={handleManageMenuSelect}>
                                    <Button variant="outline" size="xs" startDecorator="DotsThreeOutline" onPress={() => {FeedbackHaptics('Medium');}} rounded />
                                </DropdownMenu>
                            </View>
                            }
                        </View>
                    </View>
                    }
                </View>
            </View>
        </View>       
    );
}