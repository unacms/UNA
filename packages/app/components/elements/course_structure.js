import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text, H1C } from 'app/design/typography'
import { stripTags, appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import { useWindowDimensions } from 'react-native'
import Image from 'app/ui/atoms/image'
import { useRouter } from 'expo-router'
import { Theme } from 'app/design/theme'
import { Icon } from 'app/ui/atoms/icon'
import Menu from 'app/components/menu'
import { BlurView } from 'expo-blur';
import ProfilesList from 'app/ui/molecules/profile_list'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Button, Modal } from 'app/design/controls'
import { FeedbackHaptics } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'
import Progress from 'app/ui/atoms/progress'
import Scroll from 'app/ui/molecules/scroll'
import { memo } from 'react'
import { useState, useReducer, useCallback } from 'react'
import { fetcher } from 'app/lib/fetcher'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { useBottomSheetData } from 'app/context/bottomsheet';


function CourseStructure({ data }) {
    const { setBottomSheetData } = useBottomSheetData();
    const isEditable = data.isEditable;
    const courseId = data.entry_id;

    const initialState = {
        action: null,
        modal: null,
        data: data,
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    function reducer(state, action) {
        switch (action.type) {
            case 'SET_DATA':
                return {
                    ...state,
                    action: null,
                    modal: null,
                    data: action.data
                };

            default:
                return state;
        }
    }

    const handleAddModule = useCallback(async (event) => {
        event.preventDefault();
        const fetchedData = await fetcher(`/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=add&parent_id=0&entry_id=${courseId}`);
        const content = { content: fetchedData.data, designbox_id: 0 };
        setBottomSheetData({ title: content.content[0]?.title || " ", content: <View className='px-1'><BlockByData onFormEmpty={handleUpdate} block={content} /></View> });
    }, [courseId, setBottomSheetData]);

    const resetData = useCallback(async () => {
        const response = await fetcher(`/api.php?r=bx_courses/entity_structure_l1_block/&params[]=${courseId}`);
        dispatch({ type: 'SET_DATA', data: response.data[0].data });
    }, [courseId]);

    const handleUpdate = useCallback(() => {
        setTimeout(() => {
            setBottomSheetData(false);
            resetData();
        }, 100);
    }, [setBottomSheetData, resetData]);

    const handleManage = async (item, id) => {
        if (item.action == "edit") {
            const fetchedData = await fetcher(`/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=edit&parent_id=0&entry_id=${courseId}&id=${id}`);
            const content = { content: fetchedData.data, designbox_id: 0 };
            setBottomSheetData({ title: content.content[0]?.title || " ", content: <View className='px-1'><BlockByData onFormEmpty={handleUpdate} block={content} /></View> });
        }
        if (item.action == "delete") {
            await fetcher(`/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=delete&parent_id=0&entry_id=${courseId}&ids[]=${id}`);
            resetData();
        }
    };

    return (

        <Scroll horizontal={true} step={250} className='w-full'>
            {
                state.data.items.map((item, index) => {
                    let icon = "Check";
                    let color = "gray-600";
                    let colorButton = "emerald-400";
                    let colorButtonText = "emerald-400";
                    if (item.status == "in process") {
                        icon = "HourglassSimple";
                        color = "red-400";
                        colorButton = "white";
                        colorButtonText = "red-400";
                    }
                    if (item.status == "not started") {
                        icon = "BookmarkSimple";
                        color = "gray-400";
                        colorButton = "gray-500";
                        colorButtonText = "white";
                    }

                    const manageMenu = [
                        { title: "Edit module", action: "edit" },
                        { title: "Delete module", action: "delete" },
                    ];

                    return (
                        <View className='m-2 w-72' key={item.index}>
                            <Card rounded=' rounded-none sm:rounded-2xl  ' margin={'bg-' + color + ' max-w-screen-lg mx-auto w-full p-3 sm:p-4 mb-1 sm:mb-4 '}>
                                <Link href={item.link}>
                                    <View className={`mb-2 bg-${color}`}>
                                        {!isEditable && <Progress value={item.percent} />}

                                        <Row className='justify-between'>
                                            <View className='my-2 text-xs '><Text className="text-white">Module {item.index}</Text></View>
                                            {isEditable && <DropdownMenu items={manageMenu} onSelect={(oItem) => { handleManage(oItem, item.id) }}><Button rounded startDecorator="Gear" size='sm' /></DropdownMenu>}
                                        </Row>
                                        <View className='h-12'>
                                            <Text className="text-white text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200" numberOfLines={2}>{item.title}</Text>
                                        </View>
                                    </View>
                                    <Row className='gap-x-2 items-end mt-4'>
                                        <Button textColor={`text-${colorButtonText}`} bgColor={`bg-${colorButton}`} startDecorator={icon} variant="outline" title={item.status} size="xs" rounded />
                                        {item.counters.map((item2, index) => {
                                            return (
                                                <Button key={`cnt-${index}`} bgColor={`bg-white`} variant="default" title={`${item2.cn_progress} ${item2.cn_title}`} size="xs" rounded />
                                            )
                                        })}
                                    </Row>
                                </Link>
                            </Card>
                        </View>
                    )
                })
            }
            {isEditable && (<View className='m-2 w-72'>
                <Card rounded=' rounded-none sm:rounded-2xl  ' >
                    <View className='h-40 items-center justify-center'>
                        <Button rounded startDecorator="Plus" title="Add new" onPress={(event) => { handleAddModule(event, courseId) }} size='sm' />
                    </View>
                </Card>
            </View>)
            }
        </Scroll>)
}
export default memo(CourseStructure);