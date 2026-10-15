import { useContext, useState } from 'react'
import { Platform } from 'react-native'
import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu';

export default function MenuTopItem({ link, title, index, icon, isTitle, isActive, items, chevron, animated, addClassName }) {
    return items?.length > 0 ?
        <DropdownMenu
            mode="popup"
            triggerAccessibilityLabel={title}
            triggerClassName="group"
            items={items}
            defaultOpen={false}
        >
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={true} chevron={chevron} animated={animated} addClassName={addClassName} />
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-16 w-full flex-auto relative group web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={false} chevron={chevron} animated={animated} addClassName={addClassName} />
        </Link>

}


function MenuTopItem_({ title, icon, isTitle, isActive, isPopup, chevron, animated, addClassName }) {
    const isMenuOpen = useContext(DropdownMenuOpenContext) ?? false;
    const isOpen = isPopup && isMenuOpen;
    const isActiveOrOpen = isActive || isOpen;
    const useAnimatedIcon = animated === true;
    const [groupHovered, setGroupHovered] = useState(false);
    const rowHoverProps =
        useAnimatedIcon && Platform.OS === 'web'
            ? {
                onMouseEnter: () => setGroupHovered(true),
                onMouseLeave: () => setGroupHovered(false),
            }
            : {};
    const baseIconClass = isActiveOrOpen
        ? 'text-accent-foreground h-9 w-9 my-auto items-center justify-center flex'
        : 'text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex';
    const menuIconClassName = addClassName ? `${baseIconClass} ${addClassName}` : baseIconClass;

    // The hover label exists to name icon-only items. When the title is already
    // rendered next to the icon it just repeats it, so skip the tooltip.
    const showTooltip = !isTitle && !!title;

    return (

        <Tooltip content={title} enabled={showTooltip}>
            {/* The active link's highlight is MenuTop's sliding indicator, which never moves to a
                dropdown, so an open dropdown draws its own fill behind the accent-foreground label. */}
            <Row
                className={`items-center content-center justify-center px-2 h-12 min-w-16 flex-auto flex-wrap rounded-xl  ${isOpen
                    ? ' bg-accent text-accent-foreground'
                    : isActive
                    ? '  text-accent-foreground'
                    : ' text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/50 web:group-focus:bg-muted/50 web:active:bg-muted '
                    }`}
                {...rowHoverProps}
            >
                {[
                    icon ? (
                        <Icon
                            key="menu-icon"
                            icon={icon}
                            animated={useAnimatedIcon}
                            active={useAnimatedIcon ? isActiveOrOpen : undefined}
                            size={useAnimatedIcon ? 24 : undefined}
                            className={menuIconClassName}
                            hovered={useAnimatedIcon && Platform.OS === 'web' ? groupHovered : undefined}
                        />
                    ) : null,
                    isTitle ? (
                        <Text key="menu-title" className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActiveOrOpen ? 'text-accent-foreground' : 'text-secondary-foreground'} text-sm lg:text-base px-2 leading-5`}>{title}</Text>
                    ) : null,
                    chevron ? (
                        // Sized explicitly: without width and height the SVG is 24 px tall and sits
                        // 4 px below the label. A class turns it, because NEO's web View drops
                        // React Native transform arrays.
                        <View
                            key="menu-chevron"
                            className={`h-4 w-4 items-center justify-center flex shrink-0 web:transition-transform web:duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        >
                            <Icon
                                icon={chevron}
                                width={16}
                                height={16}
                                className={`h-4 w-4 ${isActiveOrOpen ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}
                            />
                        </View>
                    ) : null,
                ]}

            </Row>

        </Tooltip>

    )
}
