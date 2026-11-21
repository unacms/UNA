import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Modal, NeoButton } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { playCue } from 'app/lib/sound';
import {
    getPushProvider,
    isPushPromptSnoozed,
    linkPushMember,
    pushPromptEnabled,
    pushPromptWaitMs,
    snoozePushPrompt,
    type PushMember,
} from 'app/lib/push';

// Once per app run (a web tab, a native launch), whatever remounts the layout.
let askedThisRun = false;

/**
 * Asks a member to turn on push notifications, with NEO's own dialog, then the system's request
 * through the configured provider (`app/lib/push`). Shown `notifications.push_prompt_delay_ms`
 * after a member's first page of the run, only while the system can still ask; "Not now" waits
 * `push_prompt_snooze_days`. A member who already allowed them is linked to this device quietly.
 */
export default function PushPrompt() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    // The member the dialog is open for, so it never stays up for a visitor or another member.
    const [openFor, setOpenFor] = useState<string | null>(null);

    const memberId = currentUser ? currentUser.id : undefined;
    const memberHash = currentUser ? currentUser.hash : undefined;

    useEffect(() => {
        if (!memberId) return;
        const provider = getPushProvider();
        if (!provider) return;

        const member: PushMember = { id: memberId, hash: memberHash };
        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                const permission = await provider.permission();
                if (cancelled) return;
                if (permission === 'granted') {
                    await linkPushMember(provider, member);
                    return;
                }
                if (permission !== 'default' || askedThisRun || !pushPromptEnabled()) return;
                if (await isPushPromptSnoozed()) return;
                await provider.prepare();
                if (cancelled || askedThisRun) return;
                askedThisRun = true;
                setOpenFor(String(memberId));
            } catch (error) {
                console.warn('Push notifications:', (error as Error)?.message || error);
            }
        }, pushPromptWaitMs(memberId));

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [memberId, memberHash]);

    if (!memberId || openFor !== String(memberId)) return null;

    const close = () => setOpenFor(null);

    const handleLater = () => {
        close();
        void snoozePushPrompt();
    };

    const handleAllow = () => {
        const provider = getPushProvider();
        close();
        if (!provider) return;
        // No await before the request: browsers only show it from the press itself.
        provider.requestPermission()
            .then(async (granted) => {
                if (!granted) {
                    // Refused, or the system's request was closed without an answer: the member has
                    // been asked, so the next visit doesn't ask again.
                    await snoozePushPrompt();
                    return;
                }
                await linkPushMember(provider, { id: memberId, hash: memberHash });
                playCue('success', { emphasis: 'subtle' });
            })
            .catch((error) => {
                console.warn('Push notifications:', (error as Error)?.message || error);
            });
    };

    return (
        <Modal
            onVisible
            onClose={handleLater}
            accessibilityLabel={t('push_prompt_title')}
            maxWidth="max-w-sm"
            padding="p-6"
            autoHeight
            skipUnsavedGuard
            outerClickClose
        >
            <View className="items-center gap-y-4">
                <View className="size-12 rounded-xl bg-accent items-center justify-center">
                    <Icon icon="BellRing" size={24} className="text-accent-foreground" />
                </View>
                <View className="items-center gap-y-1">
                    <Text role="heading" aria-level={2} className="text-lg leading-7 font-semibold text-card-foreground text-center">
                        {t('push_prompt_title')}
                    </Text>
                    <Text className="text-sm leading-5 text-muted-foreground text-center">
                        {t('push_prompt_text')}
                    </Text>
                </View>
                <View className="w-full gap-y-2 pt-2">
                    <NeoButton
                        style="borderedProminent"
                        controlSize="large"
                        width="fill"
                        label={t('push_prompt_allow')}
                        onPress={handleAllow}
                    />
                    <NeoButton
                        style="borderless"
                        role="cancel"
                        controlSize="large"
                        width="fill"
                        label={t('push_prompt_later')}
                        onPress={handleLater}
                    />
                </View>
            </View>
        </Modal>
    );
}
