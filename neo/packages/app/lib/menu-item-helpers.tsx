import React, { type ReactNode } from 'react';
import Link from 'app/ui/atoms/link';
import { ButtonMenuActionDefault, ButtonMenuActionText, NeoButton } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { components } from 'app/components/registry';
import { getIconByNameFromIconset } from 'app/lib/util';

export function formatMenuHref(link: any) {
    if (!link) return null;
    if (link[0] === '/' || String(link).includes('://')) return link;
    return '/' + link;
}

export function getMenuItemFlags(item: any) {
    const params = item?.params;
    return {
        showActionAsButton: params?.show_action_as_button == undefined || params.show_action_as_button === true,
        showVertical: params?.showVertical === true,
        titleOnly: params?.showTitleOnly === true,
        iconset: params?.iconset || {},
        isTextMode: item?.mode === 'text',
        isDropdown: item?.mode === 'dropdown-menu',
    };
}

export function resolveMenuItemIcon(item: any, options: { preferAliases?: boolean; aliases?: Record<string, string>; emptyListIcon?: string } = {}) {
    const { titleOnly, iconset, isTextMode } = getMenuItemFlags(item);
    if (isTextMode) return '';

    if (options.preferAliases) {
        if (!titleOnly) {
            if (options.aliases?.[item.name]) return options.aliases[item.name];
            if (iconset[item.name]) return iconset[item.name];
        }
        return item.icon || '';
    }

    let icon = item.icon;
    if (options.emptyListIcon && item.list && item.list.length == 0) {
        icon = options.emptyListIcon;
    }
    if (!titleOnly && icon == '') {
        icon = getIconByNameFromIconset(iconset, item.name);
    }
    return icon;
}

export function MenuItemSubmenuSwitch({ item, map, Fallback, extra, wrapperClassName }: { item: any; map?: any; Fallback?: any; extra?: any; wrapperClassName?: string }) {
    const { showActionAsButton, isDropdown } = getMenuItemFlags(item);
    const Element = (item?.submenu?.object && map?.[item.submenu.object]) || Fallback;
    const content = (
        <Element key={item.id ? item.id : item.name} show_action_as_button={showActionAsButton} {...item} />
    );

    if (isDropdown) {
        return extra ? <>{extra}{content}</> : content;
    }

    return (
        <View className={wrapperClassName}>
            {extra}
            {content}
        </View>
    );
}

function isPrimaryItem(primary: boolean | number | string | undefined) {
    return primary === true || primary === 1 || primary === '1';
}

function getActionButton(params: any) {
    const showAsButton = getMenuItemFlags({ params }).showActionAsButton;
    return showAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
}

function getNeoButtonStyle(item: any) {
    return isPrimaryItem(item?.primary)
        ? (item?.params?.button_primary_style || item?.params?.button_style)
        : item?.params?.button_style;
}

function getDefaultActionButtonProps(item: any) {
    const params = item?.params;
    return {
        variant: isPrimaryItem(item?.primary) ? 'primary' : params?.button_variant,
        size: params?.button_size,
        rounded: params?.button_rounded,
        fullWidth: params?.button_full_width,
        showTitleFromSize: item?.paramsi?.button_show_title_from_size || params?.button_show_title_from_size,
        ring: params?.button_ring,
    };
}

/** NeoButton when `params.button_style` is set, otherwise ButtonMenuActionDefault/Text. */
export function MenuItemActionButton({
    item,
    title,
    icon,
    onPress,
    image,
    contentInsets,
    actionButtonProps,
    interactive = false,
}: { item: any; title?: any; icon?: any; onPress?: () => void; image?: any; contentInsets?: any; actionButtonProps?: any; interactive?: boolean }) {
    const params = item?.params;
    const titleText = title ?? item?.title ?? '';
    const iconValue = image ?? icon ?? item?.icon ?? '';
    const ButtonAction = getActionButton(params);

    // No onPress while a parent owns the press (Link, dropdown trigger): keep the hover/press visuals.
    const pressProps = onPress ? { onPress } : (interactive ? { interactive: true } : {});

    if (params?.button_style) {
        return (
            <NeoButton
                label={titleText}
                image={iconValue}
                style={getNeoButtonStyle(item)}
                controlSize={params?.button_size}
                borderShape={params?.button_border_shape}
                width={params?.button_full_width ? 'fill' : 'auto'}
                contentInsets={contentInsets ?? params?.button_content_insets}
                className={params?.button_className}
                classNames={params?.button_classNames}
                {...pressProps}
            />
        );
    }

    return (
        <ButtonAction
            title={titleText}
            startDecorator={icon ?? item?.icon ?? ''}
            {...getDefaultActionButtonProps(item)}
            {...actionButtonProps}
            {...pressProps}
        />
    );
}

/**
 * Shared chrome for UNA menu action items: dropdown row, optional Link wrap,
 * or the default menu-item layout around NeoButton / ButtonAction.
 */
export default function MenuItemActionBase({
    item,
    title,
    icon,
    onPress,
    href,
    dropdownLink,
    extra,
    leading,
    image,
    contentInsets,
    actionButtonProps,
    wrapperClassName,
    innerClassName,
    innerAs,
    bare = false,
    children,
}: { item: any; title?: any; icon?: any; onPress?: () => void; href?: any; dropdownLink?: any; extra?: any; leading?: any; image?: any; contentInsets?: any; actionButtonProps?: any; wrapperClassName?: string; innerClassName?: any; innerAs?: any; bare?: any; children?: ReactNode }) {
    const titleText = title ?? item?.title ?? '';
    const iconValue = icon ?? item?.icon ?? '';
    const showVertical = getMenuItemFlags(item).showVertical;
    const buttonOnPress = href ? undefined : onPress;

    let button = children ?? (
        <MenuItemActionButton
            item={item}
            title={titleText}
            icon={iconValue}
            onPress={buttonOnPress}
            interactive={!buttonOnPress && (!!href || !!bare)}
            image={image}
            contentInsets={contentInsets}
            actionButtonProps={actionButtonProps}
        />
    );

    if (children && buttonOnPress && !(children as any).props?.onPress) {
        button = React.cloneElement(children as React.ReactElement<any>, { onPress: buttonOnPress });
    }

    if (item?.mode === 'dropdown-menu') {
        const DropdownMenuItem = (components as any)['menu-item']['dropdown'];
        return (
            <>
                {extra}
                <DropdownMenuItem
                    item={{ title: titleText, icon: iconValue, description: item?.description || item?.info }}
                    handleSelect={onPress}
                    {...(dropdownLink ? { link: dropdownLink } : {})}
                />
            </>
        );
    }

    if (bare) return button;

    const wrapped = href ? (
        <Link emulate={true} href={href}>
            {button}
        </Link>
    ) : button;

    const content = (
        <>
            {leading}
            {wrapped}
        </>
    );

    const inner = innerClassName
        ? (innerAs === 'row'
            ? <Row className={innerClassName}>{content}</Row>
            : <View className={innerClassName}>{content}</View>)
        : content;

    const defaultWrapper = 'menu-item flex-auto ' + (showVertical ? ' w-full' : ' flex-row items-center justify-center');

    return (
        <View className={wrapperClassName ?? defaultWrapper}>
            {extra}
            {inner}
        </View>
    );
}
