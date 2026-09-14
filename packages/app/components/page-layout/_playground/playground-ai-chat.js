'use client';

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Input, NeoButton } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import AiAgent from 'app/ui/molecules/ai-agent/agent';

const isWeb = Platform.OS === 'web';

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
    const [draftAgent, setDraftAgent] = useState(readAgentFromLocation);
    const [agentId, setAgentId] = useState(() => readAgentFromLocation().trim());

    const connect = useCallback(() => {
        const next = draftAgent.trim();
        if (!next) return;
        setAgentId(next);
        writeAgentToLocation(next);
    }, [draftAgent]);

    const disconnect = useCallback(() => {
        setAgentId('');
        writeAgentToLocation('');
    }, []);

    const chat = agentId ? (
        <AiAgent key={agentId} data={{ agent_id: agentId, allow_images: 1, allow_new: 1, max_images: 4 }} />
    ) : null;

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
                        disabled={!draftAgent.trim()}
                        onPress={connect}
                    />
                    <NeoButton
                        style="bordered"
                        controlSize="small"
                        label="Disconnect"
                        onPress={disconnect}
                    />
                </Row>
            </View>

            {chat}
        </View>
    );
}
