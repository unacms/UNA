'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import Switch from 'app/ui/atoms/switcher';
import Profile from 'app/ui/molecules/profile/profile';
import { cn } from 'app/lib/util';
import { formatDate } from 'app/lib/util/datetime';
import { fetchAdminAgents, setAdminAgentActive } from './helper';
import { AgentHistory } from './history';

function AgentRowImpl({ agent, expanded, busy, onToggleActive, onToggleHistory, t }) {
    const active = Number(agent.active) === 1;
    const hasChat = Number(agent.has_chat) === 1;
    const count = Number(agent.activity_count) || 0;
    const last = Number(agent.activity_last) || 0;
    const subtitle = [agent.trigger_title || agent.trigger];
    if (agent.alert) subtitle.push(agent.alert);
    if (agent.model) subtitle.push(agent.model);
    const lastText = last ? formatDate(last * 1000, t, { showTime: true, month: 'short' }) : '';

    return (
        <View className={cn('rounded-xl border border-border/60', expanded ? 'bg-muted/30' : '')}>
            <Row className="items-center gap-3 px-3 py-2.5">
                <Switch
                    value={active}
                    disabled={busy}
                    size="small"
                    onValueChange={(next) => onToggleActive(agent, next)}
                />
                <View className="w-8">
                    <Profile
                        {...agent.profile}
                        displayType="unit_wo_info"
                        displaySize="sm"
                        showInfo="false"
                        showLinks={false}
                    />
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                    <Text numberOfLines={1} className={cn('text-sm font-semibold', active ? 'text-card-foreground' : 'text-muted-foreground')}>
                        {agent.title}
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                        {subtitle.join(' · ')}
                    </Text>
                </View>
                {!hasChat && count ? (
                    <View className="hidden md:flex items-end">
                        <Text className="text-xs text-muted-foreground">
                            {t('agents_admin_actions_count', { count })}
                        </Text>
                        {lastText ? <Text className="text-xs text-muted-foreground">{lastText}</Text> : null}
                    </View>
                ) : null}
                <NeoButton
                    style={expanded ? 'bordered' : 'borderless'}
                    borderShape="circle"
                    controlSize="small"
                    image={hasChat ? 'MessageSquare' : 'History'}
                    accessibilityLabel={hasChat ? t('agents_admin_chats') : t('agents_admin_activity')}
                    onPress={() => onToggleHistory(agent)}
                />
            </Row>
            {expanded ? (
                <View className="border-t border-border/60 px-3 pb-3">
                    <AgentHistory agent={agent} />
                </View>
            ) : null}
        </View>
    );
}

const AgentRow = memo(AgentRowImpl);

/**
 * Operators' view of Studio > Agents, cut down to what is needed day to day: every
 * agent with its on/off switch, and per agent either the conversations (manual /
 * message agents) or the activity log — what an alert / scheduler / webhook agent
 * actually did. Editing stays in Studio; the header links there.
 *
 * @param {object} props
 * @param {{agents?: import('./helper').AdminAgent[], studio_url?: string}} props.data Block payload
 *   from `system/get_block_ai_agents_admin`; the list is refetched on every toggle.
 */
export default function AiAgentsAdmin({ data }) {
    const { t } = useTranslation();
    const initial = Array.isArray(data?.agents) ? data.agents : [];
    const [agents, setAgents] = useState(initial);
    const [busyId, setBusyId] = useState(0);
    const [expandedId, setExpandedId] = useState(0);
    const [error, setError] = useState('');
    // Bumped to refetch the list (after a toggle, or on demand).
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!version) return undefined;
        let cancelled = false;
        fetchAdminAgents()
            .then((next) => {
                if (!cancelled) setAgents(next);
            })
            .catch((e) => {
                if (!cancelled) setError(String(e?.message || e));
            });
        return () => {
            cancelled = true;
        };
    }, [version]);

    const refresh = useCallback(() => setVersion((v) => v + 1), []);

    const toggleActive = useCallback(async (agent, next) => {
        setBusyId(agent.id);
        setError('');
        // Optimistic: the switch answers immediately, the server value wins on return.
        setAgents((prev) => prev.map((row) => (row.id === agent.id ? { ...row, active: next ? 1 : 0 } : row)));
        try {
            const stored = await setAdminAgentActive(agent.id, next);
            setAgents((prev) => prev.map((row) => (row.id === agent.id ? { ...row, active: stored ? 1 : 0 } : row)));
        } catch (e) {
            setAgents((prev) => prev.map((row) => (row.id === agent.id ? { ...row, active: agent.active } : row)));
            setError(String(e?.message || e));
        } finally {
            setBusyId(0);
        }
    }, []);

    const toggleHistory = useCallback((agent) => {
        setExpandedId((prev) => (prev === agent.id ? 0 : agent.id));
    }, []);

    return (
        <View className="gap-2">
            <Row className="items-center justify-between gap-2 pb-1">
                <Text className="text-xs text-muted-foreground">
                    {t('agents_admin_count', { count: agents.length })}
                </Text>
                <Row className="items-center gap-1">
                    <NeoButton
                        style="borderless"
                        borderShape="circle"
                        controlSize="mini"
                        image="RefreshCw"
                        accessibilityLabel={t('Refresh')}
                        onPress={refresh}
                    />
                    {data?.studio_url ? (
                        <NeoButtonLink
                            style="borderless"
                            borderShape="rounded"
                            controlSize="mini"
                            image="ExternalLink"
                            label={t('agents_admin_studio')}
                            href={data.studio_url}
                            target="_blank"
                        />
                    ) : null}
                </Row>
            </Row>
            {error ? (
                <Text className="text-xs text-destructive px-1">{error}</Text>
            ) : null}
            {agents.map((agent) => (
                <AgentRow
                    key={agent.id}
                    agent={agent}
                    expanded={expandedId === agent.id}
                    busy={busyId === agent.id}
                    onToggleActive={toggleActive}
                    onToggleHistory={toggleHistory}
                    t={t}
                />
            ))}
            {!agents.length ? (
                <Text className="text-sm text-muted-foreground px-1 py-2">{t('agents_admin_empty')}</Text>
            ) : null}
        </View>
    );
}
