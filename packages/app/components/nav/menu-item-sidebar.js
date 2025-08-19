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
        <Row className={` px-1 items-center  hover:bg-muted group rounded-xl ${isActive && 'bg-bgritemprimary dark:bg-bgritemprimary-d hover:bg-bgritemprimary-h dark:hover:bg-bgritemprimary-dh'}`}>
            <View className='p-1 rounded-full'>
                <Text className={`h-9 w-9 text-center items-center justify-center flex rounded-full ${isActive && !icon ? ' bg-primary text-white ' : 'bg-bgritem dark:bg-bgritem-d group-hover:bg-bgritem-h dark:group-hover:bg-bgritem-dh text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 web:duration-300'}`}>
                    {isEmoji(icon) ? icon : <Icon icon={icon} size="20" />}
                </Text>
            </View>
            <Text className=" text-sm leading-tight font-semibold text-secondary-foreground group-hover:text-foreground">{title}</Text>
            {getPart("CounterIndicator", [addon, true])}
        </Row>
    )
}