import { View } from 'app/design/view';
import Submenu from './submenu';
import SubmenuShare from './submenu-share';
import ProfilesList from 'app/ui/molecules/profile/profile-list';
import { Text } from 'app/design/typography';
import MenuItemActionBase, {
    formatMenuHref,
    getMenuItemFlags,
    resolveMenuItemIcon,
    MenuItemSubmenuSwitch,
} from 'app/lib/menu-item-helpers';

const SUBMENU_MAP = {
    'bx_timeline_menu_item_share': SubmenuShare,
};

export default function MenuItemButton(oProps) {
    const { showVertical, isTextMode, isDropdown } = getMenuItemFlags(oProps);

    if (oProps.content_type === 'submenu') {
        return (
            <MenuItemSubmenuSwitch
                item={oProps}
                map={SUBMENU_MAP}
                Fallback={Submenu}
                wrapperClassName={`menu-item flex-auto ${showVertical ? 'w-full' : 'flex-row'}`}
            />
        );
    }

    const handleClick = (event) => {
        if (!oProps?.link && !oProps.params?.onclick)
            return;

        event.preventDefault();

        if (oProps.params?.onclick)
            oProps.params.onclick(event, oProps);
    };

    const sButtonIcon = resolveMenuItemIcon(oProps, { emptyListIcon: 'Users' });
    const hasList = oProps?.list?.length > 0;
    const listDisplay = hasList ? (
        <View className={oProps.params?.list_className || ''}>
            <ProfilesList
                data={oProps.list}
                showEmpty={false}
                maxCount={oProps.params?.list_max_count || 3}
                displaySize={oProps.params?.list_display_size || 'sm'}
            />
        </View>
    ) : null;

    const formattedLink = oProps.link && !oProps.noAction ? formatMenuHref(oProps.link) : null;
    const href = isDropdown ? null : formattedLink;
    const onPress = isDropdown
        ? oProps.onPress
        : (href ? undefined : (oProps.link && oProps.noAction ? oProps.onPress : (oProps.params?.onclick ? handleClick : undefined)));

    return (
        <MenuItemActionBase
            item={oProps}
            title={oProps.title}
            icon={sButtonIcon}
            onPress={onPress}
            href={href}
            dropdownLink={isDropdown ? formattedLink : undefined}
            leading={hasList && !oProps.params?.button_style ? listDisplay : null}
            image={hasList && oProps.params?.button_style ? listDisplay : undefined}
            contentInsets={hasList && oProps.params?.button_style
                ? (oProps.params?.button_content_insets || oProps.params?.button_image_inset || 'mediaLeading')
                : undefined}
            actionButtonProps={{
                variant: oProps.primary === '1' ? 'primary' : (oProps.accent === '1' ? 'accent' : (isTextMode ? 'custom' : oProps.params?.button_variant)),
                size: isTextMode ? 'base' : oProps.params?.button_size,
            }}
            wrapperClassName={`menu-item flex-auto ${showVertical ? 'w-full' : 'flex-row'}`}
            innerClassName={showVertical ? 'flex-col flex-auto items-stretch' : 'flex-auto items-center'}
            innerAs="row"
        >
            {hasList && !oProps.params?.button_style ? (
                <Text className="text-secondary-foreground web:hover:text-foreground px-2 text-sm font-medium">{oProps.title}</Text>
            ) : undefined}
        </MenuItemActionBase>
    );
}
