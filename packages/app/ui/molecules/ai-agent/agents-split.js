'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform } from 'react-native';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { View, ScrollView } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { cn, stripTags } from 'app/lib/util';
import ConvosList from 'app/components/elements/chat/parts/convos-list';
import {
    PanelHeader,
    PANEL_HEADER_HEIGHT,
    MenuSwitcher,
    CHAT_OVERLAY_HEADER,
    CHAT_OVERLAY_HEADER_FADE,
} from 'app/components/elements/chat/parts/headers';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import ConvosListItem from 'app/components/elements/chat/parts/convos-list-item';
import { useIsDesktop } from 'app/context/measure';
import { useLocalSearchParams } from 'app/lib/hooks/router';
import { lazyComponent } from 'app/lib/lazy-component';
import ChatPanels, { usePageContentHeight } from 'app/components/elements/chat/parts/chat-panels';
import AiAgent, { useAiAgent } from 'app/ui/molecules/ai-agent/agent';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

const AiAgentsAdmin = lazyComponent(() => import('app/ui/molecules/ai-agents-admin'), { name: 'AiAgentsAdmin' });

const isWeb = Platform.OS === 'web';

/** Operator chat | agents list: the same two tabs as the `ai_agents_admin` block header. */
const TABS = ['chat', 'agents'];
const tabItems = (t) => [
    { name: 'chat', title: t('agent_chats') },
    { name: 'agents', title: t('agents_admin_tab') },
];

const threadTitle = (thread, t) => thread.title || thread.context_name || t('agent_chat_untitled');

/** `ai_agents_admin` payload → props `useAiAgent` / `AiAgent` take for the operator chat. */
function useChatProps(chat) {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const initialMessage = chat ? hiddenFirstMessageFromData(chat, params) : '';
    return {
        data: chat,
        // Same message input and message items as the messenger.
        variant: 'chat',
        placeholder: `${t('Message')}...`,
        initialMessage,
        hideInitialMessage: !!initialMessage,
        showHistory: true,
        historyAlways: true,
    };
}

