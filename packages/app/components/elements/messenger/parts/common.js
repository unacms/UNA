import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { memo, useState, useEffect, useRef, useCallback, useMemo,  } from 'react';
import { appSetting } from 'app/lib/util'
import useDebounce from 'app/lib/hooks/debounce'
import UniList from 'app/ui/atoms/unilist'
import { Button, Input } from 'app/design/controls'
import Form from 'app/components/elements/form';
import { Platform } from 'react-native'
//import use-SWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { KbStickyView } from 'app/ui/atoms/kb-avoiding-view';
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
import { useFocusEffect, useIsFocused } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next'
import {
    Panel,
    PanelGroup,
    PanelHandler,
} from 'app/ui/molecules/resizable-panels'
import { useIsDesktop } from 'app/context/measure';
import { useSetHeader, defaultHeader, useSetHeaderHeight } from 'app/context/jotai/layout';
import { getComponent } from 'app/components/registry';
import { useSafeAreaInsets } from 'app/lib/hooks/router'

// Keep in sync with tabBarStyle.height in app/components/nav/tabs.js
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56

export default function ({ defaultConvoId, selectedMenu, convos, layoutHeight, fetchConvos, data, pageData, onSave, addButtons }) {
    const isWeb = Platform.OS == 'web'
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    // Form sits above the tab bar. On Android the root SafeAreaView also pads
    // insets.bottom (iOS edges omit bottom) — sticky must compensate both or the
    // composer lands too high when the keyboard covers that space.
    // e.g. Android: 56 + ~44 nav inset ≈ 100
    const stickyOpened = !isWeb
        ? TAB_BAR_HEIGHT + (Platform.OS === 'android' ? insets.bottom : 0)
        : 0;
    const { setBottomSheetData } = useBottomSheetData();
    const [convoId, setConvoId] = useState(defaultConvoId);
    const [jots, setJots] = useState(false);
    const [listError, setListError] = useState(false);
    const isSmallScreen = !useIsDesktop();
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const panelsVisibleRef = useRef(panelsVisible);
    panelsVisibleRef.current = panelsVisible;
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [showMsg, setShowMsg] = useState(false);
    const refListJots = useRef();
    const isFetchingJots = useRef(false);
    const hasMoreJots = useRef(true);
    const jotsPaginationRef = useRef(null);
    const [convosData, setConvosData] = useState(convos?.data || []);
    const selectedConvoIndex = convosData && convoId ? convosData.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convosData ? convosData[selectedConvoIndex] : false;
    const { currentUser, setCurrentUser } = useCurrentUser();
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

    const handleSearch = useCallback((term) => {
        fetchConvos(term);
    }, [fetchConvos]);

    useEffect(() => {
        setConvosData(convos?.data || []);
    }, [convos?.data]);

    const fetchItems = useCallback(async (targetConvoId, isAddJots) => {
        if (isAddJots && (isFetchingJots.current || !hasMoreJots.current)) return;

        const params = jotsPaginationRef.current;
        let start = 0;

        if (params?.limit && isAddJots)
            start = (params.start ?? 0) + params.limit;

        isFetchingJots.current = true;
        try {
            let request_url = '/api.php?r=bx_messenger/get_convo_messages/Services&params=' + JSON.stringify({ lot: targetConvoId, jot: 0, start: start });
            const sResponse = await fetcher(request_url);

            const newJots = sResponse.data?.jots ?? [];
            if (isAddJots && newJots.length === 0) {
                hasMoreJots.current = false;
                return;
            }

            jotsPaginationRef.current = sResponse.data.params;

            setJots(prevJots => ({
                ...prevJots,
                data: {
                    params: sResponse.data.params,
                    jots: prevJots && isAddJots ? [...newJots, ...prevJots?.data?.jots] : newJots
                },
                index: prevJots && isAddJots ? prevJots.index : 0
            }));
        } finally {
            isFetchingJots.current = false;
        }
    }, [])



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
        if (!selectedConvo) return;

        const sub1 = subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
        const sub2 = subscribe('bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
        hasMoreJots.current = true;
        jotsPaginationRef.current = null;
        setJots(false);
        fetchItems(selectedConvo.id, false);
        updateState();

        return () => {
            sub1();
            sub2();
        };
    }, [convoId]);


    useEffect(() => {
        if (!defaultConvoId)
            setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);


    useEffect(() => {
        if (convoId == '' && convosData?.length > 0) {
            setConvoId(convosData[0]?.id);
        }
    }, [convosData]);


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
            //if (isWeb /*&& selectedConvo.unread > 0*/) {
                setTimeout(() => {
                    if (refListJots?.current)
                        refListJots.current.scrollToIndex({ animated: false, align: "end", behavior: "smooth", index: 9999999999 });
                }, 100);
           // }
        }
    }

    useEffect(() => {
        if (jotUpdated) {

            if (jotUpdated.action == 'added') {
                if (jotUpdated.data.jots) {
                    const latestJot = jotUpdated.data.jots[jotUpdated.data.jots.length - 1];
                    if (latestJot) {
                        setConvosData(prevConvos => {
                            const nextConvos = [...prevConvos];
                            const targetIndex = nextConvos.findIndex(convo => convo.id == convoId);
                            if (targetIndex === -1) return prevConvos;

                            const targetConvo = nextConvos[targetIndex];
                            nextConvos[targetIndex] = {
                                ...targetConvo,
                                message: latestJot.message ?? targetConvo.message,
                                date: latestJot.created ?? targetConvo.date,
                            };
                            return nextConvos;
                        });
                    }
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
    }, [isWeb]);

    // Bottom-tab reselect: leave open chat and show conversation list.
    useEffect(() => {
        const subscription = emitter.addListener('conductor', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action !== 'reset_to_first') return;
            if (!(isSmallScreen && panelsVisibleRef.current.jots && !panelsVisibleRef.current.convos)) return;
            showConvo();
        });
        return () => subscription.remove();
    }, [isSmallScreen, showConvo]);

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
                        <Text className="text-popover-foreground ">{t('Participants:')} {sResponse.data.lot.parts}</Text>
                        <Text className="text-popover-foreground ">{t('Messages:')} {sResponse.data.lot.messages}</Text>
                        <Text className="text-popover-foreground ">{t('Files:')} {sResponse.data.lot.files}</Text>
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
        setBottomSheetData({ title: t('messenger_add_users'), content: <CreateConvo onSave={onSaveHandler} initedData={sResponse.data} convoId={selectedConvo.id2} />, showClose: true, snapPoints: ['85%', '85%'] });
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
    }, [selectedConvo?.id])

    const convosComponent = useMemo(() => {
        return <Convos
            pageData={pageData}
            isSmallScreen={isSmallScreen}
            layoutHeightLeft={layoutHeightLeft}
            data={convosData}
            selectedConvoIndex={selectedConvoIndex}
            changeConvo={changeConvo}
            handleSearch={handleSearch}
            onSave={onSave}
            addButtons={addButtons}
        />
    }, [
        panelsVisible.convos,
        layoutHeightLeft,
        convosData,
        selectedConvoIndex,
        changeConvo,
        handleSearch,
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
        setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const cellsCustomConfig = appSetting('layouts', 'messenger')

    if (!isWeb || isSmallScreen) {
        return (
            <View className=' web:h-auto w-full  h-full flex-row  bg-card'>
                {panelsVisible.convos && <View className=' w-full  overflow-hidden'>
                    {convosComponent}
                </View>}
                {panelsVisible.jots && <View className='flex-1'>
                    <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    <View className="w-full flex-1">
                        {jotsComponent}
                    </View>
                    <KbStickyView offset={{ closed: 0, opened: stickyOpened }}>
                        <View onLayout={handleLayout} className="w-full">
                            <FormContainer
                                form={data.form}
                                replyItem={replyItem}
                                onFormSubmit={onFormSubmit}
                                handleCancelReply={handleCancelReply}
                            />
                        </View>
                    </KbStickyView>
                </View>}
            </View>)
    }

    return (
        <View style={{height: layoutHeightLeft}}>
        <PanelGroup
            key={`cells-messenger-${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
            autoSaveId={cellsCustomConfig.sizable ? `cells-messenger` : undefined}
            direction="horizontal"
            className={`${appSetting('layout', 'max_width')} mx-auto w-full min-w-0 flex-auto relative flex-row`}

        >
            <Panel
                className={`block min-w-0`}
                {...cellsCustomConfig.cells?.left}
            >
                {panelsVisible.convos && <View className='w-full  overflow-hidden'>
                    {convosComponent}
                </View>}
            </Panel>
            <PanelHandler
                gap="hidden lg:block"
                sizable={cellsCustomConfig.sizable}
                panelLine={cellsCustomConfig['panel-line']}
            />
            <Panel className=" w-full min-w-0" {...cellsCustomConfig.cells?.center}>
                {panelsVisible.jots && <View className='flex-1  border-border/60 lg:border-l bg-card'>
                    <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    <View className={`w-full ${!isWeb ? 'flex-1' : ''}`} style={{ height: layoutHeightRight }}>
                        {jotsComponent}
                    </View>
                    <KbStickyView offset={{ closed: 0, opened: 0 }}>
                        <View onLayout={handleLayout} className='  w-full ' >
                            <FormContainer
                                form={data.form}
                                replyItem={replyItem}
                                onFormSubmit={onFormSubmit}
                                handleCancelReply={handleCancelReply}
                            />
                        </View>
                    </KbStickyView>
                </View>}
            </Panel>
        </PanelGroup>
        </View>
    )
}

const SEARCH_DEBOUNCE_MS = 300;

const Convos = memo(({ layoutHeightLeft, data, pageData, selectedConvoIndex, changeConvo, onSave, handleSearch, addButtons, isSmallScreen }) => {
    const isWeb = Platform.OS == 'web'
    const { t } = useTranslation();
    const [showSearch, setShowSearch] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
    const lastEmittedSearch = useRef(null);

    const setHeader = useSetHeader();
    const setHeaderHeightAtom = useSetHeaderHeight();

    // Keep typing local; only notify parent after debounce (skip initial empty — parent loads via menu).
    useEffect(() => {
        if (lastEmittedSearch.current === null && debouncedSearch === '') {
            lastEmittedSearch.current = debouncedSearch;
            return;
        }
        if (lastEmittedSearch.current === debouncedSearch) return;
        lastEmittedSearch.current = debouncedSearch;
        handleSearch(debouncedSearch);
    }, [debouncedSearch, handleSearch]);

    function handleSearch2() {
        setShowSearch(!showSearch)
    }

    function onSave2() {
        setSearchValue('');
        lastEmittedSearch.current = '';
        handleSearch('');
    }

    const onChangeSearch = useCallback((value) => {
        setSearchValue(value);
    }, []);

    const srch = <Input className="w-full min-w-0" size="small" rounded="full" name="search" placeholder={t('Search') + '...'} value={searchValue} onChangeText={onChangeSearch} />;
    const ContextSelector = getComponent('molecule', 'context_selector');
    const header = useMemo(() => (
        <Row className={`${appSetting('layout', 'page_content_width_default')} ${appSetting('layout', 'header', 'content')}`}>
            <View className='hidden lg:flex flex-1 min-w-0 w-full pe-2'>
                {srch}
            </View>
            {!showSearch && <View className='flex-1 min-w-0 lg:hidden'><Row className={appSetting('layout', 'header', 'content_left')}>
                {appSetting('messenger', 'back_button') && getBackButtonWeb()}
                {appSetting('context_selector', 'show_always') ? <><ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} /></>:  <Text className={`font-bold truncate flex-1 leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight font-main`}>{t('Messenger')}</Text>}
            </Row></View>}
            {showSearch && <View className={`${appSetting('layout', 'header', 'content_left')} flex-1 min-w-0 lg:hidden`}>
                {srch}
            </View>}
            <Row className='my-auto shrink-0'>
                <View className='lg:hidden mr-1 lg:mr-0 '>
                    <Button size="base" startDecorator="Search" variant="text" rounded onPress={() => handleSearch2()} />
                </View>
                {addButtons}
            </Row>
        </Row>
    ), [showSearch, searchValue, addButtons, pageData, t]);

    useEffect(() => {
        if (!isWeb) return;
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
    }, [isSmallScreen, setHeader, header]);

    useFocusEffect(useCallback(() => {
        if (isWeb) return;

        setHeaderHeightAtom(32)
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
        return () => setHeader(defaultHeader);
    }, [isSmallScreen, setHeader, header]));
    
    return (
        <View className='flex-1 bg-card' style={{ minHeight: layoutHeightLeft }}>
            {(isWeb && !isSmallScreen) && <View className='w-full px-4'>{header}</View>}
            {data && data.length > 0 ? <View className=' w-full overflow-hidden web:flex-1'
            style={{height:layoutHeightLeft}}
            >
                <UniList
                  
                    data={data}
                    mode="simple"
                    useCustomScrollHandler={isSmallScreen ? true : false}
                    height={layoutHeightLeft - 64}
                    renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
                /></View>
                : <View className='items-center justify-center w-full h-full'><View className="pt-8">
                    <View className="gap-y-2 items-center opacity-80 justify-center mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-muted-foreground/10 ">
                        <View className="mx-auto text-secondary-foreground  ">
                            <Text className="text-center text-lg text-secondary-foreground lg:text-xl font-semibold  ">
                                No conversations found
                            </Text>
                        </View>
                        {addButtons?.length > 0 && <CreateConvoButton variant='secondary' onSave={onSave} onShow={onSave2} />}
                    </View>
                </View></View>

            }
        </View>)
});

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


    const header = useMemo(() => (

            <Row className={`${appSetting('layout', 'page_content_width_default')} ${appSetting('layout', 'header', 'content')}`}>
                <Row className="">
                    {isSmallScreen && <BackButton buttonProps={{ variant: "text", startDecorator: 'ArrowLeft', rounded: 'rounded' }} callback={showConvo} />}
                    <View className="overflow-hidden flex-1">
                    <Text numberOfLines={1} className="font-bold text-card-foreground text-lg sm:text-xl tracking-tight overflow-hidden text-ellipsis">{title}</Text>
                    </View>
                </Row>
                <Row className='items-center gap-x-2'>
                    <View>
                        <DropdownMenu onSelect={(oItem) => { handleManage(oItem) }} items={menuItems}>
                            <Button
                                variant="text"
                                size="base"
                                rounded

                                startDecorator="Settings"
                            />
                        </DropdownMenu>
                    </View>
                </Row>
            </Row>
        
    ), [isSmallScreen, title, showConvo]);

    useEffect(() => {
        if (!isWeb) return;
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
    }, [isSmallScreen, setHeader, header]);

    useFocusEffect(useCallback(() => {
        if (isWeb) return;
        setHeader(isSmallScreen ? { header: header } : defaultHeader);
        return () => setHeader(defaultHeader);
    }, [isSmallScreen, setHeader, header]));

    return (<>
        {(isWeb && !isSmallScreen) && <View className='w-full px-4'>{header}</View>}
        {<View className="flex-1">
            <UniList

                refer={refListJots}
                {...(Platform.OS !== 'web' ? { inverted: true } : {})}
                overscan={900}
                onStartReached={startReached}
                scrollToLastItem={true}
                data={data}
                height={layoutHeightRight - (isSmallScreen ? 64 : 64)}
                mode="simple"
                useCustomScrollHandler={isSmallScreen ? true : false}
                renderItem={({ item, index }) => <ItemJot handleReply={handleReply} item={item} index={index} />}

            /></View>}
    </>);
});

const FormContainer = memo(({ form, replyItem, onFormSubmit, handleCancelReply }) => {
    const { t } = useTranslation();

    return (

        <View className="p-1.5 sm:p-2.5">
            <View className=' ' >
                {
                    replyItem && (<View className='bg-accent/60 rounded-xl border border-accent px-2.5 py-2 mb-2'>
                        <Row className='items-start justify-between max-w-full relative'>
                            <View className=' flex-auto pr-4'>
                                <Row className='max-w-full '>
                                    <Text className='text-xs text-popover-foreground '>{t('Reply to:')} </Text>
                                    <Text className='font-semibold text-xs text-popover-foreground '>{replyItem.author_data.display_name}</Text>
                                </Row>
                                <Text className='text-sm overflow-hidden text-popover-foreground ' numberOfLines={3}>{linkedText(replyItem.message, "hover:text-accent-foreground")}</Text>
                            </View>
                            <View className=" -right-1 -top-1">
                                <Button align="start" rounded startDecorator="X" size="xs" variant="text" onPress={() => handleCancelReply()} />
                            </View>
                        </Row>
                    </View>)
                }
                <Form {...form} name='bx_messenger' resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
            </View>
        </View>

    )
});