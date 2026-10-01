'use client';

import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import emitter, { EVENTS } from 'app/context/emitter';
import { androidTabBarHeight, appSetting, cn, isNativeTabsEnabled } from 'app/lib/util';
import { useLocalSearchParams, useSafeAreaInsets } from 'app/lib/hooks/router';
import { useFooterHeight } from 'app/context/jotai/layout';
import { areTabBarLabelsHidden, getTabList, hasNativeTabsMoreMenu } from 'app/components/nav/tabs/tab-menu';
import { lazyComponent } from 'app/lib/lazy-component';
import { fetchOperatorAgentBlock } from 'app/ui/molecules/ai-agent/operator-block';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

const AiAgent = lazyComponent(() => import('app/ui/molecules/ai-agent/agent'), { name: 'AiAgent' });

const isWeb = Platform.OS === 'web';
// Emitter channel between the title bar here and the `AiAgent` inside; see its `channel` prop.
const CHANNEL = EVENTS.operatorAgent;

/**
 * The operator agent block when `user.operator` is true and the server has an
 * operator agent (Studio > Settings > Agents), else null. The payload is the one
 * the Dashboard page block renders — same agent, same settings, same thread —
 * see `fetchOperatorAgentBlock`. `enabled = false` skips the request.
 */
export function useOperatorAgentData(enabled = true) {
    const { currentUser } = useCurrentUser();
    const [data, setData] = useState(null);
    const operatorAgent = appSetting('ai', 'operator_agent') || {};
    const isOperator = enabled && operatorAgent.enabled !== false && !!currentUser?.operator;

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

    return isOperator ? data : null;
}

/**
 * Agent chat card anchored bottom-right, `bottomOffset` above the window /
 * screen bottom. Mounts on first open and then only hides, so the thread and
 * draft survive closing. `children` render under the card (the float's button).
 */
export function OperatorAgentPanel({ data, open, onClose, bottomOffset, params, children }) {
    const { t } = useTranslation();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [mounted, setMounted] = useState(open);
    if (open && !mounted) setMounted(true);
    // Which title-bar controls the widget can act on right now; it reports them on
    // the channel once threads / restart permission are known.
    const [controls, setControls] = useState({ history: false, restart: false });
    const showHistory = (appSetting('ai', 'operator_agent') || {}).show_history === true;

    const toggleHistory = useCallback(() => emitter.emit(CHANNEL, { action: 'toggle_history' }), []);
    const startNew = useCallback(() => emitter.emit(CHANNEL, { action: 'start_new' }), []);

    useEffect(() => {
        const subscription = emitter.addListener(CHANNEL, (event) => {
            if (event?.action === 'state') setControls({ history: !!event.history, restart: !!event.restart });
        });
        return () => subscription.remove();
    }, []);

    const initialMessage = hiddenFirstMessageFromData(data, params);
    const agentId = data?.agent_id ?? '';
    const contextProfileId = Number(data?.context_profile_id) || 0;
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
                                onPress={onClose}
                            />
                        </Row>
                    </Row>
                    <View className="flex-1 min-h-0 p-3">
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
                    </View>
                </View>
            ) : null}
            {children}
        </View>
    );
}

/**
 * Floating Agent button + panel for site operators, on every page. With
 * NativeTabs and a More tab the trigger lives in the More menu instead and the
 * tab navigator hosts the panel (tabs/expoui-tabs.js), so pages render nothing.
 */
export function OperatorAgentFloat() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const insets = useSafeAreaInsets();
    const footerHeight = useFooterHeight();
    const params = useLocalSearchParams();
    const [open, setOpen] = useState(false);
    const hostedByTabBar = hasNativeTabsMoreMenu(currentUser);
    const data = useOperatorAgentData(!hostedByTabBar);

    const openChat = useCallback(() => setOpen(true), []);
    const close = useCallback(() => setOpen(false), []);

    // No agent configured, or not allowed to chat with it: nothing to float.
    if (!data) return null;

    // Native: the page's safe-area bottom already covers the iOS tab bar (UIKit
    // adds it to the tab screen) and JS tabs (the page ends above them). The
    // Android NativeTabs bar is drawn over the page, so add its height. Tabs
    // show by the same rule as the bar itself (tabs/index.js `isShowTabs`).
    const showsTabs = !!((currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged'));
    const androidTabBar = Platform.OS === 'android' && isNativeTabsEnabled() && showsTabs
        ? androidTabBarHeight(areTabBarLabelsHidden(getTabList(currentUser) || []))
        : 0;
    const bottomOffset = 16 + (isWeb ? Number(footerHeight) || 0 : (insets?.bottom || 0) + androidTabBar);

    return (
        <OperatorAgentPanel data={data} open={open} onClose={close} bottomOffset={bottomOffset} params={params}>
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
        </OperatorAgentPanel>
    );
}
