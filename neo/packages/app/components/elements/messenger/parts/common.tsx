import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useRef, useCallback, useMemo, type ComponentType, type ReactNode } from 'react';
import { appSetting, isNativeTabsEnabled } from 'app/lib/util'
import { Platform, type ViewStyle } from 'react-native'
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import { playCue } from 'app/lib/sound'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { KbStickyView } from 'app/ui/atoms/kb-avoiding-view';
import CreateConvo, { CreateConvoButton as CreateConvoButtonJs } from 'app/components/elements/messenger/parts/new-convo';
import Msg from 'app/ui/molecules/dialogs/msg';
import { useBottomSheetData } from 'app/context/bottomsheet';
import Profile from 'app/ui/molecules/profile/profile'
import ElementMsgJs from 'app/components/elements/msg';
import emitter, { EVENTS } from 'app/context/emitter';
import { getWindowSafeAreaInsets, useCurrentTabPath, useIsFocused, useRouter, useSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsPushedScreen } from 'app/context/tab-chrome';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { useTranslation } from 'react-i18next'
import ChatPanels from 'app/components/elements/chat/parts/chat-panels'
import { useIsDesktop } from 'app/context/measure';
import { getNativeTabBarHeight } from 'app/components/nav/tabs/tab-menu';
import { useFooterHeight, useHeaderHeight, useSetPageBottomBlur } from 'app/context/jotai/layout';
import { PageHeaderOptions as PageHeaderOptionsJs } from 'app/ui/molecules/header/options';
import ConvosList from 'app/components/elements/chat/parts/convos-list';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import JotsPanel, { ChatEmptyState } from 'app/components/elements/messenger/parts/jots-panel';
import ComposerJs from 'app/components/elements/messenger/parts/composer';
import { MobileListHeader, MobileChatHeader, ConvoActionsMenu, ConvoSearchButton, ConvoSearchField } from 'app/components/elements/messenger/parts/headers';
import Confirm from 'app/ui/molecules/dialogs/confirm';
import ConvoSettings from 'app/components/elements/messenger/parts/convo-settings';
import ConvoFiles from 'app/components/elements/messenger/parts/convo-files';
import ConvoSearchResults from 'app/components/elements/messenger/parts/convo-search';
import {
    PanelHeader,
    PANEL_HEADER_HEIGHT,
    CHAT_OVERLAY_HEADER,
    CHAT_OVERLAY_HEADER_FADE,
    CHAT_OVERLAY_COMPOSER_FADE,
} from 'app/components/elements/chat/parts/headers';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import type { AddButtons, ConvoAction, Convo, Jot, JotsState, MessengerMenuItem } from 'app/components/elements/messenger/parts/messenger.types';

const isWeb = Platform.OS === 'web';

// Keep in sync with tabBarStyle.height in app/components/nav/tabs/native-tabs.js
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56

// Untyped JS components: their inferred props mark every prop as required.
const ConfirmDialog = Confirm as unknown as ComponentType<Record<string, any>>;
const MsgDialog = Msg as unknown as ComponentType<Record<string, any>>;
const CreateConvoForm = CreateConvo as unknown as ComponentType<Record<string, any>>;
const CreateConvoButton = CreateConvoButtonJs as unknown as ComponentType<Record<string, any>>;
const ElementMsg = ElementMsgJs as unknown as ComponentType<Record<string, any>>;
const PageHeaderOptions = PageHeaderOptionsJs as unknown as ComponentType<Record<string, any>>;
const Composer = ComposerJs as unknown as ComponentType<Record<string, any>>;

type LoosePayload = Record<string, any>;

// expo-router on native, the Next router on web: only the native branch pushes tab pages.
type MessengerRouter = { push: (href: unknown) => void; back: () => void; canGoBack?: () => boolean };

type MessengerProps = {
    defaultConvoId: string;
    selectedMenu: string;
    convos: { data?: Convo[]; menu?: string } | false;
    fetchConvos: (term?: string) => void;
    data: LoosePayload;
    pageData?: LoosePayload;
    onSave: (data: LoosePayload) => void;
    addButtons?: AddButtons;
    menuItems?: MessengerMenuItem[];
    menuIndex: number;
    onMenuChange: (index: number) => void;
};