/** Web desktop: threads in the left panel, chat (or the agents list) in the centre. */
function AgentsDesktop({ data, chat }) {
    const { t } = useTranslation();
    const [tab, setTab] = useState('chat');
    const [height, setHeight] = useState(0);
    const { chat: chatElement, history } = useAiAgent({ ...useChatProps(chat), headerInset: PANEL_HEADER_HEIGHT });

    const onLayout = useCallback((event) => {
        const next = event.nativeEvent.layout.height;
        if (next > 0) setHeight((prev) => (prev === next ? prev : next));
    }, []);

    const selectThread = useCallback((thread) => {
        setTab('chat');
        history?.props.onSelect(thread);
    }, [history]);

    const threads = history?.props.threads;
    // Client-side search: the list is the viewer's own threads, at most 100 rows.
    const [query, setQuery] = useState('');
    const rows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return (threads || [])
            .filter((thread) => !needle
                || [thread.title, thread.preview, thread.context_name].some((text) => String(text || '').toLowerCase().includes(needle)))
            .map((thread) => ({ ...thread, id: thread.thread_id }));
    }, [threads, query]);
    const activeThreadId = history?.props.activeThreadId || history?.props.liveThreadId;
    const onStartNew = history?.props.onStartNew;
    const menuItems = useMemo(() => tabItems(t), [t]);
    const addButtons = useMemo(
        () => (onStartNew
            ? [(
                <NeoButton
                    key="new"
                    style="glass"
                    controlSize="regular"
                    borderShape="circle"
                    image="Plus"
                    accessibilityLabel={t('agent_chat_new')}
                    onPress={onStartNew}
                />
            )]
            : null),
        [onStartNew, t]
    );

    // Same panel as the messenger's conversation list; only the rows differ.
    const left = (
        <ConvosList
            data={rows}
            panelHeight={height}
            listHeight={height}
            isSmallScreen={false}
            title={data.chat_title || t('operator_agent_title')}
            emptyText={query.trim() ? t('agent_chats_search_empty') : t('agent_chats_empty')}
            onSearch={setQuery}
            addButtons={addButtons}
            menuItems={menuItems}
            menuIndex={TABS.indexOf(tab)}
            onMenuChange={(index) => setTab(TABS[index])}
            renderItem={({ item }) => (
                <ConvosListItem
                    profile={chat.agent_profile}
                    title={threadTitle(item, t)}
                    time={Number(item.updated_ts) || Number(item.created_ts) || 0}
                    preview={stripTags(item.preview)}
                    selected={tab === 'chat' && item.thread_id === activeThreadId}
                    onPress={() => selectThread(item)}
                />
            )}
        />
    );

    const studioItems = useMemo(
        () => [{ id: 'studio', title: t('Open in Studio'), icon: 'ExternalLink' }],
        [t]
    );
    const studioUrl = data.studio_url;
    const openStudio = useCallback(() => {
        if (studioUrl) Linking.openURL(studioUrl);
    }, [studioUrl]);

    const activeThread = (threads || []).find((thread) => thread.thread_id === activeThreadId);
    const chatTitle = activeThread ? threadTitle(activeThread, t) : t('agent_chat_new');

    // The header floats over the transcript, translucent, like the messenger's:
    // the chat (and the agents list) pad their top by its height and scroll under it.
    const center = (
        <View className="relative h-full min-h-0 overflow-hidden border-border/60 lg:border-l">
            <View className={cn('h-full min-h-0', tab === 'chat' ? '' : 'hidden')}>{chatElement}</View>
            {tab === 'agents' ? (
                <ScrollView
                    className="h-full"
                    contentContainerClassName="p-3"
                    contentContainerStyle={{ paddingTop: PANEL_HEADER_HEIGHT }}
                >
                    <AiAgentsAdmin data={data} />
                </ScrollView>
            ) : null}
            <EdgeBlurView edge="top" config={edgeBlurConfig('footer')} className={CHAT_OVERLAY_HEADER} washClassName={CHAT_OVERLAY_HEADER_FADE} pointerEvents="box-none">
                <View pointerEvents="auto">
                    <PanelHeader
                        title={tab === 'chat' ? chatTitle : t('agents_admin_tab')}
                        actions={studioUrl ? (
                            <DropdownMenu onSelect={openStudio} items={studioItems}>
                                <NeoButton
                                    style="glass"
                                    controlSize="regular"
                                    borderShape="circle"
                                    image="Settings"
                                    accessibilityLabel={t('Settings')}
                                />
                            </DropdownMenu>
                        ) : null}
                    />
                </View>
            </EdgeBlurView>
        </View>
    );

    return <ChatPanels left={left} center={center} height={height} onLayout={onLayout} />;
}

/** Small screens and native: one column, the thread list overlays the chat. */
function AgentsCompact({ data, chat }) {
    const { t } = useTranslation();
    const [tab, setTab] = useState('chat');
    const chatProps = useChatProps(chat);
    const frame = { height: Math.max(320, usePageContentHeight()) };

    return (
        <View style={frame}>
            <View className="px-4 pt-2">
                <MenuSwitcher items={tabItems(t)} index={TABS.indexOf(tab)} onChange={(index) => setTab(TABS[index])} />
            </View>
            <View className={cn('flex-1 min-h-0', tab === 'chat' ? '' : 'hidden')}>
                <AiAgent {...chatProps} height="h-full" historyLayout="overlay" />
            </View>
            {tab === 'agents' ? (
                <ScrollView className="flex-1" contentContainerClassName="p-3">
                    <AiAgentsAdmin data={data} />
                </ScrollView>
            ) : null}
        </View>
    );
}

/**
 * The agents page body (`ai_agents_admin` block payload) inside the shared chat
 * layout. With no operator chat configured only the agents list is shown.
 */
export default function AgentsSplit({ data }) {
    const isDesktop = useIsDesktop();
    const chat = data?.chat && typeof data.chat === 'object' ? data.chat : null;

    if (!chat) {
        return (
            <ScrollView className="h-full" contentContainerClassName="p-3">
                <AiAgentsAdmin data={data} />
            </ScrollView>
        );
    }

    return isWeb && isDesktop
        ? <AgentsDesktop data={data} chat={chat} />
        : <AgentsCompact data={data} chat={chat} />;
}
