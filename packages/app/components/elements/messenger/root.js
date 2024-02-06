import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { memo, useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic'
import { appSetting, setClipboard, stripTags, linkify } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html';
import { Button, InputRounded } from 'app/design/controls'
import { BottomSheetData } from 'app/context/bottomsheet';
import Form from 'app/components/elements/form';
import { Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import useSWR from "swr";
import Loading from 'app/ui/atoms/loading'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';

export default function (props) {

    const isWeb = Platform.OS == 'web'
    const { width, height } = useWindowDimensions();
    const aAllowedList = ['inbox', 'direct', 'saved'];

    let defaultMenuName = 'inbox';
    let defaultConvoId = '';
    const aUrl = props.url.split('/');
    if (aUrl.length > 1)
        defaultMenuName = aUrl[1];
    if (aUrl.length > 2)
        defaultConvoId = aUrl[2];

    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const menuDefaultList = props.data.menu.filter(item => aAllowedList.includes(item.name));
    const [menu, setMenu] = useState({ data: menuDefaultList, index: menuDefaultList.findIndex(item => item.name == defaultMenuName) });
    const [convos, setConvos] = useState(false);
    const [convoId, setConvoId] = useState(defaultConvoId);
    const [jots, setJots] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(width < 768);
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(74);
    const refListConvos = useRef();
    const refListJots = useRef();

    const selectedConvoIndex = convos?.data && convoId ? convos.data.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convos?.data ? convos.data[selectedConvoIndex] : false;
    
    //console.log("selectedConvoselectedConvo", defaultConvoId,  convoId, selectedConvo, selectedConvoIndex, convos)

    let { currentUser, setCurrentUser } = useCurrentUser();

    const layoutHeight = height - 64;
    const layoutHeightLeft = layoutHeight - 64;
    const layoutHeightRight = layoutHeight - 64 - formHeight;
    const allowChangeMenu = true;

    const aIconsAliases = { 'inbox': 'House', 'comment': 'Chats', 'reply': 'Bell', 'bookmark': 'Bookmarks' };

    let { data: dynamicData, error } = useSWR(
        commentForm ? ['/api.php?r=bx_messenger/get_send_form/&params=' + JSON.stringify({ id: selectedConvo.id }), '', commentForm] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    const fetchConvos = async () => {
        if (menu) {
            const menuItem = menu?.data[menu?.index].name;
            if (menuItem) {
                let request_url = '/api.php?r=bx_messenger/get_convos_list/&params[]=' + JSON.stringify({ group: menuItem, count: 0 });
                const sResponse = await fetcher(request_url);
                let convos = sResponse.data;
               
                setConvos({ data: convos});
            }
        }
    }

    const fetchItems = async (convoId) => {
        //if (convos) {
           // const convoId = convos?.data[selectedConvoIndex].id;
           // if (convoId) {
                let request_url = '/api.php?r=bx_messenger/get_convo_messages/&params=' + JSON.stringify({ lot: convoId, jot: 0 });
                const sResponse = await fetcher(request_url);
                setJots({ data: sResponse.data, index: 0 });
                setTimeout(() => {
                    scrolTo();
                }, 500);
               
          //  }
      //  }
    }

    const updateState = () => {
        if (!isWeb)
            return;
        if (menu && convos) {
            window.history.pushState(null, null, "/messenger/" + menu.data[menu.index].name + '/' + selectedConvo.id + '/');
        }
    }

    useEffect(() => {
        setIsSmallScreen(width < 768);
    }, [width]);

    useEffect(() => {
        setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);

    useEffect(() => {
        fetchConvos();
    }, [menu]);

    useEffect(() => {
        if (convoId == '' && convos){
            //console.log("convos?.data[0]convos?.data[0]", convos)
            setConvoId(convos?.data[0]?.id);
        }
    }, [convos]);

    useEffect(() => {
        console.log("convoId", convoId)
        fetchItems(selectedConvo.id);

        updateState()
        if (currentUser) {
            subscribe(currentUser.pusher, 'bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
            subscribe(currentUser.pusher, 'bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
        }

    }, [convoId]);

    useEffect(() => {
        console.log("5555", selectedConvo)
        fetchItems(selectedConvo.id);
        if (currentUser) {
            subscribe(currentUser.pusher, 'bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
            subscribe(currentUser.pusher, 'bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
        }
    }, []);

    const onNewMessage = (data) => {
        setJotUpdated(data);
    }

    const onCheckConvos = (data) => {
        if (convoId != data.id) {
            fetchConvos();
        }
    }

    const scrolTo = () => {
        //TODO
        if (refListJots && refListJots?.current) {
            refListJots.current.scrollToIndex({ animated: true, align: "end", behavior: "auto", index: selectedConvo.total_messages - selectedConvo.unread -1 });
        }
    }

    useEffect(() => {
        if (jotUpdated) {
            if (jotUpdated.action == 'added') {
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: [...prevJots.data.jots, ...jotUpdated.data.jots]
                    }
                }));
                scrolTo();
            }
            if (jotUpdated.action == 'edited') {
                let newJots = jots.data.jots.map(item => item.id === jotUpdated.data.jots[0].id ? jotUpdated.data.jots[0] : item);
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: newJots
                    }
                }));
            }
            if (jotUpdated.action == 'deleted') {
                let idToRemove = jotUpdated.data; // The id of the item you want to remove
                let newJots = jots.data.jots.filter(item => item.id !== idToRemove);
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: newJots
                    }
                }));
            }

        }
    }, [jotUpdated]);

    if (!menu || !selectedConvo)
        return <></>

    const showMenu = () => {

        const Menus = menu.data?.length && menu.data.map((item, index) => {
            return (
                <View className='mb-2' key={'menus' + index}>
                    <Button variant="outline" startDecorator={getIcon(item.icon)} rounded align="start" title={item.title} onPress={() => changeMenu(index)} />
                </View>
            )
        });
        setBottomSheetData({ title: 'Threads', content: Menus, showClose: true, snapPoints: ['25%', '70%'] });
    }

    const changeMenu = (index) => {
        setBottomSheetData(false)
        setConvoId('');
        setMenu(prevMenu => ({ ...prevMenu, index: index }))
    }

    const changeConvo = (convo) => {
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }


    const showConvo = () => {
        setPanelsVisible({ convos: true, jots: false })
    }

    const onSave = (data) => {
        setConvos(prevConvos => ({
            ...prevConvos,
            data: [data.convo, ...prevConvos.data]
        }));

        setBottomSheetData(false);
    }

    const newConvo = () => {
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSave} />, showClose: true, snapPoints: ['25%', '70%'] });
    }

    const getIcon = (icon) => {
        const sIcon = icon && icon.split(' ')[0];
        return sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon] : sIcon;
    }

    const onFormSubmit = (formData, d) => {
        formData.set("id", convos?.data[selectedConvoIndex].id);
        setCommentForm(formData);
        Keyboard.dismiss();
    }

    const handleLayout = (event) => {
        setFormHeight(event.nativeEvent.layout.height)
    };

    return (
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full items-stretch '}>
            <Row style={{ height: layoutHeight }} className='items-stretch '>
                {panelsVisible.convos && <View className={' w-full bg-bgrcard dark:bg-bgrcard-d md:w-2/5 md:pr-2 border-dashed border-bdrcard dark:border-bdrcard-d border-r'}>
                    <View>
                        <Row className=' py-2 gap-x-2 items-center h-16 justify-center px-2 '>
                            <View className='flex-auto'>
                                <Button disabled={!allowChangeMenu} variant="text" startDecorator={getIcon(menu.data[menu.index].icon)} rounded align="start" title={menu.data[menu.index].title} onPress={() => showMenu()} />
                                {/* <Text className="text-2xl lg:text-3xl font-bold font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">{menu.data[menu.index].title}</Text>*/}
                            </View>
                            {/*<Button variant="outline" size="sm" startDecorator="MagnifyingGlass" rounded align="start" />*/}
                            <Button variant="outline" startDecorator="Plus" rounded align="start" onPress={() => newConvo()} />
                        </Row>
                    </View>
                    <View style={{ height: layoutHeightLeft }}>
                        {convos?.data?.length > 0 && <UniList
                            refer={refListConvos}
                            height={layoutHeightLeft}

                            data={convos.data}
                            renderItem={({ item, index }) => <ConvosItem selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
                        />}
                    </View>
                </View>}
                {panelsVisible.jots && <View className={' w-full md:w-3/5 sm:pl-2 bg-bgrcard dark:bg-bgrcard-d'}>
                    <Row className='px-2 py-2 gap-x-2 h-16 items-center px-2 md:px-0'>
                        {convos && (
                            <>
                                {isSmallScreen && <Button variant="text" startDecorator='ArrowLeft' rounded align="start" onPress={() => showConvo()} />}
                                <Text className="text-lg lg:text-xl font-bold font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">{selectedConvo.title}</Text>
                            </>
                        )}
                    </Row>
                    <View style={{ height: layoutHeightRight }} className='mx-2'>
                        {jots?.data?.jots?.length > 0 && <UniList
                            refer={refListJots}
                            data={jots.data.jots}
                            height={layoutHeightRight}
                            useWindowScroll
                            renderItem={({ item, index }) => <JotItem item={item} index={index}  />}
                        />}
                    </View>
                    <Row className='bg-bgrcard dark:bg-bgrcard-d border-bdr dark:border-bdr-d  border-t border-bdr dark:border-bdr-d pr-2 ' onLayout={handleLayout}>
                        <Form {...props.data.form} name='bx_messenger' resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />

                    </Row>
                </View>}
            </Row>
        </View>
    );
}

