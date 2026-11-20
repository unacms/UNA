import { BlockWrapper } from 'app/components/block-wrapper'
import { View } from 'app/design/view'
import { components } from 'app/components/registry';
import { appSetting, getMenuHub, getMenuSectionListItems, getMenuView } from 'app/lib/util';
import MenuGrid from './menu-grid';
import MenuCards from './menu-cards';
import { useState } from 'react';
import SettingsMenu from './settings-menu';
import { hasMenuSections } from 'app/lib/menu-sections';

const conductorTheme = appSetting('theme', 'conductor');

// `itemsClassName`: classes for the list of links in place of `w-full`, e.g. the Conductor's left
// panel lines them up with its own links (`-mx-1`: a fixed `w-full` would cancel the right margin).
export default function ElementMenu({ data, blockWrapperProps, url, itemsClassName = '' }) {
    const MenuItemSidebarWithWrapper = components['menu-item']['sidebar_with_wrapper'];
    const currentPath = String(url || '');
    const currentPathComparable = currentPath.replace(/^\/+/, '');
    const depthClassNameMap = {
        0: '',
        1: conductorTheme.menu_categ_indent,
        2: 'pl-12',
        3: 'pl-16',
    };
    const getDepthClassName = (depth) => depthClassNameMap[depth] || '';
    const getItemId = (item, indexPath) => String(item?.id || item?.name || item?.url || item?.link || indexPath);
    const hasItemPath = (item) => {
        const path = String(item?.url || item?.link || '');
        return Boolean(path && path !== 'javascript:void(0)');
    };
    const hasActiveDescendant = (item) => {
        const itemPath = String(item?.url || item?.link || '');
        if (itemPath && itemPath !== 'javascript:void(0)') {
            const itemPathComparable = itemPath.replace(/^\/+/, '');
            if (itemPathComparable && itemPathComparable === currentPathComparable) return true;
        }
        const children = item?.subitems || [];
        return children.some((child) => hasActiveDescendant(child));
    };
    const topLevelItems = data?.content?.items || [];
    const buildInitialExpandedMap = (items = [], parentIndexPath = '') => {
        const map = {};
        items.forEach((item, index) => {
            const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
            const itemId = getItemId(item, indexPath);
            const children = item?.subitems || [];
            if (!children.length) return;
            if (hasActiveDescendant(item)) {
                map[itemId] = true;
            }
            Object.assign(map, buildInitialExpandedMap(children, indexPath));
        });
        return map;
    };
    const [expandedMap, setExpandedMap] = useState(() => buildInitialExpandedMap(topLevelItems));

    const toggleExpanded = (id) => {
        setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderItems = (items = [], depth = 0, parentIndexPath = '') =>
        items.map((item, index) => {
            const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
            const itemId = getItemId(item, indexPath);
            const itemPath = (() => {
                const p = String(item?.url || item?.link || '');
                if (!p || p === 'javascript:void(0)') return '';
                return p.startsWith('/') ? p : `/${p}`;
              })();
            const itemPathComparable = itemPath.replace(/^\/+/, '');
            const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
            const children = item?.subitems || [];
            const hasChildren = children.length > 0;
            const isExpanded = Boolean(expandedMap[itemId]);
            const title = item?.title || item?.name;
            const icon = item?.icon || 'Circle';
            const canNavigate = hasItemPath(item);

            return (
                <View key={`lmenu-${itemId}`} className="w-full gap-0.5">
                    {/* Indent on a wrapper: on the button it loses to the inline contentInsets padding. */}
                    <View className={getDepthClassName(depth)}>
                    <MenuItemSidebarWithWrapper
                        link={canNavigate ? itemPath : undefined}
                        title={title}
                        icon={icon}
                        iconEnd={!canNavigate && hasChildren ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : undefined}
                        isActive={isActive}
                        onPress={!canNavigate && hasChildren ? () => toggleExpanded(itemId) : undefined}
                    />
                    </View>
                    {hasChildren && isExpanded ? (
                        <View className="gap-0.5">
                            {renderItems(children, depth + 1, indexPath)}
                        </View>
                    ) : null}
                </View>
            );
        });

    // A section's own list (the Settings page's `sys_account_settings`) in the sections its items without a link make
    // (`lib/menu-sections.ts`; an older UNA: the items' groups).
    const sectionItems = getMenuSectionListItems(data?.content, topLevelItems);
    if (hasMenuSections(sectionItems)) {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <SettingsMenu items={sectionItems} hub={getMenuHub(data?.content)} />
            </BlockWrapper>
        );
    }

    // A menu UNA draws as a grid (its config says `"view": "grid"`, the home menu): tiles, as UNA's site draws it.
    if (getMenuView(data?.content) === 'grid') {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <MenuGrid items={topLevelItems} />
            </BlockWrapper>
        );
    }

    // A menu UNA draws as cards (`"view": "cards"`, the profile types of "Create your profile"), and any flat menu
    // whose items all carry a description: cards, as UNA's site draws them.
    const isChoiceList = topLevelItems.length > 0 && topLevelItems.every(
        (item) => typeof item?.info === 'string' && item.info.trim() && !(item?.subitems || []).length
    );
    if (getMenuView(data?.content) === 'cards' || isChoiceList) {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <MenuCards items={topLevelItems} />
            </BlockWrapper>
        );
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className={`gap-0.5 ${itemsClassName || 'w-full'}`}>
                {renderItems(topLevelItems)}
            </View>
        </BlockWrapper>
    );
}
