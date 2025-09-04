import { View, Row, Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { getPart } from 'app/lib/parts/part';
import { isEmoji, appSetting } from 'app/lib/util';

export function MenuItemSidebarWithWrapper({ link, title, index, icon = 'Circle', userUrl, isActive, onPress, addon }) {

    const finalLink = link?.includes('{profile}') ? link.replace('{profile}', userUrl || '') : link;
    const Wrapper = onPress ? Pressable : Link;
    const wrapperProps = onPress
        ? { onPress }
        : { href: finalLink, alt: title };

    return (
        <Wrapper {...wrapperProps}>
            <MenuItemSidebar title={title} icon={icon} isActive={isActive} addon={addon} />
        </Wrapper>
    )
}

export function MenuItemSidebar({ title, icon, isActive, addon }) {
    return (
        <Row className={` mb-0.5 px-2 py-1.5 items-center group rounded-xl ${isActive && 'bg-accent/80 web:hover:bg-accent text-accent-foreground  web:hover:shadow-sm ring-[0.5px] ring-inset ring-ring/20 web:hover:ring-ring/40' || 'web:hover:bg-muted/60'}`}>
            
                <Text className={`h-9 w-9 text-center items-center justify-center flex rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-grayA1 text-muted-foreground web:group-hover:bg-secondary web:group-hover:text-foreground web:duration-300'}`}>
                    {isEmoji(icon) ? icon : <Icon icon={icon} size="20" className={`${isActive ? 'text-primary-foreground' : 'text-muted-foreground web:group-hover:text-foreground'}`} />}
                </Text>
            
            <Text className={` px-2 text-sm leading-tight font-semibold  ${isActive && 'text-accent-foreground' || 'text-secondary-foreground group-hover:text-foreground'}`}>{title}</Text>
            {getPart("CounterIndicator", [addon, true])}
        </Row>
    )
}