const User = ({ data, onSelect }) => {
    return <Pressable onPress={() => onSelect(data)}>
        <View className="p-1 pr-2 group duration-200 rounded-full active:opacity-50 active:translate-y-1
                hover:bg-bgritem-h dark:hover:bg-bgritem-dh max-w-5xl self-center w-full border border-bdrnavbar dark:border-bdrnavbar-d mb-2">
            <Profile displaySize="xs" {...data.author_data} url="" />
        </View>
    </Pressable>
};

const CreateConvo = memo(({ onSave }) => {
    const [users, setUsers] = useState([]);
    const [susers, setSUsers] = useState([]);
    const [showLoading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSearchUsers = useCallback(async (sValue) => {
        setLoading(true);
        let request_url = '/api.php?r=bx_messenger/search_users/&params=' + JSON.stringify({ term: sValue });
        const sResponse = await fetcher(request_url);
        setUsers(sResponse.data);
        setLoading(false);

    }, [users]);

    const handlerOnSelect = useCallback((oData) => {
        if (susers.find((user) => user.id === oData.id) === undefined)
            setSUsers((prev) => ([...prev, oData]));

        setUsers(users.filter((user) => user.id !== oData.id));
    }, [users]);

    const handlerOnRemove = useCallback((oData) => {
        if (users.find((user) => user.id === oData.id) === undefined)
            setUsers((prev) => [...prev, oData]);

        setSUsers(susers.filter((user) => user.id !== oData.id));

    }, [users, susers]);

    const handleSave = async () => {
        let request_url = '/api.php?r=bx_messenger/save_parts_list/&params=' + JSON.stringify({ parts: susers.map(item => item.id) });
        const sResponse = await fetcher(request_url);
        if (sResponse.data.code == 0) {
            onSave(sResponse.data)
        }
        else {
            setMessage(sResponse.data.message)
        }
    };

    return <View className="">
        <Row className="text-center w-full  flex-wrap gap-x-2 py-2">
            {susers && susers.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnRemove} />)}
        </Row>
        <Row className="gap-x-2">
            <InputRounded
                placeholder={"Select users..."}
                className="px-2 w-full"
                onChangeText={handleSearchUsers}
                role="textbox" aria-label="Select users..."
            />
            <Button variant="outline" disabled={susers.length == 0} startDecorator="Check" rounded align="start" onPress={() => handleSave()} />

        </Row>
        <Row>
            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{message}</Text>
        </Row>
        <Row className="text-center py-2 w-full  flex-wrap gap-x-2 ">
            {users && !showLoading && users.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnSelect} />)}
            {showLoading && <View className=' w-full items-center justify-center py-2'><Loading /></View>}
        </Row>
    </View>
});

