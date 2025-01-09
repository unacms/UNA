import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import { Button, InputRounded, InputRoundedSmall } from 'app/design/controls'
import Form from 'app/components/elements/form';
import { Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import useSWR from "swr";
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';
import { Nav2 } from 'app/components/elements/messenger/parts/nav';
import { linkedText } from 'app/lib/text-helpers';
import CreateConvo, { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import Msg from 'app/ui/molecules/msg';
import { useBottomSheetData } from 'app/context/bottomsheet';
import Profile from 'app/ui/molecules/profile'
import ElementMsg from 'app/components/elements/msg';
import { getBackButtonWeb } from 'app/lib/common-helpers'

export default function ({ defaultConvoId, selectedMenu, convos, layoutHeight, fetchConvos, data, onSave, addButtons }) {
    const isWeb = Platform.OS == 'web'
    const { width, height } = useWindowDimensions();
    const { setBottomSheetData } = useBottomSheetData();
    const [convoId, setConvoId] = useState(defaultConvoId);
    const [jots, setJots] = useState(false);
    const [listError, setListError] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(width < LAYOUT_BREAKPOINTS.md);
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(100);
    const [showMsg, setShowMsg] = useState(false);
    const refListJots = useRef();
    const selectedConvoIndex = convos?.data && convoId ? convos.data.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convos?.data ? convos.data[selectedConvoIndex] : false;
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [searchValue, setSearchValue] = useState('');
    const [replyItem, setReplyItem] = useState(false);

    const layoutHeightLeft = layoutHeight;
    let layoutHeightRight = isWeb ? layoutHeight - 40 - formHeight : layoutHeight - 40 - formHeight;
    if (listError)
        layoutHeightRight = layoutHeightRight - 60
    let { data: dynamicData, error } = useSWR(
        commentForm ? ['/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo.id, convo_id: selectedConvo.id, reply_id: replyItem ? replyItem.id : 0 }), '', commentForm] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    useEffect(() => {
        data.form.data.inputs.message.value = '';
        setReplyItem(false);
        setCommentForm(false);
        if (dynamicData?.data?.jot_id > 0)
            scrolTo();

        if (dynamicData?.data?.data) {
            setJotUpdated(dynamicData?.data?.data);
        }

    }, [dynamicData]);

    const handleSearch = useCallback(async (sValue) => {
        setSearchValue(sValue);
    }, []);

    useEffect(() => {
        fetchConvos(searchValue);
        if (convos && convos.data.length > 0)
            setConvoId(convos.data[0].id);
    }, [searchValue]);

    const fetchItems = async (convoId, isAddJots) => {
        let start = 0;

        if (jots?.data?.params?.limit && isAddJots)
            start = jots?.data?.params?.start + jots?.data?.params?.limit;

        let request_url = '/api.php?r=bx_messenger/get_convo_messages/Services&params=' + JSON.stringify({ lot: convoId, jot: 0, start: start });
        const sResponse = await fetcher(request_url);

        setJots(prevJots => ({
            ...prevJots,
            data: {
                params: sResponse.data.params,
                jots: prevJots && isAddJots ? [...sResponse.data.jots, ...prevJots?.data?.jots] : sResponse.data.jots
            },
            index: prevJots && isAddJots ? prevJots.index : 0
        }));
    }

    const updateState = () => {
        if (!isWeb)
            return;
        if (selectedMenu && selectedConvo) {
            window.history.pushState(null, null, appSetting('messenger', 'url') + '/' + selectedMenu + '/' + selectedConvo.id + '/');
        }
    }

    useEffect(() => {
        setIsSmallScreen(width < LAYOUT_BREAKPOINTS.md);
    }, [width]);


    useEffect(() => {
        setConvoId(defaultConvoId);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }, [selectedMenu, defaultConvoId]);

    useEffect(() => {
        if (selectedConvo) {
            subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
            subscribe('bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
            fetchItems(selectedConvo.id, false);
            updateState();
        }
    }, [convoId]);


    useEffect(() => {
        if (!defaultConvoId)
            setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);


    useEffect(() => {
        if (convoId == '' && convos) {
            setConvoId(convos?.data[0]?.id);
        }
    }, [convos]);


    useEffect(() => {
        setListError(null);
    }, [convoId]);
    const onNewMessage = (data) => {
        if (data.id == convoId) {
            setJotUpdated(data);
        }
    }

    const onCheckConvos = (data) => {
        /*if (convoId != data.id) {
            fetchConvos();
        }*/
        //MAY BE NEED TO RETURN
    }

    const scrolTo = () => {
        if (refListJots && refListJots?.current) {
            let offset = 0;
            if (selectedConvo.unread > 0)
                offset = selectedConvo.unread - 1;
            if (isWeb) {
                setTimeout(() => {
                    if (refListJots?.current)
                        refListJots.current.scrollToIndex({ animated: false, align: "end", behavior: "smooth", index: 9999999999 });
                }, 100);
            }
        }

    }

    useEffect(() => {
        if (jotUpdated) {

            if (jotUpdated.action == 'added') {
                console.log("jotUpdated", jotUpdated)
                if (jotUpdated.data.jots) {
                    setJots(prevJots => ({
                        ...prevJots,
                        data: {
                            ...prevJots.data,
                            jots: [...prevJots.data.jots, ...jotUpdated.data.jots]
                        }
                    }));
                }
                if (jotUpdated.data.msg) {
                    setListError(jotUpdated.data.msg);
                }
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
                    },
                    index: 0
                }));
            }

        }
    }, [jotUpdated]);

    useEffect(() => {
        if (jots?.index == 0) {
            scrolTo();
        }
    }, [refListJots?.current]);//selectedConvo refListJots?.current, jots?.index

    const changeConvo = useCallback((convo) => {
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }, [isSmallScreen, setConvoId, setPanelsVisible]);

    const showConvo = useCallback(() => {
        setPanelsVisible({ convos: true, jots: false })
    },[]);

    const deleteConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/delete_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            fetchConvos();
            setConvoId(convos.data[0].id);
        }
    }, [selectedConvo?.id2, convos.data]);

    const leaveConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/leave_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            fetchConvos();
            setConvoId(convos.data[0].id);
        }
    }, [selectedConvo?.id2, convos.data]);

    const getConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/get_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            const content = (<View className='items-center justify-center'>
                <Row className='mb-4 gap-x-4'>
                    <Profile {...sResponse.data.lot.author_data} />
                    <View>
                        <Text>Participants: {sResponse.data.lot.parts}</Text>
                        <Text>Messages: {sResponse.data.lot.messages}</Text>
                        <Text>Files: {sResponse.data.lot.files}</Text>
                    </View>
                </Row>
            </View>)
            setBottomSheetData({ title: 'Conversation info', content: content, showClose: true, snapPoints: ['25%', '50%'] });
        }
    }, [selectedConvo?.id2, convos.data]);

    const onSaveHandler = (data) => {
        setBottomSheetData(false);
        onSave(data);
    }

    const editConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/get_parts_list/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} initedData={sResponse.data} convoId={selectedConvo.id2} />, showClose: true, snapPoints: ['85%', '85%'] });
    }, [selectedConvo?.id2, convos.data]);

    const onFormSubmit = useCallback((formData, d) => {
        //Keyboard.dismiss();
        setCommentForm(formData);
    },[]);

    const handleLayout = useCallback((event) => {
        setFormHeight(event.nativeEvent.layout.height + 16)
    },[]);

    const handleReply = useCallback((item) => {
        setReplyItem(item)
    },[])

    const handleCancelReply = useCallback((item) => {
        setReplyItem(false)
    },[])

    const handleStartReached = useCallback(() => {
        if (selectedConvo)
            fetchItems(selectedConvo.id, true);
    },[selectedConvo?.id])

    const handleBackButton = () => {
        if (!panelsVisible.convos) {
            showConvo()
        }
        else {
            setConvoId(-1);
            routerExpo.back();
        }
    };

    const convosComponent = useMemo(() => {
        return panelsVisible.convos && <Convos
            layoutHeightLeft={layoutHeightLeft}
            data={convos?.data}
            selectedConvoIndex={selectedConvoIndex}
            changeConvo={changeConvo}
            handleSearch={handleSearch}
            searchValue={searchValue}
            onSave={onSave}
            addButtons={addButtons}
        />
    }, [
        panelsVisible.convos,
        layoutHeightLeft,
        convos?.data.length,
        selectedConvoIndex,
        changeConvo,
        handleSearch,
        searchValue,
        onSave,
        addButtons,
    ]);
    //const previousValues = useRef({});
    const jotsComponent = useMemo(() => {

       /* const dependencies = {
            panelsVisibleJots: panelsVisible.jots,
            selectedConvo,
            jotsDataJots: jots?.data?.jots,
            isSmallScreen,
            layoutHeightRight,
            refListJots,
            showConvo,
            deleteConvo,
            leaveConvo,
            getConvo,
            editConvo,
            handleReply,
            handleStartReached,
            listError,
            dataForm: data.form,
            replyItem,
            onFormSubmit,
            handleCancelReply,
            handleLayout,
        };

        Object.keys(dependencies).forEach((key) => {
            if (previousValues.current[key] !== dependencies[key]) {
                console.log(`${key} rerender555 :`, {
                    previous: previousValues.current[key],
                    current: dependencies[key],
                });
            }
        });
        previousValues.current = dependencies;*/
        return (
            (!!panelsVisible.jots && !!selectedConvo && jots?.data?.jots) && (
                <View className="w-full md:w-3/5 flex-1 bg-bgrcard dark:bg-bgrcard-d">
                    <View className="w-full flex-auto">
                        <Jots
                              isSmallScreen={isSmallScreen}
                              title={selectedConvo.title}
                              layoutHeightRight={layoutHeightRight}
                              data={jots?.data?.jots}
                              refListJots={refListJots}
                              showConvo={showConvo}
                              deleteConvo={deleteConvo}
                              leaveConvo={leaveConvo}
                              getConvo={getConvo}
                              editConvo={editConvo}
                              handleReply={handleReply}
                              startReached={handleStartReached}
                        />
                        {listError && (
                            <View className="mx-4">
                                <ElementMsg data={listError} />
                            </View>
                        )}
                    </View>
                    <KbAvoidingView>
                        <FormContainer
                            form={data.form}
                            replyItem={replyItem}
                            onFormSubmit={onFormSubmit}
                            handleCancelReply={handleCancelReply}
                            handleLayout={handleLayout}
                        />
                    </KbAvoidingView>
                </View>
            )
        );
    }, [
        panelsVisible.jots,
        selectedConvo,
        jots?.data?.jots,
        isSmallScreen,
        layoutHeightRight,
        refListJots,
        showConvo,
        deleteConvo,
        leaveConvo,
        getConvo,
        editConvo,
        handleReply,
        handleStartReached,
        listError,
        data.form,
        replyItem,
        onFormSubmit,
        handleCancelReply,
        handleLayout,
    ]);


    if (!isWeb) {
        return (
            <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto w-full h-full items-stretch'}>
                <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                {convosComponent}
                {jotsComponent}
            </View>
        );
    }

    return (
        <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto  w-full items-stretch '}>
            <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
            <Row className='items-stretch '>
                {convosComponent}
                {jotsComponent}
            </Row>
        </View>
    );
}

