'use client';

import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import emitter from 'app/context/emitter';
import { appSetting, cn } from 'app/lib/util';
import { useLocalSearchParams, useSafeAreaInsets } from 'app/lib/hooks/router';
import { useFooterHeight } from 'app/context/jotai/layout';
import { lazyComponent } from 'app/lib/lazy-component';
import { fetchOperatorAgentBlock } from 'app/ui/molecules/ai-agent/helper';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

const AiAgent = lazyComponent(() => import('app/ui/molecules/ai-agent/agent'), { name: 'AiAgent' });

const isWeb = Platform.OS === 'web';
const NATIVE_TAB_BAR = Platform.OS === 'ios' ? 52 : 56;
// Emitter channel between the title bar here and the `AiAgent` inside; see its `channel` prop.
const CHANNEL = 'operator_agent';

/**
 * Floating Agent for site operators. Shown on every page when `user.operator` is
 * true and the server has an operator agent (Studio > Settings > Agents). The block
 * payload is the same one the Dashboard page block renders — same agent, same
 * settings, same thread — see `fetchOperatorAgentBlock`.
 */
export function OperatorAgentFloat() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const insets = useSafeAreaInsets();
    const footerHeight = useFooterHeight();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(null);
    // Which title-bar controls the widget can act on right now; it reports them on
    // the channel once threads / restart permission are known.
    const [controls, setControls] = useState({ history: false, restart: false });

    const params = useLocalSearchParams();
    const operatorAgent = appSetting('ai', 'operator_agent') || {};
    const enabled = operatorAgent.enabled !== false;
    const showHistory = operatorAgent.show_history === true;
    const isOperator = enabled && !!currentUser?.operator;

    const openChat = useCallback(() => {
        setOpen(true);
        setMounted(true);
    }, []);

    const close = useCallback(() => setOpen(false), []);
    const toggleHistory = useCallback(() => emitter.emit(CHANNEL, { action: 'toggle_history' }), []);
    const startNew = useCallback(() => emitter.emit(CHANNEL, { action: 'start_new' }), []);

    useEffect(() => {
        const subscription = emitter.addListener(CHANNEL, (event) => {
            if (event?.action === 'state') setControls({ history: !!event.history, restart: !!event.restart });
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!isOperator) return undefined;
        let cancelled = false;
        fetchOperatorAgentBlock()
            .then((next) => {
                if (!cancelled) setData(next);
            })
            .catch(() => {
                if (!cancelled) setData(null);
            });
        return () => {
            cancelled = true;
        };
    }, [isOperator]);

    const initialMessage = hiddenFirstMessageFromData(data, params);
    const agentId = data?.agent_id ?? '';
    const contextProfileId = Number(data?.context_profile_id) || 0;
    // No agent configured, or not allowed to chat with it: nothing to float.
    if (!isOperator || !data) return null;

    const bottomOffset = 16
        + (Number(footerHeight) || (isWeb ? 0 : NATIVE_TAB_BAR))
        + (!isWeb ? (insets?.bottom || 0) : 0);
    const panelWidth = Math.min(384, Math.max(280, windowWidth - 32));
    const panelHeight = Math.min(448, Math.max(320, windowHeight - bottomOffset - 88));

    return (
        <View
            pointerEvents="box-none"
            className="absolute web:fixed z-50 right-4 items-end"
            style={{ bottom: bottomOffset }}
        >
            {mounted ? (
                <View
                    pointerEvents={open ? 'auto' : 'none'}
                    className={cn(
                        'overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl shadow-card-outline dark:shadow-card-outline-deep',
                        open ? '' : 'hidden'
                    )}
                    style={{ width: panelWidth, height: panelHeight }}
                    accessibilityViewIsModal={open}
                >
                    <Row className="items-center justify-between px-3 py-2 border-b border-border/60">
                        <Text className="text-sm font-semibold text-card-foreground">
                            {t('operator_agent_title')}
                        </Text>
                        <Row className="items-center">
                            {controls.history ? (
                                <NeoButton
                                    style="borderless"
                                    borderShape="circle"
                                    controlSize="small"
                                    image="History"
                                    accessibilityLabel={t('agent_chats')}
                                    onPress={toggleHistory}
                                />
                            ) : null}
                            {controls.restart ? (
                                <NeoButton
                                    style="borderless"
                                    borderShape="circle"
                                    controlSize="small"
                                    image="RefreshCw"
                                    tooltip={t('Start new')}
                                    tooltipSide="bottom"
                                    accessibilityLabel={t('Start new')}
                                    onPress={startNew}
                                />
                            ) : null}
                            <NeoButton
                                style="borderless"
                                borderShape="circle"
                                controlSize="small"
                                image="X"
                                accessibilityLabel={t('operator_agent_close')}
                                onPress={close}
                            />
                        </Row>
                    </Row>
                    <View className="flex-1 min-h-0 p-3">
                        {data ? (
                            <AiAgent
                                key={`${agentId}:${contextProfileId}`}
                                data={data}
                                initialMessage={initialMessage}
                                hideInitialMessage={!!initialMessage}
                                height="h-full"
                                showHistory={showHistory}
                                // The panel is ~384px wide whatever the viewport is, so
                                // the "Chats" list can only ever overlay the transcript.
                                historyLayout="overlay"
                                fadeSurface="card"
                                channel={CHANNEL}
                            />
                        ) : null}
                    </View>
                </View>
            ) : null}
            {open ? null : (
                <NeoButton
                    style="glassProminent"
                    borderShape="circle"
                    controlSize="large"
                    image="Sparkles"
                    accessibilityLabel={t('operator_agent_open')}
                    onPress={openChat}
                />
            )}
        </View>
    );
}
