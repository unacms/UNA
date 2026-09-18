'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row, ScrollView, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import Loading from 'app/ui/atoms/loading';
import Link from 'app/ui/atoms/link';
import { Icon } from 'app/ui/atoms/icon';
import { cn } from 'app/lib/util';
import { formatDate } from 'app/lib/util/datetime';
import { ChatBubble } from 'app/ui/molecules/ai-agent/chat-bubble';
import {
    fetchAdminAgentActivity,
    fetchAdminAgentChatThreads,
    fetchAdminAgentChatThread,
} from './helper';

const ACTIVITY_PAGE = 30;

/** lucide icon per activity action */
const ACTION_ICONS = {
    comment_add: 'MessageSquarePlus',
    comment_update: 'MessageSquareMore',
    comment_delete: 'MessageSquareX',
    content_add: 'FilePlus',
    content_update: 'FilePen',
    content_delete: 'FileX',
    db_write: 'Database',
    db_undo: 'Undo2',
    email: 'Mail',
    lang: 'Languages',
    agent: 'Bot',
    mockup: 'LayoutTemplate',
};

function ActivityRowImpl({ item, t }) {
    const ok = Number(item.ok) === 1;
    const when = item.added ? formatDate(Number(item.added) * 1000, t, { showTime: true, month: 'short' }) : '';
    // Where it happened is a link whenever the server could resolve one — it reads as one.
    const text = (
        <Text className={cn('text-sm', ok ? 'text-card-foreground' : 'text-destructive', item.url ? 'text-primary web:hover:underline' : '')}>
            {item.text}
        </Text>
    );
    return (
        <Row className="gap-2.5 py-2 border-b border-border/40">
            <View className="w-5 pt-0.5 items-center">
                <Icon icon={ACTION_ICONS[item.action] || 'Activity'} size={16} className={ok ? 'text-muted-foreground' : 'text-destructive'} />
            </View>
            <View className="flex-1 min-w-0 gap-0.5">
                <Row className="items-start justify-between gap-2">
                    <View className="flex-1 min-w-0">
                        {item.url ? (
                            <Link href={item.url} target="_blank" accessibilityLabel={item.title || item.text}>
                                {text}
                            </Link>
                        ) : text}
                    </View>
                    {when ? <Text className="text-xs text-muted-foreground flex-none">{when}</Text> : null}
                </Row>
                {item.summary ? (
                    <Text numberOfLines={3} className="text-xs text-muted-foreground">
                        {item.summary}
                    </Text>
                ) : null}
            </View>
        </Row>
    );
}

const ActivityRow = memo(ActivityRowImpl);

/**
 * What an event-driven agent did, newest first, with "more" paging.
 *
 * Tagged with the request it answers (`agent:want`): "loading" is simply "the tag
 * is behind", so no state is written from inside the effect body.
 */
function ActivityLog({ agent }) {
    const { t } = useTranslation();
    // How many rows are wanted; "More" grows it by a page.
    const [want, setWant] = useState(ACTIVITY_PAGE);
    const key = `${agent.id}:${want}`;
    const [state, setState] = useState({ key: "", agentId: 0, items: [], hasMore: false, error: "" });
    const sameAgent = state.agentId === agent.id;
    const have = sameAgent ? state.items.length : 0;
    const loading = state.key !== key;

    useEffect(() => {
        if (state.key === key) return undefined;
        let cancelled = false;
        const start = have;
        const limit = Math.max(1, want - start);
        fetchAdminAgentActivity(agent.id, start, limit)
            .then(({ items: page, hasMore }) => {
                if (cancelled) return;
                setState((prev) => ({
                    key,
                    agentId: agent.id,
                    items: start && prev.agentId === agent.id ? [...prev.items, ...page] : page,
                    // An empty page ends the list whatever the server says, so "More" cannot loop.
                    hasMore: hasMore && page.length > 0,
                    error: "",
                }));
            })
            .catch((e) => {
                if (!cancelled) setState({ key, agentId: agent.id, items: [], hasMore: false, error: String(e?.message || e) });
            });
        return () => {
            cancelled = true;
        };
    }, [key, state.key, agent.id, have, want]);

    const items = sameAgent ? state.items : [];
    const more = useCallback(() => setWant((prev) => prev + ACTIVITY_PAGE), []);

    return (
        <View className="pt-2">
            {state.error && sameAgent ? <Text className="text-xs text-destructive py-2">{state.error}</Text> : null}
            {items.map((item) => (
                <ActivityRow key={item.id} item={item} t={t} />
            ))}
            {!items.length && !loading && !state.error ? (
                <Text className="text-sm text-muted-foreground py-3">{t("agents_admin_activity_empty")}</Text>
            ) : null}
            {loading ? (
                <View className="py-3 items-center">
                    <Loading size="small" />
                </View>
            ) : null}
            {state.hasMore && !loading ? (
                <View className="pt-2 items-start">
                    <NeoButton
                        style="bordered"
                        borderShape="rounded"
                        controlSize="mini"
                        label={t("agents_admin_more")}
                        onPress={more}
                    />
                </View>
            ) : null}
        </View>
    );
}

