'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Profile from 'app/ui/molecules/profile/profile';
import Html from 'app/ui/atoms/html';
import { agentTextToHtml, messageActions, messageImages, messageText, clipAgentText } from './message-content';
import { ChatActions } from './chat-actions';
import Image from 'app/ui/atoms/image';
import MessageItem from 'app/components/elements/chat/parts/message-item';

/** Unix seconds a message was created, or 0 when the transcript carries no time. */
function messageTime(message) {
    const created = message?.createdAt;
    const ms = created instanceof Date ? created.getTime() : typeof created === 'number' ? created : Date.parse(created);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/**
 * Message body. Agent output is HTML (see agentTextToHtml for how plain prose is
 * kept safe); on web the `Html` atom sanitizes before it reaches innerHTML.
 */
function MessageBody({ text, isStreaming, format }) {
    const html = useMemo(() => (text ? agentTextToHtml(text, format) : ''), [text, format]);
    if (!text && !isStreaming) return null;
    // Streaming with nothing rendered yet: an ellipsis keeps the bubble from
    // popping into existence at full height a moment later.
    if (!text) return <Text className="text-sm text-foreground leading-5">…</Text>;
    // Links in an answer are places to go and come back from: never navigate the chat away.
    return <Html data={html} customClassName="u-vanilla-html-small" linksInNewTab />;
}

/** "Thinking…" line. Announced to screen readers via the list's live region. */
export function AgentStatus() {
    const { t } = useTranslation();
    return (
        <Text className="text-xs text-muted-foreground py-1 animate-pulse flex-none">
            {t('Thinking…')}
        </Text>
    );
}

function ChatBubbleImpl({
    message,
    user,
    assistant,
    isStreaming,
    onReply,
    repliesEnabled,
    streamedActions,
    chosenReply,
    hideIdentity,
    maxChars = 0,
    messageFormat,
    variant = 'default',
}) {
    const { t } = useTranslation();
    const isUser = message.role === 'user';
    const raw = messageText(message);
    // The user's own text is clipped on display too: a transcript hydrated from an
    // older session may predate the agent's current max_input_chars.
    const text = isUser ? clipAgentText(raw, maxChars) : raw;
    const images = messageImages(message);
    const actions = isUser ? [] : messageActions(message, streamedActions);
    const hasActions = actions.length > 0;
    const hasImages = images.length > 0;

    if (!text && !hasActions && !hasImages && !isStreaming) return null;

    const showBubble = !!text || hasImages || isStreaming;
    const author = isUser
        ? {
              id: user?.id || 0,
              display_name: user?.display_name || t('You'),
              url_avatar: user?.url_avatar,
          }
        : assistant;

    const imagesElement = hasImages ? (
        <View className="flex-row flex-wrap gap-2 mt-2">
            {images.map((src) => (
                <Image
                    key={src}
                    src={src}
                    alt={t('Attached image')}
                    view="cover"
                    className="h-28 w-28 rounded-lg"
                />
            ))}
        </View>
    ) : null;
    const actionsElement = hasActions ? (
        <ChatActions
            actions={actions}
            onReply={onReply}
            repliesEnabled={repliesEnabled}
            chosenReply={chosenReply}
        />
    ) : null;

    // Chat look: the messenger's message item (avatar, card with name + time, row below).
    if (variant === 'chat') {
        // Buttons without a message of their own: just the row, no empty card.
        if (!showBubble) return <View className="w-full px-4 pl-16">{actionsElement}</View>;
        return (
            <MessageItem
                author={author}
                time={messageTime(message)}
                footer={actionsElement ? <View className="pl-12 mt-0.5">{actionsElement}</View> : null}
            >
                <View className="pb-2 gap-0.5">
                    <MessageBody text={text} isStreaming={isStreaming} format={messageFormat} />
                    {imagesElement}
                </View>
            </MessageItem>
        );
    }

    return (
        <Row className="gap-2">
            {!hideIdentity ? (
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
            ) : null}
            <View className="flex-1 mt-2 min-w-0">
                {showBubble ? (
                    <View className="bg-muted/50 rounded-xl py-2.5 px-3 gap-0.5 w-full min-w-0">
                        {!hideIdentity ? (
                            <Text className="text-sm tracking-tight font-semibold text-card-foreground">
                                {author?.display_name}
                            </Text>
                        ) : null}
                        <MessageBody text={text} isStreaming={isStreaming} format={messageFormat} />
                        {imagesElement}
                    </View>
                ) : null}
                {actionsElement}
            </View>
        </Row>
    );
}

/**
 * Memoized because a streaming reply re-renders the parent on every token: without
 * this, the whole transcript re-parses its actions and re-runs HTML sanitizing once
 * per chunk. Every prop is either a primitive or a value the parent keeps stable.
 */
export const ChatBubble = memo(ChatBubbleImpl);
