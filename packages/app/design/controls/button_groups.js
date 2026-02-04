import React from 'react';
import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import  { Button } from 'app/design/controls/buttons';

const ThemeCssClassesButtonGroups = appSetting('theme', 'buttons_group_styles');
const BtnClsSize = appSetting('theme', 'button_sizes_neo');
const BtnCls = appSetting('theme', 'button_styles_neo');

export function NeoButtonsGroup({
    size = 'base',
    children
}) {
    return (
        <Row className={`${BtnCls.group?.container} ${BtnClsSize[size]?.rounded}`}>
            {children?.map((child, i) => (
                <>
                    {child}
                    {i < children.length - 1 && <View className={`${BtnCls.group?.separator}`} />}
                </>
            ))}
        </Row>
    )
}

export function ButtonsGroup(props) {
     const {
  className = '',
  variant = 'default',
  size = 'base',
  fullWidth = false,
  showTitleFromSize = '',
  rounded = false,
  children = null,
  ...rest
} = props;
    
     if (appSetting('theme', 'neo_button') && !rest.old)
        return <NeoButtonsGroup {...props} />

    let sClassContainer = 'web:group';
    sClassContainer += fullWidth ? ' flex-auto w-full items-stretch' : ' w-fit m-0 truncate ';
    
    sClassContainer += ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] ? ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] + ' ' : ' ';
    sClassContainer += className;

    const bTextContainer = !!variant && variant == 'text';
    const ThemeButtonsGroupSizes = appSetting('theme', 'buttons_group_sizes');
    const ThemeButtonsGroupItemSizes = appSetting('theme', 'buttons_group_items_sizes');
    const ThemeButtonItemStyles = appSetting('theme', 'button_styles');
    const groupSizeCfg = ThemeButtonsGroupSizes?.[size] || {};
    const itemSizeCfg = ThemeButtonsGroupItemSizes?.[size] || {};

    const aChildren = children.map((child, iIndex) => {
        const childProps = child?.props || {};
        const { variant: childVariant, size: childSize, fullWidth: childFullWidth, ...restChild } = childProps;

        // If child is a Button: size and style it as a group item and return directly
        if (child.type === Button) {
            const hasTitle = !!restChild.title;
            const paddingOverride = hasTitle ? (groupSizeCfg.item_padding || '') : (groupSizeCfg.item_padding_icon_only || groupSizeCfg.item_padding || '');
            return (
                <Button
                    key={iIndex}
                    showTitleFromSize={showTitleFromSize}
                    variant={'group-item' + (!!childVariant ? '-' + childVariant : '')}
                    size={childSize}
                    fullWidth={childFullWidth ?? fullWidth}
                    padding={paddingOverride}
                    {...restChild}
                />
            );
        }

        // If child is a wrapper (e.g., Link) around a Button: replace inner Button with sized group item
        const inner = childProps.children;
        if (React.isValidElement(inner) && inner.type === Button) {
            const innerProps = inner.props || {};
            const innerVariant = innerProps.variant;
            const { fullWidth: innerFullWidth, ...restInner } = innerProps;
            const hasTitle = !!restInner.title;
            const paddingOverride = hasTitle ? (groupSizeCfg.item_padding || '') : (groupSizeCfg.item_padding_icon_only || groupSizeCfg.item_padding || '');
            const sizedInner = (
                <Button
                    showTitleFromSize={showTitleFromSize}
                    variant={'group-item' + (!!innerVariant ? '-' + innerVariant : '')}
                    size={innerProps.size}
                    fullWidth={innerFullWidth ?? fullWidth}
                    padding={paddingOverride}
                    {...restInner}
                />
            );
            return React.cloneElement(child, { key: iIndex, children: sizedInner });
        }

        // Fallback: non-Button child — wrap with group item container styles and padding
        const paddingOverride = groupSizeCfg.item_padding || '';
        const itemCntClass = ThemeButtonItemStyles[`u-btn-group-item-${variant}-cnt`] || '';
        const itemTextClass = ThemeButtonItemStyles[`u-btn-group-item-${variant}-text`] || '';
        return (
            <View key={iIndex} className={`${itemCntClass} ${itemTextClass} ${paddingOverride} items-center justify-center ${itemSizeCfg?.container || ''} ${rounded ? (itemSizeCfg?.rounded || '') : ''}`}>{child}</View>
        );
    });

    // Insert dividers between items when there are multiple children
    const dividerSizeClass = groupSizeCfg?.divider || '';
    const dividerStyleClass =
        (ThemeButtonItemStyles[`u-btn-group-divider-${variant}-cnt`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}-cnt`] ||
            ThemeButtonItemStyles[`u-btn-group-divider-${variant}-text`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}-text`] ||
            ThemeButtonItemStyles[`u-btn-group-divider-${variant}`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}`] ||
            ThemeButtonItemStyles['u-btn-group-divider-cnt'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider-cnt'] ||
            ThemeButtonItemStyles['u-btn-group-divider-text'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider-text'] ||
            ThemeButtonItemStyles['u-btn-group-divider'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider'] ||
            '');
    const itemsWithDividers = [];
    aChildren.forEach((item, index) => {
        itemsWithDividers.push(item);
        if (index < aChildren.length - 1) {
            itemsWithDividers.push(
                <View key={`divider-${index}`} className={`${dividerStyleClass} ${dividerSizeClass}`}></View>
            );
        }
    });

    // Apply group container sizing on the same wrapper
    const groupHeightClass = groupSizeCfg?.container || '';
    const groupRoundedClass = rounded ? ' rounded-full ' : (groupSizeCfg.rounded || '');
    return (
        <View className={`${fullWidth ? 'flex-auto w-full' : 'w-fit'} ${groupRoundedClass} overflow-hidden ${sClassContainer} ${groupHeightClass}`} {...rest}>
            {itemsWithDividers}
        </View>
    );
}