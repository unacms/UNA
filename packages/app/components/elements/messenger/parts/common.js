import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { appSetting } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import { Button } from 'app/design/controls'
import Form from 'app/components/elements/form';
import { Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import useSWR from "swr";
import { useCurrentUser } from 'app/context/user';
import { subscribe, unbind } from 'app/ui/atoms/socket';

import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';

export default function ({defaultConvoId, selectedMenu, convos, layoutHeight, fetchConvos, data}) {

    const isWeb = Platform.OS == 'web'
    const { width, height } = useWindowDimensions();

    //console.log('menu', selectedMenu, convos, props.defaultConvoId);

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

    const [replyItem, setReplyItem] = useState(false);

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
        setConvoId(defaultConvoId);
    }, [selectedMenu, defaultConvoId]);

    useEffect(() => {
        if (selectedConvo) {
            fetchItems(selectedConvo.id);

            updateState()
            if (currentUser) {
                unbind(currentUser.pusher, 'bx_messenger');
                subscribe(currentUser.pusher, 'bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
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
        if (data.id == convoId) {
            setJotUpdated(data);
        }
    }

    const onCheckConvos = (data) => {
        if (convoId != data.id) {
            fetchConvos();
        }
    }

    const scrolTo = () => {
        setTimeout(() => {
            if (refListJots && refListJots?.current && jots.data?.jots?.length > 0) {
                let offset = 0;
                if (selectedConvo.unread > 0)
                    offset = selectedConvo.unread - 1;
                refListJots.current.scrollToIndex({ animated: false, align: "end", behavior: "auto", index: jots.data?.jots?.length - offset - 1 });
            }
        }, 100);
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
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }

    const showConvo = () => {
        setPanelsVisible({ convos: true, jots: false })
    }

    const onFormSubmit = (formData, d) => {
        formData.set("id", convos?.data[selectedConvoIndex].id);
        if (replyItem) {
            formData.set("reply", replyItem.id);
        }
        setCommentForm(formData);
        Keyboard.dismiss();
        setReplyItem(false)
    }

    const handleLayout = (event) => {
        setFormHeight(event.nativeEvent.layout.height)
    };

    const handleReply = (item) => {
        setReplyItem(item)
    };

    const handleCancelReply = (item) => {
        setReplyItem(false)
    };

    return (
        <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto w-full items-stretch'}>
            <Row className='items-stretch '>
                <Convos
                    isVisible={panelsVisible.convos}
                    layoutHeightLeft={layoutHeightLeft}
                    data={convos?.data}
                    refListConvos={refListConvos}
                    selectedConvoIndex={selectedConvoIndex}
                    changeConvo={changeConvo}
                />
                {(panelsVisible.jots && selectedConvo && jots?.data?.jots) && <View className={' w-full md:w-3/5 sm:pl-2 bg-bgrcard dark:bg-bgrcard-d'}>
                    <Jots
                        isSmallScreen={isSmallScreen}
                        title={selectedConvo.title}
                        layoutHeightRight={layoutHeightRight}
                        data={jots?.data?.jots}
                        refListJots={refListJots}
                        showConvo={showConvo}
                        handleReply={handleReply}
                    />
                    <FormContainer
                        form={data.form}
                        replyItem={replyItem}
                        onFormSubmit={onFormSubmit}
                        handleCancelReply={handleCancelReply}
                        handleLayout={handleLayout}
                    />

                </View>}
            </Row>
        </View>
    );
}

const Convos = memo(({ isVisible, layoutHeightLeft, data, refListConvos, selectedConvoIndex, changeConvo }) => {
    return <>{isVisible && <View style={{ height: layoutHeightLeft }} className={' w-full bg-bgrcard dark:bg-bgrcard-d md:w-2/5 md:pr-2 border-dashed border-bdrcard dark:border-bdrcard-d border-r'}>
        {data.length > 0 && <UniList
            refer={refListConvos}
            height={layoutHeightLeft}

            data={data}
            renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
        />}
    </View>}</>
});

const Jots = memo(({ isSmallScreen, title, layoutHeightRight, data, refListJots, showConvo, handleReply }) => {
    return (<>
        <Row className='px-2 py-2 gap-x-2 h-16 items-center px-2 md:px-0'>
            {isSmallScreen && <Button variant="text" startDecorator='ArrowLeft' rounded align="start" onPress={() => showConvo()} />}
            <Text className="text-lg lg:text-xl font-bold font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">{title}</Text>
        </Row>
        <View style={{ height: layoutHeightRight }} className='mx-2'>
            {data.length > 0 && <UniList
                refer={refListJots}
                data={data}
                height={layoutHeightRight}
                useWindowScroll
                renderItem={({ item, index }) => <ItemJot handleReply={handleReply} item={item} index={index} />}
            />}
        </View>
    </>);
});

const FormContainer = memo(({ form, replyItem, onFormSubmit, handleCancelReply, handleLayout }) => {
    return (
        <View className='bg-bgrcard dark:bg-bgrcard-d border-bdr dark:border-bdr-d  border-t border-bdr dark:border-bdr-d pr-2 ' onLayout={handleLayout}>
            {
                replyItem && (<View className='bg-bgrcard dark:bg-bgrcard-d rounded-sm border-l-2 border-primary/50  py-1 pl-2 mt-2 mx-2'>
                    <Row className='items-start justify-between max-w-full relative'>
                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to: </Text>
                                <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{replyItem.author_data.display_name}</Text>
                            </Row>
                            <Text className='text-sm overflow-hidden text-neutral-900 dark:text-neutral-50' numberOfLines={3}>{replyItem.message}</Text>
                        </View>
                        <View className=" right-0 t-0">
                            <Button align="start" rounded startDecorator="X" size="xs" variant="outline" onPress={() => handleCancelReply()} />
                        </View>
                    </Row>
                </View>)
            }
            <Form {...form} name='bx_messenger' resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
        </View>
    )
});