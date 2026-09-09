'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, TextInputClear } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { appSetting, cn, isWeb } from 'app/lib/util';
import { createAgentChat, hydrateAgentChat } from './helper';
import { isHiddenFirstMessageText } from './hidden-first-message';
import {
    agentMaxInputChars,
    clipAgentText,
    lastAssistantId,
    messageActions,
    messageText,
    parseChatActionsPayload,
    parseChatSessionPayload,
    sessionAllowsRestart,
    sessionFromMessages,
} from './message-content';
import { AgentStatus, ChatBubble } from './chat-bubble';
import { COMPOSER_MAX_PX, useComposerHeight } from './use-composer-height';
import { useChatAutoscroll } from './use-chat-autoscroll';

/**
 * @typedef {object} AgentBlockData UNA `sys-ai-chat` block payload.
 * @property {string} agent_id Agent row id; the only required field.
 * @property {number|string} [context_profile_id] Profile the conversation is about.
 * @property {object} [agent_profile] Profile unit used for the assistant's avatar and name.
 * @property {number|string} [max_input_chars] Per-message cap; 0 or absent means none.
 * @property {number|string} [guest_new_session_on_reload] 1 = every guest reload starts a fresh chat.
 * @property {'html'|'text'} [message_format] How to read agent output. Default 'html'.
 * @property {string} [hidden_first_message] Bootstrap rule, read by the block element — see hidden-first-message.js.
 */

/** Elements that own their own click: never steal focus from them. */
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [contenteditable="true"], [role="button"]';

function isInteractiveTarget(target) {
    return typeof target?.closest === 'function' ? !!target.closest(INTERACTIVE_SELECTOR) : false;
}

/**
 * Client-side id for a guest chat, so "one browser = one conversation" works without a
 * member account. Not security-bearing — identity is still the UNA session cookie;
 * this only partitions transcripts.
 */