/**
 * Messenger root: owns conversation selection, panel visibility, URL/history
 * sync and the injected page header. Composes ConvosList / JotsPanel /
 * Composer (small screens: stacked list ↔ chat; web desktop: resizable
 * two-column split inside the UNA block).
 */
export default function Messenger({ defaultConvoId, selectedMenu, convos, fetchConvos, data, pageData, onSave, addButtons, menuItems, menuIndex, onMenuChange }: MessengerProps) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const footerHeight = useFooterHeight();
    const headerHeight = useHeaderHeight();
    const { setBottomSheetData } = useBottomSheetData();
    const [convoId, setConvoId] = useState(defaultConvoId);
    const selectedMenuRef = useRef(selectedMenu);
    useEffect(() => {
        selectedMenuRef.current = selectedMenu;
    }, [selectedMenu]);
    const convoIdRef = useRef(convoId);
    convoIdRef.current = convoId;
    const [jots, setJots] = useState<JotsState | false>(false);
    const [listError, setListError] = useState<unknown>(false);
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
    const [commentForm, setCommentForm] = useState<FormData | false>(false);
    const [jotUpdated, setJotUpdated] = useState<LoosePayload | false>(false);
    const [formHeight, setFormHeight] = useState(0);
    const [splitHeight, setSplitHeight] = useState(0);
    const [showMsg, setShowMsg] = useState<string | false>(false);
    const refListJots = useRef<any>(null);
    const isFetchingJots = useRef(false);
    const hasMoreJots = useRef(true);
    const jotsPaginationRef = useRef<LoosePayload | null>(null);
    // Saved messages removed from the open list since the last page: UNA pages by offset.
    const removedJotsRef = useRef(0);
    const [convosData, setConvosData] = useState<Convo[]>((convos && convos.data) || []);
    const selectedConvoIndex = convosData && convoId ? convosData.findIndex(item => item.id === convoId) : -1;
    const selectedConvo: Convo | undefined = selectedConvoIndex >= 0 ? convosData[selectedConvoIndex] : undefined;
    const { currentUser } = useCurrentUser();
    const currentUserId = currentUser ? currentUser.id : undefined;
    // NativeTabs screens run under the tab bar (iOS floats it, Android draws
    // it over the page), so lists pad and the composer rests this far up.
    // Window insets, not `insets`: NativeTabs can report the keyboard height
    // as the bottom inset (as in post.js). JS tabs end the screen above the bar.
    const tabBarOverlayInset = isWeb || !isNativeTabsEnabled()
        ? 0
        : getNativeTabBarHeight(currentUser) + (getWindowSafeAreaInsets().bottom || 0);
    // KeyboardStickyView lifts by (keyboard − opened), so opened is the
    // composer's resting distance from the window bottom. JS tabs: the bar
    // sits below the screen, plus Android's root SafeAreaView insets.bottom
    // (iOS edges omit bottom), e.g. 56 + ~44 nav inset ≈ 100.
    const stickyOpened = isWeb
        ? 0
        : tabBarOverlayInset || TAB_BAR_HEIGHT + (Platform.OS === 'android' ? insets.bottom : 0);
    const [replyItem, setReplyItem] = useState<Jot | false>(false);
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

    const { data: dynamicData } = useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo?.id, convo_id: selectedConvo?.id, reply_id: replyItem ? replyItem?.id : 0 }), commentForm || null);

    useEffect(() => {
        data.form.data.inputs.message.value = '';
        setReplyItem(false);
        setCommentForm(false);
        // The reply to a sent message: subtle success, or error when UNA refuses it.
        if (dynamicData?.data?.jot_id > 0)
            playCue('success', { emphasis: 'subtle' });
        else if (dynamicData?.data?.data?.data?.msg)
            playCue('error');
        if (dynamicData?.data?.jot_id > 0)
            scrolTo();

        if (dynamicData?.data?.data) {
            setJotUpdated(dynamicData?.data?.data);
        }

    }, [dynamicData]);

    // Text of the list search; the list isn't refreshed by new messages while it is set.
    const listSearchRef = useRef('');
    const handleSearch = useCallback((term: string) => {
        listSearchRef.current = term;
        fetchConvos(term);
    }, [fetchConvos]);

    // UNA sends 'profile_<id>' to every participant on a new message (broadcastNewJot).
    // A message in another talk refreshes the list: unread counts, order and previews come
    // from UNA. Bursts are merged; own messages and the open talk (fed by its own channel) are skipped.
    useEffect(() => {
        if (!currentUserId) return;

        let timer: ReturnType<typeof setTimeout> | undefined;
        const unsubscribe = subscribe('bx_messenger', 'profile_' + currentUserId, (event) => {
            if (event?.user_id == currentUserId || listSearchRef.current) return;
            if (event?.id && event.id == convoIdRef.current && panelsVisibleRef.current.jots) return;

            clearTimeout(timer);
            timer = setTimeout(() => fetchConvos(), 400);
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, [currentUserId, fetchConvos]);

    useEffect(() => {
        setConvosData((convos && convos.data) || []);
    }, [convos]);

    const fetchItems = useCallback(async (targetConvoId: string, isAddJots: boolean) => {
        if (isAddJots && (isFetchingJots.current || !hasMoreJots.current)) return;

        const params = jotsPaginationRef.current;
        let start = 0;

        if (params?.limit && isAddJots)
            start = Math.max(0, (params.start ?? 0) + params.limit - removedJotsRef.current);

        isFetchingJots.current = true;
        try {
            // Saved: only the messages the viewer saved in this talk, as on the site.
            const area = selectedMenuRef.current === 'saved' ? { area_type: 'saved' } : {};
            let request_url = '/api.php?r=bx_messenger/get_convo_messages/Services&params=' + JSON.stringify({ lot: targetConvoId, jot: 0, start: start, ...area });
            const sResponse = await fetcher(request_url);

            const newJots: Jot[] = sResponse.data?.jots ?? [];
            if (isAddJots && newJots.length === 0) {
                hasMoreJots.current = false;
                return;
            }

            jotsPaginationRef.current = sResponse.data.params;
            removedJotsRef.current = 0;

            setJots(prevJots => ({
                ...(prevJots || {}),
                data: {
                    params: sResponse.data.params,
                    jots: prevJots && isAddJots ? [...newJots, ...(prevJots.data?.jots || [])] : newJots
                },
                index: prevJots && isAddJots ? prevJots.index : 0,
                // Unread on opening the talk (UNA counts them before marking them read):
                // the 'new messages' line stays where it was while the talk is open.
                unread: prevJots && isAddJots ? prevJots.unread : {
                    count: parseInt(sResponse.data?.unread_jots) || 0,
                    firstId: parseInt(sResponse.data?.last_unread_jot) || 0,
                },
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
    // Native (NativeTabs): a conversation is a page pushed onto the tab's
    // stack, so the edge swipe / system back return to the list; its back
    // arrow pops it.
    const router = useRouter() as unknown as MessengerRouter;
    const currentTabPath = useCurrentTabPath();
    const isPushedScreen = useIsPushedScreen();
    const stackedChat = !isWeb && isNativeTabsEnabled();

    const isOnMessengerPath = useCallback(() => {
        if (!isWeb || typeof window === 'undefined') return false;
        const path = window.location.pathname;
        return path === messengerUrl || path.startsWith(messengerUrl + '/');
    }, [messengerUrl]);

    const syncConvoUrl = useCallback((id: string | undefined, { push = false }: { push?: boolean } = {}) => {
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
        if (convos && convos.menu && convos.menu !== selectedMenu) return;
        const first = convosData[0];
        if (convoId == '' && first) {
            setConvoId(first.id);
            syncConvoUrl(first.id);
        }
    }, [convosData, convoId, isSmallScreen, syncConvoUrl, convos, selectedMenu]);

    useEffect(() => {
        if (!selectedConvo) return;

        const sub1 = subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
        hasMoreJots.current = true;
        jotsPaginationRef.current = null;
        removedJotsRef.current = 0;
        setJots(false);
        fetchItems(selectedConvo.id, false);

        return () => {
            sub1();
        };
    }, [convoId]);

    useEffect(() => {
        setListError(null);
    }, [convoId]);

    const onNewMessage = (event: LoosePayload) => {
        if (event.id == convoId) {
            // Someone else's message in the open conversation: one subtle ready per update.
            const incoming: Jot[] = event.action == 'added' && Array.isArray(event.data?.jots) ? event.data.jots : [];
            const fromOthers = incoming.some((jot) => {
                const author = jot?.author_data?.id ?? jot?.author;
                return author != null && author != currentUserId;
            });
            if (fromOthers) playCue('ready', { emphasis: 'subtle' });
            setJotUpdated(event);
        }
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

        const incoming: Jot[] = Array.isArray(jotUpdated.data?.jots) ? jotUpdated.data.jots : [];

        // Saved section: the list holds the viewer's saved messages only, new ones aren't saved yet.
        if (jotUpdated.action == 'added' && selectedMenuRef.current !== 'saved') {
            if (incoming.length) {
                const latestJot = incoming[incoming.length - 1];
                if (latestJot) {
                    setConvosData(prevConvos => {
                        const nextConvos = [...(prevConvos || [])];
                        const targetIndex = nextConvos.findIndex(convo => convo.id == convoId);
                        const targetConvo = nextConvos[targetIndex];
                        if (targetIndex === -1 || !targetConvo) return prevConvos;

                        nextConvos[targetIndex] = {
                            ...targetConvo,
                            message: latestJot.message ?? targetConvo.message,
                            date: latestJot.created ?? targetConvo.date,
                        };
                        return nextConvos;
                    });
                }
                setJots(prevJots => {
                    const prevList: Jot[] = prevJots ? prevJots.data?.jots || [] : [];
                    const seen = new Set(prevList.map(item => item?.id));
                    const merged = [...prevList];
                    for (const jot of incoming) {
                        if (jot?.id == null || seen.has(jot.id)) continue;
                        seen.add(jot.id);
                        merged.push(jot);
                    }
                    return {
                        ...(prevJots || {}),
                        data: {
                            ...(prevJots ? prevJots.data : {}),
                            jots: merged,
                        },
                    };
                });
                scrolTo();
            }
        }
        if (jotUpdated.action == 'added' && jotUpdated.data?.msg) {
            setListError(jotUpdated.data.msg);
        }
        const edited = incoming[0];
        if (jotUpdated.action == 'edited' && edited) {
            setJots(prevJots => {
                const prevList: Jot[] = prevJots ? prevJots.data?.jots || [] : [];
                return {
                    ...(prevJots || {}),
                    data: {
                        ...(prevJots ? prevJots.data : {}),
                        // 'saved' in the broadcast is the editor's, keep the viewer's own.
                        jots: prevList.map(item => item.id === edited.id ? { ...edited, saved: item.saved } : item),
                    },
                };
            });
        }
        if (jotUpdated.action == 'deleted') {
            const idToRemove = jotUpdated.data;
            setJots(prevJots => {
                const prevList: Jot[] = prevJots ? prevJots.data?.jots || [] : [];
                return {
                    ...(prevJots || {}),
                    data: {
                        ...(prevJots ? prevJots.data : {}),
                        jots: prevList.filter(item => item.id !== idToRemove),
                    },
                    index: 0,
                };
            });
        }
    }, [jotUpdated]);

    const changeConvo = useCallback((convo: Convo) => {
        if (stackedChat && isSmallScreenRef.current) {
            // No trailing slash: the API redirects `…/<id>/` to `…/<id>`.
            router.push(nativeTabPageHref(`${messengerUrl}/${selectedMenu}/${convo.id}`, currentTabPath));
            return;
        }
        emitter.emit(EVENTS.editor, { action: 'focus' });
        setConvoId(convo.id);
        if (isSmallScreenRef.current)
            setPanelsVisible({ convos: false, jots: true })
        if (isWeb && typeof window !== 'undefined')
            window.scrollTo(0, 0);
        syncConvoUrl(convo.id, { push: true });
    }, [syncConvoUrl, stackedChat, router, messengerUrl, selectedMenu, currentTabPath]);

    const showConvo = useCallback(() => {
        emitter.emit(EVENTS.editor, { action: 'blur' });
        if (stackedChat && isPushedScreen && router.canGoBack?.()) {
            router.back();
            return;
        }
        setPanelsVisible({ convos: true, jots: false })
        if (isWeb && typeof window !== 'undefined')
            window.scrollTo(0, 0);
        if (!isWeb || !isOnMessengerPath())
            return;

        if (window.location.pathname !== messengerUrl)
            window.history.pushState(null, '', messengerUrl);
    }, [messengerUrl, isOnMessengerPath, stackedChat, isPushedScreen, router]);

    // Bottom-tab reselect: leave open chat and show conversation list.
    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.conductor, (payload: LoosePayload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action !== 'reset_to_first') return;
            if (!(isSmallScreen && panelsVisibleRef.current.jots && !panelsVisibleRef.current.convos)) return;
            showConvo();
        });
        return () => subscription.remove();
    }, [isSmallScreen, showConvo]);

    // After delete / leave: the list is refetched, the first talk of the current one is opened.
    const openFirstConvo = useCallback(() => {
        fetchConvos();
        const first = convos && convos.data ? convos.data[0] : undefined;
        setConvoId(first ? first.id : '');
        syncConvoUrl(first?.id);
    }, [convos, fetchConvos, syncConvoUrl]);

    const deleteConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/delete_convo/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            openFirstConvo();
        }
    }, [selectedConvo?.id2, openFirstConvo]);

    const leaveConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/leave_convo/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            openFirstConvo();
        }
    }, [selectedConvo?.id2, openFirstConvo]);

    const getConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/get_convo/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            const lot = sResponse.data.lot;
            // Labels without a trailing colon: i18next reads "Participants:" as a namespace and renders nothing.
            const stats: [string, ReactNode][] = [
                [t('Participants'), lot.parts],
                [t('Messages'), lot.messages],
                [t('Files'), lot.files],
            ];
            // Author (avatar + name) on the left, stats on the right.
            const content = (<Row className='w-full items-center gap-x-8 pb-4'>
                <View className='items-center gap-y-3 shrink-0 max-w-48'>
                    <Profile displaySize="2xl" displayType="unit_wo_info" {...lot.author_data} />
                    {lot.author_data?.display_name ? (
                        <Text className="text-popover-foreground text-xl font-bold text-center" numberOfLines={2}>{lot.author_data.display_name}</Text>
                    ) : null}
                </View>
                <View className='flex-1 min-w-0 gap-y-3'>
                    {stats.map(([label, value]) => (
                        <Text key={label} className="text-muted-foreground text-base">{label}: {value ?? 0}</Text>
                    ))}
                </View>
            </Row>)
            setBottomSheetData({ title: t('Conversation info'), content: content, showClose: true, snapPoints: ['50%', '50%'] });
        }
    }, [selectedConvo?.id2]);

    const onSaveHandler = (saved: LoosePayload) => {
        setBottomSheetData(false);
        onSave(saved);
    }

    const editConvo = useCallback(async () => {
        let request_url = '/api.php?r=bx_messenger/get_parts_list/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 });
        const sResponse = await fetcher(request_url);
        setBottomSheetData({ title: t('messenger_add_users'), content: <CreateConvoForm onSave={onSaveHandler} initedData={sResponse.data} convoId={selectedConvo?.id2} />, showClose: true, snapPoints: ['85%', '85%'] });
    }, [selectedConvo?.id2]);

    const clearConvo = useCallback(async () => {
        const sResponse = await fetcher('/api.php?r=bx_messenger/clear_convo/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 }));
        if (sResponse.data?.code != 0) {
            setShowMsg(sResponse.data?.message || t('Error'));
            return;
        }
        hasMoreJots.current = false;
        jotsPaginationRef.current = null;
        setJots(prevJots => ({ ...(prevJots || {}), data: { ...(prevJots ? prevJots.data : {}), jots: [] }, index: 0 }));
        setConvosData(prevConvos => (prevConvos || []).map(convo => convo.id === selectedConvo?.id ? { ...convo, message: '' } : convo));
    }, [selectedConvo]);

    const openSettings = useCallback(async () => {
        const lotId = selectedConvo?.id2;
        const sResponse = await fetcher('/api.php?r=bx_messenger/get_convo_settings/Services&params=' + JSON.stringify({ lot: lotId }));
        if (sResponse.data?.message || !Array.isArray(sResponse.data?.options)) {
            setShowMsg(sResponse.data?.message || t('Error'));
            return;
        }
        setBottomSheetData({
            title: t('Settings'),
            content: (
                <ConvoSettings
                    lotId={lotId ?? ''}
                    settings={sResponse.data}
                    onSaved={() => setBottomSheetData(false)}
                    onError={(message: string) => {
                        setBottomSheetData(false);
                        setShowMsg(message);
                    }}
                />
            ),
            showClose: true,
            snapPoints: ['50%', '50%'],
        });
    }, [selectedConvo?.id2]);

    // Header search in the open conversation's messages; it closes when another conversation opens.
    const [convoSearch, setConvoSearch] = useState<{ convoId: string | null; term: string }>({ convoId: null, term: '' });
    const searchOpen = !!selectedConvo && convoSearch.convoId === convoId;
    const toggleSearch = useCallback(() => {
        setConvoSearch(prev => (prev.convoId === convoIdRef.current ? { convoId: null, term: '' } : { convoId: convoIdRef.current, term: '' }));
    }, []);
    const handleSearchTerm = useCallback((term: string) => {
        setConvoSearch(prev => (prev.term === term ? prev : { ...prev, term }));
    }, []);

    const openFiles = useCallback(() => {
        setBottomSheetData({
            title: t('Files'),
            content: <ConvoFiles lotId={selectedConvo?.id2 ?? ''} />,
            showClose: true,
            snapPoints: ['85%', '85%'],
        });
    }, [selectedConvo?.id2]);

    // Delete / clear can be a single tap on the header button, so they ask first.
    const [confirmAction, setConfirmAction] = useState<'delete' | 'clear' | false>(false);

    // Mute / star: toggles for the viewer, UNA returns the new state.
    const toggleConvo = useCallback(async (action: 'mute' | 'star') => {
        const sResponse = await fetcher('/api.php?r=bx_messenger/' + action + '_convo/Services&params=' + JSON.stringify({ lot: selectedConvo?.id2 }));
        if (sResponse.data?.code != 0) {
            playCue('error');
            setShowMsg(sResponse.data?.message || t('Error'));
            return;
        }
        playCue('toggle', { emphasis: 'subtle' });
        if (action === 'star') {
            // Star badge in the list follows the new state right away.
            const lotId = selectedConvo?.id2;
            setConvosData(prevConvos => (prevConvos || []).map(convo => convo.id2 == lotId ? { ...convo, starred: sResponse.data.value } : convo));
            // Favorites list shows starred talks only: refresh it after a star change.
            if (selectedMenu === 'favorites') fetchConvos();
        }
    }, [selectedConvo?.id2, selectedMenu, fetchConvos]);

    const handleConvoAction = useCallback((item: ConvoAction) => {
        if (item.id === 'mute' || item.id === 'star') toggleConvo(item.id);
        if (item.id === 'edit') editConvo();
        if (item.id === 'leave') leaveConvo();
        if (item.id === 'info') getConvo();
        if (item.id === 'settings') openSettings();
        if (item.id === 'files') openFiles();
        if (item.id === 'delete' || item.id === 'clear') setConfirmAction(item.id);
    }, [editConvo, leaveConvo, getConvo, openSettings, openFiles, toggleConvo]);

    const confirmDialog = (
        <ConfirmDialog
            onVisible={!!confirmAction}
            title={t('Are you sure?')}
            handleCancel={() => setConfirmAction(false)}
            handleOk={() => {
                const action = confirmAction;
                setConfirmAction(false);
                if (action === 'delete') deleteConvo();
                if (action === 'clear') clearConvo();
            }}
        />
    );

    const onFormSubmit = useCallback((formData: FormData) => {
        setCommentForm(formData);
    }, []);

    const handleReply = useCallback((item: Jot) => {
        setReplyItem(item)
    }, [])

    // Saved section: a message removed from saved leaves the list; an emptied talk leaves the talks list.
    const handleSavedChange = useCallback((item: Jot, saved: boolean) => {
        if (saved || selectedMenuRef.current !== 'saved') return;

        const rest = (jots ? jots.data.jots : []).filter(jot => jot.id !== item.id);
        // UNA pages saved messages by offset: one less of them, one less to skip on the next page.
        removedJotsRef.current += 1;
        setJots(prevJots => (prevJots ? { ...prevJots, data: { ...prevJots.data, jots: prevJots.data.jots.filter(jot => jot.id !== item.id) } } : prevJots));
        if (!rest.length) fetchConvos();
    }, [jots, fetchConvos]);

    const handleCancelReply = useCallback(() => {
        setReplyItem(false)
    }, [])

    const handleStartReached = useCallback(() => {
        if (selectedConvo)
            fetchItems(selectedConvo.id, true);
    }, [selectedConvo?.id])

    const handleFormLayout = useCallback((event: LoosePayload) => {
        setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleSplitLayout = useCallback((event: LoosePayload) => {
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
            return <MobileChatHeader title={selectedConvo.title} onBack={showConvo} menu={selectedConvo.menu} menuKey={selectedConvo.id} onAction={handleConvoAction} searchOpen={searchOpen} onSearchToggle={toggleSearch} onSearch={handleSearchTerm} />;
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
    }, [isSmallScreen, panelsVisible.jots, selectedConvo?.id, selectedConvo?.title, showConvo, selectedConvo?.menu, handleConvoAction, searchOpen, toggleSearch, handleSearchTerm, pageData, handleSearch, addButtons, menuItems, menuIndex, onMenuChange]);

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    const jotsLoaded = !!(panelsVisible.jots && selectedConvo && jots && jots.data?.jots);
    const jotsList: Jot[] = jots ? jots.data.jots : [];
    const unread = jots ? jots.unread : undefined;
    const errorOffset = listError ? 60 : 0;
    const convosListProps = {
        title: t('Messages'),
        emptyText: t('No conversations found'),
        emptyAction: ({ resetSearch }: { resetSearch: () => void }) => (
            Array.isArray(addButtons) && addButtons.length > 0 ? <CreateConvoButton variant="secondary" onSave={onSave} onShow={resetSearch} /> : null
        ),
        // Small screens show the list or the chat, never both, so a "current" row
        // would only linger after Back. Desktop keeps it highlighted next to the open chat.
        renderItem: ({ item, index }: { item: Convo; index: number }) => (
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
                    <MsgDialog onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                    {confirmDialog}
                    {searchOpen ? (
                        <ConvoSearchResults
                            lotId={selectedConvo?.id2 ?? ''}
                            term={convoSearch.term}
                            headerInset={isWeb ? 0 : headerHeight}
                            footerInset={composerInset + bottomBarInset}
                        />
                    ) : null}
                    {jotsLoaded && !searchOpen && (
                        <JotsPanel
                            data={jotsList}
                            unread={unread}
                            onSavedChange={handleSavedChange}
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
                            // 'fixed' is a web-only position, outside React Native's types.
                            style={(isWeb
                                ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20 }
                                : { position: 'absolute', left: 0, right: 0, bottom: ownsBottomBlur ? 0 : tabBarOverlayInset, zIndex: 10 }) as unknown as ViewStyle}
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
                        <MsgDialog onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                        {confirmDialog}
                        {selectedConvo ? (
                            <>
                                {searchOpen ? (
                                    <ConvoSearchResults
                                        lotId={selectedConvo.id2}
                                        term={convoSearch.term}
                                        headerInset={PANEL_HEADER_HEIGHT}
                                        footerInset={formHeight + errorOffset}
                                    />
                                ) : null}
                                {jotsLoaded && !searchOpen ? (
                                    <JotsPanel
                                        data={jotsList}
                                        unread={unread}
                                        onSavedChange={handleSavedChange}
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
                                        <PanelHeader title={selectedConvo.title || ''} search={searchOpen ? <ConvoSearchField onSearch={handleSearchTerm} /> : null} actions={<Row className="items-center gap-3"><ConvoSearchButton open={searchOpen} onPress={toggleSearch} style="glass" /><ConvoActionsMenu key={selectedConvo.id} menu={selectedConvo.menu} onAction={handleConvoAction} style="glass" /></Row>} />
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
