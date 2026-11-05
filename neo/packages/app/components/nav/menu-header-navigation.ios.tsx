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
import { appSetting, isExternalUrl, openExternalLink, sanitazeUrl, type MenuItem } from 'app/lib/util';
import {
    AUTH_BUTTONS,
    useMenuNavigationEntries,
    type MenuNavigationEntry,
} from 'app/components/nav/menu-header-navigation-entries';
import type { MenuHeaderNavigationProps } from 'app/components/nav/menu-header-navigation.types';

// A `regular` icon-only header button: 44pt circle, 24pt glyph (theme `neo_button.controlSizes`).
const BUTTON_PT = 44;
const ICON_PT = 24;
// Tailwind `sm`: from here the toolbar shows its own Log In / Sign Up.
const SM_PT = 640;

/**
 * iOS: the header menu (menu-header-navigation.tsx) as a native SwiftUI pull-down menu on
 * the system Liquid Glass material, opened from a glass circle like the other header
 * buttons. Rows show their Lucide icons (`menuIcon`, else `icon`) and groups are listed
 * inline as sections. Items marked as buttons (the site menu's Log In and Sign Up for
 * guests on phones; with `auth`, these two when the menu has none, below `sm`) come first
 * as a control group: a menu draws only rows, and a control group is its one way to put
 * two actions side by side, each a tile with its icon over its title, set off from the
 * sections below. Neither button styles nor tints reach a menu's items, so Sign Up can't
 * look primary there.
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
    const { entries, buttons, pending } = useMenuNavigationEntries();
    // The header band's scheme (`layout.header.band_scheme`), as NeoButton's Host takes it.
    const colorScheme = useNeoButtonColorScheme();
    const pressRow = useMenuRowPress();

    // The `auth` fallback follows the toolbar, which has its own Log In and Sign Up from `sm`.
    const authFallback = !buttons.length && auth && !currentUser && width < SM_PT;
    const shownButtons = authFallback ? AUTH_BUTTONS : buttons;

    // While the site menu loads, keep the button so the header doesn't shift.
    if (!entries.length && !shownButtons.length && !pending) return null;
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
                    {shownButtons.length ? (
                        <ControlGroup>
                            {shownButtons.map(({ key, item }) => {
                                const title = authFallback ? t(item.title) : item.title;
                                return (
                                    <MenuRow
                                        key={key}
                                        title={title}
                                        icon={item.menuIcon || item.icon}
                                        onPress={() => pressRow.press({ ...item, title })}
                                    />
                                );
                            })}
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
 * a modal, a `_blank` / `blank` row or a link to another host opens in the browser, any other
 * row opens its page.
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
        // As Link does: a link to another host opens in the browser whatever its target.
        const url = sanitazeUrl(link);
        if (row.target === '_blank' || row.target === 'blank' || isExternalUrl(url)) {
            if (url) void openExternalLink(url);
            return;
        }
        if (url) redirectRef.current?.redirect(url);
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
