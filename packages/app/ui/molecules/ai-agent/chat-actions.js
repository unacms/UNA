'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'app/design/view';
import { NeoButton, NeoButtonLink } from 'app/design/controls';

/**
 * The quick-reply / link buttons an assistant message can carry.
 *
 * Selection has one authority: `chosenReply`, derived by the parent from the user
 * message that actually followed this bubble. `pending` is only an optimistic bridge
 * covering the round-trip, and it is cleared as soon as the transcript confirms the
 * choice or the send reports failure — so a failed send can no longer leave a button
 * highlighted as if it had been answered.
 */
function ChatActionsImpl({ actions, onReply, repliesEnabled, chosenReply = '' }) {
    const [pending, setPending] = useState('');
    const selected = chosenReply || pending;

    useEffect(() => {
        // The transcript now records the answer; the optimistic copy has no job left.
        if (chosenReply) setPending('');
    }, [chosenReply]);

    const press = useCallback(async (message) => {
        setPending(message);
        // onReply resolves false when the message never made it into the transcript.
        const sent = await onReply?.(message);
        if (!sent) setPending('');
    }, [onReply]);

    if (!actions.length) return null;

    return (
        <View className="flex-row flex-wrap gap-2 mt-2 max-w-full">
            {actions.map((action, index) => {
                const isLink = action.type === 'link';
                const isSelected = !isLink && action.message === selected;
                // Index is part of the key because an agent may legitimately repeat a
                // label within one message ("Other", "Other").
                const key = `${action.type}:${action.label}:${index}`;
                const buttonProps = {
                    label: action.label,
                    style: isSelected ? 'glassProminent' : 'bordered',
                    controlSize: 'small',
                    borderShape: 'rounded',
                };
                if (isLink) {
                    // Target vetting happens in messageActions(); NeoButtonLink routes
                    // internal hrefs through the SPA router and external ones to the
                    // in-app browser.
                    return <NeoButtonLink key={key} {...buttonProps} href={action.url} target="_blank" />;
                }
                return (
                    <NeoButton
                        key={key}
                        {...buttonProps}
                        selected={isSelected}
                        // The answered option stays enabled so it keeps reading as the
                        // choice that was made; the alternatives lock once the turn is over.
                        disabled={!isSelected && !repliesEnabled}
                        onPress={() => {
                            if (!repliesEnabled || isSelected) return;
                            void press(action.message);
                        }}
                    />
                );
            })}
        </View>
    );
}

export const ChatActions = memo(ChatActionsImpl);
