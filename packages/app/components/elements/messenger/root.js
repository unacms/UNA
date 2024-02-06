import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { appSetting, getLayout } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import { Button } from 'app/design/controls'
import { BottomSheetData } from 'app/context/bottomsheet';
import Form from 'app/components/elements/form';
import { Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import useSWR from "swr";
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';

import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';
import CreateConvo from 'app/components/elements/messenger/parts/new-convo';

export default function (props) {

    console.log(props);
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
    const menu = props.menu
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
   
    let { currentUser, setCurrentUser } = useCurrentUser();

    const layoutHeight = height - 64;
    const layoutHeightLeft = layoutHeight;
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
        let request_url = '/api.php?r=bx_messenger/get_convo_messages/&params=' + JSON.stringify({ lot: convoId, jot: 0 });
        const sResponse = await fetcher(request_url);
        setJots({ data: sResponse.data, index: 0 });
        setTimeout(() => {
            scrolTo();
        }, 500);
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

    const changeConvo = (convo) => {
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }


    const showConvo = () => {
        setPanelsVisible({ convos: true, jots: false })
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
                    <View style={{ height: layoutHeightLeft }}>
                        {convos?.data?.length > 0 && <UniList
                            refer={refListConvos}
                            height={layoutHeightLeft}

                            data={convos.data}
                            renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
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
                            renderItem={({ item, index }) => <ItemJot item={item} index={index}  />}
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
