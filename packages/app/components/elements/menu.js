import { BlockWrapper } from 'app/components/block-wrapper'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'
import { components } from 'app/components/registry';
import { appSetting } from 'app/lib/util';
import { useState } from 'react';

const conductorTheme = appSetting('theme', 'conductor');

/**
 * A menu item UNA describes with `info` (already translated), shown as a full-width choice:
 * icon, title, the description under it, chevron. E.g. the profile types of `sys_add_profile`.
 */
function MenuChoiceRow({ item, href }) {
    const title = item?.title || item?.name
    return (
        <Link href={href} mode="plain" haptics="Light" alt={title} className="w-full">
            <Row className="w-full items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 web:hover:bg-muted/60 web:transition-colors">
                <View className="size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon icon={item?.icon || 'Circle'} size={20} className="text-primary" />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-base font-semibold text-card-foreground">{title}</Text>
                    <Text className="text-sm text-muted-foreground">{item.info}</Text>
                </View>
                <Icon icon="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />
            </Row>
        </Link>
    )
}

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

    // Flat menus whose items all carry a description render as choices instead of sidebar links.
    const isChoiceList = topLevelItems.length > 0 && topLevelItems.every(
        (item) => typeof item?.info === 'string' && item.info.trim() && !(item?.subitems || []).length
    );
    if (isChoiceList) {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <View className="w-full gap-3">
                    {topLevelItems.map((item, index) => {
                        const path = String(item?.url || item?.link || '');
                        const href = !path || /^https?:/.test(path) || path.startsWith('/') ? path : `/${path}`;
                        return <MenuChoiceRow key={getItemId(item, String(index))} item={item} href={href} />;
                    })}
                </View>
            </BlockWrapper>
        );
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-0.5">
                {renderItems(topLevelItems)}
            </View>
        </BlockWrapper>
    );
}
