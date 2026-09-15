'use client';

import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { appSetting, cn } from 'app/lib/util';
import { useLocalSearchParams, useSafeAreaInsets } from 'app/lib/hooks/router';
import { useFooterHeight } from 'app/context/jotai/layout';
import { lazyComponent } from 'app/lib/lazy-component';
import { fetchAgentBlock } from 'app/ui/molecules/ai-agent/helper';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

const AiAgent = lazyComponent(() => import('app/ui/molecules/ai-agent/agent'), { name: 'AiAgent' });

const isWeb = Platform.OS === 'web';
const NATIVE_TAB_BAR = Platform.OS === 'ios' ? 52 : 56;

/**
 * Floating Agent for site operators. Shown on every page when
 * `user.operator` is true and `ai.operator_agent_id` is set.
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

    const params = useLocalSearchParams();
    const agentId = String(appSetting('ai', 'operator_agent_id') || '').trim();
    const isOperator = !!currentUser?.operator && !!agentId;

    const toggle = useCallback(() => {
        setOpen((prev) => !prev);
        setMounted(true);
    }, []);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!isOperator) return undefined;
        let cancelled = false;
        fetchAgentBlock(agentId)
            .then((next) => {
                if (!cancelled) setData(next);
            })
            .catch(() => {
                if (!cancelled) setData({ agent_id: agentId });
            });
        return () => {
            cancelled = true;
        };
    }, [isOperator, agentId]);

    const initialMessage = hiddenFirstMessageFromData(data, params);
    const contextProfileId = Number(data?.context_profile_id) || 0;
    if (!isOperator) return null;

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
                        'mb-3 overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-card-outline dark:shadow-card-outline-deep',
                        open ? '' : 'hidden'
                    )}
                    style={{ width: panelWidth, height: panelHeight }}
                    accessibilityViewIsModal={open}
                >
                    <Row className="items-center justify-between px-3 py-2 border-b border-border/60">
                        <Text className="text-sm font-semibold text-card-foreground">
                            {t('operator_agent_title')}
                        </Text>
                        <NeoButton
                            style="borderless"
                            borderShape="circle"
                            controlSize="mini"
                            image="X"
                            accessibilityLabel={t('operator_agent_close')}
                            onPress={close}
                        />
                    </Row>
                    <View className="flex-1 min-h-0 px-3 pb-3">
                        {data ? (
                            <AiAgent
                                key={`${agentId}:${contextProfileId}`}
                                data={data}
                                initialMessage={initialMessage}
                                hideInitialMessage={!!initialMessage}
                                height="h-full"
                            />
                        ) : null}
                    </View>
                </View>
            ) : null}
            <NeoButton
                style="glassProminent"
                borderShape="circle"
                controlSize="large"
                image={open ? 'X' : 'Sparkles'}
                accessibilityLabel={open ? t('operator_agent_close') : t('operator_agent_open')}
                onPress={toggle}
            />
        </View>
    );
}
