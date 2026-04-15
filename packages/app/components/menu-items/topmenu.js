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
            items={items}
            defaultOpen={false}
        >
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={true} chevron={chevron} animated={animated} addClassName={addClassName} />
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-16 flex-auto relative web:group web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={false} chevron={chevron} animated={animated} addClassName={addClassName} />
        </Link>

}


function MenuTopItem_({ title, icon, isTitle, isActive, isPopup, chevron, animated, addClassName }) {
    const isOpen = useContext(DropdownMenuOpenContext) ?? false;
    const isActiveOrOpen = isActive || (isPopup && isOpen);
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

    return (

        <Tooltip content={title}>
            
                <Row
                    className={`items-center content-center justify-center px-2 h-12 min-w-16 flex-auto flex-wrap rounded-xl  ${isActiveOrOpen
                        ? ' web:hover:bg-accent/60 active:bg-accent text-accent-foreground'
                        : ' text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/60 web:group-focus:bg-muted/60 web:active:bg-muted '
                        }`}
                    {...rowHoverProps}
                >
                    {[
                        <Icon
                            key="menu-icon"
                            icon={icon}
                            animated={useAnimatedIcon}
                            active={useAnimatedIcon ? isActiveOrOpen : undefined}
                            size={useAnimatedIcon ? 24 : undefined}
                            className={menuIconClassName}
                            hovered={useAnimatedIcon && Platform.OS === 'web' ? groupHovered : undefined}
                        />,
                        isTitle ? (
                            <Text key="menu-title" className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActiveOrOpen ? 'text-accent-foreground' : 'text-secondary-foreground'} text-sm lg:text-base px-2 leading-5`}>{title}</Text>
                        ) : null,
                        chevron ? (
                            <View
                                key="menu-chevron"
                                className="h-4 w-4 items-center justify-center flex shrink-0 transition-transform duration-200"
                                style={{
                                    transform: [
                                        { rotate: isOpen ? '180deg' : '0deg' },
                                    ],
                                }}
                            >
                                <Icon
                                    icon={chevron}
                                    className={`h-4 w-4 ${isActiveOrOpen ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}
                                />
                            </View>
                        ) : null,
                    ]}
                    {/*
                        isPopup && <Icon
                        icon={icon}
                        className={`${isActive ? "text-accent-foreground h-9 w-9 my-auto items-center justify-center flex" : "text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                    />
                    */}
                </Row>
            
        </Tooltip>

    )
}
