import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useMemo, memo } from 'react';
import { NeoButtonLink } from 'app/design/controls'
import { useCurrentUserNoCounters } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';

const linkVariantToNeoStyle = {
    default: 'plain',
    secondary: 'borderless',
    accent: 'link',
    primary: 'borderedProminent',
    ghost: 'borderless',
};

const linkSizeToNeoControlSize = {
    xs: 'mini',
    sm: 'small',
    md: 'regular',
    base: 'regular',
    lg: 'large',
};

const normalizeFooterHref = (href = '') => {
    const value = typeof href === 'string' ? href.trim() : '';
    if (!value) return '';
    if (
        value.startsWith('/') ||
        value.startsWith('#') ||
        value.startsWith('//') ||
        /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)
    ) {
        return value;
    }
    return `/${value}`;
};

function MenuFooterComponent({
    cntClasses,
    btnStyle,
    menu_items,
    variant,
    size,
    itemClassName,
}) {

    const { t } = useTranslation();
    const currentUser = useCurrentUserNoCounters();
    const { menuData } = useMenuData(appSetting('menu_items', 'objects', 'footer'));

    const visualProps = useMemo(() => {
        const legacy = btnStyle || {};
        const legacyVariant = variant ?? legacy.variant ?? 'accent';
        const legacySize = size ?? legacy.size ?? 'sm';
        return {
            style: legacy.style ?? linkVariantToNeoStyle[legacyVariant] ?? 'link',
            controlSize: legacy.controlSize ?? linkSizeToNeoControlSize[legacySize] ?? 'small',
            className: legacy.containerClassName ?? '',
            textClassName: itemClassName ?? legacy.textClassName ?? legacy.className ?? '',
        };
    }, [btnStyle, variant, size, itemClassName]);
  
    
    const menu_launcher_items = useMemo(() => (
        menu_items || (appSetting('layout', 'user_remote_config')
            ? menuItemsByNameNew('menu_post', menuData, currentUser)
            : menuItemsByName('', appSetting('menu_items', 'menu_footer'), currentUser))
    ), [menu_items, menuData, currentUser]);

    if (menu_launcher_items.length === 0 && menuData)
        return null;

    return (
        <View className={cntClasses}>
            {menu_launcher_items.map((item, index) => (
                <NeoButtonLink
                    href={normalizeFooterHref(item.link)}
                    key={item.link || index}
                    label={t(item.title)}
                    style={visualProps.style}
                    controlSize={visualProps.controlSize}
                    className={visualProps.className}
                    textClassName={visualProps.textClassName}
                />
            ))}
        </View>
    );
}

export default memo(MenuFooterComponent);