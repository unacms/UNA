'use client';

import { Platform } from 'react-native';
import { fetchServerSentEvents, stream } from '@tanstack/ai-react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import AiChat from 'app/ui/molecules/chat/ai-chat';
import { emulateUnaChatStream, UNA_CHAT_EMULATOR } from './ai-chat-emulator';

const isWeb = Platform.OS === 'web';

const EMULATOR_CONNECTION = isWeb
    ? fetchServerSentEvents('/api/pg/ai-chat')
    : stream((messages, _data, signal) => emulateUnaChatStream(messages, signal));

export default function PlaygroundAiChat() {
    return (
        <View className="w-full max-w-2xl mx-auto gap-4">
            <View className="gap-1">
                <Text className="text-2xl font-semibold text-foreground">AI Chat</Text>
                <Text className="text-sm text-muted-foreground">
                    Playground emulator for the UNA Ask AI block (
                    <Link href="https://ci.una.io/test/chat.php" asExternal className="underline">
                        chat.php
                    </Link>
                    ). Settings stay on the UNA backend; this page streams fake AG-UI until that endpoint exists.
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

            <AiChat
                connection={EMULATOR_CONNECTION}
                settings={{
                    assistantName: UNA_CHAT_EMULATOR.assistantName,
                    subtitle: isWeb ? 'SSE → /api/pg/ai-chat' : 'local stream() adapter',
                    badge: 'emulator',
                    placeholder: 'Write a comment',
                    emptyText:
                        'Write a message to start a transient chat. Replies stream the same way the UNA endpoint will.',
                }}
            />
        </View>
    );
}
