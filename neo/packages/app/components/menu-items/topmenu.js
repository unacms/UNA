import { useContext } from 'react'
import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu';

export default function MenuTopItem({ link, title, index, icon, isTitle, isActive, stacked, items, chevron, animated, addClassName, columns }) {
    return items?.length > 0 ?
        <DropdownMenu
            mode="popup"
            triggerAccessibilityLabel={title}
            triggerClassName="group"
            items={items}
            columns={columns}
            defaultOpen={false}
        >
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} stacked={stacked} isPopup={true} chevron={chevron} animated={animated} addClassName={addClassName} />
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-16 w-full flex-auto relative group web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} stacked={stacked} isPopup={false} chevron={chevron} animated={animated} addClassName={addClassName} />
        </Link>

}

// Class strings written out in full (Tailwind sees only static classes), picked by the helpers below.
const ROW_BASE = 'items-center content-center justify-center h-12 min-w-16 flex-auto rounded-xl'
const ROW_LAYOUT = {
    // the bar is too narrow for labels beside icons (MenuTop measures it): the label under the icon
    stacked: 'flex-col gap-0.5 px-2',
    // icon and label side by side: 12 px before the icon, 8 px after the label's own padding
    labelled: 'flex-wrap ps-3 pe-2',
    plain: 'flex-wrap px-2',
}
const ROW_STATE = {
    open: 'bg-accent text-accent-foreground',
    active: 'text-accent-foreground',
    idle: 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/50 web:group-focus:bg-muted/50 web:active:bg-muted',
}
const ICON_CLASS = {
    on: 'text-accent-foreground h-9 w-9 items-center justify-center flex',
    off: 'text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex',
}
const LABEL_BASE = 'whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium'
const LABEL_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground' }
const LABEL_SIZE = { stacked: 'text-xs leading-4 px-1 max-w-full', inline: 'text-sm px-2 leading-5' }
const CHEVRON_TONE = { on: 'text-accent-foreground', off: 'text-secondary-foreground web:group-hover:text-foreground' }

function rowLayout(stacked, labelled) {
    if (stacked) return ROW_LAYOUT.stacked
    return labelled ? ROW_LAYOUT.labelled : ROW_LAYOUT.plain
}

function rowState(isOpen, isActive) {
    if (isOpen) return ROW_STATE.open
    return isActive ? ROW_STATE.active : ROW_STATE.idle
}

// Sized explicitly: without width and height the SVG is 24 px tall and sits 4 px below the label.
// A class turns it, because NEO's web View drops React Native transform arrays.
function MenuTopChevron({ icon, isOpen, on }) {
    return (
        <View className={`h-4 w-4 items-center justify-center flex shrink-0 web:transition-transform web:duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <Icon icon={icon} width={16} height={16} className={`h-4 w-4 ${on ? CHEVRON_TONE.on : CHEVRON_TONE.off}`} />
        </View>
    )
}

function MenuTopItem_({ title, icon, isTitle, isActive, stacked: stackedBar, isPopup, chevron, animated, addClassName }) {
    const isMenuOpen = useContext(DropdownMenuOpenContext) ?? false;
    const isOpen = isPopup && isMenuOpen;
    const isActiveOrOpen = isActive || isOpen;
    // The icon's hover motion is CSS, keyed on the link's (or trigger's) `group` class.
    const useAnimatedIcon = animated === true;
    const baseIconClass = isActiveOrOpen ? ICON_CLASS.on : ICON_CLASS.off;
    const menuIconClassName = addClassName ? `${baseIconClass} ${addClassName}` : baseIconClass;

    // The hover label exists to name icon-only items. When the title is already
    // rendered next to the icon it just repeats it, so skip the tooltip.
    const showTooltip = !isTitle && !!title;
    const labelled = !!icon && !!isTitle;
    const stacked = !!stackedBar && labelled;
    const rowClassName = `${ROW_BASE} ${rowLayout(stacked, labelled)} ${rowState(isOpen, isActive)}`;
    const labelClassName = `${LABEL_BASE} ${isActiveOrOpen ? LABEL_TONE.on : LABEL_TONE.off} ${stacked ? LABEL_SIZE.stacked : LABEL_SIZE.inline}`;
    const label = isTitle ? <Text key="menu-title" className={labelClassName}>{title}</Text> : null;
    const arrow = chevron ? <MenuTopChevron key="menu-chevron" icon={chevron} isOpen={isOpen} on={isActiveOrOpen} /> : null;
    // Stacked, a tab is the icon over one line: a dropdown's arrow goes beside its label there,
    // not under it (a third row would not fit the 48 px tab).
    const labelAndArrow = stacked && label && arrow
        ? [<Row key="menu-title-row" className="items-center max-w-full min-w-0">{label}{arrow}</Row>]
        : [label, arrow];

    return (
        <Tooltip content={title} enabled={showTooltip}>
            {/* The active link's highlight is MenuTop's sliding indicator, which never moves to a
                dropdown, so an open dropdown draws its own fill behind the accent-foreground label. */}
            <Row className={rowClassName}>
                {[
                    icon ? (
                        <Icon
                            key="menu-icon"
                            icon={icon}
                            animated={useAnimatedIcon}
                            active={useAnimatedIcon ? isActiveOrOpen : undefined}
                            size={useAnimatedIcon ? 24 : undefined}
                            className={menuIconClassName}
                        />
                    ) : null,
                    ...labelAndArrow,
                ]}
            </Row>
        </Tooltip>
    )
}
