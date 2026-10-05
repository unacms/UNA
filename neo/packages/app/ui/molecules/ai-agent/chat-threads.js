'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row, ScrollView, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Input, NeoButton } from 'app/design/controls';
import { cn } from 'app/lib/util';
import { formatDate } from 'app/lib/util/datetime';
import { fetchAgentChatThreads } from './helper';

/**
 * Which row of the history the live widget is talking to.
 *
 * With an explicit `?chat=` the answer is exact. Without one the server follows the
 * owner's open thread in this context (see BxDolAI::resolveCurrentChatThread), and
 * the server keeps at most one open per owner+context — so the first open row in
 * this context is it. Returns '' when no row matches (the live chat is brand new and
 * has no history row yet, or every thread is closed).
 *
 * @param {import('./helper').AgentChatThread[]} threads
 */
export function liveThreadId(threads, contextProfileId, chatId) {
    const pid = Number(contextProfileId) || 0;
    const match = threads.find((thread) =>
        (Number(thread.context_pid) || 0) === pid
        && (chatId ? thread.chat === chatId : thread.status !== 'closed')
    );
    return match?.thread_id || '';
}

/**
 * The viewer's threads with an agent, refetched whenever `version` changes.
 *
 * @returns {{threads: import('./helper').AgentChatThread[], loading: boolean, error: Error|null}}
 */
export function useAgentChatThreads(agentId, enabled, version = 0) {
    // Tagged with the request it answers: "loading" is simply "the tag is behind",
    // so no state is written from inside the effect body.
    const key = enabled && agentId ? `${agentId}:${version}` : '';
    const [state, setState] = useState({ key: '', agentId: null, threads: [], error: null });

    useEffect(() => {
        if (!key) return undefined;
        let cancelled = false;
        fetchAgentChatThreads(agentId)
            .then((threads) => {
                if (!cancelled) setState({ key, agentId, threads, error: null });
            })
            .catch((error) => {
                // Keep the previous rows on a failed refresh; the list going blank
                // would read as "history deleted".
                if (!cancelled) setState((prev) => ({ key, agentId, threads: prev.agentId === agentId ? prev.threads : [], error }));
            });
        return () => {
            cancelled = true;
        };
    }, [key, agentId]);

    // Rows fetched for another agent are not this agent's history.
    const threads = state.agentId === agentId ? state.threads : [];
    return { threads, loading: !!key && state.key !== key, error: state.error };
}

function threadTime(thread, t) {
    const ts = Number(thread.updated_ts) || Number(thread.created_ts) || 0;
    if (!ts) return '';
    return formatDate(ts * 1000, t, { showTime: true, month: 'short' });
}

function ThreadRowImpl({ thread, active, onSelect, t }) {
    const closed = thread.status === 'closed';
    const time = threadTime(thread, t);
    const title = thread.title || thread.context_name || time || t('agent_chat_untitled');
    const meta = [closed ? t('agent_chat_closed') : t('agent_chat_open')];
    if (time && title !== time) meta.push(time);
    if (thread.context_name && title !== thread.context_name) meta.push(thread.context_name);

    return (
        <Pressable
            onPress={() => onSelect(thread)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={title}
            className={cn(
                'rounded-lg px-2.5 py-2 gap-0.5 web:cursor-pointer web:hover:bg-muted/60 web:transition-colors',
                active ? 'bg-muted' : ''
            )}
        >
            <Text numberOfLines={1} className="text-sm font-medium text-card-foreground">
                {title}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {meta.join(' · ')}
            </Text>
        </Pressable>
    );
}

const ThreadRow = memo(ThreadRowImpl);

/**
 * The "Chats" column: every earlier conversation the viewer had with this agent.
 * Presentation only — which row is live and which is open come from the parent,
 * so this list never decides anything about the chat itself.
 *
 * @param {object} props
 * @param {import('./helper').AgentChatThread[]} props.threads
 * @param {string} props.activeThreadId Row being shown; '' when the live chat is.
 * @param {string} props.liveThreadId Row the live widget is talking to; '' if none.
 * @param {(thread: import('./helper').AgentChatThread) => void} props.onSelect
 * @param {() => void} [props.onClose] Present on narrow layouts, where the list overlays the chat.
 * @param {boolean} [props.overlayOnly] The list is always an overlay, so the close button always shows.
 * @param {() => void} [props.onStartNew] "New chat" under the list — the same action as the
 *   composer's Start new; absent when the block does not allow extra threads.
 * @param {boolean} [props.loading]
 */
export function ChatThreads({ threads, activeThreadId, liveThreadId: liveId, onSelect, onClose, onStartNew, overlayOnly = false, loading = false }) {
    const { t } = useTranslation();
    const select = useCallback((thread) => onSelect(thread), [onSelect]);

    // Client-side filter: the list is the viewer's own threads, at most 100 rows.
    const [query, setQuery] = useState('');
    const needle = query.trim().toLowerCase();
    const visible = useMemo(() => {
        if (!needle) return threads;
        return threads.filter((thread) =>
            [thread.title, thread.preview, thread.context_name].some((text) => String(text || '').toLowerCase().includes(needle))
        );
    }, [threads, needle]);

    return (
        <View className="flex-1 min-h-0 pt-2">
            <Row className="items-center gap-1 pb-2 pr-2">
                <View className="flex-1 min-w-0">
                    <Input
                        name="search"
                        size="small"
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t('Search...')}
                        accessibilityLabel={t('Search')}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>
                {onClose ? (
                    // Only the overlay needs closing; the persistent column (md and up) does not.
                    <View className={overlayOnly ? '' : 'md:hidden'}>
                        <NeoButton
                            style="borderless"
                            borderShape="circle"
                            controlSize="mini"
                            image="X"
                            accessibilityLabel={t('Close')}
                            onPress={onClose}
                        />
                    </View>
                ) : null}
            </Row>
            <ScrollView className="min-h-0 flex-1" contentContainerClassName="gap-0.5 pb-2 pr-2">
                {visible.map((thread) => (
                    <ThreadRow
                        key={thread.thread_id}
                        thread={thread}
                        active={activeThreadId ? thread.thread_id === activeThreadId : thread.thread_id === liveId}
                        onSelect={select}
                        t={t}
                    />
                ))}
                {!visible.length && !loading ? (
                    <Text className="text-xs text-muted-foreground px-2.5 py-2">
                        {needle ? t('agent_chats_search_empty') : t('agent_chats_empty')}
                    </Text>
                ) : null}
            </ScrollView>
            {onStartNew ? (
                <View className="pt-2 pb-2 pr-2">
                    <NeoButton
                        style="borderedProminent"
                        borderShape="rounded"
                        controlSize="small"
                        width="fill"
                        image="Plus"
                        label={t('agent_chat_new')}
                        onPress={onStartNew}
                    />
                </View>
            ) : null}
        </View>
    );
}
