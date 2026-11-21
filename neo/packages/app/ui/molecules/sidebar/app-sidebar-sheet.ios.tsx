import { BottomSheet, Group, Host, RNHostView, VStack } from '@expo/ui/swift-ui';
import { preferredColorScheme, presentationDetents, presentationDragIndicator } from '@expo/ui/swift-ui/modifiers';
import { useThemeName } from 'app/design/theme';
import { SidebarListView } from './app-sidebar-list.ios';
import type { AppSidebarSheetProps } from './app-sidebar-sheet.types';

/**
 * iPhone: the menu as a native sheet on the system Liquid Glass material, where iOS has no drawer. It opens at half
 * height and pulls up to full; the menus are the same SwiftUI List as in the drawer, so the list and the sheet
 * share one scroll. The head stays React Native, hosted in the sheet: the profile switcher it opens is a sheet of
 * its own, which the system stacks over this one.
 */
export default function AppSidebarSheet({ open, onClose, head, ...list }: Readonly<AppSidebarSheetProps>) {
    // The app's theme, not the system's (see design/controls/sheet.ios.tsx).
    const scheme = useThemeName() === 'dark' ? 'dark' : 'light';

    return (
        // The sheet presents over the window; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            <BottomSheet isPresented={open} onIsPresentedChange={(presented) => { if (!presented && open) onClose(); }}>
                <Group modifiers={[presentationDetents(['medium', 'large']), presentationDragIndicator('visible'), preferredColorScheme(scheme)]}>
                    <VStack spacing={0}>
                        {/* As tall as the head, as wide as the sheet. */}
                        <RNHostView matchContents={{ vertical: true }}>{head}</RNHostView>
                        <SidebarListView {...list} />
                    </VStack>
                </Group>
            </BottomSheet>
        </Host>
    );
}
