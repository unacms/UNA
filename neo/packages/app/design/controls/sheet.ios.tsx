import { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Group, Host, Image as SymbolImage, NavigationStack, RNHostView, Toolbar, ToolbarItem } from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
    navigationBarTitleDisplayMode,
    navigationTitle,
    preferredColorScheme,
    presentationDetents,
    presentationDragIndicator,
    type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import emitter, { EVENTS } from 'app/context/emitter';
import { useThemeName } from 'app/design/theme';
import type { SheetProps } from './sheet.types';

// What a height detent spends outside the hosted content, in points: the inline navigation bar
// and the home indicator's inset. Measured on an iPhone with a home indicator (411 pt detent,
// 341 pt content); a phone without one only gets a little more room. (useSafeAreaInsets reads
// the screen under the sheet, tab bar included, so it can't give the sheet's own inset.)
const SHEET_CHROME_PT = 70;
// Content taller than this part of the screen opens a full-height sheet and scrolls.
const MAX_FIT_FRACTION = 0.9;

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
    const { height: windowHeight } = useWindowDimensions();
    // fitToContents can't size a NavigationStack (it takes all the room it is offered), so the
    // sheet gets a height detent: its chrome plus the content, measured as it lays out. Content
    // too tall for that (many profiles, landscape) gets the full-height sheet and scrolls.
    const [contentHeight, setContentHeight] = useState(0);
    const fittedHeight = Math.ceil(contentHeight) + SHEET_CHROME_PT;
    let detents: PresentationDetent[] = ['medium', 'large'];
    if (fitContent && contentHeight > 0) {
        detents = fittedHeight <= windowHeight * MAX_FIT_FRACTION ? [{ height: fittedHeight }] : ['large'];
    }

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
                            {/* Fills the sheet under the bar; the content stays at the top and scrolls when it is taller. */}
                            <RNHostView>
                                <ScrollView
                                    keyboardShouldPersistTaps="always"
                                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
                                    onContentSizeChange={(_width, height) => setContentHeight(height)}
                                >
                                    {children}
                                </ScrollView>
                            </RNHostView>
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
