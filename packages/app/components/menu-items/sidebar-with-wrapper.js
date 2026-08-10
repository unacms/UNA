import { getComponent } from 'app/components/registry'
import { NeoButton, NeoButtonLink } from 'app/design/controls'

export default function MenuItemSidebarWithWrapper({
    link,
    title,
    icon = 'Circle',
    userUrl,
    isActive,
    onPress,
    addon,
    className = '',
}) {
    const MenuItemSidebar = getComponent('menu-item', 'sidebar')
    const finalLink = link?.includes('{profile}')
        ? link.replace('{profile}', userUrl || '')
        : link

    const content = (
        <MenuItemSidebar
            title={title}
            icon={icon}
            isActive={isActive}
            addon={addon}
        />
    )

    const commonProps = {
        alt: title,
        style: 'borderless',
        controlSize: 'large',
        width: 'fill',
        align: 'start',
        contentInsets: { x: 8 },
        selected: isActive,
        selectedState: 'pressed',
        className: `group ${className}`.trim(),
        onPress,
    }

    if (finalLink) {
        return (
            <NeoButtonLink href={finalLink} {...commonProps}>
                {content}
            </NeoButtonLink>
        )
    }

    return (
        <NeoButton {...commonProps} interactive>
            {content}
        </NeoButton>
    )
}
