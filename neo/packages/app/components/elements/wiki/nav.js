import { useEffect, useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { components } from 'app/components/registry'
import { getConductorDepthClassName } from 'app/ui/molecules/sections/conductor/helpers'
import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'
import {
  getItemId,
  getItemPath,
  getRouteParam,
  hasItemPath,
  normalizePathComparable,
} from './helpers'
import { useTranslation } from 'react-i18next'

export function WikiBreadcrumb({ items, onNavigate, compact = false }) {
    const { t } = useTranslation()
    if (!items?.length) return null

    // Sits next to the "On this page" trigger: match its label type
    // (neo_button regular + borderless) so the row reads as one line.
    const textCls = 'text-base leading-6 font-semibold tracking-tight'
    const currentCls = 'text-card-foreground'

    return (
        <Row
            // -ms-1 cancels the first link's px-1 so its text lines up with the article.
            className={`items-center flex-wrap min-w-0 ${compact ? 'gap-1 flex-1' : 'gap-1.5 -ms-1'}`}
            role="navigation"
            accessibilityLabel={t('Breadcrumb')}
        >
            {items.map((item, index) => (
                <Row key={item.key} className="items-center gap-1 min-w-0 max-w-full">
                    {index > 0 ? (
                        <Icon
                            icon="ChevronRight"
                            size={14}
                            className="shrink-0 text-muted-foreground"
                        />
                    ) : null}
                    {item.isCurrent || !item.path || !onNavigate ? (
                        <Text
                            numberOfLines={1}
                            className={`${textCls} ${
                                item.isCurrent ? currentCls : 'text-muted-foreground'
                            }`}
                        >
                            {item.title}
                        </Text>
                    ) : (
                        <Pressable
                            href={item.path}
                            onPress={() => onNavigate(item.path)}
                            className="min-w-0 rounded-md px-1 py-0.5 web:hover:bg-muted/50"
                            accessibilityRole="link"
                            accessibilityLabel={item.title}
                        >
                            <Text
                                numberOfLines={1}
                                className={`${textCls} text-muted-foreground web:hover:text-foreground`}
                            >
                                {item.title}
                            </Text>
                        </Pressable>
                    )}
                </Row>
            ))}
        </Row>
    )
}


export function useCurrentPathComparable() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    return normalizePathComparable(getRouteParam(params?.url) || pathname);
}

export function buildExpandedMapForPath(items = [], currentPathComparable, parentIndexPath = '') {
    const map = {};

    items.forEach((item, index) => {
        const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
        const itemId = getItemId(item, indexPath);
        const children = item?.subitems || [];

        if (!children.length) return;

        if (hasActiveDescendant(item, currentPathComparable)) {
            map[itemId] = true;
        }

        Object.assign(map, buildExpandedMapForPath(children, currentPathComparable, indexPath));
    });

    return map;
}

export function hasActiveDescendant(item, currentPathComparable) {
    const itemPath = String(item?.url || item?.link || '');
    const itemPathComparable = normalizePathComparable(itemPath);
    if (itemPathComparable && itemPathComparable === currentPathComparable) return true;
    const children = item?.subitems || [];
    return children.some((child) => hasActiveDescendant(child, currentPathComparable));
}

export function isImageSource(icon) {
    if (typeof icon === 'number') return true; // require('./x.png')
    if (typeof icon === 'object' && icon !== null && 'uri' in icon) return true;
    if (typeof icon === 'string' && /^(https?:|file:|content:|data:)/i.test(icon)) return true;
    return false;
}

export function ActiveBranchExpander({ currentPathComparable, items, setExpandedMap }) {
    useEffect(() => {
        const activeExpandedMap = buildExpandedMapForPath(items, currentPathComparable);
        const activeExpandedIds = Object.keys(activeExpandedMap);

        if (!activeExpandedIds.length) return;

        setExpandedMap((prev) => {
            let hasChanges = false;
            const next = { ...prev };

            activeExpandedIds.forEach((id) => {
                if (!next[id]) {
                    next[id] = true;
                    hasChanges = true;
                }
            });

            return hasChanges ? next : prev;
        });
    }, [currentPathComparable, items, setExpandedMap]);

    return null;
}

export function MenuWiki({ onNavigate, block, url }) {
    const data = block.content[0].data;
    const routePathComparable = useCurrentPathComparable();
    // Prefer pageData.url so sidebar pushState (web) and in-layout swaps (native)
    // keep the active item in sync without waiting on the router.
    const currentPathComparable = normalizePathComparable(url) || routePathComparable;
    const initialPathComparable = normalizePathComparable(url);
    const topLevelItems = data?.content?.items || [];
    const MenuItemSidebarWithWrapper = components['menu-item']['sidebar_with_wrapper'];
    const [expandedMap, setExpandedMap] = useState(() => buildExpandedMapForPath(topLevelItems, initialPathComparable));

    const toggleExpanded = (id) => {
        setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderItems = (items = [], depth = 0, parentIndexPath = '') =>
        items.map((item, index) => {
            const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
            const itemId = getItemId(item, indexPath);
            const itemPath = getItemPath(item);
            const children = item?.subitems || [];
            const hasChildren = children.length > 0;
            const isExpanded = Boolean(expandedMap[itemId]);
            const title = item?.title || item?.name;
            const icon = item?.icon || item?.image || 'Circle';
            const canNavigate = hasItemPath(item);
            const itemPathComparable = normalizePathComparable(itemPath);
            const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
            const menuIsActive = canNavigate ? isActive : false;
            // Parent-only nodes (no path) toggle expand/collapse; leaves navigate.
            const showChevron = !canNavigate && hasChildren;
            const menuIconEnd = showChevron ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : null;
            return (
                <View key={`lmenu-${itemId}`} className="w-full">
                    {/* Same item as the conductor sidebar (menu-item/sidebar_with_wrapper),
                        so wiki and section menus look alike and forks style both at once.
                        Indent on a wrapper: on the button it loses to the inline contentInsets padding. */}
                    <View className={getConductorDepthClassName(depth)}>
                    <MenuItemSidebarWithWrapper
                        link={canNavigate ? itemPath : undefined}
                        title={title}
                        icon={icon}
                        iconEnd={menuIconEnd}
                        isActive={menuIsActive}
                        onPress={canNavigate
                            ? (event) => {
                                onNavigate?.(itemPath)
                                event?.preventDefault?.()
                            }
                            : (hasChildren ? () => toggleExpanded(itemId) : undefined)}
                    />
                    </View>
                    {hasChildren && isExpanded && (
                        <View className="gap-0.5">
                            {renderItems(children, depth + 1, indexPath)}
                        </View>
                    )}
                </View>
            );
        });

    return (
        <>
            <ActiveBranchExpander
                currentPathComparable={currentPathComparable}
                items={topLevelItems}
                setExpandedMap={setExpandedMap}
            />
            <View className='gap-0.5 lg:-mx-2'>
                {renderItems(topLevelItems)}
            </View>
        </>
    );
}
