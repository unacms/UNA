import { Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { getComponent } from 'app/components/registry'

export default function MenuItemSidebarWithWrapper({ link, title, index, icon = 'Circle', userUrl, isActive, onPress, addon }) {

    const MenuItemSidebar = getComponent('menu-item', 'sidebar');
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
