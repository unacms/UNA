'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { InputMulti, NeoButton, NeoButtonLink } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import Html from 'app/ui/atoms/html';
import { useCurrentUser } from 'app/context/user';
import { cn, isWeb } from 'app/lib/util';
import { createAgentChat } from './helper';
import { isHiddenFirstMessageText } from './hidden-first-message';
import { messageActions, parseChatActionsPayload } from './message-content';

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

function lastAssistantId(messages) {
    for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
        if (messages[i]?.role === 'assistant') return messages[i].id;
    }
    return null;
}

function isInteractiveTarget(target) {
    return typeof target?.closest === 'function'
        ? !!target.closest('a, button, input, textarea, select, [contenteditable="true"], [role="button"]')
        : false;
}

function MessageBody({ text, isStreaming }) {
    if (!text && !isStreaming) return null;
    if (!text) {
        return <Text className="text-sm text-foreground leading-5">…</Text>;
    }
    return (
        <Html
            data={String(text).replace(/\r\n|\n|\r/g, '<br>')}
            customClassName="u-vanilla-html-small"
        />
    );
}

function ChatActions({ actions, onReply, repliesEnabled, chosenReply = '' }) {
    const [chosen, setChosen] = useState('');
    const selectedMessage = chosen || chosenReply;
    if (!actions.length) return null;
    return (
        <View className="flex-row flex-wrap gap-2 mt-2 max-w-full">
            {actions.map((action, index) => {
                const isLink = action.type === 'link';
                const isSelected = !isLink && action.message === selectedMessage;
                const buttonProps = {
                    label: action.label,
                    style: isSelected ? 'glassProminent' : 'bordered',
                    controlSize: 'small',
                    borderShape: 'rounded',
                };
                if (isLink) {
                    return (
                        <NeoButtonLink
                            key={`${action.type}:${action.label}:${index}`}
                            {...buttonProps}
                            href={action.url}
                            target="_blank"
                        />
                    );
                }
                return (
                    <NeoButton
                        key={`${action.type}:${action.label}:${index}`}
                        {...buttonProps}
                        selected={isSelected}
                        disabled={!isSelected && !repliesEnabled}
                        onPress={() => {
                            if (!repliesEnabled || isSelected) return;
                            setChosen(action.message);
                            onReply?.(action.message);
                        }}
                    />
                );
            })}
        </View>
    );
}

function AgentStatus({ label }) {
    return (
        <Row className="flex-none gap-2 items-center">
            <Text className="text-xs text-muted-foreground py-1 animate-pulse">{label}</Text>
        </Row>
    );
}

function ChatBubble({ message, user, assistant, isStreaming, onReply, repliesEnabled, streamedActions, chosenReply }) {
    const isUser = message.role === 'user';
    const text = messageText(message);
    const actions = isUser ? [] : messageActions(message, streamedActions);
    const hasActions = actions.length > 0;
    if (!text && !hasActions && !isStreaming) return null;

    const showBubble = !!text || isStreaming;
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
                {showBubble ? (
                    <View className="bg-muted/50 rounded-xl py-2.5 px-3 gap-0.5 w-full min-w-0">
                        <Text className="text-sm tracking-tight font-semibold text-card-foreground">
                            {author?.display_name}
                        </Text>
                        <MessageBody text={text} isStreaming={isStreaming} />
                    </View>
                ) : null}
                {hasActions ? (
                    <ChatActions
                        actions={actions}
                        onReply={onReply}
                        repliesEnabled={repliesEnabled}
                        chosenReply={chosenReply}
                    />
                ) : null}
            </View>
        </Row>
    );
}

const sentBootstrapKeys = new Set();

/** Load UNA transcript before useChat mounts so bootstrap cannot race hydrate. */
export default function AiAgent({ data, initialMessage = '', hideInitialMessage = false }) {
    const agentId = data.agent_id;
    const contextProfileId = Number(data.context_profile_id) || 0;
    const [seed, setSeed] = useState(() => (initialMessage ? null : []));
    const [seedError, setSeedError] = useState(null);

    useEffect(() => {
        if (!initialMessage) return undefined;
        let cancelled = false;
        const chat = createAgentChat(agentId, {
            contextProfileId,
            onHydrateError: (error) => {
                if (!cancelled) setSeedError(error);
            },
        });
        chat
            .hydrate()
            .then((result) => {
                if (!cancelled) setSeed(Array.isArray(result?.messages) ? result.messages : []);
            })
            .catch(() => {
                if (!cancelled) setSeed([]);
            });
        return () => {
            cancelled = true;
        };
    }, [agentId, contextProfileId, initialMessage]);

    if (initialMessage && seed === null) {
        return <View className="h-[28rem] overflow-hidden" />;
    }

    return (
        <AiAgentChat
            data={data}
            initialMessage={initialMessage}
            hideInitialMessage={hideInitialMessage}
            initialMessages={seed || []}
            sendBootstrap={!!initialMessage && (seed || []).length === 0}
            hydrateError={seedError}
        />
    );
}

