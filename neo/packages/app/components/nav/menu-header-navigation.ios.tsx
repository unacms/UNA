import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ControlGroup, HStack, Host, Image, Label, Menu, Section } from '@expo/ui/swift-ui';
import {
    accessibilityLabel as accessibilityLabelModifier,
    buttonStyle,
    contentShape,
    frame,
    glassEffect,
    menuIndicator,
    menuStyle,
    resizable,
    shapes,
} from '@expo/ui/swift-ui/modifiers';
import Redirect, { type RedirectHandle } from 'app/ui/atoms/redirect';
import { useCurrentUser } from 'app/context/user';
import { useWindowWidth } from 'app/context/measure';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import { lucideAssetName } from 'app/lib/platform/lucide-assets';
import { appSetting, type MenuItem } from 'app/lib/util';
import { useMenuNavigationEntries, type MenuNavigationEntry } from 'app/components/nav/menu-header-navigation-entries';
import type { MenuHeaderNavigationProps } from 'app/components/nav/menu-header-navigation.types';

// A `regular` icon-only header button: 44pt circle, 24pt glyph (theme `neo_button.controlSizes`).
const BUTTON_PT = 44;
const ICON_PT = 24;
// Tailwind `sm`: from here the toolbar shows its own Log In / Sign Up.
const SM_PT = 640;

/**
 * iOS: the header menu (menu-header-navigation.js) as a native SwiftUI pull-down menu on
 * the system Liquid Glass material, opened from a glass circle like the other header
 * buttons. Rows show their Lucide icons (`menuIcon`, else `icon`), groups are listed
 * inline as sections, and with `auth` guests below `sm` get Log In and Sign Up as a
 * control group at the top.
 */
export default function MenuHeaderNavigation({
    image,
    startDecorator = 'Menu',
    accessibilityLabel,
    alt = 'Menu',
    auth = false,
}: MenuHeaderNavigationProps) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const width = useWindowWidth();
    const entries = useMenuNavigationEntries();
    const redirectRef = useRef<RedirectHandle>(null);

    if (!entries.length) return null;

    const go = (link: unknown) => () => {
        if (link) redirectRef.current?.redirect('' + link);
    };
    const showAuth = auth && !currentUser && width < SM_PT;
    const label = t(accessibilityLabel ?? alt);

    return (
        <>
            <Redirect ref={redirectRef} />
            <Host
                matchContents
                // Like NeoButton's Host. The header slides up under the status bar on scroll; with the safe
                // area applied, SwiftUI insets the menu down there and keeps that inset after a tab switch.
                ignoreSafeArea="all"
                style={{ width: BUTTON_PT, height: BUTTON_PT }}
            >
                <Menu
                    label={<TriggerLabel icon={image ?? startDecorator} label={label} />}
                    modifiers={[
                        menuStyle('button'),
                        buttonStyle('plain'),
                        menuIndicator('hidden'),
                        glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'circle' }),
                        frame({ width: BUTTON_PT, height: BUTTON_PT }),
                        accessibilityLabelModifier(label),
                    ]}
                >
                    {/* First, as iOS menus place control groups: the menu scrolls, and this stays in view. */}
                    {showAuth ? (
                        <ControlGroup>
                            <MenuRow title={t('Log In')} icon="LogIn" onPress={go('/login')} />
                            <MenuRow title={t('Sign Up')} icon="UserPlus" onPress={go('/create-account')} />
                        </ControlGroup>
                    ) : null}
                    {menuSections(entries).map((section, index) => (
                        <Section key={index} title={section.title}>
                            {section.items.map((row, i) => (
                                <MenuRow key={row.id ?? row.name ?? i} title={row.title} icon={row.menuIcon || row.icon} onPress={go(row.link)} />
                            ))}
                        </Section>
                    ))}
                </Menu>
            </Host>
        </>
    );
}

/** The trigger glyph, from the same source as NeoButton (Lucide asset or SF Symbol). */
function TriggerLabel({ icon, label }: { icon: string; label: string }) {
    const name = getNativeIcon(icon, appSetting('theme', 'expo_ui', 'button'));
    // The menu's label image stays an accessibility element (hiding it has no effect), so
    // it gets the menu's name instead of reading as its asset name.
    const box = [frame({ width: ICON_PT, height: ICON_PT }), accessibilityLabelModifier(label)];
    return (
        <HStack modifiers={[frame({ width: BUTTON_PT, height: BUTTON_PT }), contentShape(shapes.circle())]}>
            {typeof name !== 'string' ? null : name.startsWith('Lucide/') ? (
                <Image assetName={name} modifiers={[resizable(), ...box]} />
            ) : (
                <Image systemName={name as never} size={ICON_PT - 2} modifiers={box} />
            )}
        </HStack>
    );
}

/** A menu row: title with its Lucide icon (from the app's `Lucide/<kebab>` assets), if any. */
function MenuRow({ title, icon, onPress }: { title: string; icon?: string; onPress: () => void }) {
    const asset = lucideAssetName(icon);
    if (!asset) return <Button label={title} onPress={onPress} />;
    return (
        <Button onPress={onPress}>
            <Label title={title} icon={<Image assetName={asset} />} />
        </Button>
    );
}

type MenuSection = { title?: string; items: MenuItem[] };

/**
 * The menu's sections, all inline: a nested Menu would open as a second menu stacked on
 * this one. A group's rows split into sections at their `group_header` / `separator`
 * rows; consecutive links share one.
 */
function menuSections(entries: MenuNavigationEntry[]): MenuSection[] {
    const sections: MenuSection[] = [];
    let plain: MenuSection | null = null;
    for (const { item, rows } of entries) {
        if (!rows.length) {
            if (!plain) sections.push((plain = { title: undefined, items: [] }));
            plain.items.push(item);
            continue;
        }
        plain = null;
        let current: MenuSection = { title: undefined, items: [] };
        for (const row of rows) {
            if (row.type === 'group_header' || row.type === 'separator') {
                if (current.items.length) sections.push(current);
                current = { title: row.type === 'group_header' ? row.title : undefined, items: [] };
            } else {
                current.items.push(row);
            }
        }
        if (current.items.length) sections.push(current);
    }
    return sections;
}