const Convos = memo(({ layoutHeightLeft, data, selectedConvoIndex, changeConvo, onSave, searchValue, handleSearch, addButtons }) => {
    const [showSearch, setShowSearch] = useState(false);

    function handleSearch2() {
        setShowSearch(!showSearch)
    }

    function onSave2() {
        handleSearch('')
    }

    const srch = <InputRounded name="search" placeholder={("Search") + '...'} value={searchValue} onChangeText={(value) => handleSearch(value)} />;


    return <View style={{ height: layoutHeightLeft }} className={' w-full bg-bgrcard dark:bg-bgrcard-d lg:w-80 2xl:w-96 border-bdrtabbar dark:border-bdrtabbar-d border-r'}>
        <Row className='py-2 px-3 sm:px-4 border-b border-bdrtabbar dark:border-bdrtabbar-d gap-x-4'>
            <View className='flex-auto hidden lg:flex'>
                {srch}
            </View>
            {!showSearch && <Row className='lg:hidden flex-auto  items-center '>
                {appSetting('messenger', 'back_button') && getBackButtonWeb()}
                <Text className={`${Platform.OS == 'web' ? 'text-2xl' : 'text-3xl'} lg:hidden font-bold text-neutral-800 dark:text-neutral-200`}>Messenger</Text>
            </Row>}
            {showSearch && <Row className='lg:hidden flex-auto  items-center '>
                {srch}
            </Row>}
            <Row className='flex-row my-auto gap-x-2'>
                <View className='lg:hidden  '>
                    <Button startDecorator="MagnifyingGlass" variant="secondary" rounded onPress={() => handleSearch2()} />
                </View>
                {addButtons}
            </Row>
        </Row>
        {data && data.length > 0 ? <>

            <UniList
                height={layoutHeightLeft}
                data={data}
                mode="simple"
                renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
            /></>
            : <View className='items-center justify-center w-full h-full'><View className="pt-8">
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-neutral-500/10 ">
                    <View className="flex-col mx-auto  text-neutral-800 dark:text-neutral-200 ">
                        <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                            No conversations found
                        </Text>
                    </View>
                    <CreateConvoButton variant='full' onSave={onSave} onShow={onSave2} />
                </View>
            </View></View>

        }
    </View>
});
/*bg-neutral-500/10 border-b border-neutral-500/10*/
const Jots = memo(({ isSmallScreen, title, layoutHeightRight, data, refListJots, showConvo, deleteConvo, leaveConvo, getConvo, editConvo, handleReply, startReached }) => {
    const isWeb = Platform.OS == 'web'
    const initValue = Platform.OS === 'ios' ? 48 : 0;

    const [keyboardHeight, setKeyboardHeight] = useState(initValue);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(initValue); // Reset keyboard height
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return (<>
        <View className='md:px-0 border-bdrcard dark:border-bdrcard-d border-b'>
            {(isWeb || true) && <Row className='px-3 py-2 items-center justify-between w-full h-[56px]'>
                <Row className='items-center justify-start overflow-hidden flex-auto '>
                    {isSmallScreen && <View className='mr-2'><Button variant="secondary" startDecorator='ArrowLeft' rounded align="start" onPress={() => showConvo()} /></View>}
                    <Text numberOfLines={1} className="text-lg lg:text-xl font-bold font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">{title}</Text>
                </Row>
                <Row className='items-center gap-x-2 '>
                    <Button buttonTooltip="Edit participants list" startDecorator="Users" variant="secondary" rounded onPress={() => editConvo()} />
                    <Button buttonTooltip="Leave" startDecorator="SignOut" variant="secondary" rounded onPress={() => leaveConvo()} />
                    <Button buttonTooltip="Delete" startDecorator='Trash' variant="secondary" rounded onPress={() => deleteConvo()} />
                    <Button buttonTooltip="Info" startDecorator='Info' variant="secondary" rounded onPress={() => getConvo()} />
                </Row>
            </Row>}
        </View>
        <View style={{ height: layoutHeightRight - keyboardHeight }} className='mx-2'>
            {data.length > 0 && <UniList
                refer={refListJots}
                {...(Platform.OS !== 'web' ? { inverted: true } : {})}
                overscan={900}
                startReached={isWeb ? startReached : null}
                onEndReached={!isWeb ? startReached : null}
                scrollToLastItem={true}
                data={isWeb ? data : data.slice().reverse()}
                height={layoutHeightRight - keyboardHeight}
                mode="simple"
                useWindowScroll
                renderItem={({ item, index }) => <ItemJot handleReply={handleReply} item={item} index={index} />}
            />}
        </View>
    </>);
});

