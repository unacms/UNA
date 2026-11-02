import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Group, Host, Image as SymbolImage, NavigationStack, RNHostView, Spacer, Toolbar, ToolbarItem, VStack } from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
    navigationBarTitleDisplayMode,
    navigationTitle,
    preferredColorScheme,
    presentationDetents,
    presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import emitter, { EVENTS } from 'app/context/emitter';
import { useThemeName } from 'app/design/theme';
import type { SheetProps } from './sheet.types';

// The sheet's inline navigation bar, above the hosted content, in points.
const NAV_BAR_PT = 56;

/**
 * iOS: a native SwiftUI sheet with a navigation bar. The title is the bar's inline title, the
 * close button is the system one (`role="close"`), and `onBack` adds a back chevron before the
 * title. The content stays React Native, hosted in the sheet. Same props as the JS Modal
 * fallback (sheet.tsx).
 */
export function Sheet({ visible, title, onClose, onBack, fitContent = true, children }: Readonly<SheetProps>) {
    const { t } = useTranslation();
    // The app's theme, not the system's (see bottomsheet-native.ios.tsx).
    const scheme = useThemeName() === 'dark' ? 'dark' : 'light';
    // fitToContents can't size a NavigationStack (it takes all the room it is offered), so the
    // sheet gets a height detent: the bar plus the hosted content, measured once it lays out.
    const [contentHeight, setContentHeight] = useState(0);
    const detents = fitContent && contentHeight > 0
        ? [{ height: Math.ceil(contentHeight) + NAV_BAR_PT }]
        : ['medium' as const, 'large' as const];

    // A link pressed in the sheet navigates under it; close the sheet, as the JS Modal does.
    useEffect(() => {
        if (!visible) return undefined;
        const subscription = emitter.addListener(EVENTS.link, (data: { action?: string }) => {
            if (data?.action === 'pressed') onClose();
        });
        return () => subscription.remove();
    }, [visible, onClose]);

    return (
        // The sheet presents over the window; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            <BottomSheet
                isPresented={visible}
                onIsPresentedChange={(presented) => { if (!presented && visible) onClose(); }}
            >
                <Group
                    modifiers={[
                        presentationDetents(detents),
                        presentationDragIndicator('visible'),
                        preferredColorScheme(scheme),
                    ]}
                >
                    <NavigationStack>
                        <Toolbar modifiers={[navigationTitle(title ?? ''), navigationBarTitleDisplayMode('inline')]}>
                            {fitContent ? (
                                // The content stays at the top while the sheet settles on its height.
                                <VStack spacing={0}>
                                    <RNHostView matchContents={{ vertical: true }} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
                                        <View collapsable={false} style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>{children}</View>
                                    </RNHostView>
                                    <Spacer />
                                </VStack>
                            ) : (
                                <RNHostView>
                                    <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                                        {children}
                                    </ScrollView>
                                </RNHostView>
                            )}
                            <Toolbar.Content>
                                {onBack ? (
                                    <ToolbarItem placement="topBarLeading">
                                        <Button onPress={onBack} modifiers={[accessibilityLabel(t('Back'))]}>
                                            <SymbolImage systemName="chevron.backward" />
                                        </Button>
                                    </ToolbarItem>
                                ) : null}
                                <ToolbarItem placement="topBarTrailing">
                                    <Button role="close" onPress={onClose} modifiers={[accessibilityLabel(t('Close'))]} />
                                </ToolbarItem>
                            </Toolbar.Content>
                        </Toolbar>
                    </NavigationStack>
                </Group>
            </BottomSheet>
        </Host>
    );
}