function guestChatNonce() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
        }
    } catch {
        // Some locked-down contexts throw on crypto access. The fallback is fine here
        // because collisions only ever matter within one browser.
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Seed state for the transcript: `null` = "hydrate first, render nothing yet",
 * `[]` = "nothing to load, start clean".
 *
 * Fetching history is only worth a round trip when there is a bootstrap message to
 * suppress — without one, `useChat`'s own persistence handles hydration — and the chat
 * could already exist server-side. A guest whose chat id is a fresh nonce (agent
 * configured for a new session per reload, or they just pressed "Start again")
 * provably has no transcript, so the fetch is skipped.
 */
function initialSeed(initialMessage, chatIsFresh) {
    return initialMessage && !chatIsFresh ? null : [];
}

/**
 * Loads the UNA transcript before `useChat` mounts, so the bootstrap send cannot race
 * hydration ("a send that starts first owns the client"). The chat itself lives in
 * `AiAgentChat`, remounted via `key` whenever its identity changes.
 *
 * @param {object} props
 * @param {AgentBlockData} props.data
 * @param {string} [props.initialMessage] Hidden first user line; empty = no bootstrap.
 * @param {boolean} [props.hideInitialMessage] Keep the bootstrap line out of the transcript.
 * @param {string} [props.placeholder] Composer placeholder; defaults to a translated string.
 * @param {boolean} [props.hideButton] Hide the send/stop button (Enter still sends).
 * @param {boolean} [props.hideIdentity] Hide avatars and author names.
 * @param {string} [props.height] Tailwind height class for the whole widget.
 */
export default function AiAgent({
    data,
    initialMessage = '',
    hideInitialMessage = false,
    placeholder,
    hideButton = false,
    hideIdentity = false,
    height = 'h-[28rem]',
}) {
    const { currentUser } = useCurrentUser();
    const agentId = data?.agent_id;
    const contextProfileId = Number(data?.context_profile_id) || 0;
    const isGuest = !(Number(currentUser?.id) > 0);
    const guestSessionPerReload = !!Number(data?.guest_new_session_on_reload);

    const [guestChatId, setGuestChatId] = useState(() => (guestSessionPerReload ? guestChatNonce() : ''));
    // Members are identified by their session; only guests need the nonce.
    const chatId = isGuest ? guestChatId : '';

    const [seed, setSeed] = useState(() => initialSeed(initialMessage, guestSessionPerReload && isGuest));
    const [seedSession, setSeedSession] = useState(null);
    const [seedError, setSeedError] = useState(null);

    const startAgain = useCallback(() => {
        // A new nonce means a new conversation, so there is nothing left to hydrate.
        setSeed(initialSeed(initialMessage, isGuest));
        setSeedSession(null);
        setSeedError(null);
        setGuestChatId(guestChatNonce());
    }, [initialMessage, isGuest]);

    useEffect(() => {
        // `seed !== null` covers both "already loaded" and "decided not to load", and it
        // keeps a restart from re-fetching the chat it just replaced.
        if (!initialMessage || seed !== null) return undefined;
        let cancelled = false;
        hydrateAgentChat(agentId, { contextProfileId, chatId })
            .then((result) => {
                if (cancelled) return;
                setSeed(Array.isArray(result?.messages) ? result.messages : []);
                setSeedSession(parseChatSessionPayload(result?.session) || null);
            })
            .catch((error) => {
                if (cancelled) return;
                // A failed history load must not block the chat: start clean and show the
                // error beside the composer.
                setSeed([]);
                setSeedSession(null);
                setSeedError(error);
            });
        return () => {
            cancelled = true;
        };
    }, [agentId, contextProfileId, initialMessage, chatId, seed]);

    // Hold the final height while hydrating so the page does not jump when the
    // transcript arrives.
    if (initialMessage && seed === null) {
        return <View className={cn(height, 'overflow-hidden')} />;
    }

    return (
        <AiAgentChat
            key={`${agentId}:${contextProfileId}:${chatId}`}
            data={data}
            guestChatId={chatId}
            initialMessage={initialMessage}
            hideInitialMessage={hideInitialMessage}
            initialMessages={seed || []}
            initialSession={seedSession}
            sendBootstrap={!!initialMessage && (seed || []).length === 0}
            hydrateError={seedError}
            hideButton={hideButton}
            hideIdentity={hideIdentity}
            placeholder={placeholder}
            height={height}
            onStartAgain={isGuest ? startAgain : undefined}
        />
    );
}

function AiAgentChat({
    data,
    guestChatId = '',
    initialMessage = '',
    hideInitialMessage = false,
    initialMessages = [],
    initialSession = null,
    sendBootstrap = false,
    hydrateError = null,
    hideButton = false,
    hideIdentity = false,
    placeholder,
    height,
    onStartAgain,
}) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const inputRef = useRef(null);
    const messagesRef = useRef(initialMessages);
    const pendingActionsRef = useRef(null);
    const bootstrapSentRef = useRef('');
    const [streamActions, setStreamActions] = useState({});
    const [streamedSession, setStreamedSession] = useState(null);

    const agentId = data?.agent_id;
    const contextProfileId = Number(data?.context_profile_id) || 0;
    const assistant = data?.agent_profile;
    const maxChars = agentMaxInputChars(data);
    const messageFormat = data?.message_format === 'text' ? 'text' : 'html';

    // Read per render rather than at module scope: theme settings arrive with the
    // layout, so a snapshot taken at import time can be empty.
    const inputSettings = appSetting('theme', 'inputs');

    const { listRef, onScroll, scrollToEnd, pinToBottom, followIfPinned } = useChatAutoscroll();
    const composer = useComposerHeight(inputRef, input);

    /**
     * Attach streamed quick-reply buttons to the assistant message they belong to.
     *
     * The CUSTOM chunk often lands in the same tick as TEXT_MESSAGE_END, before React
     * has committed the new bubble — so falling back to the *previous* assistant
     * message would hang the buttons off the wrong turn. With no message to attach to
     * yet, park the actions and let the effect below place them.
     */
    const applyChatActions = useCallback((messageId, value) => {
        const actions = parseChatActionsPayload(value);
        if (!actions.length) return;

        const messages = messagesRef.current;
        const last = messages[messages.length - 1];
        const id = (last?.role === 'assistant' ? last.id : null)
            || (messageId && messages.some((message) => message.id === messageId) ? messageId : null);

        if (!id) {
            pendingActionsRef.current = actions;
            return;
        }

        pendingActionsRef.current = null;
        setStreamActions((prev) => {
            const next = { ...prev, [id]: actions };
            // Also key by the server's id, so the actions survive reconciliation
            // renaming the optimistic message.
            if (messageId && messageId !== id) next[messageId] = actions;
            return next;
        });
    }, []);

    const applyChatSession = useCallback((value) => {
        const next = parseChatSessionPayload(value);
        if (next) setStreamedSession(next);
    }, []);

    // Both handlers are dependency-free, so their identity is stable for the life of the
    // component and `connection` is never rebuilt underneath an open stream. That is why
    // they can be passed straight in, with no latest-ref indirection.
    const connection = useMemo(
        () =>
            createAgentChat(agentId, {
                contextProfileId,
                chatId: guestChatId,
                onChatActions: applyChatActions,
                onChatSession: (_messageId, value) => applyChatSession(value),
            }),
        [agentId, contextProfileId, guestChatId, applyChatActions, applyChatSession]
    );

    const threadId = ['agent', agentId, contextProfileId > 0 ? contextProfileId : null, guestChatId || null]
        .filter(Boolean)
        .join(':');

    const onChatChunk = useCallback((chunk) => {
        if (chunk?.type !== 'CUSTOM') return;
        if (chunk.name === 'chat_actions') applyChatActions(chunk.messageId, chunk.value);
        if (chunk.name === 'chat_session') applyChatSession(chunk.value);
    }, [applyChatActions, applyChatSession]);

    // Prefetched transcript: do not use persistence hydrate — it races sendMessage
    // ("a send that starts first owns the client"). Contact / no bootstrap keeps
    // server hydrate like neo.
    const { messages, sendMessage, isLoading, error, stop } = useChat({
        connection,
        initialMessages,
        threadId,
        onChunk: onChatChunk,
        onCustomEvent: (name, value) => {
            if (name === 'chat_actions') applyChatActions(null, value);
            if (name === 'chat_session') applyChatSession(value);
        },
        ...(sendBootstrap || initialMessage || guestChatId ? {} : { persistence: true }),
    });

    /**
     * Mirrored in a layout effect rather than assigned during render: writing a ref
     * while rendering is a side effect, and a render React discards would still leave
     * the ref pointing at messages that were never committed. The chunk handler runs
     * between commits, so "last committed messages" is exactly what it should see.
     */
    useLayoutEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Place actions that arrived before their bubble existed.
    useEffect(() => {
        const pending = pendingActionsRef.current;
        if (!pending) return;
        const id = lastAssistantId(messages);
        if (!id) return;
        pendingActionsRef.current = null;
        setStreamActions((prev) => ({ ...prev, [id]: pending }));
    }, [messages]);

    /**
     * Session end has three possible sources, newest first: a live `chat_session` chunk,
     * a payload persisted on an assistant message, and whatever hydrate returned.
     * Derived instead of stored, so there is no second copy of the truth to keep in sync
     * with an effect that also writes it.
     */
    const session = useMemo(
        () => streamedSession || sessionFromMessages(messages) || parseChatSessionPayload(initialSession),
        [streamedSession, messages, initialSession]
    );
    const sessionEnded = !!session?.ended;
    const canRestart = sessionAllowsRestart(session);
    const chatError = hydrateError || error;

    // Belt and braces: the parent already remounts on every input to threadId via `key`,
    // so this only matters if that key is ever relaxed.
    useEffect(() => {
        pendingActionsRef.current = null;
        setStreamActions({});
        setStreamedSession(null);
    }, [threadId]);

    const visibleMessages = useMemo(
        () =>
            messages.filter((message, index) => {
                // The bootstrap line is machinery, not conversation. Matched on position as
                // well as text: only the first user message can be it, so someone who later
                // types "[page opened…" cannot make their own message disappear.
                if (
                    hideInitialMessage
                    && index === 0
                    && message.role === 'user'
                    && isHiddenFirstMessageText(messageText(message))
                ) {
                    return false;
                }
                if (message.role !== 'assistant') return true;
                // An assistant turn with neither text nor buttons has nothing to show yet.
                return !!messageText(message) || messageActions(message, streamActions[message.id]).length > 0;
            }),
        [messages, hideInitialMessage, streamActions]
    );

    const last = messages[messages.length - 1];
    const lastVisibleId = visibleMessages[visibleMessages.length - 1]?.id;
    const streamingId = isLoading && last?.role === 'assistant' ? last.id : null;
    const lastText = last ? messageText(last) : '';
    // Loading with no assistant text yet — the gap between "sent" and "first token".
    const waitingForReply = isLoading && (!last || last.role === 'user' || !lastText);

    const focusComposer = useCallback(() => {
        if (sessionEnded) return;
        const node = inputRef.current;
        if (node && typeof node.focus === 'function') node.focus();
    }, [sessionEnded]);

    // Follow the stream while the user is pinned to the bottom. `lastText` is in the deps
    // on purpose: it changes on every token, which is what keeps the view glued to a
    // growing reply.
    useLayoutEffect(() => {
        followIfPinned();
    }, [followIfPinned, visibleMessages.length, lastText, isLoading, waitingForReply, composer.height]);

    const onListMouseUp = useCallback((event) => {
        // Click anywhere in the transcript to get back to typing — but not when the click
        // was a link/button press or the end of a text selection.
        if (sessionEnded) return;
        if (event.button !== 0 || isInteractiveTarget(event.target)) return;
        const selection = window.getSelection?.();
        if (selection && !selection.isCollapsed && selection.toString()) return;
        focusComposer();
    }, [focusComposer, sessionEnded]);

    /**
     * The single send path, shared by the composer and the quick-reply buttons. Resolves
     * to whether the message was accepted, so `ChatActions` knows when to drop its
     * optimistic highlight.
     *
     * Deliberately closed over nothing that changes per keystroke: this is handed to
     * every bubble as `onReply`, and depending on `input` would change its identity on
     * every character typed, defeating the memo on ChatBubble. Draft handling therefore
     * lives in `send` below.
     */
    const sendReply = useCallback(async (raw) => {
        const text = clipAgentText(String(raw ?? '').trim(), maxChars);
        if (!text || isLoading || sessionEnded) return false;
        // A send always pulls the view down, even if the user had scrolled up to read.
        pinToBottom();
        try {
            const pending = sendMessage(text);
            scrollToEnd();
            // Focus twice: once so typing can continue immediately, once after the round
            // trip because re-rendering the list can take focus back.
            focusComposer();
            await pending;
            focusComposer();
            return true;
        } catch {
            // Reported through useChat's `error`; the caller decides what to restore.
            return false;
        }
    }, [maxChars, isLoading, sessionEnded, sendMessage, focusComposer, scrollToEnd, pinToBottom]);

    const send = useCallback(async () => {
        const draft = input;
        // Clear first so the composer empties the moment the user hits send...
        setInput('');
        const sent = await sendReply(draft);
        // ...and never swallow their words: put the draft back if it did not go through.
        if (!sent) setInput(draft);
        return sent;
    }, [input, sendReply]);

    useEffect(() => {
        if (!sendBootstrap || !initialMessage) return;
        const text = clipAgentText(initialMessage, maxChars);
        // Guarded per mount. This used to be a module-level Set that was never cleared:
        // it leaked, and worse it outlived the component — coming back to the same agent
        // with an empty transcript would skip the bootstrap and leave the chat silent.
        if (bootstrapSentRef.current === text) return;
        bootstrapSentRef.current = text;
        Promise.resolve(sendMessage(text)).catch(() => {
            // Clear the guard so a later render can try again; the error itself surfaces
            // through useChat's `error`.
            bootstrapSentRef.current = '';
        });
    }, [sendBootstrap, initialMessage, sendMessage, maxChars]);

    const onInputChange = useCallback((value) => {
        setInput(clipAgentText(value, maxChars));
    }, [maxChars]);

    const onComposerKey = useCallback((event) => {
        // Enter sends, Shift+Enter makes a new line. IME composition must be left alone,
        // or Enter would submit half-typed CJK text.
        if (event?.isComposing || event?.nativeEvent?.isComposing) return;
        const key = event?.nativeEvent?.key || event?.key;
        if (key !== 'Enter' || event?.shiftKey) return;
        event.preventDefault?.();
        void send();
    }, [send]);

    return (
        <View className={cn(height, 'overflow-hidden')}>
            <ScrollView
                ref={listRef}
                className="min-h-0 flex-1"
                contentContainerClassName="gap-1 grow-0"
                onScroll={onScroll}
                scrollEventThrottle={100}
                keyboardShouldPersistTaps="always"
                accessibilityLabel={t('Conversation')}
                {...(isWeb ? { onMouseUp: onListMouseUp } : null)}
            >
                {visibleMessages.map((message, index) => {
                    const next = visibleMessages[index + 1];
                    // A user message directly after this one is the answer to its buttons —
                    // that is what marks a quick reply as chosen.
                    const chosenReply = next?.role === 'user'
                        ? clipAgentText(messageText(next).trim(), maxChars)
                        : '';
                    return (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            user={currentUser}
                            assistant={assistant}
                            isStreaming={message.id === streamingId}
                            onReply={sendReply}
                            // Only the newest bubble can be answered, and only between turns.
                            repliesEnabled={!isLoading && !sessionEnded && message.id === lastVisibleId}
                            streamedActions={streamActions[message.id]}
                            chosenReply={chosenReply}
                            hideIdentity={hideIdentity}
                            maxChars={maxChars}
                            messageFormat={messageFormat}
                        />
                    );
                })}
                {/*
                    Stays at the end of the transcript so it reads as the reply being
                    composed, and is announced politely — the streamed text itself is
                    deliberately not a live region, or a screen reader would narrate
                    every token.
                */}
                {waitingForReply ? (
                    <View accessibilityLiveRegion="polite">
                        <AgentStatus />
                    </View>
                ) : null}
            </ScrollView>

            <View className="pt-2">
                {chatError ? (
                    <View className="px-1 pb-2" accessibilityRole="alert" accessibilityLiveRegion="polite">
                        <Text className="text-sm text-destructive">{chatError.message}</Text>
                    </View>
                ) : null}
                <View className="w-full overflow-hidden">
                    <Row className="items-center">
                        <View
                            className={cn(
                                inputSettings.base,
                                inputSettings.rounded.default,
                                'flex-1 min-h-12 justify-center px-3 overflow-hidden web:focus-within:bg-card web:focus-within:border-ring/80 web:focus-within:shadow-none',
                                sessionEnded ? 'opacity-60' : ''
                            )}
                        >
                            <TextInputClear
                                ref={inputRef}
                                multiline
                                value={input}
                                onChangeText={onInputChange}
                                editable={!sessionEnded}
                                accessibilityLabel={t('Message')}
                                onContentSizeChange={composer.onContentSizeChange}
                                placeholder={sessionEnded ? t('This conversation has ended') : (placeholder || t('Ask anything...'))}
                                className="w-full bg-transparent border-0 shadow-none outline-none ring-0 rounded-none p-0 min-h-0 leading-5 text-base text-card-foreground placeholder:text-muted-foreground resize-none web:overflow-y-auto web:focus:outline-none web:focus:ring-0 web:focus:border-0 web:focus-visible:outline-none web:focus-visible:ring-0 web:focus-visible:border-0 web:focus-visible:shadow-none web:focus-visible:bg-transparent"
                                style={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    height: composer.height,
                                    maxHeight: COMPOSER_MAX_PX,
                                    padding: 0,
                                    margin: 0,
                                    // Centered on one line, top-aligned once it wraps.
                                    textAlignVertical: composer.isMultiline ? 'top' : 'center',
                                }}
                                onKeyDown={isWeb && !sessionEnded ? onComposerKey : undefined}
                                onKeyPress={isWeb || sessionEnded ? undefined : onComposerKey}
                                blurOnSubmit={false}
                                returnKeyType="default"
                                {...(isWeb ? { rows: 1 } : { scrollEnabled: composer.scrollEnabled })}
                            />
                        </View>
                        {!hideButton && !sessionEnded ? (
                            <View className="p-1.5">
                                {isLoading ? (
                                    <NeoButton
                                        style="bordered"
                                        borderShape="circle"
                                        controlSize="small"
                                        image="Square"
                                        accessibilityLabel={t('Stop')}
                                        onPress={() => stop()}
                                    />
                                ) : (
                                    <NeoButton
                                        style="glassProminent"
                                        borderShape="circle"
                                        controlSize="small"
                                        image="ArrowUp"
                                        accessibilityLabel={t('Send')}
                                        disabled={!input.trim()}
                                        onPress={send}
                                    />
                                )}
                            </View>
                        ) : null}
                    </Row>
                </View>
                {canRestart && onStartAgain ? (
                    <View className="pt-2 items-start">
                        <NeoButton
                            label={t('Start again')}
                            style="bordered"
                            controlSize="small"
                            borderShape="rounded"
                            onPress={onStartAgain}
                        />
                    </View>
                ) : null}
            </View>
        </View>
    );
}