function AiAgentChat({
    data,
    initialMessage = '',
    hideInitialMessage = false,
    initialMessages = [],
    sendBootstrap = false,
    hydrateError = null,
}) {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const restComposerHeightRef = useRef(null);
    const pinnedToBottomRef = useRef(true);
    const scrollRafRef = useRef(0);
    const skipPinFromScrollRef = useRef(false);
    const [composerHeight, setComposerHeight] = useState(COMPOSER_LINE_PX);
    const [streamActions, setStreamActions] = useState({});
    const lastAssistantIdRef = useRef(null);
    const messagesRef = useRef([]);
    const pendingActionsRef = useRef(null);
    const applyChatActionsRef = useRef(null);

    const agentId = data.agent_id;
    const contextProfileId = Number(data.context_profile_id) || 0;
    const assistant = data.agent_profile;

    const applyComposerHeight = useCallback((height) => {
        const next = Math.min(Math.max(Math.round(height), COMPOSER_LINE_PX), COMPOSER_MAX_PX);
        setComposerHeight((prev) => (prev === next ? prev : next));
        return next;
    }, []);

    const focusComposer = useCallback(() => {
        const node = inputRef.current;
        if (node && typeof node.focus === 'function') node.focus();
    }, []);

    useLayoutEffect(() => {
        const node = inputRef.current;
        if (!node?.style || typeof node.scrollHeight !== 'number') return;
        const selectionStart = node.selectionStart;
        const selectionEnd = node.selectionEnd;
        node.style.height = 'auto';
        const measured = input ? node.scrollHeight : COMPOSER_LINE_PX;
        const next = applyComposerHeight(measured);
        node.style.height = `${next}px`;
        if (
            isWeb &&
            typeof node.setSelectionRange === 'function' &&
            typeof document !== 'undefined' &&
            document.activeElement === node
        ) {
            node.setSelectionRange(selectionStart, selectionEnd);
        }
        if (!input) {
            restComposerHeightRef.current = next;
        }
    }, [input, applyComposerHeight]);

    const restComposerHeight = restComposerHeightRef.current ?? COMPOSER_LINE_PX;
    const isMultiline = input.length > 0 && (composerHeight > restComposerHeight + 6 || input.includes('\n'));

    const applyChatActions = useCallback((messageId, value) => {
        const actions = parseChatActionsPayload(value);
        if (!actions.length) return;

        const messages = messagesRef.current;
        const last = messages[messages.length - 1];
        // CUSTOM often arrives in the same tick as TEXT_MESSAGE_END, before React
        // commits the new bubble. Do not fall back to the previous assistant.
        const id = (last?.role === 'assistant' ? last.id : null)
            || (messageId && messages.some((message) => message.id === messageId) ? messageId : null);

        if (!id) {
            pendingActionsRef.current = actions;
            return;
        }

        pendingActionsRef.current = null;
        setStreamActions((prev) => {
            const next = { ...prev, [id]: actions };
            if (messageId && messageId !== id) next[messageId] = actions;
            return next;
        });
    }, []);
    applyChatActionsRef.current = applyChatActions;

    const connection = useMemo(
        () =>
            createAgentChat(agentId, {
                contextProfileId,
                onChatActions: (messageId, value) => applyChatActionsRef.current?.(messageId, value),
            }),
        [agentId, contextProfileId]
    );

    const threadId =
        contextProfileId > 0 ? `agent:${agentId}:${contextProfileId}` : `agent:${agentId}`;

    const onChatChunk = useCallback((chunk) => {
        if (chunk?.type !== 'CUSTOM' || chunk.name !== 'chat_actions') return;
        applyChatActions(chunk.messageId, chunk.value);
    }, [applyChatActions]);

    // Prefetched transcript: do not use persistence hydrate — it races sendMessage
    // ("a send that starts first owns the client"). Contact / no bootstrap keeps
    // server hydrate like neo.
    const { messages, sendMessage, isLoading, error, stop } = useChat({
        connection,
        initialMessages,
        threadId,
        onChunk: onChatChunk,
        onCustomEvent: (name, value) => {
            if (name !== 'chat_actions') return;
            applyChatActions(null, value);
        },
        ...(sendBootstrap || initialMessage ? {} : { persistence: true }),
    });

    messagesRef.current = messages;
    lastAssistantIdRef.current = lastAssistantId(messages);

    useEffect(() => {
        const pending = pendingActionsRef.current;
        if (!pending) return;
        const id = lastAssistantId(messages);
        if (!id) return;
        pendingActionsRef.current = null;
        setStreamActions((prev) => ({ ...prev, [id]: pending }));
    }, [messages]);

    const visibleMessages = messages.filter((message) => {
        if (hideInitialMessage && isHiddenFirstMessageText(messageText(message))) return false;
        if (message.role !== 'assistant') return true;
        return !!messageText(message) || messageActions(message, streamActions[message.id]).length > 0;
    });

    useEffect(() => {
        pendingActionsRef.current = null;
        setStreamActions({});
    }, [threadId]);

    useEffect(() => {
        if (!sendBootstrap || !initialMessage) return;
        const key = `${threadId}:${initialMessage}`;
        if (sentBootstrapKeys.has(key)) return;
        sentBootstrapKeys.add(key);
        void sendMessage(initialMessage);
    }, [sendBootstrap, initialMessage, sendMessage, threadId]);

    const chatError = hydrateError || error;

    const last = messages[messages.length - 1];
    const lastVisible = visibleMessages[visibleMessages.length - 1];
    const lastVisibleId = lastVisible?.id;
    const streamingId = isLoading && last?.role === 'assistant' ? last.id : null;
    const lastText = last ? messageText(last) : '';
    const waitingForReply = isLoading && (!last || last.role === 'user' || !lastText);

    const scrollListToEnd = useCallback(() => {
        skipPinFromScrollRef.current = true;
        scrollChatToEnd(listRef.current);
        pinnedToBottomRef.current = true;
        if (scrollRafRef.current) return;
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = 0;
            skipPinFromScrollRef.current = true;
            scrollChatToEnd(listRef.current);
            skipPinFromScrollRef.current = false;
        });
    }, []);

    useLayoutEffect(() => {
        return () => {
            if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        };
    }, []);

    useLayoutEffect(() => {
        if (!pinnedToBottomRef.current) return;
        scrollListToEnd();
    }, [visibleMessages.length, lastText, isLoading, waitingForReply, composerHeight, scrollListToEnd]);

    const onListScroll = useCallback((event) => {
        if (skipPinFromScrollRef.current) return;
        pinnedToBottomRef.current = isNearBottom(listRef.current, event?.nativeEvent);
    }, []);

    const onListMouseUp = useCallback((event) => {
        if (event.button !== 0 || isInteractiveTarget(event.target)) return;
        const selection = window.getSelection?.();
        if (selection && !selection.isCollapsed && selection.toString()) return;
        focusComposer();
    }, [focusComposer]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;
        pinnedToBottomRef.current = true;
        setInput('');
        const pending = sendMessage(text);
        scrollListToEnd();
        focusComposer();
        await pending;
        focusComposer();
    }, [input, isLoading, sendMessage, focusComposer, scrollListToEnd]);

    const sendReply = useCallback(async (text) => {
        const value = String(text || '').trim();
        if (!value || isLoading) return;
        pinnedToBottomRef.current = true;
        setInput('');
        const pending = sendMessage(value);
        scrollListToEnd();
        focusComposer();
        await pending;
        focusComposer();
    }, [isLoading, sendMessage, focusComposer, scrollListToEnd]);

    const onComposerKey = useCallback(
        (event) => {
            if (event?.isComposing || event?.nativeEvent?.isComposing) return;
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
                contentContainerClassName="gap-1 grow-0"
                onScroll={onListScroll}
                scrollEventThrottle={100}
                keyboardShouldPersistTaps="always"
                {...(isWeb ? { onMouseUp: onListMouseUp } : null)}
            >
                {visibleMessages.map((message, index) => {
                    const next = visibleMessages[index + 1];
                    const chosenReply = next?.role === 'user' ? messageText(next).trim() : '';
                    return (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            user={currentUser}
                            assistant={assistant}
                            isStreaming={message.id === streamingId}
                            onReply={sendReply}
                            repliesEnabled={!isLoading && message.id === lastVisibleId}
                            streamedActions={streamActions[message.id]}
                            chosenReply={chosenReply}
                        />
                    );
                })}
                {waitingForReply ? <AgentStatus label="Thinking…" /> : null}
            </ScrollView>

            <View className="pt-2">
                {chatError ? (
                    <View className="px-1 pb-2">
                        <Text className="text-sm text-destructive">{chatError.message}</Text>
                    </View>
                ) : null}
                <View
                    className={cn(
                        'w-full  overflow-hidden',
                        isMultiline ? '' : ''
                    )}
                >
                    <Row className="items-center">
                        <View className="flex-1 min-h-12 justify-center">
                            <InputMulti
                                ref={inputRef}
                                value={input}
                                onChangeText={setInput}
                                onHeight={(height) => applyComposerHeight(input ? height : COMPOSER_LINE_PX)}
                                placeholder="Ask anything..."
                                className="w-full bg-transparent border-0 shadow-none outline-none ring-0 rounded-none p-0 min-h-0 leading-5 resize-none web:overflow-y-auto web:focus:outline-none web:focus:ring-0 web:focus:border-0 web:focus-visible:outline-none web:focus-visible:ring-0 web:focus-visible:border-0 web:focus-visible:shadow-none web:focus-visible:bg-transparent"
                                style={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    height: composerHeight,
                                    maxHeight: COMPOSER_MAX_PX,
                                }}
                                onKeyDown={isWeb ? onComposerKey : undefined}
                                onKeyPress={isWeb ? undefined : onComposerKey}
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
