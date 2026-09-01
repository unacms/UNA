'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fetchServerSentEvents, stream, useChat } from '@tanstack/ai-react';
import { Platform } from 'react-native';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { InputMulti, NeoButton } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import { useCurrentUser } from 'app/context/user';
import { appSetting, cn } from 'app/lib/util';
import { createUnaAiChatConnection, isUnaAiChatAgentId } from 'app/lib/una-ai-chat';

const UNCONFIGURED_CONNECTION = stream(async function* () {
    yield {
        type: 'RUN_ERROR',
        message: 'Agent chat is not configured.',
    };
});

const NEAR_BOTTOM_PX = 96;
const COMPOSER_LINE_PX = 20;
const COMPOSER_MAX_PX = 160;
const isWeb = Platform.OS === 'web';

function isNearBottom(node, nativeEvent) {
    if (node && typeof node.scrollTop === 'number' && typeof node.scrollHeight === 'number') {
        return node.scrollHeight - node.scrollTop - node.clientHeight <= NEAR_BOTTOM_PX;
    }
    const size = nativeEvent?.contentSize;
    const offset = nativeEvent?.contentOffset;
    const layout = nativeEvent?.layoutMeasurement;
    if (!size || !offset || !layout) return true;
    return size.height - offset.y - layout.height <= NEAR_BOTTOM_PX;
}

function scrollChatToEnd(node) {
    if (!node) return;
    if (typeof node.scrollToEnd === 'function') {
        node.scrollToEnd({ animated: false });
        return;
    }
    const top = node.scrollHeight ?? 0;
    if (typeof node.scrollTo === 'function') {
        node.scrollTo({ top, behavior: 'auto' });
        return;
    }
    if (typeof node.scrollTop === 'number') {
        node.scrollTop = top;
    }
}

function messageText(message) {
    if (typeof message?.content === 'string') return message.content;
    const parts = message?.parts || [];
    return parts
        .filter((part) => part?.type === 'text')
        .map((part) => part.content || '')
        .join('');
}

function ChatBubble({ message, user, assistant, isStreaming }) {
    const isUser = message.role === 'user';
    const text = messageText(message);
    const author = isUser
        ? {
              id: user?.id || 0,
              display_name: user?.display_name || 'You',
              url_avatar: user?.url_avatar,
          }
        : assistant;

    return (
        <Row className="gap-2">
            <View className="w-8 min-h-8 mt-2.5">
                <View className="w-8 my-0.5 shadow-xs rounded-full">
                    <Profile
                        {...author}
                        displayType="unit_wo_info"
                        displaySize="sm"
                        showInfo="false"
                        showLinks={false}
                    />
                </View>
            </View>
            <View className="flex-1 mt-2 min-w-0">
                <View className="bg-muted/50 rounded-xl py-2.5 px-3 gap-0.5 self-start max-w-full">
                    <Text className="text-sm tracking-tight font-semibold text-card-foreground">
                        {author.display_name}
                    </Text>
                    <Text className="text-sm text-foreground leading-5">
                        {text}
                        {isStreaming && !text ? '…' : ''}
                    </Text>
                </View>
            </View>
        </Row>
    );
}

function resolveSettings(props) {
    const incoming = {
        ...(props.data && typeof props.data === 'object' && !Array.isArray(props.data) ? props.data : {}),
        ...(props.params || {}),
        ...(props.settings || {}),
    };
    const showClearDefault = appSetting('ai_chat', 'show_clear');
    const agentIdRaw = String(
        props.agentId ??
            props.agent_id ??
            incoming.agentId ??
            incoming.agent_id ??
            incoming.agent ??
            ''
    ).trim();
    const agentId = isUnaAiChatAgentId(agentIdRaw) ? agentIdRaw : '';
    const connection = props.connection ?? incoming.connection;
    const liveUna = Boolean(agentId && !connection);

    return {
        connection,
        endpoint: props.endpoint ?? incoming.endpoint,
        agentId,
        liveUna,
        assistantName:
            incoming.assistantName ||
            incoming.assistant_name ||
            appSetting('ai_chat', 'assistant_name') ||
            'Assistant',
        assistantId: incoming.assistantId || incoming.assistant_id || agentId || 'una-assistant',
        assistantAvatar:
            incoming.assistantAvatar ||
            incoming.url_avatar ||
            incoming.assistant?.url_avatar,
        subtitle: incoming.subtitle || '',
        badge: incoming.badge || '',
        placeholder:
            incoming.placeholder ||
            appSetting('ai_chat', 'placeholder') ||
            'Ask anything...',
        emptyText:
            incoming.emptyText ||
            incoming.empty_text ||
            appSetting('ai_chat', 'empty_text') ||
            '',
        showClear:
            incoming.showClear ??
            incoming.show_clear ??
            (liveUna ? false : showClearDefault !== false),
        showHeader: incoming.showHeader ?? incoming.show_header ?? true,
    };
}