function ThreadRowImpl({ thread, active, onSelect, t }) {
    const closed = thread.status === 'closed';
    return (
        <Pressable
            onPress={() => onSelect(thread)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
                'rounded-lg px-2.5 py-2 gap-0.5 web:cursor-pointer web:hover:bg-muted/60 web:transition-colors',
                active ? 'bg-muted' : ''
            )}
        >
            <Text numberOfLines={1} className="text-sm font-medium text-card-foreground">
                {thread.title || t('agent_chat_untitled')}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {[closed ? t('agent_chat_closed') : t('agent_chat_open'), thread.updated_at, `${thread.messages_count}`].filter(Boolean).join(' · ')}
            </Text>
            {thread.preview ? (
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {thread.preview}
                </Text>
            ) : null}
        </Pressable>
    );
}

const ThreadRow = memo(ThreadRowImpl);

/** The person's name is the first part of the Studio thread title ("Name · context · title"). */
function threadOwner(thread) {
    return String(thread?.title || '').split(' · ')[0] || '';
}

/**
 * Every conversation of a manual / message agent: threads on the left, the chosen
 * transcript on the right (stacked on narrow screens). Read-only.
 */
function ChatLog({ agent }) {
    const { t } = useTranslation();
    const [threadsState, setThreadsState] = useState({ agentId: 0, threads: [], error: '' });
    const [selected, setSelected] = useState(null);
    const [transcript, setTranscript] = useState({ threadId: '', messages: [], error: '' });
    const loaded = threadsState.agentId === agent.id;
    const threads = loaded ? threadsState.threads : [];

    useEffect(() => {
        let cancelled = false;
        fetchAdminAgentChatThreads(agent.id)
            .then((next) => {
                if (cancelled) return;
                setThreadsState({ agentId: agent.id, threads: next, error: '' });
                setSelected(next[0] || null);
            })
            .catch((e) => {
                if (!cancelled) setThreadsState({ agentId: agent.id, threads: [], error: String(e?.message || e) });
            });
        return () => {
            cancelled = true;
        };
    }, [agent.id]);

    const threadId = selected?.thread_id || '';
    useEffect(() => {
        if (!threadId) return undefined;
        let cancelled = false;
        fetchAdminAgentChatThread(agent.id, threadId)
            .then(({ messages }) => {
                if (!cancelled) setTranscript({ threadId, messages, error: '' });
            })
            .catch((e) => {
                if (!cancelled) setTranscript({ threadId, messages: [], error: String(e?.message || e) });
            });
        return () => {
            cancelled = true;
        };
    }, [agent.id, threadId]);

    const select = useCallback((thread) => setSelected(thread), []);
    const transcriptReady = transcript.threadId === threadId;
    const user = { id: 0, display_name: threadOwner(selected) || t('agent_chat_untitled') };

    return (
        <View className="pt-2 gap-2 md:flex-row">
            <View className="md:w-64 md:border-r md:border-border/40 md:pr-2">
                {threadsState.error && loaded ? <Text className="text-xs text-destructive py-2">{threadsState.error}</Text> : null}
                {!loaded ? (
                    <View className="py-3 items-center">
                        <Loading size="small" />
                    </View>
                ) : null}
                <ScrollView className="max-h-48 md:max-h-96" contentContainerClassName="gap-0.5">
                    {threads.map((thread) => (
                        <ThreadRow key={thread.thread_id} thread={thread} active={thread.thread_id === threadId} onSelect={select} t={t} />
                    ))}
                    {loaded && !threads.length ? (
                        <Text className="text-sm text-muted-foreground px-2.5 py-2">{t('agent_chats_empty')}</Text>
                    ) : null}
                </ScrollView>
            </View>
            <View className="flex-1 min-w-0">
                {threadId && !transcriptReady ? (
                    <View className="py-3 items-center">
                        <Loading size="small" />
                    </View>
                ) : null}
                {transcriptReady && transcript.error ? <Text className="text-xs text-destructive py-2">{transcript.error}</Text> : null}
                <ScrollView className="max-h-96" contentContainerClassName="gap-1 pb-2 pr-1">
                    {transcriptReady
                        ? transcript.messages.map((message) => (
                              <ChatBubble
                                  key={message.id}
                                  message={message}
                                  user={user}
                                  assistant={agent.profile}
                                  isStreaming={false}
                                  repliesEnabled={false}
                                  chosenReply=""
                                  hideIdentity={false}
                                  maxChars={0}
                              />
                          ))
                        : null}
                    {transcriptReady && !transcript.messages.length && !transcript.error ? (
                        <Text className="text-sm text-muted-foreground py-3">{t('agents_admin_chat_empty')}</Text>
                    ) : null}
                </ScrollView>
            </View>
        </View>
    );
}

/**
 * Per-agent history: conversations for agents people talk to, the activity log
 * for the rest. Mounted only while the row is expanded, so each open is a fresh fetch.
 */
export function AgentHistory({ agent }) {
    return Number(agent.has_chat) === 1 ? <ChatLog agent={agent} /> : <ActivityLog agent={agent} />;
}
