import { useRef, type ReactNode } from 'react';
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
import { useOpenModalByUrl, useOpenModalWithContent } from 'app/context/jotai/modal';
import { useNeoButtonColorScheme } from 'app/design/controls/neo-button/color-scheme-context';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import { lucideAssetName } from 'app/lib/platform/lucide-assets';
import { appSetting, openExternalLink, sanitazeUrl, type MenuItem } from 'app/lib/util';
import { useMenuNavigationEntries, type MenuNavigationEntry } from 'app/components/nav/menu-header-navigation-entries';
import type { MenuHeaderNavigationProps } from 'app/components/nav/menu-header-navigation.types';

// A `regular` icon-only header button: 44pt circle, 24pt glyph (theme `neo_button.controlSizes`).
const BUTTON_PT = 44;
const ICON_PT = 24;
// Tailwind `sm`: from here the toolbar shows its own Log In / Sign Up.
const SM_PT = 640;

const LOG_IN: MenuItem = { name: 'login', title: 'Log In', icon: 'LogIn', link: '/login' };
const SIGN_UP: MenuItem = { name: 'create-account', title: 'Sign Up', icon: 'UserPlus', link: '/create-account' };

/**
 * iOS: the header menu (menu-header-navigation.tsx) as a native SwiftUI pull-down menu on
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
}: Readonly<MenuHeaderNavigationProps>) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const width = useWindowWidth();
    const entries = useMenuNavigationEntries();
    // The header band's scheme (`layout.header.band_scheme`), as NeoButton's Host takes it.
    const colorScheme = useNeoButtonColorScheme();
    const pressRow = useMenuRowPress();

    if (!entries.length) return null;

    const showAuth = auth && !currentUser && width < SM_PT;
    const label = t(accessibilityLabel ?? alt);

    return (
        <>
            {pressRow.redirect}
            <Host
                matchContents
                colorScheme={colorScheme ?? undefined}
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
                            <MenuRow title={t('Log In')} icon={LOG_IN.icon} onPress={() => pressRow.press(LOG_IN)} />
                            <MenuRow title={t('Sign Up')} icon={SIGN_UP.icon} onPress={() => pressRow.press(SIGN_UP)} />
                        </ControlGroup>
                    ) : null}
                    {menuSections(entries).map((section) => (
                        <Section key={section.key} title={section.title}>
                            {section.items.map((row, i) => (
                                <MenuRow
                                    key={rowKey(row, i)}
                                    title={row.title}
                                    icon={row.menuIcon || row.icon}
                                    onPress={() => pressRow.press(row)}
                                />
                            ))}
                        </Section>
                    ))}
                </Menu>
            </Host>
        </>
    );
}

/**
 * Runs a chosen row the way DropdownMenu does: a `modal` row opens its content (or link) in
 * a modal, a `_blank` / `blank` row opens externally, any other row opens its page.
 */
function useMenuRowPress(): { redirect: ReactNode; press: (row: MenuItem) => void } {
    const redirectRef = useRef<RedirectHandle>(null);
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    const press = (row: MenuItem) => {
        const link = typeof row.link === 'string' ? row.link : '';
        if (row.target === 'modal') {
            if (row.content) openModalWithContent({ title: row.title, content: row.content });
            else if (link) openModalByUrl(link);
            return;
        }
        if (row.target === '_blank' || row.target === 'blank') {
            const url = sanitazeUrl(link);
            if (url) openExternalLink(url);
            return;
        }
        if (link) redirectRef.current?.redirect(link);
    };
    return { redirect: <Redirect ref={redirectRef} />, press };
}

/** The trigger glyph, from the same source as NeoButton (Lucide asset or SF Symbol). */
function TriggerLabel({ icon, label }: Readonly<{ icon: string; label: string }>) {
    const name = getNativeIcon(icon, appSetting('theme', 'expo_ui', 'button'));
    // The menu's label image stays an accessibility element (hiding it has no effect), so
    // it gets the menu's name instead of reading as its asset name.
    const box = [frame({ width: ICON_PT, height: ICON_PT }), accessibilityLabelModifier(label)];
    let glyph: ReactNode = null;
    if (typeof name === 'string') {
        glyph = name.startsWith('Lucide/')
            ? <Image assetName={name} modifiers={[resizable(), ...box]} />
            : <Image systemName={name as never} size={ICON_PT - 2} modifiers={box} />;
    }
    return (
        <HStack modifiers={[frame({ width: BUTTON_PT, height: BUTTON_PT }), contentShape(shapes.circle())]}>
            {glyph}
        </HStack>
    );
}

/** A menu row: title with its Lucide icon (from the app's `Lucide/<kebab>` assets), if any. */
function MenuRow({ title, icon, onPress }: Readonly<{ title: string; icon?: string; onPress: () => void }>) {
    const asset = lucideAssetName(icon);
    if (!asset) return <Button label={title} onPress={onPress} />;
    return (
        <Button onPress={onPress}>
            <Label title={title} icon={<Image assetName={asset} />} />
        </Button>
    );
}

type MenuSection = { key: string; title?: string; items: MenuItem[] };

function rowKey(row: MenuItem, index: number): string {
    return String(row.id ?? row.name ?? row.link ?? index);
}

/**
 * The menu's sections, all inline: a nested Menu would open as a second menu stacked on
 * this one. Consecutive links share one untitled section; each group gets its own (below).
 */
function menuSections(entries: MenuNavigationEntry[]): MenuSection[] {
    const sections: MenuSection[] = [];
    let links: MenuSection | null = null;
    for (const { key, item, rows } of entries) {
        if (rows.length) {
            links = null;
            sections.push(...groupSections(key, item, rows));
            continue;
        }
        if (!links) {
            links = { key: `links-${key}`, items: [] };
            sections.push(links);
        }
        links.items.push(item);
    }
    return sections;
}

/**
 * A group's rows as sections: the first under the group's title, then a new one at each of
 * its `group_header` (titled) or `separator` (untitled) rows. Empty sections are dropped.
 */
function groupSections(key: string, item: MenuItem, rows: MenuItem[]): MenuSection[] {
    const sections: MenuSection[] = [];
    let current: MenuSection = { key, title: item.title, items: [] };
    for (const row of rows) {
        if (row.type !== 'group_header' && row.type !== 'separator') {
            current.items.push(row);
            continue;
        }
        if (current.items.length) sections.push(current);
        const title = row.type === 'group_header' ? row.title : undefined;
        current = { key: `${key}-${rowKey(row, sections.length)}`, title, items: [] };
    }
    if (current.items.length) sections.push(current);
    return sections;
}
