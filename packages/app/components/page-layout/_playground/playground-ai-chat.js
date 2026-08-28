'use client';

import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { fetchServerSentEvents, stream, useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Input, NeoButton } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import Link from 'app/ui/atoms/link';
import { useCurrentUser } from 'app/context/user';
import { emulateUnaChatStream, UNA_CHAT_EMULATOR } from './ai-chat-emulator';

const isWeb = Platform.OS === 'web';

const EMULATOR_CONNECTION = isWeb
    ? fetchServerSentEvents('/api/pg/ai-chat')
    : stream((messages, _data, signal) => emulateUnaChatStream(messages, signal));

function messageText(message) {
    if (typeof message?.content === 'string') return message.content;
    const parts = message?.parts || [];
    return parts
        .filter((part) => part?.type === 'text')
        .map((part) => part.content || '')
        .join('');
}

function ChatBubble({ message, user, isStreaming }) {
    const isUser = message.role === 'user';
    const text = messageText(message);
    const author = isUser
        ? {
              id: user?.id || 0,
              display_name: user?.display_name || 'You',
              url_avatar: user?.url_avatar,
          }
        : {
              id: 'una-assistant',
              display_name: UNA_CHAT_EMULATOR.assistantName,
          };

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
            <View className="flex-1 mt-2">
                <View className="bg-muted/50 rounded-xl py-2.5 px-3 gap-0.5 me-auto max-w-full">
                    <Row className="items-center gap-2 pr-4">
                        <Profile
                            {...author}
                            displayType="unit_wo_image"
                            displaySize="sm"
                            showInfo="false"
                            showLinks={false}
                        />
                    </Row>
                    <Text className="text-sm text-foreground leading-5">
                        {text}
                        {isStreaming && !text ? '…' : ''}
                    </Text>
                </View>
            </View>
        </Row>
    );
}

export default function PlaygroundAiChat() {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const listRef = useRef(null);

    const { messages, sendMessage, isLoading, error, stop, clear } = useChat({
        connection: EMULATOR_CONNECTION,
    });

    const last = messages[messages.length - 1];
    const streamingId = isLoading && last?.role === 'assistant' ? last.id : null;

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;
        setInput('');
        await sendMessage(text);
        listRef.current?.scrollToEnd?.({ animated: true });
    }, [input, isLoading, sendMessage]);

    const onComposerKey = useCallback((event) => {
        const key = event?.nativeEvent?.key || event?.key;
        if (key !== 'Enter' || event?.shiftKey) return;
        event.preventDefault?.();
        send();
    }, [send]);

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

            <View className="rounded-2xl border border-border bg-card overflow-hidden">
                <Row className="items-center justify-between px-4 py-3 border-b border-border/60">
                    <View className="gap-0.5">
                        <Text className="text-sm font-semibold text-foreground">
                            {UNA_CHAT_EMULATOR.assistantName}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                            {isWeb ? 'SSE → /api/pg/ai-chat' : 'local stream() adapter'}
                        </Text>
                    </View>
                    <View className="rounded-full bg-muted px-2 py-0.5">
                        <Text className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            emulator
                        </Text>
                    </View>
                </Row>

                <ScrollView
                    ref={listRef}
                    className="max-h-[28rem] px-4 py-3"
                    contentContainerClassName="gap-1 pb-2"
                >
                    {messages.length === 0 ? (
                        <View className="py-10 px-2">
                            <Text className="text-sm text-muted-foreground text-center">
                                Write a message to start a transient chat. Replies stream the same way the UNA endpoint will.
                            </Text>
                        </View>
                    ) : (
                        messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                message={message}
                                user={currentUser}
                                isStreaming={message.id === streamingId}
                            />
                        ))
                    )}
                </ScrollView>

                {error ? (
                    <View className="px-4 pb-2">
                        <Text className="text-sm text-destructive">{error.message}</Text>
                    </View>
                ) : null}

                <View className="px-3 pb-3 pt-1">
                    <Row className="items-center gap-2 bg-muted/60 rounded-full px-2 py-1">
                        <Input
                            value={input}
                            onChangeText={setInput}
                            placeholder="Write a comment"
                            editable={!isLoading}
                            rounded="full"
                            className="flex-1 bg-transparent border-0"
                            onSubmitEditing={send}
                            onKeyPress={onComposerKey}
                            returnKeyType="send"
                        />
                        {isLoading ? (
                            <NeoButton
                                style="bordered"
                                borderShape="circle"
                                image="Square"
                                accessibilityLabel="Stop"
                                onPress={() => stop()}
                            />
                        ) : (
                            <NeoButton
                                style="borderedProminent"
                                borderShape="circle"
                                image="ArrowUp"
                                accessibilityLabel="Send"
                                disabled={!input.trim()}
                                onPress={send}
                            />
                        )}
                    </Row>
                    {messages.length > 0 ? (
                        <Row className="justify-end pt-2">
                            <NeoButton
                                style="plain"
                                controlSize="mini"
                                label="Clear"
                                onPress={() => clear()}
                            />
                        </Row>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
