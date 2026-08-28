'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react';
import { View, Row, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Input, NeoButton } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util';

function messageText(message) {
    if (typeof message?.content === 'string') return message.content;
    const parts = message?.parts || [];
    return parts
        .filter((part) => part?.type === 'text')
        .map((part) => part.content || '')
        .join('');
}

function ChatBubble({ message, user, assistant, isStreaming }) {
    const isUser = message.role === 'user';
    const text = messageText(message);
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

function resolveSettings(props) {
    const incoming = { ...(props.params || {}), ...(props.settings || {}) };
    const showClearDefault = appSetting('ai_chat', 'show_clear');

    return {
        connection: props.connection ?? incoming.connection,
        endpoint: props.endpoint ?? incoming.endpoint,
        assistantName:
            incoming.assistantName ||
            incoming.assistant_name ||
            appSetting('ai_chat', 'assistant_name') ||
            'Assistant',
        assistantId: incoming.assistantId || incoming.assistant_id || 'una-assistant',
        assistantAvatar:
            incoming.assistantAvatar ||
            incoming.url_avatar ||
            incoming.assistant?.url_avatar,
        subtitle: incoming.subtitle || '',
        badge: incoming.badge || '',
        placeholder:
            incoming.placeholder ||
            appSetting('ai_chat', 'placeholder') ||
            'Write a comment',
        emptyText: incoming.emptyText || incoming.empty_text || '',
        showClear: incoming.showClear ?? incoming.show_clear ?? showClearDefault !== false,
        showHeader: incoming.showHeader ?? incoming.show_header ?? true,
    };
}

/**
 * Streaming AI chat widget (UNA Ask AI).
 *
 * Settings (prop or `params`, UNA-style):
 *   connection      — TanStack AI connection (preferred)
 *   endpoint        — SSE URL; used when `connection` is omitted
 *   assistantName   — header + bubble author
 *   assistantAvatar — optional avatar URL
 *   subtitle, badge, placeholder, emptyText
 *   showClear, showHeader
 */
export default function AiChat(props) {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState('');
    const listRef = useRef(null);
    const cfg = resolveSettings(props);

    const assistant = useMemo(
        () => ({
            id: cfg.assistantId,
            display_name: cfg.assistantName,
            url_avatar: cfg.assistantAvatar,
        }),
        [cfg.assistantId, cfg.assistantName, cfg.assistantAvatar]
    );

    const connection = useMemo(() => {
        if (cfg.connection) return cfg.connection;
        if (cfg.endpoint) return fetchServerSentEvents(cfg.endpoint);
        return undefined;
    }, [cfg.connection, cfg.endpoint]);

    const { messages, sendMessage, isLoading, error, stop, clear } = useChat({
        connection,
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

    const onComposerKey = useCallback(
        (event) => {
            const key = event?.nativeEvent?.key || event?.key;
            if (key !== 'Enter' || event?.shiftKey) return;
            event.preventDefault?.();
            send();
        },
        [send]
    );

    return (
        <View className="rounded-2xl border border-border bg-card overflow-hidden">
            {cfg.showHeader ? (
                <Row className="items-center justify-between px-4 py-3 border-b border-border/60">
                    <View className="gap-0.5">
                        <Text className="text-sm font-semibold text-foreground">
                            {cfg.assistantName}
                        </Text>
                        {cfg.subtitle ? (
                            <Text className="text-xs text-muted-foreground">{cfg.subtitle}</Text>
                        ) : null}
                    </View>
                    {cfg.badge ? (
                        <View className="rounded-full bg-muted px-2 py-0.5">
                            <Text className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {cfg.badge}
                            </Text>
                        </View>
                    ) : null}
                </Row>
            ) : null}

            <ScrollView
                ref={listRef}
                className="max-h-[28rem] px-4 py-3"
                contentContainerClassName="gap-1 pb-2"
            >
                {messages.length === 0 ? (
                    <View className="py-10 px-2">
                        {cfg.emptyText ? (
                            <Text className="text-sm text-muted-foreground text-center">
                                {cfg.emptyText}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            user={currentUser}
                            assistant={assistant}
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
                        placeholder={cfg.placeholder}
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
                {cfg.showClear && messages.length > 0 ? (
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
    );
}
