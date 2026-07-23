import { useEffect, useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { isEmoji } from 'app/lib/util'
import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'
import {
  getDepthClassName,
  getItemId,
  getItemPath,
  getRouteParam,
  hasItemPath,
  normalizePathComparable,
} from './helpers'

export function WikiBreadcrumb({ items, onNavigate, compact = false }) {
    if (!items?.length) return null

    return (
        <Row
            className={`items-center flex-wrap min-w-0 ${compact ? 'gap-1 flex-1' : 'gap-1.5'}`}
            accessibilityRole="navigation"
            accessibilityLabel="Breadcrumb"
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
                            className={`text-sm leading-5 ${
                                item.isCurrent
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground'
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
                                className="text-sm leading-5 text-muted-foreground web:hover:text-foreground"
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

export function WikiMenuItem({ title, icon, isActive, iconEnd }) {
    const iconClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground'
    const iconBackgroundClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground'

    return (
        <Row className="w-full items-center gap-2">
            <View className={`h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBackgroundClassName}`}>
                {isImageSource(icon) ? (
                    <Image
                        src={icon}
                        className="h-5 w-5 rounded"
                        view="cover"
                        sizes="auto"
                    />
                ) : isEmoji(icon) ? (
                    <Text className="text-xs leading-none">{icon}</Text>
                ) : (
                    <Icon icon={icon} size={20} className={iconClassName} />
                )}
            </View>

            <Text className={`flex-1 text-sm leading-5 font-semibold ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>
                {title}
            </Text>

            {!!iconEnd && (
                <View className="ml-auto h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {isEmoji(iconEnd) ? (
                        <Text className="text-xs leading-none text-secondary-foreground">{iconEnd}</Text>
                    ) : (
                        <Icon icon={iconEnd} size={15} className="text-secondary-foreground web:group-hover:text-foreground" />
                    )}
                </View>
            )}
        </Row>
    )
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
            const depthClassName = getDepthClassName(depth);
            const title = item?.title || item?.name;
            const icon = item?.icon || item?.image || 'Circle';
            const canNavigate = hasItemPath(item);
            const itemPathComparable = normalizePathComparable(itemPath);
            const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
            const menuIsActive = canNavigate ? isActive : false;
            // Parent-only nodes (no path) toggle expand/collapse; leaves navigate.
            const showChevron = !canNavigate && hasChildren;
            const menuIconEnd = showChevron ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : null;
            const menuItem = (
                <WikiMenuItem
                    title={title}
                    icon={icon}
                    isActive={menuIsActive}
                    iconEnd={menuIconEnd}
                />
            );

            return (
                <View key={`lmenu-${itemId}`} className={`w-full ${depthClassName}`}>
                    {canNavigate ? (
                        <NeoButtonLink
                            href={itemPath}
                            alt={title}
                            style="borderless"
                            controlSize="large"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            selected={menuIsActive}
                            selectedState="pressed"
                            className="group"
                            onPress={(event) => {
                                onNavigate?.(itemPath)
                                event?.preventDefault?.()
                            }}
                        >
                            {menuItem}
                        </NeoButtonLink>
                    ) : (
                        <NeoButton
                            alt={title}
                            style="borderless"
                            controlSize="large"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            interactive
                            className="group"
                            onPress={hasChildren ? () => toggleExpanded(itemId) : undefined}
                        >
                            {menuItem}
                        </NeoButton>
                    )}
                    {hasChildren && isExpanded && (
                        <View className="mt-1 gap-1">
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
            <View className=' gap-1 lg:-mx-2'>
                {renderItems(topLevelItems)}
            </View>
        </>
    );
}
