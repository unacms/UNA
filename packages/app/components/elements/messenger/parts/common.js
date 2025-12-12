import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { appSetting } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import { Button, InputRoundedSmall } from 'app/design/controls'
import Form from 'app/components/elements/form';
import { Platform } from 'react-native'
//import use-SWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';
import { linkedText } from 'app/lib/text-helpers';
import CreateConvo, { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import Msg from 'app/ui/molecules/msg';
import { useBottomSheetData } from 'app/context/bottomsheet';
import Profile from 'app/ui/molecules/profile'
import ElementMsg from 'app/components/elements/msg';
import { getBackButtonWeb } from 'app/lib/common-helpers'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import BackButton from 'app/components/nav/back';
import emitter from 'app/context/emitter';
import {
    Panel,
    PanelGroup,
    PanelHandler,
} from 'app/ui/molecules/resizable-panels'
import { useIsDesktop } from 'app/context/measure';
import { useSetHeader, defaultHeader } from 'app/context/jotai/layout';

export default function ({ defaultConvoId, selectedMenu, convos, layoutHeight, fetchConvos, data, onSave, addButtons }) {
    const isWeb = Platform.OS == 'web'
    const { setBottomSheetData } = useBottomSheetData();
    const [convoId, setConvoId] = useState(defaultConvoId);
    const [jots, setJots] = useState(false);
    const [listError, setListError] = useState(false);
    const isSmallScreen = !useIsDesktop();
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [showMsg, setShowMsg] = useState(false);
    const refListJots = useRef();
    const selectedConvoIndex = convos?.data && convoId ? convos.data.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convos?.data ? convos.data[selectedConvoIndex] : false;
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [searchValue, setSearchValue] = useState('');
    const [replyItem, setReplyItem] = useState(false);



    const layoutHeightLeft = layoutHeight;
    let layoutHeightRight = layoutHeight - formHeight;
    if (listError)
        layoutHeightRight = layoutHeightRight - 60
    /* let { data: dynamicData, error } = useSWR(
         commentForm ? ['/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo.id, convo_id: selectedConvo.id, reply_id: replyItem ? replyItem.id : 0 }), '', commentForm] : null,
         fetcher,
         !true ? undefined : {
             revalidateIfStale: false,
             revalidateOnFocus: false,
             revalidateOnReconnect: false
         }
     );*/



    const { data: dynamicData, error } = useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo?.id, convo_id: selectedConvo?.id, reply_id: replyItem ? replyItem?.id : 0 }), commentForm);

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
        if (convos && convos?.data && convos?.data?.length > 0) {
            setConvoId(convos.data[0].id);
        }
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
        setConvoId(defaultConvoId);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }, [selectedMenu, defaultConvoId]);

    useEffect(() => {
        if (selectedConvo) {
            subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
            subscribe('bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
            setJots(false)
            fetchItems(selectedConvo.id, false);
            updateState();
        }
    }, [convoId]);


    useEffect(() => {
        if (!defaultConvoId)
            setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);


    useEffect(() => {
        if (convoId == '' && convos?.data?.length > 0) {
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
            if (isWeb /*&& selectedConvo.unread > 0*/) {
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
                if (jotUpdated.data.jots) {
                    setJots(prevJots => ({
                        ...prevJots,
                        data: {
                            ...prevJots.data,
                            jots: [...prevJots.data.jots, ...jotUpdated.data.jots]
                        }
                    }));
                    scrolTo();
                }
                if (jotUpdated.data.msg) {
                    setListError(jotUpdated.data.msg);
                }
            }
            if (jotUpdated.action == 'edited') {
                const newJots = jots.data.jots.map(item => item.id === jotUpdated.data.jots[0].id ? jotUpdated.data.jots[0] : item);
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
        /*  if (jots?.index == 0) {
              console.log("aaaa", jots?.index, refListJots?.current)
              scrolTo();
          }*/
    }, [refListJots?.current]);//selectedConvo refListJots?.current, jots?.index*/



    const changeConvo = useCallback((convo) => {
        emitter.emit('editor', { action: 'focus' });
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }, [isSmallScreen, setConvoId, setPanelsVisible]);

    const showConvo = useCallback(() => {
        emitter.emit('editor', { action: 'blur' });
        setPanelsVisible({ convos: true, jots: false })
        if (!isWeb)
            return;

        window.history.pushState(null, null, appSetting('messenger', 'url'));
    }, []);

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
                    <Profile displaySize="base" displayType="unit_wo_info" {...sResponse.data.lot.author_data} />
                    <View>
                        <Text className="text-neutral-900 dark:text-neutral-100">Participants: {sResponse.data.lot.parts}</Text>
                        <Text className="text-neutral-900 dark:text-neutral-100">Messages: {sResponse.data.lot.messages}</Text>
                        <Text className="text-neutral-900 dark:text-neutral-100">Files: {sResponse.data.lot.files}</Text>
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
    }, []);

    /*const handleLayout = useCallback((event) => {
        setFormHeight(event.nativeEvent.layout.height + (isSmallScreen ? 0 : 16))
    }, []);*/

    const handleReply = useCallback((item) => {
        setReplyItem(item)
    }, [])

    const handleCancelReply = useCallback((item) => {
        setReplyItem(false)
    }, [])

    const handleStartReached = useCallback(() => {
        if (selectedConvo)
            fetchItems(selectedConvo.id, true);
    }, [selectedConvo?.id, jots])

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
        return <Convos
            isSmallScreen={isSmallScreen}
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
        convos?.data?.length,
        selectedConvoIndex,
        changeConvo,
        handleSearch,
        searchValue,
        onSave,
        addButtons,
    ]);
    const jotsComponent = useMemo(() => {
        return (
            (!!panelsVisible.jots && !!selectedConvo && jots?.data?.jots) && (
                <>
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
                </>
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
        layoutHeightRight,
        layoutHeightLeft,


    ]);

    const handleLayout = useCallback((event) => {
        if (isWeb)
            setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const cellsCustomConfig = appSetting('layouts', 'messenger')

    if (!isWeb || isSmallScreen) {
        return (
            <View className='web:flex-1 w-full h-full flex-row bg-card'>
                {panelsVisible.convos && <View className=' w-full'>
                    {convosComponent}
                </View>}
                {panelsVisible.jots && <View className='flex-1 '>
                    <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    <View className={`w-full  ${!isWeb ? 'flex-1' : ''}`} style={{ height: layoutHeightRight }}>
                        {jotsComponent}
                    </View>
                    <KbAvoidingView>
                        <View onLayout={handleLayout} className='  w-full ' >
                            <FormContainer
                                form={data.form}
                                replyItem={replyItem}
                                onFormSubmit={onFormSubmit}
                                handleCancelReply={handleCancelReply}
                            />
                        </View>
                    </KbAvoidingView>
                </View>}
            </View>)
    }

    return (

        <PanelGroup
            key={`cells-messenger-${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
            autoSaveId={cellsCustomConfig.sizable ? `cells-messenger` : undefined}
            direction="horizontal"
            className={`${appSetting('layout', 'max_width')} mx-auto w-full flex-auto relative flex-row`}

        >
            <Panel
                className={`block`}
                {...cellsCustomConfig.cells?.left}
            >
                {panelsVisible.convos && <View className='w-full'>
                    {convosComponent}
                </View>}
            </Panel>
            <PanelHandler
                gap="hidden xl:block"
                sizable={cellsCustomConfig.sizable}
            />
            <Panel className=" w-full" {...cellsCustomConfig.cells?.center}>
                {panelsVisible.jots && <View className='flex-1  border-border/60 lg:border-l bg-card'>
                    <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    <View className={`w-full ${!isWeb ? 'flex-1' : ''}`} style={{ height: layoutHeightRight }}>
                        {jotsComponent}
                    </View>
                    <KbAvoidingView>
                        <View onLayout={handleLayout} className='  w-full ' >
                            <FormContainer
                                form={data.form}
                                replyItem={replyItem}
                                onFormSubmit={onFormSubmit}
                                handleCancelReply={handleCancelReply}
                            />
                        </View>
                    </KbAvoidingView>
                </View>}
            </Panel>
        </PanelGroup>
    )
}

const Convos = memo(({ layoutHeightLeft, data, selectedConvoIndex, changeConvo, onSave, searchValue, handleSearch, addButtons, isSmallScreen }) => {
    const isWeb = Platform.OS == 'web'
    const [showSearch, setShowSearch] = useState(false);

    const setHeader = useSetHeader();

    function handleSearch2() {
        setShowSearch(!showSearch)
    }

    function onSave2() {
        handleSearch('')
    }

    const srch = <InputRoundedSmall name="search" placeholder={("Search") + '...'} value={searchValue} onChangeText={(value) => handleSearch(value)} />;

    const header = <Row className=' bg-card px-3 gap-2 web:border-b border-border/60 gap-x-3 h-16'>
        <View className='flex-auto hidden lg:flex'>
            {srch}
        </View>
        {!showSearch && <Row className='lg:hidden flex-auto  items-center '>
            {appSetting('messenger', 'back_button') && getBackButtonWeb()}
            <Text className={`lg:hidden font-bold truncate flex-1  leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight font-main`}>Messenger</Text>
        </Row>}
        {showSearch && <Row className='lg:hidden flex-auto  items-center '>
            {srch}
        </Row>}
        <Row className='my-auto'>
            <View className='lg:hidden mr-1 lg:mr-0 '>
                <Button size="base" startDecorator="Search" variant="secondary" rounded onPress={() => handleSearch2()} />
            </View>
            {addButtons}
        </Row>
    </Row>

    useEffect(() => {
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
    }, [isSmallScreen, setHeader, header]);


    /*useEffect(() => {
        return () => setHeader(defaultHeader);
    }, [setHeader]);*/

    return (
        <View className='flex-1 bg-card' style={{ minHeight: layoutHeightLeft }}>
            {(isWeb && !isSmallScreen) && header}
            {data && data.length > 0 ? <View className=' w-full flex-1'>
                <UniList
                    height={layoutHeightLeft - 64}
                    data={data}
                    mode="simple"
                    useCustomScrollHandler={isSmallScreen ? true : false}

                    renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
                /></View>
                : <View className='items-center justify-center w-full h-full'><View className="pt-8">
                    <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-neutral-500/10 ">
                        <View className="flex-col mx-auto  text-neutral-800 dark:text-neutral-200 ">
                            <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                                No conversations found
                            </Text>
                        </View>
                        <CreateConvoButton variant='secondary' onSave={onSave} onShow={onSave2} />
                    </View>
                </View></View>

            }
        </View>)
});
/*bg-neutral-500/10 border-b border-neutral-500/10*/
const Jots = memo(({ isSmallScreen, title, layoutHeightRight, data, refListJots, showConvo, deleteConvo, leaveConvo, getConvo, editConvo, handleReply, startReached }) => {
    const isWeb = Platform.OS == 'web'
    const setHeader = useSetHeader();
    const menuItems = [
        { 'id': 'edit', 'title': 'Edit participants list', 'icon': 'Users' },
        { 'id': 'info', 'title': 'Info', 'icon': 'Info' },
        { 'id': 'leave', 'title': 'Leave chat', 'icon': 'LogOut' },
        { 'id': 'delete', 'title': 'Delete chat', 'icon': 'Trash' }
    ]

    const handleManage = async (item) => {
        if (item.id == "edit") {
            editConvo();
        }
        if (item.id == "leave") {
            leaveConvo();
        }
        if (item.id == "info") {
            getConvo();
        }
        if (item.id == "delete") {
            deleteConvo();
        }
    };


    const header = (
        <View className='md:px-0 w-full border-border/60 bg-card border-b h-16 justify-center'>
            <Row className='px-2 lg:px-4 items-center justify-between w-full '>
                <Row className='items-center justify-start overflow-hidden gap-3 flex-auto'>
                    {isSmallScreen && <BackButton buttonProps={{ variant: "secondary", startDecorator: 'ArrowLeft', rounded: 'rounded' }} callback={showConvo} />}
                    <Text numberOfLines={1} className="font-bold text-card-foreground text-2xl tracking-tight">{title}</Text>
                </Row>
                <Row className='items-center gap-x-2'>
                    <View>
                        <DropdownMenu onSelect={(oItem) => { handleManage(oItem) }} items={menuItems}>
                            <Button
                                variant="secondary"
                                size="base"
                                rounded

                                startDecorator="Settings"
                            />
                        </DropdownMenu>
                    </View>
                </Row>
            </Row>
        </View>
    )

    useEffect(() => {
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
    }, [isSmallScreen, setHeader, header]);


    /*useEffect(() => {
        return () => setHeader(defaultHeader);
    }, [setHeader]);*/

    return (<>
        {(isWeb && !isSmallScreen) && header}
        {<View className="flex-1">
            <UniList

                refer={refListJots}
                {...(Platform.OS !== 'web' ? { inverted: true } : {})}
                overscan={900}
                startReached={isWeb ? startReached : null}
                onEndReached={!isWeb ? startReached : null}
                scrollToLastItem={true}
                data={isWeb ? data : data.slice().reverse()}
                height={layoutHeightRight - 64}
                mode="simple"
                useCustomScrollHandler={isSmallScreen ? true : false}
                renderItem={({ item, index }) => <ItemJot handleReply={handleReply} item={item} index={index} />}

            /></View>}
    </>);
});

const FormContainer = memo(({ form, replyItem, onFormSubmit, handleCancelReply, handleLayout }) => {
    const isWeb = Platform.OS == 'web'

    return (

        <View className={` ${isWeb ? '' : 'min-h-20'}`} onLayout={handleLayout} style={{ paddingTop: 12, paddingBottom: 12 }}>
            <View className=' ' >
                {
                    replyItem && (<View className='bg-card rounded-sm border-l-2 border-primary/50 py-1 pl-2 mt-2 mx-2'>
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