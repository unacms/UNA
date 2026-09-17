import { BlockWrapper } from 'app/components/block-wrapper'
import { View } from 'app/design/view'
import { components } from 'app/components/registry';
import { appSetting } from 'app/lib/util';
import { useState } from 'react';

const conductorTheme = appSetting('theme', 'conductor');

export default function ElementMenu({ data, blockWrapperProps, url }) {
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
                <View key={`lmenu-${itemId}`} className="w-full">
                    <MenuItemSidebarWithWrapper
                        link={canNavigate ? itemPath : undefined}
                        title={title}
                        icon={icon}
                        iconEnd={!canNavigate && hasChildren ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : undefined}
                        isActive={isActive}
                        onPress={!canNavigate && hasChildren ? () => toggleExpanded(itemId) : undefined}
                        className={getDepthClassName(depth)}
                    />
                    {hasChildren && isExpanded ? (
                        <View className="gap-0.5">
                            {renderItems(children, depth + 1, indexPath)}
                        </View>
                    ) : null}
                </View>
            );
        });

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-0.5">
                {renderItems(topLevelItems)}
            </View>
        </BlockWrapper>
    );
}