const FormContainer = memo(({ form, replyItem, onFormSubmit, handleCancelReply, handleLayout }) => {
    const isWeb = Platform.OS == 'web'
    let padding = 12;
    return (
        <View className={`border-t border-bdr dark:border-bdr-d ${isWeb ? '' : 'min-h-20'}`} onLayout={handleLayout} style={{ paddingTop: padding, paddingBottom: padding }}>
            <View className=' ' >
                {
                    replyItem && (<View className='bg-bgrcard dark:bg-bgrcard-d rounded-sm border-l-2 border-primary/50 py-1 pl-2 mt-2 mx-2'>
                        <Row className='items-start justify-between max-w-full relative'>
                            <View className=' flex-auto pr-4'>
                                <Row className='max-w-full '>
                                    <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to: </Text>
                                    <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{replyItem.author_data.display_name}</Text>
                                </Row>
                                <Text className='text-sm overflow-hidden text-neutral-900 dark:text-neutral-50' numberOfLines={3}>{linkedText(replyItem.message, "hover:text-linkhover")}</Text>
                            </View>
                            <View className=" right-0 t-0">
                                <Button align="start" rounded startDecorator="X" size="xs" variant="outline" onPress={() => handleCancelReply()} />
                            </View>
                        </Row>
                    </View>)
                }
                <Form {...form} name='bx_messenger' resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
            </View>
        </View>
    )
});