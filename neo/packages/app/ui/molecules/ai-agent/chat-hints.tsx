'use client';

import { memo } from 'react';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import { cn } from 'app/lib/util';

/** A hint as UNA sends it (`BxDolAiChatHints`): only `reply` ones are shown. */
type RawHint = { type?: unknown; label?: unknown; emoji?: unknown; image?: unknown };

type Hint = { label: string; emoji: string; image: string };

type ChatHintsProps = Readonly<{
    /** Raw hint items from `?hints=1`. */
    hints: unknown[];
    onSend: (message: string) => unknown;
    /** While a reply streams or an image message uploads: a hint would overtake it. */
    disabled?: boolean;
}>;

const MAX_HINTS = 4;

function toHints(items: unknown[]): Hint[] {
    const out: Hint[] = [];
    for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as RawHint;
        const label = String(raw.label ?? '').trim();
        if (!label || (raw.type !== undefined && raw.type !== 'reply')) continue;
        const image = String(raw.image ?? '').trim();
        out.push({
            label,
            image: /^https:\/\//i.test(image) ? image : '',
            emoji: String(raw.emoji ?? '').trim(),
        });
        if (out.length >= MAX_HINTS) break;
    }
    return out;
}

/**
 * Task hints above the composer (UNA `BxDolAiChatHints`): suggested prompts in a row
 * that wraps, each with its icon (the picture of the project it is about, else an
 * emoji, else a sparkle) and a dashed outline that tells them from answer buttons.
 * Dashes need a real border and the JS surface, so these are not NeoButtons on Expo UI.
 * A press only sends the label to the chat: no selected state, a hint answers no question.
 */
function ChatHintsImpl({ hints, onSend, disabled = false }: ChatHintsProps) {
    const items = toHints(hints);
    if (!items.length) return null;

    return (
        <View className="flex-row flex-wrap gap-1.5 max-w-full">
            {items.map((hint, index) => (
                <Pressable
                    // Index is part of the key: a module may repeat a label.
                    key={`${hint.label}:${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={hint.label}
                    disabled={disabled}
                    onPress={() => {
                        if (!disabled) void onSend(hint.label);
                    }}
                    className={cn(
                        'flex-row items-center gap-2 max-w-full rounded-xl border border-dashed border-border px-3 py-1.5 web:hover:bg-button-hover',
                        disabled ? 'opacity-50' : ''
                    )}
                >
                    {hint.image ? (
                        <Image src={hint.image} width={16} height={16} alt="" className="w-4 h-4 rounded" />
                    ) : null}
                    {!hint.image && hint.emoji ? <Text className="text-sm leading-5">{hint.emoji}</Text> : null}
                    {!hint.image && !hint.emoji ? <Icon icon="Sparkles" size={16} className="text-accent-foreground" /> : null}
                    <Text className="text-sm leading-5 text-card-foreground shrink" numberOfLines={1}>
                        {hint.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

export const ChatHints = memo(ChatHintsImpl);