function JotItem({ item, index }) {
    const [postData, setPostData] = useState(null)
    const [viewState, setViewState] = useState({ view: '' })
    const handleManageMenuSelect = async (oItem, event) => {

        switch (oItem.name) {
            case 'edit':
                const result = await fetcher('/api.php?r=bx_messenger/get_send_form/&params=' + JSON.stringify({ 'action': 'edit', id: item.id }));
                setViewState({ view: 'edited', data: result });
                break;

            case 'remove':
                const result1 = await fetcher('/api.php?r=bx_messenger/remove_jot/&params=' + JSON.stringify({ jot_id: item.id, lot_id: item.lot_id }));
                break;
        }
    }

    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_messenger/get_send_form/&params[]=', '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    let aImg = item?.files.map((obj) => {
        return {
            src: obj.src,
            type: 'image',
        }
    });

    const onFormSubmit = (formData, d) => {
        formData.set("id", item.lot_id);
        setViewState({ view: '' })
        setPostData(formData);
    }

    return (
        <AnimatedBlock key={'jot' + index}>
            <View className='w-full mb-4'>
                <View className="flex-row gap-x-2 ">
                    <View className="w-10 flex-0 ">
                        <Profile {...item.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                    </View>
                    <View className='flex-1 flex-col gap-y-1 mb-2 '>
                        <View className={'bg-neutral-500/10 border border-neutral-500/10 rounded-lg px-2.5 u-vanilla-html-small  py-2'} >
                            <View className="flex-row flex-1 items-center mb-0.5 overflow-hidden">
                                <Profile {...item.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                <View><Text className="text-neutral-500 px-1">·{index}</Text></View>
                                <Time ts={item.created}></Time>
                            </View>

                            {viewState.view == 'edited' ? (
                                <View className="w-full">
                                    <Form
                                        name='bx_messenger'
                                        {...viewState.data}
                                        classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                        onFormSubmit={onFormSubmit}
                                    />
                                    <View className="mx-4 mb-4">
                                        <Button
                                            title="Cancel"
                                            fullWidth
                                            size="base"
                                            startDecorator="X"
                                            variant="outline"
                                            onPress={() => setViewState({ view: '' })}
                                        />
                                    </View>
                                </View>
                            ) : <><Html data={linkify(item?.message)} /><CarouselMemo aImg={aImg} /></>}



                        </View>
                    </View>
                </View>
                <View className="ml-2 justify-end items-end">
                    <DropdownMenu items={item.menu.filter(item => ['remove', 'edit'].includes(item.name)).map((aItem) => {
                        return {
                            id: aItem.id + '-' + aItem.name,
                            name: aItem.name,
                            link: aItem.link,
                            title: aItem.title
                        };
                    })} onSelect={handleManageMenuSelect}>
                        <Button variant="outline" size="xs" startDecorator="DotsThreeOutline" onPress={() => { FeedbackHaptics('Medium'); }} rounded />
                    </DropdownMenu>
                </View>
            </View>


        </AnimatedBlock>
    )
}

function ConvosItem({ item, index, changeConvo, selectedIndex }) {
    return (
        <AnimatedBlock key={'convos' + index}>
            <Pressable onPress={() => changeConvo(item)}>
                <Card addClassName={(selectedIndex == index ? ' bg-neutral-500/10 ' : '') + 'group  active:opacity-50 active:translate-y-1 flex-row px-3 py-2 '} rounded="rounded-none" margin=" -mb-[1px]">
                    <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                        <Profile
                            {...item.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                    </View>
                    <View className="flex-auto flex-col my-auto ">
                        <View className="flex-row gap-x-2">
                            <Text className="text-xs flex-auto font-semibold text-neutral-800 dark:text-neutral-200">
                                {item.author_data.display_name}
                            </Text>
                            <Time className="text-xs flex-none" ts={item.date}></Time>
                        </View>
                        <Text className="flex-auto text-base  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                            {item.title}
                        </Text>
                        <View className="flex-row w-full items-end content-end">
                            <Text
                                className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                                numberOfLines={1}
                            >
                                {stripTags(item.message)}
                            </Text>
                            <View className="flex-none bg-primary dark:bg-primary-d rounded-full    my-auto h-min px-1.5">
                                {item.unread > 0 && (
                                    <Text className="text-xs text-white dark:text-black font-medium">
                                        {item.unread}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Card>
            </Pressable>
        </AnimatedBlock>
    )
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
