'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonLink, Modal } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';

// A link the chat waits for (e.g. OAuth in another tab): poll every 3 s, give up after 10 min.
const WATCH_INTERVAL = 3000;
const WATCH_TIMEOUT = 10 * 60 * 1000;

export type ChatAction = {
    type: 'reply' | 'link' | 'form';
    label: string;
    message?: string;
    url?: string;
    checkUrl?: string;
    formUrl?: string;
};

type ChatActionsProps = {
    actions: ChatAction[];
    onReply?: (message: string) => Promise<boolean> | boolean;
    repliesEnabled: boolean;
    chosenReply?: string;
};

type OpenForm = {
    Block: any;
    block: { content: any; designbox_id: number; title: string };
    message?: string;
};

type Watch = { checkUrl: string; message?: string; until: number };

/**
 * The quick-reply / link / form buttons an assistant message can carry.
 *
 * Selection has one authority: `chosenReply`, derived by the parent from the user
 * message that actually followed this bubble. `pending` is only an optimistic bridge
 * covering the round-trip, cleared once the transcript confirms the choice or the
 * send reports failure.
 *
 * A form button opens the site form (`/api.php?r={formUrl}`) in a popup over the chat;
 * once the form is saved the popup closes and the action `message` is sent.
 *
 * A link with `checkUrl` opens as usual, then the chat polls `/api.php?r={checkUrl}`
 * and sends the link `message` itself once it answers `done`.
 */
function ChatActionsImpl({ actions, onReply, repliesEnabled, chosenReply = '' }: Readonly<ChatActionsProps>) {
    const { t } = useTranslation();
    const [pending, setPending] = useState('');
    const [form, setForm] = useState<OpenForm | null>(null);
    const [opening, setOpening] = useState(false);
    const [formError, setFormError] = useState('');
    // Several buttons may send the same answer: only the pressed one reads as chosen.
    const [pressedIndex, setPressedIndex] = useState<number | null>(null);
    const selected = chosenReply || pending;

    useEffect(() => {
        if (chosenReply) setPending('');
    }, [chosenReply]);

    const press = useCallback(async (message: string) => {
        setPending(message);
        const sent = await onReply?.(message);
        if (!sent) setPending('');
    }, [onReply]);

    const openForm = useCallback(async (action: ChatAction) => {
        setOpening(true);
        setFormError('');
        try {
            // Loaded on demand: the block renderer imports the component registry,
            // which in turn imports this chat.
            const [{ BlockByDataInt }, response] = await Promise.all([
                import('app/components/block'),
                fetcher(`/api.php?r=${action.formUrl}`),
            ]);
            if (!response?.data) throw new Error('empty form');
            setForm({
                Block: BlockByDataInt,
                block: { content: response.data, designbox_id: 0, title: action.label },
                message: action.message,
            });
        } catch {
            // The button stays enabled, so pressing it again retries.
            setFormError(t('Something went wrong'));
        } finally {
            setOpening(false);
        }
    }, [t]);

    const closeForm = useCallback(() => setForm(null), []);

    // Latest press / repliesEnabled for the polling loop, which outlives renders.
    const pressRef = useRef(press);
    const repliesEnabledRef = useRef(repliesEnabled);
    useEffect(() => {
        pressRef.current = press;
        repliesEnabledRef.current = repliesEnabled;
    }, [press, repliesEnabled]);

    const [watch, setWatch] = useState<Watch | null>(null);

    useEffect(() => {
        if (!watch) return undefined;

        // Chained timeouts instead of an interval: the next check starts only after
        // the previous one answered, so slow responses never overlap.
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const check = async () => {
            if (stopped) return;
            if (Date.now() > watch.until) {
                setWatch(null);
                return;
            }
            try {
                const response = await fetcher(`/api.php?r=${watch.checkUrl}`);
                if (stopped) return;
                if (response?.data?.done) {
                    stopped = true;
                    setWatch(null);
                    if (watch.message && repliesEnabledRef.current) void pressRef.current(watch.message);
                    return;
                }
            } catch {
                // Network hiccup: keep waiting until the timeout.
            }
            if (!stopped) timer = setTimeout(check, WATCH_INTERVAL);
        };
        timer = setTimeout(check, WATCH_INTERVAL);

        return () => {
            stopped = true;
            if (timer) clearTimeout(timer);
        };
    }, [watch]);

    // The form calls onFormEmpty once the server answered the submit with "done";
    // closing the popup with its X does not, so only a saved form sends the answer.
    const completeForm = useCallback(() => {
        const message = form?.message;
        setForm(null);
        if (message && repliesEnabled) void press(message);
    }, [form, press, repliesEnabled]);

    if (!actions.length) return null;

    const firstSelectedIndex = selected ? actions.findIndex((action) => action.message === selected) : -1;

    return (
        <View className="flex-row flex-wrap gap-2 mt-2 max-w-full">
            {actions.map((action, index) => {
                const isSelected = !!action.message && action.message === selected
                    && (pressedIndex !== null && actions[pressedIndex]?.message === selected ? pressedIndex === index : firstSelectedIndex === index);
                // Index is part of the key: an agent may repeat a label ("Other", "Other").
                const key = `${action.type}:${action.label}:${index}`;
                const buttonProps = {
                    label: action.label,
                    style: isSelected ? 'glassProminent' : 'bordered',
                    controlSize: 'small',
                    borderShape: 'rounded',
                };
                if (action.type === 'link') {
                    const checkUrl = action.checkUrl;
                    const startWatch = checkUrl
                        ? () => {
                            setPressedIndex(index);
                            setWatch({ checkUrl, message: action.message, until: Date.now() + WATCH_TIMEOUT });
                        }
                        : undefined;
                    return <NeoButtonLink key={key} {...buttonProps} href={action.url} target="_blank" onPress={startWatch} />;
                }
                if (action.type === 'form') {
                    return (
                        <NeoButton
                            key={key}
                            {...buttonProps}
                            selected={isSelected}
                            disabled={opening}
                            onPress={() => {
                                setPressedIndex(index);
                                void openForm(action);
                            }}
                        />
                    );
                }
                return (
                    <NeoButton
                        key={key}
                        {...buttonProps}
                        selected={isSelected}
                        disabled={!isSelected && !repliesEnabled}
                        onPress={() => {
                            if (!repliesEnabled || isSelected || !action.message) return;
                            setPressedIndex(index);
                            void press(action.message);
                        }}
                    />
                );
            })}
            {!!formError && <Text className="w-full text-destructive text-sm">{formError}</Text>}
            {form && (
                <Modal scrollable={true} title={form.block.title} onVisible={true} onClose={closeForm}>
                    <form.Block block={form.block} onFormEmpty={completeForm} />
                </Modal>
            )}
        </View>
    );
}

export const ChatActions = memo(ChatActionsImpl);
