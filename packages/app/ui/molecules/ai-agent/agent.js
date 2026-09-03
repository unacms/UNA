'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { InputMulti, NeoButton } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import { useCurrentUser } from 'app/context/user';
import { cn, isWeb } from 'app/lib/util';
import { createAgentChat } from './helper';
import { isHiddenFirstMessageText } from './hidden-first-message';

const NEAR_BOTTOM_PX = 48;
const COMPOSER_LINE_PX = 20;
const COMPOSER_MAX_PX = 160;

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

export default function AiAgent({ data, initialMessage = '', hideInitialMessage = false }) {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const [hydrateError, setHydrateError] = useState(null);
    const sentHiddenRef = useRef(false);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const restComposerHeightRef = useRef(null);
    const pinnedToBottomRef = useRef(true);
    const scrollRafRef = useRef(0);
    const [composerHeight, setComposerHeight] = useState(COMPOSER_LINE_PX);

    const agentId = data.agent_id;
    const contextProfileId = Number(data.context_profile_id) || 0;
    const assistant = data.agent_profile;

    const applyComposerHeight = useCallback((height) => {
        const next = Math.min(Math.max(Math.round(height), COMPOSER_LINE_PX), COMPOSER_MAX_PX);
        setComposerHeight((prev) => (prev === next ? prev : next));
        return next;
    }, []);

    useLayoutEffect(() => {
        const node = inputRef.current;
        if (!node?.style || typeof node.scrollHeight !== 'number') return;
        node.style.height = 'auto';
        const measured = input ? node.scrollHeight : COMPOSER_LINE_PX;
        const next = applyComposerHeight(measured);
        node.style.height = `${next}px`;
        if (!input) {
            restComposerHeightRef.current = next;
        }
    }, [input, applyComposerHeight]);

    const restComposerHeight = restComposerHeightRef.current ?? COMPOSER_LINE_PX;
    const isMultiline = input.length > 0 && (composerHeight > restComposerHeight + 6 || input.includes('\n'));

    const connection = useMemo(
        () =>
            createAgentChat(agentId, {
                onHydrateError: setHydrateError,
                contextProfileId,
            }),
        [agentId, contextProfileId]
    );

    const { messages, sendMessage, isLoading, error, stop } = useChat({
        connection,
        persistence: true,
        threadId: contextProfileId > 0 ? `agent:${agentId}:${contextProfileId}` : `agent:${agentId}`,
    });

    const visibleMessages = hideInitialMessage
        ? messages.filter((message) => !isHiddenFirstMessageText(messageText(message)))
        : messages;

    useEffect(() => {
        if (!initialMessage || sentHiddenRef.current) return;
        if (messages.some((message) => isHiddenFirstMessageText(messageText(message)))) {
            sentHiddenRef.current = true;
            return;
        }
        if (messages.length > 0) {
            sentHiddenRef.current = true;
            return;
        }
        sentHiddenRef.current = true;
        void sendMessage(initialMessage);
    }, [initialMessage, messages, sendMessage]);

    const chatError = hydrateError || error;

    const last = messages[messages.length - 1];
    const streamingId = isLoading && last?.role === 'assistant' ? last.id : null;
    const lastText = last ? messageText(last) : '';

    const scrollToEndSoon = useCallback(() => {
        if (scrollRafRef.current) return;
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = 0;
            scrollChatToEnd(listRef.current);
        });
    }, []);

    useLayoutEffect(() => {
        return () => {
            if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        };
    }, []);

    useLayoutEffect(() => {
        if (!pinnedToBottomRef.current) return;
        scrollToEndSoon();
    }, [visibleMessages.length, lastText, isLoading, composerHeight, scrollToEndSoon]);

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
        <View className="h-[28rem] overflow-hidden">
            <ScrollView
                ref={listRef}
                className="min-h-0 flex-1"
                contentContainerClassName="gap-1"
                onScroll={onListScroll}
                scrollEventThrottle={100}
            >
                {visibleMessages.map((message) => (
                    <ChatBubble
                        key={message.id}
                        message={message}
                        user={currentUser}
                        assistant={assistant}
                        isStreaming={message.id === streamingId}
                    />
                ))}
            </ScrollView>

            <View className="pt-2">
                {chatError ? (
                    <View className="px-1 pb-2">
                        <Text className="text-sm text-destructive">{chatError.message}</Text>
                    </View>
                ) : null}
                <View
                    className={cn(
                        'w-full bg-card/90 backdrop-blur-lg shadow-input-outline dark:shadow-input-outline-deep overflow-hidden',
                        isMultiline ? 'rounded-xl' : 'rounded-full'
                    )}
                >
                    <Row className="items-end">
                        <View className="flex-1 p-3 min-h-12 justify-center">
                            <InputMulti
                                ref={inputRef}
                                value={input}
                                onChangeText={setInput}
                                onHeight={(height) => applyComposerHeight(input ? height : COMPOSER_LINE_PX)}
                                placeholder="Ask anything..."
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
                        <View className="p-1.5">
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
                    </Row>
                </View>
            </View>
        </View>
    );
}
