'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { TextInputClear } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import emitter from 'app/context/emitter';
import { cn, isWeb } from 'app/lib/util';
import { createAgentChat, fetchAgentChatThread, hydrateAgentChat } from './helper';
import { isHiddenFirstMessageText } from './hidden-first-message';
import {
    agentMaxInputChars,
    clipAgentText,
    foldConsecutiveAssistants,
    lastAssistantId,
    messageActions,
    messageIds,
    messageImages,
    messageText,
    parseChatActionsPayload,
    parseChatSessionPayload,
    sessionAllowsRestart,
    sessionFromMessages,
    streamActionsForMessage,
} from './message-content';
import Profile from 'app/ui/molecules/profile/profile';
import { MessageInput } from 'app/components/elements/chat/parts/message-input';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import { edgeWash } from './edge-wash';
import { AgentStatus, ChatBubble } from './chat-bubble';
import { CHAT_IMAGES_MAX_DEFAULT, chatImageParts, imageFilesFromDataTransfer, pickedFromFile, revokePickedPreview, uploadAgentChatImage } from './chat-images';
import { pickAgentChatImage } from './pick-image';
import { AttachButton, ComposerAttachments, ComposerButtons, ComposerNotice, HistoryButton } from './composer-controls';
import { COMPOSER_MAX_PX, useComposerHeight } from './use-composer-height';
import { useChatAutoscroll } from './use-chat-autoscroll';
import { useStoredChatId } from './use-stored-chat-id';
import { ChatThreads, liveThreadId, useAgentChatThreads } from './chat-threads';

/**
 * @typedef {object} AgentBlockData UNA `sys-ai-chat` block payload.
 * @property {string} agent_id Agent row id; the only required field.
 * @property {number|string} [context_profile_id] Profile the conversation is about.
 * @property {object} [agent_profile] Profile unit used for the assistant's avatar and name.
 * @property {number|string} [allow_images] 1 = composer can attach images for vision.
 * @property {number|string} [allow_new] 1 = show "Start new" and partition extra threads (`?chat=`).
 * @property {number|string} [max_images] Images per turn; default CHAT_IMAGES_MAX_DEFAULT.
 * @property {number|string} [max_input_chars] Per-message cap; 0 or absent means none.
 * @property {number|string} [guest_new_session_on_reload] 1 = every guest reload starts a fresh chat.
 * @property {number|string} [show_history] 1 = "Chats" panel with the viewer's earlier threads.
 * @property {'html'|'text'} [message_format] How to read agent output. Default 'html'.
 * @property {string} [hidden_first_message] Bootstrap rule, read by the block element — see hidden-first-message.js.
 */

/** Elements that own their own click: never steal focus from them. */
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [contenteditable="true"], [role="button"]';

function isInteractiveTarget(target) {
    return typeof target?.closest === 'function' ? !!target.closest(INTERACTIVE_SELECTOR) : false;
}

/** Stable "no messages" so `useChat` does not see a new array on every render. */
const NO_MESSAGES = [];

