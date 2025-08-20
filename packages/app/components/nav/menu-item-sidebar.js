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
        <Row className={` mb-0.5 items-center web:hover:bg-muted/60 group rounded-xl ${isActive && 'bg-accent/60 web:hover:bg-accent/100 text-accent-foreground shadow-xs ring-[0.5px] ring-inset ring-ring/40 hover:bg-accent hover:ring-ring/60 '}`}>
            <View className='px-2 py-1.5 rounded-full'>
                <Text className={`h-9 w-9 text-center items-center justify-center flex rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground web:group-hover:bg-muted/60 web:group-hover:text-foreground web:duration-300'}`}>
                    {isEmoji(icon) ? icon : <Icon icon={icon} size="20" className={`${isActive ? 'text-primary-foreground' : 'text-muted-foreground web:group-hover:text-foreground'}`} />}
                </Text>
            </View>
            <Text className={` p-1.5 text-sm leading-tight font-semibold  ${isActive && 'text-accent-foreground' || 'text-secondary-foreground group-hover:text-foreground'}`}>{title}</Text>
            {getPart("CounterIndicator", [addon, true])}
        </Row>
    )
}