/**
 * Streaming AI chat widget (UNA Ask AI).
 *
 * Settings (prop or `params`, UNA-style):
 *   connection      — TanStack AI connection (preferred)
 *   endpoint        — SSE URL; used when `connection` is omitted
 *   agentId         — UNA agent; GET/POST `/sys-ai-chat/{id}` (same host/auth as fetcher)
 *   assistantName   — header + bubble author
 *   assistantAvatar — optional avatar URL
 *   subtitle, badge, placeholder, emptyText
 *   showClear, showHeader
 */
export default function AiChat(props) {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const [hydrateError, setHydrateError] = useState(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const restComposerHeightRef = useRef(null);
    const pinnedToBottomRef = useRef(true);
    const [composerHeight, setComposerHeight] = useState(COMPOSER_LINE_PX);
    const cfg = resolveSettings(props);

    const applyComposerHeight = useCallback((height) => {
        const next = Math.min(Math.max(Math.round(height), COMPOSER_LINE_PX), COMPOSER_MAX_PX);
        setComposerHeight((prev) => (prev === next ? prev : next));
        return next;
    }, []);

    useLayoutEffect(() => {
        const node = inputRef.current;
        if (!node?.style || typeof node.scrollHeight !== 'number') return;
        node.style.height = 'auto';
        const next = applyComposerHeight(node.scrollHeight);
        node.style.height = `${next}px`;
        if (!input && restComposerHeightRef.current == null) {
            restComposerHeightRef.current = next;
        }
    }, [input, applyComposerHeight]);

    const restComposerHeight = restComposerHeightRef.current ?? COMPOSER_LINE_PX;
    const isMultiline = input.length > 0 && (composerHeight > restComposerHeight + 6 || input.includes('\n'));

    const assistant = useMemo(
        () => ({
            id: cfg.assistantId,
            display_name: cfg.assistantName,
            url_avatar: cfg.assistantAvatar,
        }),
        [cfg.assistantId, cfg.assistantName, cfg.assistantAvatar]
    );

    useEffect(() => {
        if (!cfg.liveUna) setHydrateError(null);
    }, [cfg.liveUna, cfg.agentId]);

    const connection = useMemo(() => {
        if (cfg.connection) return cfg.connection;
        if (cfg.liveUna) {
            return createUnaAiChatConnection(cfg.agentId, {
                onHydrateError: setHydrateError,
            });
        }
        if (cfg.endpoint) return fetchServerSentEvents(cfg.endpoint);
        return UNCONFIGURED_CONNECTION;
    }, [cfg.connection, cfg.liveUna, cfg.agentId, cfg.endpoint]);

    const { messages, sendMessage, isLoading, error, stop, clear } = useChat(
        cfg.liveUna
            ? { connection, persistence: true, threadId: `agent:${cfg.agentId}` }
            : { connection }
    );

    const chatError = hydrateError || error;

    const last = messages[messages.length - 1];
    const streamingId = isLoading && last?.role === 'assistant' ? last.id : null;
    const lastText = last ? messageText(last) : '';

    useLayoutEffect(() => {
        if (!pinnedToBottomRef.current) return;
        scrollChatToEnd(listRef.current);
    }, [messages.length, lastText, isLoading]);

    const onListScroll = useCallback((event) => {
        pinnedToBottomRef.current = isNearBottom(listRef.current, event?.nativeEvent);
    }, []);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;
        pinnedToBottomRef.current = true;
        setInput('');
        const pending = sendMessage(text);
        scrollChatToEnd(listRef.current);
        await pending;
    }, [input, isLoading, sendMessage]);

    const onComposerKey = useCallback(
        (event) => {
            const key = event?.nativeEvent?.key || event?.key;
            if (key !== 'Enter' || event?.shiftKey) return;
            event.preventDefault?.();
            send();
        },
        [send]
    );

    return (
        <View className="relative rounded-2xl shadow-card-outline dark:shadow-card-outline-deep bg-card overflow-hidden">
            <ScrollView
                ref={listRef}
                className="max-h-[28rem] px-4"
                contentContainerClassName={cfg.showHeader ? 'gap-1 pt-16 pb-24' : 'gap-1 pt-3 pb-24'}
                onScroll={onListScroll}
                scrollEventThrottle={16}
            >
                {messages.length === 0 ? (
                    <View className="py-10 px-2">
                        {cfg.emptyText ? (
                            <Text className="text-sm text-muted-foreground text-center">
                                {cfg.emptyText}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            user={currentUser}
                            assistant={assistant}
                            isStreaming={message.id === streamingId}
                        />
                    ))
                )}
            </ScrollView>

            {cfg.showHeader ? (
                <Row
                    className="absolute w-full items-center bg-linear-to-b from-card from-20% to-transparent justify-between px-4 h-14"
                    pointerEvents="box-none"
                >
                    <Row
                        className="gap-2 items-center rounded-full bg-popover/50 web:backdrop-blur-md shadow-btn-glass dark:shadow-btn-glass-deep p-1"
                        pointerEvents="auto"
                    >
                        <Profile
                            {...assistant}
                            displayType="unit_wo_info"
                            displaySize="xs"
                        />
                        <View className="gap-0.5 pe-2">
                            <Text className="text-sm font-semibold text-foreground">
                                {cfg.assistantName}
                            </Text>
                            {cfg.subtitle ? (
                                <Text className="text-xs text-muted-foreground">{cfg.subtitle}</Text>
                            ) : null}
                        </View>
                    </Row>
                    {cfg.badge ? (
                        <View
                            className="rounded-full bg-muted/80 web:backdrop-blur-md px-2 py-0.5"
                            pointerEvents="auto"
                        >
                            <Text className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {cfg.badge}
                            </Text>
                        </View>
                    ) : null}
                </Row>
            ) : null}

            <View
                className="absolute bottom-0 w-full px-3 pb-3 pt-10 bg-linear-to-t from-card from-20% to-transparent"
                pointerEvents="box-none"
            >
                {chatError ? (
                    <View className="px-1 pb-2" pointerEvents="none">
                        <Text className="text-sm text-destructive">{chatError.message}</Text>
                    </View>
                ) : null}
                <View
                    className={cn(
                        'w-full bg-card/90 backdrop-blur-lg shadow-input-outline dark:shadow-input-outline-deep overflow-hidden',
                        isMultiline ? 'rounded-xl' : 'rounded-full'
                    )}
                    pointerEvents="auto"
                >
                    <View className="items-stretch">
                        <View
                            className={cn(
                                'p-3 min-h-12 flex-auto justify-center',
                                isMultiline ? 'mb-10' : 'me-10'
                            )}
                            style={isWeb ? { transition: 'padding-bottom 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' } : undefined}
                        >
                            <InputMulti
                                ref={inputRef}
                                value={input}
                                onChangeText={setInput}
                                onHeight={applyComposerHeight}
                                placeholder={cfg.placeholder}
                                editable={!isLoading}
                                className="w-full bg-transparent border-0 shadow-none outline-none ring-0 rounded-none p-0 min-h-0 leading-5 resize-none web:overflow-y-auto web:focus:outline-none web:focus:ring-0 web:focus:border-0 web:focus-visible:outline-none web:focus-visible:ring-0 web:focus-visible:border-0 web:focus-visible:shadow-none web:focus-visible:bg-transparent"
                                style={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    height: composerHeight,
                                    maxHeight: COMPOSER_MAX_PX,
                                }}
                                onKeyPress={onComposerKey}
                                blurOnSubmit={false}
                                returnKeyType="default"
                                {...(isWeb ? { rows: 1 } : { scrollEnabled: composerHeight >= COMPOSER_MAX_PX })}
                            />
                        </View>
                        <View className="flex-row absolute bottom-1.5 right-1.5">
                            {isLoading ? (
                                <NeoButton
                                    style="bordered"
                                    borderShape="circle"
                                    controlSize="small"
                                    image="Square"
                                    accessibilityLabel="Stop"
                                    onPress={() => stop()}
                                />
                            ) : (
                                <NeoButton
                                    style="glassProminent"
                                    borderShape="circle"
                                    controlSize="small"
                                    image="ArrowUp"
                                    accessibilityLabel="Send"
                                    disabled={!input.trim()}
                                    onPress={send}
                                />
                            )}
                        </View>
                    </View>
                </View>
                {cfg.showClear && messages.length > 0 ? (
                    <Row className="justify-end pt-2" pointerEvents="auto">
                        <NeoButton
                            style="plain"
                            controlSize="mini"
                            label="Clear"
                            onPress={() => clear()}
                        />
                    </Row>
                ) : null}
            </View>
        </View>
    );
}
