import { useContext } from 'react'
import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip'
import DropdownMenu, { DropdownMenuOpenContext, type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';

/** A tab of the header's site menu (MenuTop). */
export type MenuTopItemProps = {
    link?: string;
    title?: string;
    index?: number;
    /** Lucide name (or another icon key `Icon` takes). */
    icon?: string;
    /** Show the title as a label; otherwise it is the tab's tooltip. */
    isTitle?: boolean;
    isActive?: boolean;
    /** A dropdown's items: the tab opens them instead of following `link`. */
    items?: DropdownMenuItemData[];
    /** Icon name of a dropdown's arrow; empty for none. */
    chevron?: string;
    animated?: boolean;
    addClassName?: string;
    columns?: number;
};

type ItemLookProps = Pick<MenuTopItemProps, 'title' | 'icon' | 'isTitle' | 'isActive' | 'chevron' | 'animated' | 'addClassName'> & {
    isPopup: boolean;
};

export default function MenuTopItem({ link, title, icon, isTitle, isActive, items, chevron, animated, addClassName, columns }: Readonly<MenuTopItemProps>) {
    const look = { title, icon, isTitle, isActive, chevron, animated, addClassName }
    return items && items.length > 0 ?
        <DropdownMenu
            mode="popup"
            triggerAccessibilityLabel={title}
            triggerClassName="group rounded-xl web:active:scale-95 web:duration-100"
            items={items}
            columns={columns}
            // One list, as UNA's More: groups (the launcher's apps) follow one another instead of standing side by
            // side, unless the menu asks for columns.
            stacked={!columns || columns <= 1}
            align="auto"
            defaultOpen={false}
            plainIcons
        >
            <MenuTopItemLook {...look} isPopup={true} />
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-11 w-full flex-auto relative group rounded-xl web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItemLook {...look} isPopup={false} />
        </Link>

}

// Class strings written out in full (Tailwind sees only static classes), picked by the helpers below.
// A tab is the header's control height (44 px) with a regular button's 12 px corners (`rounded-xl`), as the tabs of
// UNA's main menu. The link (or a dropdown's trigger) around it has the same corners, for its focus ring. The bar's
// sliding hover highlight has them in CSS, which also finds this row by its `h-11`
// (`.neo-menu-highlight-bar` in design/styles/global.web.css): change them together.
// One structure with UNA's main menu (Artificer tailwind.css, `#bx-toolbar .bx-menu-main`): the icon, the label and a
// dropdown's chevron 8 px apart, 12 px before the icon and 16 px after the label (the 24 px icon has ~3 px of air, so
// its side gets 4 px less to look even), the width its content's. MenuTop's hidden probe repeats these: change together.
const ROW_BASE = 'items-center justify-center gap-2 h-11 min-w-11 rounded-xl'
const ROW_LAYOUT = {
    labelled: 'ps-3 pe-4',
    // the icon alone (an icon-only item, or a bar too narrow for labels): a 44 px square
    plain: 'px-2.5',
}
const ROW_STATE = {
    open: 'bg-accent-200/60 dark:bg-accent-900/60 text-accent-foreground',
    active: 'text-accent-foreground',
    // The focus fill is for keyboard focus only: a dropdown hands focus back to its tab when it
    // closes, and after a click that would leave More looking hovered.
    idle: 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/50 web:group-focus-visible:bg-muted/50 web:active:bg-muted',
}
const ICON_CLASS = {
    on: 'text-accent-foreground size-6 shrink-0',
    off: 'text-secondary-foreground web:group-hover:text-foreground size-6 shrink-0',
}
// The label is UNA's main menu label: 14 px medium at the default spacing, the size of the labels in the More list. MenuTop's hidden probe
// (components/nav/menu-top.js) repeats these classes to measure the bar: change them together.
const LABEL_BASE = 'whitespace-nowrap text-ellipsis overflow-hidden font-medium'
const LABEL_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground web:group-hover:text-foreground' }
const LABEL_SIZE = 'text-sm leading-5'
const CHEVRON_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground web:group-hover:text-foreground' }

function rowLayout(labelled: boolean): string {
    return labelled ? ROW_LAYOUT.labelled : ROW_LAYOUT.plain
}

// The current tab's fill is MenuTop's sliding indicator, behind the tab: an open More that is also the current tab
// (its page is under More) takes only the accent label, or the two fills would stack.
function rowState(isOpen: boolean, isActive: boolean): string {
    if (isActive) return ROW_STATE.active
    return isOpen ? ROW_STATE.open : ROW_STATE.idle
}

function iconClassName(on: boolean, addClassName?: string): string {
    const base = on ? ICON_CLASS.on : ICON_CLASS.off
    return addClassName ? `${base} ${addClassName}` : base
}

function labelClassName(on: boolean): string {
    return `${LABEL_BASE} ${on ? LABEL_TONE.on : LABEL_TONE.off} ${LABEL_SIZE}`
}

// Sized explicitly: without width and height the SVG is 24 px tall and sits 4 px below the label.
// A class turns it, because NEO's web View drops React Native transform arrays.
function MenuTopChevron({ icon, isOpen, on }: Readonly<{ icon: string; isOpen: boolean; on: boolean }>) {
    return (
        <View className={`h-4 w-4 items-center justify-center flex shrink-0 web:transition-transform web:duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <Icon icon={icon} width={16} height={16} className={`h-4 w-4 ${on ? CHEVRON_TONE.on : CHEVRON_TONE.off}`} />
        </View>
    )
}

// An animated icon plays its active state and is drawn at 24 px; a plain one keeps its own size.
function MenuTopIcon({ icon, animated, on, className }: Readonly<{ icon?: string; animated: boolean; on: boolean; className: string }>) {
    if (!icon) return null
    if (!animated) return <Icon icon={icon} animated={false} className={className} />
    return <Icon icon={icon} animated active={on} size={24} className={className} />
}

function MenuTopItemLook({ title, icon, isTitle, isActive = false, isPopup, chevron, animated, addClassName }: Readonly<ItemLookProps>) {
    const isMenuOpen = useContext(DropdownMenuOpenContext) ?? false;
    const isOpen = isPopup && isMenuOpen;
    const isActiveOrOpen = isActive || isOpen;

    // The hover label exists to name icon-only items (an item Studio marks "Icon only", or every
    // item while the bar is too narrow for labels). When the title is already rendered next to
    // the icon it just repeats it, so skip the tooltip.
    const showTooltip = !isTitle && !!title;
    const labelled = !!icon && !!isTitle;
    const label = isTitle ? <Text key="menu-title" className={labelClassName(isActiveOrOpen)}>{title}</Text> : null;
    const arrow = chevron ? <MenuTopChevron key="menu-chevron" icon={chevron} isOpen={isOpen} on={isActiveOrOpen} /> : null;

    return (
        <Tooltip content={title} enabled={showTooltip}>
            {/* The current tab's fill is MenuTop's sliding indicator (accent-200 at 60%), which stays on the
                current tab, so an open dropdown draws the same fill of its own behind the accent-foreground label. */}
            <Row className={`${ROW_BASE} ${rowLayout(labelled)} ${rowState(isOpen, isActive)}`}>
                {[
                    // The icon's hover motion is CSS, keyed on the link's (or trigger's) `group` class.
                    <MenuTopIcon key="menu-icon" icon={icon} animated={animated === true} on={isActiveOrOpen} className={iconClassName(isActiveOrOpen, addClassName)} />,
                    label,
                    arrow,
                ]}
            </Row>
        </Tooltip>
    )
}