/**
 * Loads the UNA transcript before `useChat` mounts, so the bootstrap send cannot race
 * hydration ("a send that starts first owns the client"). The chat itself lives in
 * `AiAgentChat`, remounted via `key` whenever its identity changes.
 *
 * Fetching history is only worth a round trip when there is a bootstrap message to
 * suppress — without one, `useChat`'s own persistence handles hydration — and the chat
 * could already exist server-side. A chat whose id was just minted here (guest with
 * "new session per reload", or "Start new") provably has no transcript, so the fetch
 * is skipped.
 *
 * @param {object} props
 * @param {AgentBlockData} props.data
 * @param {string} [props.initialMessage] Hidden first user line; empty = no bootstrap.
 * @param {boolean} [props.hideInitialMessage] Keep the bootstrap line out of the transcript.
 * @param {string} [props.placeholder] Composer placeholder; defaults to a translated string.
 * @param {boolean} [props.hideButton] Hide the send/stop button (Enter still sends).
 * @param {boolean} [props.hideIdentity] Hide avatars and author names.
 * @param {string} [props.height] Tailwind height class for the whole widget.
 * @param {boolean} [props.showHistory] Override `data.show_history`. The operator
 *   float passes this from `appSetting('ai', 'operator_agent').show_history`.
 * @param {boolean} [props.historyAlways] Keep the "Chats" panel even when the only
 *   row is the live chat (by default it earns its space only with something else to
 *   browse). The operators' Agents block wants the list in sight at all times.
 * @param {'auto'|'overlay'} [props.historyLayout] Where the "Chats" panel goes when
 *   history is on. `auto`: a column beside the transcript from the `md:` viewport
 *   breakpoint up, an overlay below it. `overlay`: always the overlay, for hosts
 *   that are narrow regardless of the viewport (the operator float).
 * @param {string} [props.channel] `app/context/emitter` event name the host drives
 *   the widget through. The widget listens for `{ action: 'toggle_history' }` and
 *   `{ action: 'start_new' }` and reports `{ action: 'state', history, restart }`
 *   whenever those controls become available; History / Start new then stay out
 *   of the composer — the host draws them (the operator float's title bar).
 * @param {'default'|'chat'} [props.variant] Message items: compact bubbles, or the
 *   messenger's. The composer is the messenger's message input either way.
 * @param {'card'|'panel'|'background'} [props.fadeSurface] Surface the fades behind
 *   the header and the composer start from (see `edge-wash.js`): a block's card
 *   (default), a floating panel (the operator float), or the page background (`chat`
 *   variant default; a block without background, see BlockWrapper `overlayHeader`).
 * @param {number} [props.headerInset] Height of chrome the host floats over the top of
 *   the chat (its own title bar): the transcript and the history overlay start below it.
 * @param {import('react').ReactNode} [props.header] Floated over the top of the
 *   transcript on the fade (a block's title, see BlockWrapper `overlayHeader`);
 *   messages scroll under it.
 * @param {boolean} [props.gutter] The chat runs to its host's edges (a block without
 *   padding): it keeps its margins inside — around the messages, the header and the
 *   composer — so nothing that scrolls or casts a shadow is cut at the frame.
 */
export default function AiAgent({ height = 'h-[28rem]', ...props }) {
    const { chat, history, historyOverlayOnly } = useAiAgent(props);
    const gutter = !!props.gutter;

    // The frame keeps its final height while hydrating so the page does not jump
    // when the transcript arrives; `chat` is simply empty until then.
    return (
        <Row className={cn(height, 'relative')}>
            {history ? (
                <View
                    className={cn(
                        historyOverlayOnly
                            ? ''
                            // `z-0` not `z-auto`: Uniwind resolves `auto` to a string and Fabric casts zIndex to Double.
                            : cn('md:flex md:relative md:inset-auto md:z-0 md:w-56 md:shrink-0 md:bg-transparent md:border-r md:border-border/60', gutter ? 'md:ps-3 md:pb-3' : 'md:mr-3'),
                        history.open ? 'flex absolute inset-0 z-10 bg-card' : 'hidden',
                        gutter && history.open ? 'p-3' : ''
                    )}
                    // Below chrome the host floats over the chat (the float's title bar).
                    style={history.open && props.headerInset ? { paddingTop: props.headerInset } : undefined}
                >
                    <ChatThreads {...history.props} />
                </View>
            ) : null}
            <View className="flex-1 min-w-0 min-h-0">{chat}</View>
        </Row>
    );
}

/**
 * Everything `AiAgent` does, without its frame: the live chat element and the
 * history list, so a host with its own layout (the agents page's split view) can
 * put the list in a side panel instead of the built-in column. Takes the same
 * props as `AiAgent` except `height`.
 *
 * @returns {{
 *   chat: import('react').ReactNode,
 *   history: null | { open: boolean, props: object },
 *   historyOverlayOnly: boolean,
 * }} `history` is null when there is no list to show; `open` only matters where
 *   the list is an overlay; `props` are `ChatThreads` props (`onClose` included).
 */
