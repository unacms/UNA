'use client';

import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { fetchServerSentEvents, stream } from '@tanstack/ai-react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Input, NeoButton } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import AiChat from 'app/ui/molecules/chat/ai-chat';
import { useCurrentUser } from 'app/context/user';
import { isUnaAiChatAgentId, unaAiChatRequestUrl } from 'app/lib/una-ai-chat';
import { emulateUnaChatStream, UNA_CHAT_EMULATOR } from './ai-chat-emulator';

const isWeb = Platform.OS === 'web';

const EMULATOR_CONNECTION = isWeb
    ? fetchServerSentEvents('/api/pg/ai-chat')
    : stream((messages, _data, signal) => emulateUnaChatStream(messages, signal));

function readAgentFromLocation() {
    if (!isWeb || typeof window === 'undefined') return '';
    try {
        return new URLSearchParams(window.location.search).get('agent') || '';
    } catch {
        return '';
    }
}

function writeAgentToLocation(agentId) {
    if (!isWeb || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (agentId) url.searchParams.set('agent', agentId);
    else url.searchParams.delete('agent');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export default function PlaygroundAiChat() {
    const { currentUser } = useCurrentUser();
    const [draftAgent, setDraftAgent] = useState(readAgentFromLocation);
    const [agentId, setAgentId] = useState(() => {
        const initial = readAgentFromLocation().trim();
        return isUnaAiChatAgentId(initial) ? initial : '';
    });

    const live = Boolean(agentId);
    const loggedIn = Boolean(currentUser && currentUser !== false);

    const connect = useCallback(() => {
        const next = draftAgent.trim();
        if (!isUnaAiChatAgentId(next)) return;
        setAgentId(next);
        writeAgentToLocation(next);
    }, [draftAgent]);

    const useEmulator = useCallback(() => {
        setAgentId('');
        writeAgentToLocation('');
    }, []);

    const chat = useMemo(() => {
        if (live) {
            return (
                <AiChat
                    key={`live-${agentId}`}
                    settings={{
                        agentId,
                        assistantName: UNA_CHAT_EMULATOR.assistantName,
                        subtitle: `SSE → ${unaAiChatRequestUrl(agentId)}`,
                        badge: 'live',
                        placeholder: 'Write a comment',
                        emptyText: loggedIn
                            ? 'History comes from the UNA agent thread. Send a message to continue.'
                            : 'Log in to chat with this agent. Guests usually get 403.',
                    }}
                />
            );
        }

        return (
            <AiChat
                key="emulator"
                connection={EMULATOR_CONNECTION}
                settings={{
                    assistantName: UNA_CHAT_EMULATOR.assistantName,
                    subtitle: isWeb ? 'SSE → /api/pg/ai-chat' : 'local stream() adapter',
                    badge: 'emulator',
                    placeholder: 'Write a comment',
                    emptyText:
                        'Write a message to start a transient chat. Replies stream locally until you connect an AgentId.',
                }}
            />
        );
    }, [live, agentId, loggedIn]);

    return (
        <View className="w-full max-w-2xl mx-auto gap-4">
            <View className="gap-1">
                <Text className="text-2xl font-semibold text-foreground">AI Chat</Text>
                <Text className="text-sm text-muted-foreground">
                    Playground for the UNA Ask AI block. Live chat uses the same host and
                    session cookies as{' '}
                    <Text className="font-mono text-xs">fetcher</Text>
                    {' '}at{' '}
                    <Text className="font-mono text-xs">/sys-ai-chat/{'{AgentId}'}</Text>
                    .
                </Text>
                <Row className="gap-3 mt-1">
                    <Link href="/pg">
                        <Text className="text-xs text-muted-foreground underline">← Playground</Text>
                    </Link>
                    <Link href="/pg/form">
                        <Text className="text-xs text-muted-foreground underline">Form</Text>
                    </Link>
                </Row>
            </View>

            <View className="rounded-2xl border border-border bg-card p-3 gap-2">
                <Text className="text-xs text-muted-foreground">
                    Live chat sends the member session the same way native API calls do.
                    Invalid AgentId or ACL comes back as JSON {'{ code, msg }'} on HTTP 200.
                </Text>
                <Row className="items-center gap-2">
                    <Input
                        value={draftAgent}
                        onChangeText={setDraftAgent}
                        placeholder="AgentId"
                        className="flex-1"
                        onSubmitEditing={connect}
                        returnKeyType="go"
                    />
                    <NeoButton
                        style="borderedProminent"
                        controlSize="small"
                        label="Connect"
                        disabled={!isUnaAiChatAgentId(draftAgent.trim())}
                        onPress={connect}
                    />
                    <NeoButton
                        style="bordered"
                        controlSize="small"
                        label="Emulator"
                        onPress={useEmulator}
                    />
                </Row>
            </View>

            {chat}
        </View>
    );
}
