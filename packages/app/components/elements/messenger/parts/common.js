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
import { subscribe,unbind } from 'app/ui/atoms/socket';

import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';

export default function (props) {


    const isWeb = Platform.OS == 'web'
    const { width, height } = useWindowDimensions();

    const selectedMenu = props.selectedMenu;
    const convos = props.convos
    //console.log('menu', selectedMenu, convos, props.defaultConvoId);

    const [convoId, setConvoId] = useState(props.defaultConvoId);
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

    console.log("selectedConvoselectedConvo", selectedConvo?.total_messages, selectedConvo?.unread, jots.data?.jots?.length)

    const [numMessages, setNumMessages] = useState(0);

    const layoutHeight = props.height;
    const layoutHeightLeft = layoutHeight;
    const layoutHeightRight = layoutHeight - 64 - formHeight;

    let { data: dynamicData, error } = useSWR(
        commentForm ? ['/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo.id }), '', commentForm] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    const fetchItems = async (convoId) => {
        let request_url = '/api.php?r=bx_messenger/get_convo_messages/Services&params=' + JSON.stringify({ lot: convoId, jot: 0 });
        const sResponse = await fetcher(request_url);
        setJots({ data: sResponse.data, index: 0 });
    }

    const updateState = () => {
        if (!isWeb)
            return;
        if (selectedMenu && selectedConvo) {
            window.history.pushState(null, null, "/messenger/" + selectedMenu + '/' + selectedConvo.id + '/');
        }
    }

    useEffect(() => {
        setIsSmallScreen(width < 768);
    }, [width]);


    useEffect(() => {
        setConvoId(props.defaultConvoId);
    }, [selectedMenu, props.defaultConvoId]);

    useEffect(() => {
        if (selectedConvo) {
            fetchItems(selectedConvo.id);

            updateState()
            if (currentUser) {
                console.log("selectedConvo.idselectedConvo.id", selectedConvo.id)
                currentUser.pusher.allChannels().forEach(channel => console.log("selectedConvo.idselectedConvo.id===", channel.name));
                unbind(currentUser.pusher, 'bx_messenger');
                subscribe(currentUser.pusher, 'bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
                //
                subscribe(currentUser.pusher, 'bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
            }
        }
    }, [convoId]);


    useEffect(() => {
        setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);


    useEffect(() => {
        if (convoId == '' && convos) {
            setConvoId(convos?.data[0]?.id);
        }
    }, [convos]);



    const onNewMessage = (data) => {
        console.log("datadatadata", data);
        if (data.id == convoId) {
      
            setJotUpdated(data);
        }
    }

    const onCheckConvos = (data) => {
        console.log("convoId != data.id", convoId, data.id)
        if (convoId != data.id) {
           // props.fetchConvos();
        }
    }

    const scrolTo = () => {
        setTimeout(() => {
            if (refListJots && refListJots?.current && jots.data?.jots?.length > 0) {
                console.log("scrolTo", jots.data?.jots?.length, selectedConvo.unread)
                let offset = 0;
                if (selectedConvo.unread > 0)
                    offset = selectedConvo.unread -1;
                refListJots.current.scrollToIndex({ animated: false, align: "end", behavior: "auto", index: jots.data?.jots?.length - offset -1 });
            }
        }, 500);


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
                console.log("jots.data.jots", jots.data.jots, newJots)
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

    useEffect(() => {
        scrolTo();
    }, [selectedConvo, jots.data?.jots?.length]);

    const changeConvo = (convo) => {
        //props.fetchConvos();
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }

    const showConvo = () => {
        setPanelsVisible({ convos: true, jots: false })
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
        <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto w-full items-stretch'}>
            <Row className='items-stretch '>{/*style={{ height: layoutHeight }}*/}
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
                {(panelsVisible.jots && selectedConvo) && <View className={' w-full md:w-3/5 sm:pl-2 bg-bgrcard dark:bg-bgrcard-d'}>
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
                            renderItem={({ item, index }) => <ItemJot item={item} index={index} />}
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
