'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button, NeoButton } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { useCurrentUser } from 'app/context/user';
import emitter, { EVENTS } from 'app/context/emitter';
import { appSetting, cn, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util';
import { useIsDesktop, useWindowHeight } from 'app/context/measure';
import { useLocalSearchParams } from 'app/lib/hooks/router';
import { hasNativeTabsMoreMenu } from 'app/components/nav/tabs/tab-menu';
import { lazyComponent } from 'app/lib/lazy-component';
import { fetchOperatorAgentBlock } from 'app/ui/molecules/ai-agent/operator-block';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

const AiAgent = lazyComponent(() => import('app/ui/molecules/ai-agent/agent'), { name: 'AiAgent' });

// Emitter channel between the title bar here and the `AiAgent` inside; see its `channel` prop.
const CHANNEL = EVENTS.operatorAgent;
// Full-page version of the operator agent (layout `chat`, see settings/layout.js `layouts`).
const OPERATOR_ASSISTANT_URL = '/copilot';

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
 * Title bar (history / new chat / page link / optional close) + the chat itself.
 * Shared by the header dropdown and the native tab bar's floating card.
 */
function OperatorAgentBody({ data, params, onClose }) {
    const { t } = useTranslation();
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

    return (
        <>
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
                    <Link href={OPERATOR_ASSISTANT_URL}>
                        <Button variant="link" size="sm" title={t('Open page')} />
                    </Link>
                    {onClose ? (
                        <NeoButton
                            style="borderless"
                            borderShape="circle"
                            controlSize="small"
                            image="X"
                            accessibilityLabel={t('operator_agent_close')}
                            onPress={onClose}
                        />
                    ) : null}
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
                    // The card is ~384px wide whatever the viewport is, so
                    // the "Chats" list can only ever overlay the transcript.
                    historyLayout="overlay"
                    fadeSurface="card"
                    channel={CHANNEL}
                />
            </View>
        </>
    );
}

/**
 * Agent chat card anchored bottom-right, `bottomOffset` above the window /
 * screen bottom (native tab bar's More menu hosts the trigger, tabs/expoui-tabs.js).
 * Mounts on first open and then only hides, so the thread and draft survive
 * closing. `children` render under the card.
 */
export function OperatorAgentPanel({ data, open, onClose, bottomOffset, params, children }) {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [mounted, setMounted] = useState(open);
    if (open && !mounted) setMounted(true);

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
                    <OperatorAgentBody data={data} params={params} onClose={onClose} />
                </View>
            ) : null}
            {children}
        </View>
    );
}

/**
 * Header toolbar button that opens the operator agent in a dropdown, like
 * notifications. Renders nothing unless the agent is available to this viewer,
 * and not when the native tab bar's More menu hosts the trigger instead.
 */
export function OperatorAgentHeaderButton({ buttonProps }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const isDesktop = useIsDesktop();
    const windowHeight = useWindowHeight();
    const params = useLocalSearchParams();
    const [open, setOpen] = useState(false);
    const hostedByTabBar = hasNativeTabsMoreMenu(currentUser);
    const data = useOperatorAgentData(!hostedByTabBar);

    if (!data) return null;

    const label = t('operator_agent_open');

    return (
        <DropdownPopup
            open={open}
            onOpenChange={setOpen}
            minPopupWidth={384}
            maxPopupWidth={384}
            buttonProps={{
                ...getHeaderToolbarNeoButtonDefaults(isDesktop),
                tooltip: label,
                borderShape: 'circle',
                image: 'Sparkles',
                accessibilityLabel: label,
                ...(buttonProps || {}),
            }}
        >
            {open ? (
                <View key="ddp-content" style={{ height: Math.min(560, Math.max(320, windowHeight - 196)) }}>
                    <OperatorAgentBody data={data} params={params} />
                </View>
            ) : null}
        </DropdownPopup>
    );
}
