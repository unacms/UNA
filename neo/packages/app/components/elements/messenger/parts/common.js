import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { androidTabBarHeight, appSetting, isNativeTabsEnabled } from 'app/lib/util'
import { Platform } from 'react-native'
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { KbStickyView } from 'app/ui/atoms/kb-avoiding-view';
import CreateConvo, { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import Msg from 'app/ui/molecules/dialogs/msg';
import { useBottomSheetData } from 'app/context/bottomsheet';
import Profile from 'app/ui/molecules/profile/profile'
import ElementMsg from 'app/components/elements/msg';
import emitter, { EVENTS } from 'app/context/emitter';
import { getWindowSafeAreaInsets, useIsFocused, useSafeAreaInsets } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next'
import ChatPanels from 'app/components/elements/chat/parts/chat-panels'
import { useIsDesktop } from 'app/context/measure';
import { areTabBarLabelsHidden, getTabList } from 'app/components/nav/tabs/tab-menu';
import { useFooterHeight, useSetPageBottomBlur } from 'app/context/jotai/layout';
import { PageHeaderOptions } from 'app/ui/molecules/header/options';
import ConvosList from 'app/components/elements/chat/parts/convos-list';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import JotsPanel, { ChatEmptyState } from 'app/components/elements/messenger/parts/jots-panel';
import Composer from 'app/components/elements/messenger/parts/composer';
import { MobileListHeader, MobileChatHeader, ConvoActionsMenu } from 'app/components/elements/messenger/parts/headers';
import {
    PanelHeader,
    PANEL_HEADER_HEIGHT,
    CHAT_OVERLAY_HEADER,
    CHAT_OVERLAY_HEADER_FADE,
    CHAT_OVERLAY_COMPOSER_FADE,
} from 'app/components/elements/chat/parts/headers';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';

const isWeb = Platform.OS === 'web';

// Keep in sync with tabBarStyle.height in app/components/nav/tabs/native-tabs.js
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56
// Keep in sync with TAB_BAR_RESERVE in app/components/nav/tab-slide.js (and
// post.js) — the iOS NativeTabs bar floats over the screen.
const NATIVE_TAB_BAR_RESERVE = 56;

/**
 * Messenger root: owns conversation selection, panel visibility, URL/history
 * sync and the injected page header. Composes ConvosList / JotsPanel /
 * Composer (small screens: stacked list ↔ chat; web desktop: resizable
 * two-column split inside the UNA block).
 */
export default function Messenger({ defaultConvoId, selectedMenu, convos, fetchConvos, data, pageData, onSave, addButtons, menuItems, menuIndex, onMenuChange }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const footerHeight = useFooterHeight();
    const { setBottomSheetData } = useBottomSheetData();
    const [convoId, setConvoId] = useState(defaultConvoId);
    const convoIdRef = useRef(convoId);
    convoIdRef.current = convoId;
    const [jots, setJots] = useState(false);
    const [listError, setListError] = useState(false);
    const isDesktop = useIsDesktop();
    // Side-by-side panels exist only on web. Native (incl. iPad) is always
    // stack navigation: list → conversation. Width-based "desktop" would leave
    // both panels "visible" in a phone flex-row (list w-full) so taps never open chat.
    const isSmallScreen = !isWeb || !isDesktop;
    const isSmallScreenRef = useRef(isSmallScreen);
    isSmallScreenRef.current = isSmallScreen;
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const panelsVisibleRef = useRef(panelsVisible);
    panelsVisibleRef.current = panelsVisible;
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [splitHeight, setSplitHeight] = useState(0);
    const [showMsg, setShowMsg] = useState(false);
    const refListJots = useRef();
    const isFetchingJots = useRef(false);
    const hasMoreJots = useRef(true);
    const jotsPaginationRef = useRef(null);
    const [convosData, setConvosData] = useState(convos?.data || []);
    const selectedConvoIndex = convosData && convoId ? convosData.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convosData ? convosData[selectedConvoIndex] : false;
    const { currentUser } = useCurrentUser();
    // NativeTabs screens run under the tab bar (iOS floats it, Android draws
    // it over the page), so lists pad and the composer rests this far up.
    // Window insets, not `insets`: NativeTabs can report the keyboard height
    // as the bottom inset (as in post.js). JS tabs end the screen above the bar.
    const tabBarOverlayInset = isWeb || !isNativeTabsEnabled()
        ? 0
        : (Platform.OS === 'android'
            ? androidTabBarHeight(areTabBarLabelsHidden(getTabList(currentUser) || []))
            : NATIVE_TAB_BAR_RESERVE) + (getWindowSafeAreaInsets().bottom || 0);
    // KeyboardStickyView lifts by (keyboard − opened), so opened is the
    // composer's resting distance from the window bottom. JS tabs: the bar
    // sits below the screen, plus Android's root SafeAreaView insets.bottom
    // (iOS edges omit bottom), e.g. 56 + ~44 nav inset ≈ 100.
    const stickyOpened = isWeb
        ? 0
        : tabBarOverlayInset || TAB_BAR_HEIGHT + (Platform.OS === 'android' ? insets.bottom : 0);
    const [replyItem, setReplyItem] = useState(false);
    // iOS: one blur from the screen bottom up through the composer, instead of
    // the tab screen's bar blur plus a separate one behind the composer.
    const footerBlur = edgeBlurConfig('footer');
    const ownsBottomBlur = !isWeb && isSmallScreen && !!selectedConvo && !!footerBlur && tabBarOverlayInset > 0;
    const composerBlur = ownsBottomBlur
        ? { ...footerBlur, hold: (tabBarOverlayInset + formHeight * (footerBlur.hold ?? 0.5)) / (tabBarOverlayInset + formHeight) }
        : footerBlur;
    const setPageBottomBlur = useSetPageBottomBlur();
    useEffect(() => {
        if (!ownsBottomBlur) return;
        setPageBottomBlur(true);
        return () => setPageBottomBlur(false);
    }, [ownsBottomBlur, setPageBottomBlur]);

    const { data: dynamicData } = useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo?.id, convo_id: selectedConvo?.id, reply_id: replyItem ? replyItem?.id : 0 }), commentForm);

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

    // ---------------------------------------------------------------------
    // URL / history sync (web). pushState for user navigation, replaceState
    // for programmatic selection, popstate to honor the browser back button.
    // ---------------------------------------------------------------------
    const messengerUrl = appSetting('messenger', 'url');

    const isOnMessengerPath = useCallback(() => {
        if (!isWeb || typeof window === 'undefined') return false;
        const path = window.location.pathname;
        return path === messengerUrl || path.startsWith(messengerUrl + '/');
    }, [messengerUrl]);

    const syncConvoUrl = useCallback((id, { push = false } = {}) => {
        if (!isWeb || !id || !isOnMessengerPath()) return;
        const target = `${messengerUrl}/${selectedMenu}/${id}/`;
        if (window.location.pathname === target) return;
        if (push)
            window.history.pushState(null, '', target);
        else
            window.history.replaceState(null, '', target);
    }, [messengerUrl, selectedMenu, isOnMessengerPath]);

    useEffect(() => {
        if (!isWeb) return;

        const onPopState = () => {
            const path = window.location.pathname;
            if (path !== messengerUrl && !path.startsWith(messengerUrl + '/')) return;
            const segments = path.slice(messengerUrl.length).split('/').filter(Boolean);
            const poppedConvoId = segments[1] || '';
            if (poppedConvoId) {
                setConvoId(poppedConvoId);
                if (isSmallScreenRef.current)
                    setPanelsVisible({ convos: false, jots: true });
            }
            else if (isSmallScreenRef.current) {
                setPanelsVisible({ convos: true, jots: false });
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [messengerUrl]);

    // ---------------------------------------------------------------------
    // Selection / panel visibility
    // ---------------------------------------------------------------------

    // Breakpoint transitions: desktop always shows both panels; small screens
    // keep the open chat (if any) or fall back to the list.
    useEffect(() => {
        if (!isSmallScreen) {
            setPanelsVisible({ convos: true, jots: true });
            return;
        }
        setPanelsVisible(prev => (prev.jots && convoIdRef.current
            ? { convos: false, jots: true }
            : { convos: true, jots: false }));
    }, [isSmallScreen]);

    // Deep link / newly created conversation / menu switch.
    useEffect(() => {
        setConvoId(defaultConvoId);
        if (isSmallScreenRef.current)
            setPanelsVisible(defaultConvoId ? { convos: false, jots: true } : { convos: true, jots: false });
        if (defaultConvoId)
            syncConvoUrl(defaultConvoId, { push: true });
    }, [selectedMenu, defaultConvoId]);

    // Desktop only: keep the right panel filled by selecting the first
    // conversation. Small screens stay on the list until the user taps.
    // Skip lists fetched for another menu (stale during an inbox/direct switch).
    useEffect(() => {
        if (isSmallScreen) return;
        if (convos?.menu && convos.menu !== selectedMenu) return;
        if (convoId == '' && convosData?.length > 0) {
            const first = convosData[0];
            setConvoId(first.id);
            syncConvoUrl(first.id);
        }
    }, [convosData, convoId, isSmallScreen, syncConvoUrl, convos?.menu, selectedMenu]);

    useEffect(() => {
        if (!selectedConvo) return;

        const sub1 = subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
        const sub2 = subscribe('bx_messenger', 'profile_' + currentUser.id, onCheckConvos);
        hasMoreJots.current = true;
        jotsPaginationRef.current = null;
        setJots(false);
        fetchItems(selectedConvo.id, false);

        return () => {
            sub1();
            sub2();
        };
    }, [convoId]);

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
            setTimeout(() => {
                const list = refListJots?.current;
                if (!list) return;
                // Native (LegendList): to the real end, past the composer inset.
                // scrollToIndex(last) aligns the row itself with the bottom edge,
                // which left a new message behind the composer.
                const scroller = !isWeb && list.getNativeScrollRef?.();
                if (scroller?.scrollToEnd) scroller.scrollToEnd({ animated: true });
                else list.scrollToIndex({ animated: false, align: "end", behavior: "smooth", index: 9999999999 });
            }, 100);
        }
    }

    useEffect(() => {
        if (!jotUpdated) return;

        const incoming = Array.isArray(jotUpdated.data?.jots) ? jotUpdated.data.jots : [];

        if (jotUpdated.action == 'added') {
            if (incoming.length) {
                const latestJot = incoming[incoming.length - 1];
                if (latestJot) {
                    setConvosData(prevConvos => {
                        const nextConvos = [...(prevConvos || [])];
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
                setJots(prevJots => {
                    const prevList = Array.isArray(prevJots?.data?.jots) ? prevJots.data.jots : [];
                    const seen = new Set(prevList.map(item => item?.id));
                    const merged = [...prevList];
                    for (const jot of incoming) {
                        if (jot?.id == null || seen.has(jot.id)) continue;
                        seen.add(jot.id);
                        merged.push(jot);
                    }
                    return {
                        ...(prevJots && typeof prevJots === 'object' ? prevJots : {}),
                        data: {
                            ...(prevJots?.data || {}),
                            jots: merged,
                        },
                    };
                });
                scrolTo();
            }
            if (jotUpdated.data?.msg) {
                setListError(jotUpdated.data.msg);
            }
        }
        if (jotUpdated.action == 'edited' && incoming[0]) {
            const edited = incoming[0];
            setJots(prevJots => {
                const prevList = Array.isArray(prevJots?.data?.jots) ? prevJots.data.jots : [];
                return {
                    ...(prevJots && typeof prevJots === 'object' ? prevJots : {}),
                    data: {
                        ...(prevJots?.data || {}),
                        jots: prevList.map(item => item.id === edited.id ? edited : item),
                    },
                };
            });
        }
        if (jotUpdated.action == 'deleted') {
            const idToRemove = jotUpdated.data;
            setJots(prevJots => {
                const prevList = Array.isArray(prevJots?.data?.jots) ? prevJots.data.jots : [];
                return {
                    ...(prevJots && typeof prevJots === 'object' ? prevJots : {}),
                    data: {
                        ...(prevJots?.data || {}),
                        jots: prevList.filter(item => item.id !== idToRemove),
                    },
                    index: 0,
                };
            });
        }
    }, [jotUpdated]);

    const changeConvo = useCallback((convo) => {
        emitter.emit(EVENTS.editor, { action: 'focus' });
        setConvoId(convo.id);
        if (isSmallScreenRef.current)
            setPanelsVisible({ convos: false, jots: true })
        if (isWeb && typeof window !== 'undefined')
            window.scrollTo(0, 0);
        syncConvoUrl(convo.id, { push: true });
    }, [syncConvoUrl]);

    const showConvo = useCallback(() => {
        emitter.emit(EVENTS.editor, { action: 'blur' });
        setPanelsVisible({ convos: true, jots: false })
        if (isWeb && typeof window !== 'undefined')
            window.scrollTo(0, 0);
        if (!isWeb || !isOnMessengerPath())
            return;

        if (window.location.pathname !== messengerUrl)
            window.history.pushState(null, '', messengerUrl);
    }, [messengerUrl, isOnMessengerPath]);

    // Bottom-tab reselect: leave open chat and show conversation list.
    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.conductor, (payload) => {
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
            syncConvoUrl(convos.data[0].id);
        }
    }, [selectedConvo?.id2, convos.data, syncConvoUrl]);

    const leaveConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/leave_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            fetchConvos();
            setConvoId(convos.data[0].id);
            syncConvoUrl(convos.data[0].id);
        }
    }, [selectedConvo?.id2, convos.data, syncConvoUrl]);

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

    const handleConvoAction = useCallback((item) => {
        if (item.id === 'edit') editConvo();
        if (item.id === 'leave') leaveConvo();
        if (item.id === 'info') getConvo();
        if (item.id === 'delete') deleteConvo();
    }, [editConvo, leaveConvo, getConvo, deleteConvo]);

    const onFormSubmit = useCallback((formData) => {
        setCommentForm(formData);
    }, []);

    const handleReply = useCallback((item) => {
        setReplyItem(item)
    }, [])

    const handleCancelReply = useCallback(() => {
        setReplyItem(false)
    }, [])

    const handleStartReached = useCallback(() => {
        if (selectedConvo)
            fetchItems(selectedConvo.id, true);
    }, [selectedConvo?.id])

    const handleFormLayout = useCallback((event) => {
        setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleSplitLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0)
            setSplitHeight(prev => (prev === height ? prev : height));
    }, []);

    // ---------------------------------------------------------------------
    // Injected page header. Small screens replace the whole bar with the
    // list header or the chat header; desktop keeps the default site header
    // (messenger chrome renders in-flow there).
    // ---------------------------------------------------------------------
    const injectedHeader = useMemo(() => {
        if (!isSmallScreen) return null;
        if (panelsVisible.jots && selectedConvo) {
            return <MobileChatHeader title={selectedConvo.title} onBack={showConvo} onAction={handleConvoAction} />;
        }
        return (
            <MobileListHeader
                pageData={pageData}
                onSearch={handleSearch}
                addButtons={addButtons}
                menuItems={menuItems}
                menuIndex={menuIndex}
                onMenuChange={onMenuChange}
            />
        );
    }, [isSmallScreen, panelsVisible.jots, selectedConvo?.id, selectedConvo?.title, showConvo, handleConvoAction, pageData, handleSearch, addButtons, menuItems, menuIndex, onMenuChange]);

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    const jotsLoaded = !!(panelsVisible.jots && selectedConvo && jots?.data?.jots);
    const errorOffset = listError ? 60 : 0;
    const convosListProps = {
        title: t('Messages'),
        emptyText: t('No conversations found'),
        emptyAction: ({ resetSearch }) => (
            addButtons?.length > 0 ? <CreateConvoButton variant="secondary" onSave={onSave} onShow={resetSearch} /> : null
        ),
        // Small screens show the list or the chat, never both, so a "current" row
        // would only linger after Back. Desktop keeps it highlighted next to the open chat.
        renderItem: ({ item, index }) => (
            <ItemConvo selectedIndex={isSmallScreen ? -1 : selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />
        ),
    };

    if (isSmallScreen) {
        // Native: absolute page header, so the list fills the tab screen and
        // pads for chrome. Mobile web: window-scroll like conductor lists
        // (notifications, comments) so rows pass behind the collapsible page
        // header. Chat composer is viewport-fixed above the tab bar.
        const tabBarInset = isWeb ? footerHeight : 0;
        const composerInset = formHeight + errorOffset;
        // Room to scroll the last row clear of the bar (web: the footer).
        const bottomBarInset = tabBarOverlayInset || tabBarInset;

        return (
            // The conversation list and the open chat sit on the screen background
            // (rows and bubbles carry their own fill), like the desktop split view.
            <View className='web:h-auto w-full h-full flex-row'>
                <PageHeaderOptions main={injectedHeader} />
                {panelsVisible.convos && <View className='w-full'>
                    <ConvosList
                        {...convosListProps}
                        data={convosData}
                        onSearch={handleSearch}
                        addButtons={addButtons}
                        isSmallScreen={true}
                        footerInset={bottomBarInset}
                    />
                </View>}
                {panelsVisible.jots && (
                    <View className="relative w-full">
                    <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    {jotsLoaded && (
                        <JotsPanel
                            data={jots.data.jots}
                            refListJots={refListJots}
                            startReached={handleStartReached}
                            handleReply={handleReply}
                            isSmallScreen={true}
                            footerInset={composerInset + bottomBarInset}
                            // Rise with the keyboard as far as the composer does.
                            keyboardBottomOffset={isWeb ? undefined : stickyOpened}
                        />
                    )}
                    {listError ? (
                        <View
                            className={isWeb ? 'fixed left-0 right-0 z-40 mx-4' : 'absolute left-0 right-0 z-10 mx-4'}
                            style={{ bottom: formHeight + bottomBarInset }}
                        >
                            <ElementMsg data={listError} />
                        </View>
                    ) : null}
                    {selectedConvo ? (
                        <KbStickyView
                            // Web: from the window bottom, under the tab bar (footer z-30),
                            // so the wash runs from the bar up through the composer.
                            // iOS (ownsBottomBlur) the same, padded up to its resting spot.
                            style={isWeb
                                ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20 }
                                : { position: 'absolute', left: 0, right: 0, bottom: ownsBottomBlur ? 0 : tabBarOverlayInset, zIndex: 10 }}
                            offset={{ closed: 0, opened: stickyOpened }}
                        >
                            <EdgeBlurView
                                edge="bottom"
                                config={composerBlur}
                                washClassName={CHAT_OVERLAY_COMPOSER_FADE}
                                pointerEvents="box-none"
                                style={ownsBottomBlur ? { paddingBottom: tabBarOverlayInset } : undefined}
                            >
                                <View onLayout={handleFormLayout} className="w-full" pointerEvents="auto">
                                    <Composer
                                        form={data.form}
                                        replyItem={replyItem}
                                        onFormSubmit={onFormSubmit}
                                        handleCancelReply={handleCancelReply}
                                    />
                                </View>
                            </EdgeBlurView>
                            {isWeb && tabBarInset > 0 ? (
                                <View pointerEvents="none" className="bg-background" style={{ height: tabBarInset }} />
                            ) : null}
                        </KbStickyView>
                    ) : null}
                    </View>
                )}
            </View>)
    }

    const contentHeight = splitHeight;
    const desktopJotsHeight = Math.max(0, contentHeight);

    return (
        <ChatPanels
            height={contentHeight}
            onLayout={handleSplitLayout}
            left={
                    <ConvosList
                        {...convosListProps}
                        data={convosData}
                        panelHeight={contentHeight}
                        listHeight={contentHeight}
                        onSearch={handleSearch}
                        addButtons={addButtons}
                        isSmallScreen={false}
                        menuItems={menuItems}
                        menuIndex={menuIndex}
                        onMenuChange={onMenuChange}
                    />
            }
            center={
                    <View className='relative h-full min-h-0 overflow-hidden border-border/60 lg:border-l '>
                        <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                        {selectedConvo ? (
                            <>
                                {jotsLoaded ? (
                                    <JotsPanel
                                        data={jots.data.jots}
                                        listHeight={desktopJotsHeight}
                                        refListJots={refListJots}
                                        startReached={handleStartReached}
                                        handleReply={handleReply}
                                        isSmallScreen={false}
                                        headerInset={PANEL_HEADER_HEIGHT}
                                        footerInset={formHeight + errorOffset}
                                    />
                                ) : null}
                                <EdgeBlurView edge="top" config={edgeBlurConfig('footer')} className={CHAT_OVERLAY_HEADER} washClassName={CHAT_OVERLAY_HEADER_FADE} pointerEvents="box-none">
                                    <View pointerEvents="auto">
                                        <PanelHeader title={selectedConvo.title} actions={<ConvoActionsMenu onAction={handleConvoAction} style="glass" />} />
                                    </View>
                                </EdgeBlurView>
                                {listError ? (
                                    <View className="absolute left-0 right-0 z-10 mx-4" style={{ bottom: formHeight }}>
                                        <ElementMsg data={listError} />
                                    </View>
                                ) : null}
                                <KbStickyView
                                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}
                                    offset={{ closed: 0, opened: 0 }}
                                >
                                    <EdgeBlurView edge="bottom" config={edgeBlurConfig('footer')} washClassName={CHAT_OVERLAY_COMPOSER_FADE} pointerEvents="box-none">
                                        <View onLayout={handleFormLayout} className='w-full' pointerEvents="auto">
                                            <Composer
                                                form={data.form}
                                                replyItem={replyItem}
                                                onFormSubmit={onFormSubmit}
                                                handleCancelReply={handleCancelReply}
                                            />
                                        </View>
                                    </EdgeBlurView>
                                </KbStickyView>
                            </>
                        ) : (
                            <ChatEmptyState />
                        )}
                    </View>
            }
        />
    )
}
