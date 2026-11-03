'use client';

import { memo } from 'react';
import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import type { ChatAction } from './chat-actions';

type ChatHintsProps = Readonly<{
    /** Normalized hints (`messageActions`); only `reply` ones are shown. */
    hints: ChatAction[];
    onSend: (message: string) => unknown;
    /** While a reply streams or an image message uploads: a hint would overtake it. */
    disabled?: boolean;
}>;

/**
 * Task hints above the composer (UNA `BxDolAiChatHints`). Each one only sends its
 * message to the chat: no selected state, nothing remembered — unlike the buttons
 * under a message, a hint answers no question.
 */
function ChatHintsImpl({ hints, onSend, disabled = false }: ChatHintsProps) {
    const replies = hints.filter((hint) => hint.type === 'reply' && hint.message);
    if (!replies.length) return null;

    return (
        <View className="flex-row flex-wrap gap-2 max-w-full">
            {replies.map((hint, index) => (
                <NeoButton
                    // Index is part of the key: a module may repeat a label.
                    key={`${hint.label}:${index}`}
                    label={hint.label}
                    style="link"
                    controlSize="small"
                    disabled={disabled}
                    onPress={() => {
                        if (!disabled && hint.message) void onSend(hint.message);
                    }}
                />
            ))}
        </View>
    );
}

export const ChatHints = memo(ChatHintsImpl);