export function useAiAgent({
    data,
    initialMessage = '',
    hideInitialMessage = false,
    placeholder,
    hideButton = false,
    hideIdentity = false,
    showHistory: showHistoryProp,
    historyLayout = 'auto',
    historyAlways = false,
    channel,
    variant = 'default',
    fadeSurface,
    header = null,
    gutter = false,
    headerInset = 0,
}) {
    const { currentUser } = useCurrentUser();
    const agentId = data?.agent_id;
    const contextProfileId = Number(data?.context_profile_id) || 0;
    const userId = Number(currentUser?.id) || 0;
    const isGuest = userId <= 0;
    const allowNew = !!Number(data?.allow_new);
    const freshPerReload = isGuest && !!Number(data?.guest_new_session_on_reload);
    const showHistory = showHistoryProp !== undefined
        ? !!showHistoryProp
        : !!Number(data?.show_history);
    const hostOwnsChrome = !!channel;

    const { chatId, fresh, ready, startNew, select } = useStoredChatId({
        agentId,
        contextProfileId,
        userId,
        mode: freshPerReload ? 'fresh' : allowNew ? 'stored' : 'single',
    });

    /**
     * Prefetched transcript, tagged with the chat it belongs to. Switching chats (a
     * "Start new", a stored id arriving) makes it stale by itself — no reset needed.
     * @type {[{chatId: string, messages: object[], session: object|null, error: Error|null}|null, Function]}
     */
    const [prefetch, setPrefetch] = useState(null);
    const seed = prefetch?.chatId === chatId ? prefetch : null;
    const needsPrefetch = ready && !!initialMessage && !fresh && !seed;

    useEffect(() => {
        if (!needsPrefetch) return undefined;
        let cancelled = false;
        hydrateAgentChat(agentId, { contextProfileId, chatId })
            .then((result) => {
                if (cancelled) return;
                setPrefetch({
                    chatId,
                    messages: Array.isArray(result?.messages) ? result.messages : NO_MESSAGES,
                    session: parseChatSessionPayload(result?.session) || null,
                    error: null,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                // A failed history load must not block the chat: start clean and show the
                // error beside the composer.
                setPrefetch({ chatId, messages: NO_MESSAGES, session: null, error });
            });
        return () => {
            cancelled = true;
        };
    }, [needsPrefetch, agentId, contextProfileId, chatId]);

    /**
     * History panel. `threadsVersion` bumps after every completed turn and every
     * "Start new", so the list's previews and dates keep up with the live chat.
     */
    const [threadsVersion, setThreadsVersion] = useState(0);
    const refreshThreads = useCallback(() => setThreadsVersion((v) => v + 1), []);
    const { threads, loading: threadsLoading } = useAgentChatThreads(agentId, showHistory, threadsVersion);
    const liveId = liveThreadId(threads, contextProfileId, chatId);

    // Which closed thread is being read; '' = the live chat. Selecting the live row
    // is the same as "back to current", so the two states cannot disagree.
    const [selectedThreadId, setSelectedThreadId] = useState('');
    const viewingThreadId = selectedThreadId && selectedThreadId !== liveId ? selectedThreadId : '';
    // Narrow layouts: the list overlays the transcript until a row is picked.
    const [historyOpen, setHistoryOpen] = useState(false);
    const toggleHistory = useCallback(() => setHistoryOpen((prev) => !prev), []);
    const closeHistory = useCallback(() => setHistoryOpen(false), []);
    /**
     * A row that is still open, and addressable (`?chat=` id, same context, extra
     * threads allowed) becomes the live chat: the conversation just continues there.
     * Anything else — closed, the base thread, another context — is read only.
     */
    const selectThread = useCallback((thread) => {
        setHistoryOpen(false);
        const id = String(thread?.thread_id || '');
        if (!id || id === liveId) {
            setSelectedThreadId('');
            return;
        }
        const switchable = allowNew
            && thread.status !== 'closed'
            && !!thread.chat
            && (Number(thread.context_pid) || 0) === contextProfileId;
        if (switchable) {
            select(thread.chat);
            setSelectedThreadId('');
            return;
        }
        setSelectedThreadId(id);
    }, [liveId, allowNew, contextProfileId, select]);

    /**
     * Read-only transcript of the selected earlier thread, tagged with its id — like
     * `prefetch` above, a change of selection makes it stale by itself.
     * @type {[{threadId: string, messages: object[], error: Error|null}|null, Function]}
     */
    const [archived, setArchived] = useState(null);
    const archivedForView = archived?.threadId === viewingThreadId ? archived : null;
    const needsArchived = !!viewingThreadId && !archivedForView;

    useEffect(() => {
        if (!needsArchived) return undefined;
        let cancelled = false;
        fetchAgentChatThread(agentId, viewingThreadId)
            .then((result) => {
                if (!cancelled) setArchived({ threadId: viewingThreadId, messages: result.messages, error: null });
            })
            .catch((error) => {
                if (!cancelled) setArchived({ threadId: viewingThreadId, messages: NO_MESSAGES, error });
            });
        return () => {
            cancelled = true;
        };
    }, [needsArchived, agentId, viewingThreadId]);

    const startAgain = useCallback(() => {
        const next = startNew();
        setSelectedThreadId('');
        // Fire-and-forget GET on the new thread. Assumed to let UNA register the id
        // straight away, before the first message; the response is not needed. Drop
        // this if the server turns out to create the thread on first POST anyway.
        // The history list is refreshed once it lands, so the new row shows up as live.
        void hydrateAgentChat(agentId, { contextProfileId, chatId: next }).then(refreshThreads, refreshThreads);
    }, [startNew, agentId, contextProfileId, refreshThreads]);

    // The panel earns its space only when there is something besides the live chat
    // to look at: one row that is the live chat itself is nothing to browse.
    const historyVisible = showHistory
        && (historyAlways || threads.length > 1 || (threads.length === 1 && threads[0].thread_id !== liveId));
    const historyOverlayOnly = historyLayout === 'overlay';
    const onToggleHistory = historyVisible ? toggleHistory : undefined;
    const onStartAgain = allowNew ? startAgain : undefined;
    // On a channel the host draws History / Start new itself (the float's title
    // bar); the page-block composer keeps them otherwise.
    const composerToggleHistory = hostOwnsChrome ? undefined : onToggleHistory;
    const composerStartAgain = hostOwnsChrome ? undefined : onStartAgain;

    useEffect(() => {
        if (!channel) return undefined;
        const subscription = emitter.addListener(channel, (event) => {
            if (event?.action === 'toggle_history') onToggleHistory?.();
            else if (event?.action === 'start_new') onStartAgain?.();
        });
        return () => subscription.remove();
    }, [channel, onToggleHistory, onStartAgain]);

    useEffect(() => {
        if (!channel) return;
        emitter.emit(channel, { action: 'state', history: !!onToggleHistory, restart: !!onStartAgain });
    }, [channel, onToggleHistory, onStartAgain]);

    let chat = null;
    if (viewingThreadId) {
        // Earlier thread: the same transcript UI, with the composer locked. Its own
        // key, so scroll position and stream state never leak across threads.
        chat = archivedForView ? (
            <AiAgentChat
                key={`archived:${viewingThreadId}`}
                data={data}
                readOnly
                initialMessage={initialMessage}
                hideInitialMessage={hideInitialMessage}
                initialMessages={archivedForView.messages}
                hydrateError={archivedForView.error}
                hideButton={hideButton}
                hideIdentity={hideIdentity}
                placeholder={placeholder}
                height="h-full"
                onToggleHistory={composerToggleHistory}
                historyOverlayOnly={historyOverlayOnly}
                variant={variant}
                fadeSurface={fadeSurface}
                header={header}
                gutter={gutter}
                headerInset={headerInset}
            />
        ) : null;
    } else if (ready && !needsPrefetch) {
        const seedMessages = seed?.messages || NO_MESSAGES;
        chat = (
            <AiAgentChat
                key={`${agentId}:${contextProfileId}:${chatId}`}
                data={data}
                chatId={chatId}
                chatIsFresh={fresh}
                initialMessage={initialMessage}
                hideInitialMessage={hideInitialMessage}
                initialMessages={seedMessages}
                initialSession={seed?.session || null}
                sendBootstrap={!!initialMessage && seedMessages.length === 0}
                hydrateError={seed?.error || null}
                hideButton={hideButton}
                hideIdentity={hideIdentity}
                placeholder={placeholder}
                height="h-full"
                onStartAgain={composerStartAgain}
                onTurnEnd={showHistory ? refreshThreads : undefined}
                onToggleHistory={composerToggleHistory}
                historyOverlayOnly={historyOverlayOnly}
                variant={variant}
                fadeSurface={fadeSurface}
                header={header}
                gutter={gutter}
                headerInset={headerInset}
            />
        );
    }

    const history = historyVisible
        ? {
              open: historyOpen,
              props: {
                  threads,
                  activeThreadId: viewingThreadId,
                  liveThreadId: liveId,
                  loading: threadsLoading,
                  onSelect: selectThread,
                  onClose: closeHistory,
                  overlayOnly: historyOverlayOnly,
                  onStartNew: onStartAgain,
              },
          }
        : null;

    return { chat, history, historyOverlayOnly };
}

function AiAgentChat({
    data,
    chatId = '',
    chatIsFresh = false,
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
    readOnly = false,
    onTurnEnd,
    onToggleHistory,
    historyOverlayOnly = false,
    variant = 'default',
    fadeSurface,
    header = null,
    gutter = false,
    headerInset = 0,
}) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    /** @type {[import('./chat-images').PickedImage[], Function]} */
    const [pendingImages, setPendingImages] = useState([]);
    const [attachError, setAttachError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);
    const messagesRef = useRef(initialMessages);
    const pendingImagesRef = useRef(pendingImages);
    /**
     * Quick-reply buttons that arrived before the bubble they belong to was committed.
     * @type {import('react').MutableRefObject<{id: string|null, actions: object[], afterId: string|null}|null>}
     *   `id` is the server's message id when the chunk carried one; `afterId` is the
     *   newest assistant message at the time — the buttons must land on a *newer* one.
     */
    const pendingActionsRef = useRef(null);
    const bootstrapSentRef = useRef('');
    const [streamActions, setStreamActions] = useState({});
    const [streamedSession, setStreamedSession] = useState(null);

    const agentId = data?.agent_id;
    const contextProfileId = Number(data?.context_profile_id) || 0;
    const assistant = data?.agent_profile;
    const maxChars = agentMaxInputChars(data);
    const messageFormat = data?.message_format === 'text' ? 'text' : 'html';
    const allowImages = !!Number(data?.allow_images);
    const maxImages = Math.max(1, Number(data?.max_images) || CHAT_IMAGES_MAX_DEFAULT);

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
        const serverId = messageId || '';
        if (serverId && messages.some((message) => message.id === serverId)) {
            pendingActionsRef.current = null;
            setStreamActions((prev) => ({ ...prev, [serverId]: actions }));
            return;
        }

        // Never fall back to an older assistant bubble while the new one is still
        // uncommitted — that is how one turn ended up with two Yes/No rows.
        pendingActionsRef.current = {
            id: serverId || null,
            actions,
            afterId: lastAssistantId(messages),
        };
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
                chatId,
                onChatActions: applyChatActions,
                onChatSession: (_messageId, value) => applyChatSession(value),
            }),
        [agentId, contextProfileId, chatId, applyChatActions, applyChatSession]
    );

    const threadId = ['agent', agentId, contextProfileId > 0 ? contextProfileId : null, chatId || null]
        .filter(Boolean)
        .join(':');

    const onChatChunk = useCallback((chunk) => {
        if (chunk?.type !== 'CUSTOM') return;
        if (chunk.name === 'chat_actions') applyChatActions(chunk.messageId, chunk.value);
        if (chunk.name === 'chat_session') applyChatSession(chunk.value);
    }, [applyChatActions, applyChatSession]);

    // Prefetched transcript: do not use persistence hydrate — it races sendMessage
    // ("a send that starts first owns the client"). Without a bootstrap, useChat's own
    // hydrate loads history — unless the chat id was just minted and there is none.
    const { messages, sendMessage, isLoading, error, stop } = useChat({
        connection,
        initialMessages,
        threadId,
        onChunk: onChatChunk,
        onCustomEvent: (name, value) => {
            // `chat_actions` is handled in onChunk, where the messageId is available.
            if (name === 'chat_session') applyChatSession(value);
        },
        // A read-only earlier thread has its whole transcript already; hydrating would
        // fetch the *live* thread over it.
        ...(readOnly || sendBootstrap || initialMessage || chatIsFresh ? {} : { persistence: true }),
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
        const { id: wantId, actions, afterId } = pending;

        if (wantId && messages.some((message) => message.id === wantId)) {
            pendingActionsRef.current = null;
            setStreamActions((prev) => ({ ...prev, [wantId]: actions }));
            return;
        }

        const id = lastAssistantId(messages);
        if (!id || id === afterId) return;

        pendingActionsRef.current = null;
        setStreamActions((prev) => {
            const next = { ...prev, [id]: actions };
            if (wantId && wantId !== id) next[wantId] = actions;
            return next;
        });
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
    const sessionEnded = readOnly || !!session?.ended;
    const canRestart = !readOnly && sessionAllowsRestart(session);
    const showSend = !hideButton && !sessionEnded;
    const chatError = hydrateError || error;

    // "Turn over" for the parent: loading went true → false, whatever the outcome.
    const wasLoadingRef = useRef(false);
    useEffect(() => {
        if (wasLoadingRef.current && !isLoading) onTurnEnd?.();
        wasLoadingRef.current = isLoading;
    }, [isLoading, onTurnEnd]);

    // Belt and braces: the parent already remounts on every input to threadId via `key`,
    // so this only matters if that key is ever relaxed.
    useEffect(() => {
        pendingActionsRef.current = null;
        setStreamActions({});
        setStreamedSession(null);
    }, [threadId]);

    const visibleMessages = useMemo(
        () =>
            foldConsecutiveAssistants(
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
                    return !!messageText(message)
                        || messageImages(message).length > 0
                        || messageActions(message, streamActions[message.id]).length > 0;
                })
            ),
        [messages, hideInitialMessage, streamActions]
    );
    const showStartNew = !!onStartAgain && (canRestart || (!sessionEnded && visibleMessages.length > 0));

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

    // The floating composer's and header's measured heights, padded under and over
    // the transcript (below).
    const [composerBoxHeight, setComposerBoxHeight] = useState(0);
    const [headerBoxHeight, setHeaderBoxHeight] = useState(0);

    // Follow the stream while the user is pinned to the bottom. `lastText` is in the deps
    // on purpose: it changes on every token, which is what keeps the view glued to a
    // growing reply. `composerBoxHeight`: the padding under the transcript arrives after
    // the first layout, and the last message would otherwise stay under the composer.
    useLayoutEffect(() => {
        followIfPinned();
    }, [followIfPinned, visibleMessages.length, lastText, isLoading, waitingForReply, composer.height, composerBoxHeight, headerBoxHeight, headerInset]);

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
     * The one place that calls `sendMessage`. Pins the view to the bottom, keeps focus
     * in the composer across the round trip, and resolves to whether the message was
     * accepted — errors surface through useChat's `error`, callers only decide what to
     * restore.
     *
     * @param {string|{content: object[]}} payload Plain text, or a multimodal message.
     */
    const dispatch = useCallback(async (payload) => {
        // A send always pulls the view down, even if the user had scrolled up to read.
        pinToBottom();
        try {
            const pending = sendMessage(payload);
            scrollToEnd();
            // Focus twice: once so typing can continue immediately, once after the round
            // trip because re-rendering the list can take focus back.
            focusComposer();
            await pending;
            focusComposer();
            return true;
        } catch {
            return false;
        }
    }, [sendMessage, focusComposer, scrollToEnd, pinToBottom]);

    /**
     * Text-only send, shared by the quick-reply buttons. Resolves to whether the message
     * was accepted, so `ChatActions` knows when to drop its optimistic highlight.
     *
     * Deliberately closed over nothing that changes per keystroke: this is handed to
     * every bubble as `onReply`, and depending on `input` would change its identity on
     * every character typed, defeating the memo on ChatBubble. Draft handling therefore
     * lives in `send` below.
     */
    const sendReply = useCallback(async (raw) => {
        const text = clipAgentText(String(raw ?? '').trim(), maxChars);
        if (!text || isLoading || sessionEnded) return false;
        return dispatch(text);
    }, [maxChars, isLoading, sessionEnded, dispatch]);

    /** Composer send: the draft plus any attached images. */
    const send = useCallback(async () => {
        const draft = input;
        const images = pendingImages;
        const text = clipAgentText(draft.trim(), maxChars);
        if (isLoading || sessionEnded || uploading) return false;
        if (!text && !images.length) return false;

        // Clear first so the composer empties the moment the user hits send...
        setInput('');
        setPendingImages([]);
        setAttachError(null);

        // ...and never swallow their words: put everything back if it did not go through.
        // Images that did upload keep their result, so a retry only re-sends the rest.
        const restore = (uploaded) => {
            setInput(draft);
            setPendingImages(images.map((picked, i) => (uploaded[i] ? { ...picked, uploaded: uploaded[i] } : picked)));
        };

        if (!images.length) {
            const sent = await dispatch(text);
            if (!sent) setInput(draft);
            return sent;
        }

        const uploaded = [];
        setUploading(true);
        try {
            for (const picked of images) {
                uploaded.push(await uploadAgentChatImage(agentId, picked));
            }
        } catch (error) {
            restore(uploaded);
            setAttachError(error?.message || t('Upload failed'));
            return false;
        } finally {
            setUploading(false);
        }

        const sent = await dispatch({ content: chatImageParts(text, uploaded) });
        if (sent) images.forEach(revokePickedPreview);
        else restore(uploaded);
        return sent;
    }, [input, pendingImages, maxChars, isLoading, sessionEnded, uploading, dispatch, agentId, t]);

    const canAttach = allowImages && !sessionEnded && !isLoading && !uploading && pendingImages.length < maxImages;

    /**
     * Queue picked images (paperclip, paste, drop). Overflow past `maxImages` is
     * dropped and its blob URLs released; a too-large file is reported, not queued.
     */
    const enqueuePicked = useCallback((pickedList, { tooLarge = false } = {}) => {
        const incoming = (pickedList || []).filter(Boolean);
        if (!incoming.length) {
            if (tooLarge) setAttachError(t('Image is too large'));
            return;
        }
        setPendingImages((prev) => {
            const room = maxImages - prev.length;
            if (room <= 0) {
                incoming.forEach(revokePickedPreview);
                return prev;
            }
            const taken = incoming.slice(0, room);
            incoming.slice(room).forEach(revokePickedPreview);
            return [...prev, ...taken];
        });
        setAttachError(tooLarge ? t('Image is too large') : null);
    }, [maxImages, t]);

    const attachFromDataTransfer = useCallback((data) => {
        const files = imageFilesFromDataTransfer(data);
        if (!files.length) return false;
        let tooLarge = false;
        const picked = [];
        for (const file of files) {
            try {
                const next = pickedFromFile(file);
                if (next) picked.push(next);
            } catch (error) {
                if (error?.code === 'too_large') tooLarge = true;
            }
        }
        if (!picked.length && !tooLarge) return false;
        enqueuePicked(picked, { tooLarge });
        return true;
    }, [enqueuePicked]);

    const attachImage = useCallback(async () => {
        if (!canAttach) return;
        try {
            const picked = await pickAgentChatImage();
            if (!picked) return;
            enqueuePicked([picked]);
        } catch (error) {
            setAttachError(error?.code === 'too_large' ? t('Image is too large') : (error?.message || t('Upload failed')));
        }
    }, [canAttach, enqueuePicked, t]);

    const onComposerPaste = useCallback((event) => {
        // Same as the post editor: clipboard file items become attachments, not text.
        if (!isWeb || !allowImages || sessionEnded || isLoading || uploading) return;
        const data = event?.clipboardData || event?.nativeEvent?.clipboardData;
        if (!attachFromDataTransfer(data)) return;
        event.preventDefault?.();
        event.stopPropagation?.();
    }, [allowImages, sessionEnded, isLoading, uploading, attachFromDataTransfer]);

    const onComposerDragOver = useCallback((event) => {
        if (!isWeb || !allowImages || sessionEnded) return;
        const types = event?.dataTransfer?.types;
        if (!types || !Array.from(types).includes('Files')) return;
        event.preventDefault?.();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }, [allowImages, sessionEnded]);

    const onComposerDrop = useCallback((event) => {
        if (!isWeb || !allowImages || sessionEnded || isLoading || uploading) return;
        const data = event?.dataTransfer || event?.nativeEvent?.dataTransfer;
        if (!attachFromDataTransfer(data)) return;
        event.preventDefault?.();
        event.stopPropagation?.();
    }, [allowImages, sessionEnded, isLoading, uploading, attachFromDataTransfer]);

    const removePendingImage = useCallback((index) => {
        setPendingImages((prev) => {
            const picked = prev[index];
            if (picked) revokePickedPreview(picked);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    // Previews that are still pending when the chat goes away ("Start new" remounts
    // this component, or the page navigates) would otherwise leak their blob URLs.
    useLayoutEffect(() => {
        pendingImagesRef.current = pendingImages;
    }, [pendingImages]);
    useEffect(() => () => pendingImagesRef.current.forEach(revokePickedPreview), []);

    useEffect(() => {
        if (readOnly || !sendBootstrap || !initialMessage) return;
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
    }, [readOnly, sendBootstrap, initialMessage, sendMessage, maxChars]);

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

    // The messenger's composer: avatar bottom-left, image picker + send bottom-right,
    // a pill that squares off once there is a draft. It floats over the transcript —
    // messages scroll behind it and the list pads itself by its measured height.
    const isChat = variant === 'chat';
    const wash = edgeWash(fadeSurface || (isChat ? 'background' : 'card'));
    const onComposerBoxLayout = useCallback((event) => {
        const next = Math.round(event.nativeEvent.layout.height);
        if (next > 0) setComposerBoxHeight((prev) => (prev === next ? prev : next));
    }, []);
    const onHeaderBoxLayout = useCallback((event) => {
        const next = Math.round(event.nativeEvent.layout.height);
        setHeaderBoxHeight((prev) => (prev === next ? prev : next));
    }, []);
    const hasDraft = !!input.trim() || pendingImages.length > 0;
    const textInput = (
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
            onPaste={isWeb && allowImages && !sessionEnded ? onComposerPaste : undefined}
            blurOnSubmit={false}
            returnKeyType="default"
            {...(isWeb ? { rows: 1 } : { scrollEnabled: composer.scrollEnabled })}
        />
    );

    const composerBox = (
        <View
            // The page-wide chat has no frame around it, so it brings its own gutter;
            // so does a chat that runs to its block's edges. Otherwise (the float) the
            // host's padding provides one. The top padding is the fade's run-up above
            // the pill.
            className={isChat ? 'px-4 py-1.5 sm:p-2.5' : gutter ? 'px-4 pb-4 pt-3' : 'pt-3'}
            onLayout={onComposerBoxLayout}
            pointerEvents="auto"
            {...(isWeb && allowImages && !sessionEnded
                ? { onPaste: onComposerPaste, onDragOver: onComposerDragOver, onDrop: onComposerDrop }
                : null)}
        >
            <ComposerNotice message={chatError?.message} />
            <ComposerNotice message={attachError} />
            <ComposerAttachments
                images={pendingImages}
                disabled={isLoading || uploading}
                onRemove={removePendingImage}
            />
            <Row className="items-center justify-center gap-2 w-full">
                {onToggleHistory ? <HistoryButton onPress={onToggleHistory} alwaysVisible={historyOverlayOnly} /> : null}
                <View className={cn('flex-1 min-w-0', sessionEnded ? 'opacity-60' : '')}>
                    <MessageInput
                        expanded={hasDraft}
                        avatar={currentUser && !hideIdentity ? (
                            <Profile
                                {...currentUser}
                                url_avatar={currentUser.avatar}
                                displayType="unit_wo_info"
                                displaySize="sm"
                            />
                        ) : null}
                        actions={<>
                            {allowImages && !sessionEnded ? (
                                <View><AttachButton disabled={!canAttach} onPress={attachImage} image="Image" /></View>
                            ) : null}
                            <ComposerButtons
                                // Send appears once there is something to send; Stop while a reply streams.
                                showSend={showSend && (hasDraft || isLoading)}
                                showStartNew={showStartNew}
                                startNewInHistory={!!onToggleHistory && !historyOverlayOnly}
                                isLoading={isLoading}
                                canSend={!uploading && hasDraft}
                                onSend={send}
                                onStop={() => stop()}
                                onStartNew={onStartAgain}
                            />
                        </>}
                    >
                        <View className="w-full">{textInput}</View>
                    </MessageInput>
                </View>
            </Row>
        </View>
    );

    return (
        // Not overflow-hidden: the transcript scrolls (and clips) itself, and the floating
        // composer's shadow has to reach past the frame into the block's padding.
        <View className={cn(height, 'relative')}>
            <ScrollView
                ref={listRef}
                className="min-h-0 flex-1"
                contentContainerClassName={cn('grow-0', isChat ? '' : 'gap-1', gutter ? 'px-4' : '')}
                contentContainerStyle={{ paddingTop: headerInset + headerBoxHeight, paddingBottom: readOnly ? 0 : composerBoxHeight }}
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
                    // A tapped quick reply already reads as the highlighted button above —
                    // don't echo it again as a user bubble.
                    const prev = visibleMessages[index - 1];
                    if (
                        message.role === 'user'
                        && prev?.role === 'assistant'
                        && !messageImages(message).length
                    ) {
                        const text = clipAgentText(messageText(message).trim(), maxChars);
                        const isTappedReply = messageActions(prev, streamActionsForMessage(prev, streamActions))
                            .some((action) => action.type !== 'link' && action.message === text);
                        if (isTappedReply) return null;
                    }
                    return (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            user={currentUser}
                            assistant={assistant}
                            isStreaming={!!streamingId && messageIds(message).includes(streamingId)}
                            onReply={sendReply}
                            // Only the newest bubble can be answered, and only between turns.
                            repliesEnabled={!isLoading && !sessionEnded && message.id === lastVisibleId}
                            streamedActions={streamActionsForMessage(message, streamActions)}
                            chosenReply={chosenReply}
                            hideIdentity={hideIdentity}
                            maxChars={maxChars}
                            messageFormat={messageFormat}
                            variant={variant}
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

            {/* A closed thread is only read; the way back is the history list itself. */}
            {header ? (
                <View className="absolute top-0 inset-x-0 z-10" pointerEvents="box-none">
                    <EdgeBlurView edge="top" config={edgeBlurConfig('footer')} washClassName={wash.top} pointerEvents="box-none">
                        <View className={gutter ? 'px-4 pt-4 pb-3' : 'pb-3'} pointerEvents="box-none" onLayout={onHeaderBoxLayout}>
                            {header}
                        </View>
                    </EdgeBlurView>
                </View>
            ) : null}

            {readOnly ? (
                onToggleHistory ? (
                    <Row className={gutter ? 'px-4 pb-4 pt-2' : 'pt-2'}>
                        <HistoryButton onPress={onToggleHistory} alwaysVisible={historyOverlayOnly} />
                    </Row>
                ) : null
            ) : (
                <View className="absolute bottom-0 inset-x-0 z-10" pointerEvents="box-none">
                    <EdgeBlurView edge="bottom" config={edgeBlurConfig('footer')} washClassName={wash.bottom} pointerEvents="box-none">
                        {composerBox}
                    </EdgeBlurView>
                </View>
            )}
        </View>
    );
}


