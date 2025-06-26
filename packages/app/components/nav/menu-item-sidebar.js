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
        <Row className={`h-12 px-2 items-center gap-x-3 hover:bg-neutral-900/10 dark:hover:bg-neutral-100/10 group rounded-xl ${isActive && 'bg-bgritemprimary dark:bg-bgritemprimary-d hover:bg-bgritemprimary-h dark:hover:bg-bgritemprimary-dh'}`}>
            <Text className={`h-9 w-9 p-2 rounded-full ${isActive ? ' bg-primary text-white ' : 'bg-neutral-900/10 dark:bg-neutral-100/10 group-hover:bg-neutral-900/20 dark:group-hover:bg-neutral-100/20 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 web:duration-300'}`}>
                {isEmoji(icon) ? icon : <Icon icon={icon} size="20" />}
            </Text>
            <Text className="text-base font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">{title}</Text>
            {getPart("CounterIndicator", [addon, true])}
        </Row>
    )
}