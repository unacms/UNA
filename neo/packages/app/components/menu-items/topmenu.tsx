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
            triggerClassName="group rounded-full"
            items={items}
            columns={columns}
            defaultOpen={false}
        >
            <MenuTopItemLook {...look} isPopup={true} />
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-11 w-full flex-auto relative group rounded-full web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItemLook {...look} isPopup={false} />
        </Link>

}

// Class strings written out in full (Tailwind sees only static classes), picked by the helpers below.
// A tab is a capsule at the header's control height (44 px), as the tabs of UNA's main menu.
// The link (or a dropdown's trigger) around it is a capsule too, for its focus ring. The bar's
// sliding hover highlight is a capsule in CSS, which also finds this row by its `h-11`
// (`.neo-menu-highlight-bar` in design/styles/global.web.css): change them together.
const ROW_BASE = 'items-center content-center justify-center h-11 min-w-11 flex-auto rounded-full'
const ROW_LAYOUT = {
    // icon and label side by side: 12 px before the icon, 8 px after the label's own padding
    labelled: 'flex-wrap ps-3 pe-2',
    // the icon alone (an icon-only item, or a bar too narrow for labels): a 44 px circle
    plain: 'flex-wrap px-2',
}
const ROW_STATE = {
    open: 'bg-accent text-accent-foreground',
    active: 'text-accent-foreground',
    // The focus fill is for keyboard focus only: a dropdown hands focus back to its tab when it
    // closes, and after a click that would leave More looking hovered.
    idle: 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/50 web:group-focus-visible:bg-muted/50 web:active:bg-muted',
}
const ICON_CLASS = {
    on: 'text-accent-foreground h-9 w-9 items-center justify-center flex',
    off: 'text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex',
}
const LABEL_BASE = 'whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium'
const LABEL_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground' }
const LABEL_SIZE = 'text-sm px-2 leading-5'
const CHEVRON_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground web:group-hover:text-foreground' }

function rowLayout(labelled: boolean): string {
    return labelled ? ROW_LAYOUT.labelled : ROW_LAYOUT.plain
}

function rowState(isOpen: boolean, isActive: boolean): string {
    if (isOpen) return ROW_STATE.open
    return isActive ? ROW_STATE.active : ROW_STATE.idle
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
            {/* The active link's highlight is MenuTop's sliding indicator, which never moves to a
                dropdown, so an open dropdown draws its own fill behind the accent-foreground label. */}
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
