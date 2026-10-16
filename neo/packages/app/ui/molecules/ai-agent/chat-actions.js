'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'app/design/view';
import { NeoButton, NeoButtonLink, Modal } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';

/**
 * The quick-reply / link / form buttons an assistant message can carry.
 *
 * Selection has one authority: `chosenReply`, derived by the parent from the user
 * message that actually followed this bubble. `pending` is only an optimistic bridge
 * covering the round-trip, and it is cleared as soon as the transcript confirms the
 * choice or the send reports failure — so a failed send can no longer leave a button
 * highlighted as if it had been answered.
 *
 * A form button opens the site form (`/api.php?r={formUrl}`) in a popup over the chat,
 * like the deploy block does; once the form is saved the popup closes and the action
 * `message` is sent as the user's answer, so the agent goes on by itself.
 */
function ChatActionsImpl({ actions, onReply, repliesEnabled, chosenReply = '' }) {
    const [pending, setPending] = useState('');
    const [form, setForm] = useState(null);
    const [opening, setOpening] = useState(false);
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

    const openForm = useCallback(async (action) => {
        setOpening(true);
        try {
            // Loaded on demand: the block renderer imports the component registry,
            // which in turn imports this chat.
            const [{ BlockByDataInt }, response] = await Promise.all([
                import('app/components/block'),
                fetcher(`/api.php?r=${action.formUrl}`),
            ]);
            setForm({
                Block: BlockByDataInt,
                block: { content: response?.data, designbox_id: 0, title: action.label },
                message: action.message,
            });
        } finally {
            setOpening(false);
        }
    }, []);

    const closeForm = useCallback(() => setForm(null), []);

    // The form calls onFormEmpty once the server answered the submit with "done";
    // closing the popup with its X does not, so only a saved form sends the answer.
    const completeForm = useCallback(() => {
        const message = form?.message;
        setForm(null);
        if (message && repliesEnabled) void press(message);
    }, [form, press, repliesEnabled]);

    if (!actions.length) return null;

    return (
        <View className="flex-row flex-wrap gap-2 mt-2 max-w-full">
            {actions.map((action, index) => {
                const isLink = action.type === 'link';
                const isForm = action.type === 'form';
                const isSelected = !isLink && !!action.message && action.message === selected;
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
                if (isForm) {
                    // Like a link, a form stays usable after the turn is over; only the
                    // answer it sends on save needs the turn to be open.
                    return (
                        <NeoButton
                            key={key}
                            {...buttonProps}
                            selected={isSelected}
                            disabled={opening}
                            onPress={() => void openForm(action)}
                        />
                    );
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
            {form && (
                <Modal scrollable={true} title={form.block.title} onVisible={true} onClose={closeForm}>
                    <form.Block block={form.block} onFormEmpty={completeForm} />
                </Modal>
            )}
        </View>
    );
}

export const ChatActions = memo(ChatActionsImpl);
