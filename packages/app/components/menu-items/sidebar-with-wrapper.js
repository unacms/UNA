import { Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { getComponent } from 'app/components/registry'
import { Platform } from 'react-native'

export default function MenuItemSidebarWithWrapper({ link, title, index, icon = 'Circle', userUrl, isActive, onPress, addon }) {

    const MenuItemSidebar = getComponent('menu-item', 'sidebar');
    const finalLink = link?.includes('{profile}') ? link.replace('{profile}', userUrl || '') : link;
    const isWeb = Platform.OS === 'web';
    const Wrapper = onPress && !isWeb ? Pressable : Link;
    const activeWrapperClassName = isActive ? 'u-link-ghost-active bg-accent web:bg-transparent rounded-lg' : '';
    const wrapperProps = onPress
        ? {
            ...(isWeb
                ? { emulate: true, onPress, alt: title, variant: 'ghost', size: 'md' }
                : { onPress }),
            className: `group ${activeWrapperClassName}`.trim(),
        }
        : { href: finalLink, alt: title, variant: 'ghost', size: 'md', className: `group ${activeWrapperClassName}`.trim() };

    return (
        <Wrapper {...wrapperProps}>
            <MenuItemSidebar title={title} icon={icon} isActive={isActive} addon={addon} />
        </Wrapper>
    )
}
