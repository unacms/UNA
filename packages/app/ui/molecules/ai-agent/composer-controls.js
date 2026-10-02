'use client';

import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import Image from 'app/ui/atoms/image';

/** Error line above the composer, announced politely to screen readers. */
export function ComposerNotice({ message }) {
    if (!message) return null;
    return (
        <View className="px-1 pb-2" accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text className="text-sm text-destructive">{message}</Text>
        </View>
    );
}

/**
 * Thumbnails of images picked but not yet sent, each with a remove button.
 * @param {{ images: import('./chat-images').PickedImage[], disabled: boolean, onRemove: (index: number) => void }} props
 */
export function ComposerAttachments({ images, disabled, onRemove }) {
    const { t } = useTranslation();
    if (!images.length) return null;
    return (
        <View className="flex-row flex-wrap gap-2 px-1.5 pb-1.5">
            {images.map((picked, index) => (
                <View key={picked.preview || `${picked.name}-${index}`} className="relative">
                    <Image
                        src={picked.preview}
                        alt={t('Attached image')}
                        view="cover"
                        className="h-16 w-16 rounded-lg"
                    />
                    <View className="absolute -top-1 -right-1">
                        <NeoButton
                            style="glass"
                            borderShape="circle"
                            controlSize="mini"
                            image="X"
                            accessibilityLabel={t('Remove')}
                            disabled={disabled}
                            onPress={() => onRemove(index)}
                        />
                    </View>
                </View>
            ))}
        </View>
    );
}

/** Paperclip inside the composer pill — same chrome as comments FileButton. */
export function AttachButton({ disabled, onPress, image = 'Paperclip' }) {
    const { t } = useTranslation();
    return (
        <NeoButton
            style="borderless"
            borderShape="circle"
            controlSize="small"
            image={image}
            accessibilityLabel={t('Attach image')}
            disabled={disabled}
            onPress={onPress}
        />
    );
}

/**
 * Opens the "Chats" list where there is no room for it beside the transcript
 * (see AiAgent: the column is persistent from `md:` up, an overlay below —
 * or always an overlay, in which case the button always shows).
 */
export function HistoryButton({ onPress, alwaysVisible = false }) {
    const { t } = useTranslation();
    return (
        <View className={alwaysVisible ? 'pr-1.5' : 'pr-1.5 md:hidden'}>
            <NeoButton
                style="bordered"
                borderShape="circle"
                controlSize="small"
                image="History"
                accessibilityLabel={t('agent_chats')}
                onPress={onPress}
            />
        </View>
    );
}

/**
 * Send / Stop and "Start new" to the right of the input. Renders nothing when
 * neither is wanted, so the input can stretch to the edge. `startNewInHistory`:
 * the "Chats" column beside the transcript has its own "New chat" from `md:` up,
 * so "Start new" only shows below that, where the column is a closed overlay.
 */
export function ComposerButtons({ showSend, showStartNew, startNewInHistory = false, isLoading, canSend, onSend, onStop, onStartNew }) {
    const { t } = useTranslation();
    if (!showSend && !showStartNew) return null;
    return (
        <View className="flex-row items-center gap-1.5">
            {showSend && isLoading ? (
                <NeoButton
                    style="bordered"
                    borderShape="circle"
                    controlSize="small"
                    image="Square"
                    accessibilityLabel={t('Stop')}
                    onPress={onStop}
                />
            ) : null}
            {showSend && !isLoading ? (
                <NeoButton
                    style="glassProminent"
                    borderShape="circle"
                    controlSize="small"
                    image="ArrowUp"
                    accessibilityLabel={t('Send')}
                    disabled={!canSend}
                    onPress={onSend}
                />
            ) : null}
            {showStartNew ? (
                <View className={startNewInHistory ? 'md:hidden' : undefined}>
                    <NeoButton
                        style="borderless"
                        borderShape="circle"
                        controlSize="small"
                        image="RefreshCw"
                        tooltip={t('Start new')}
                        tooltipSide="top"
                        accessibilityLabel={t('Start new')}
                        onPress={onStartNew}
                    />
                </View>
            ) : null}
        </View>
    );
}
