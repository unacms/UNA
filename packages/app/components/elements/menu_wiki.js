import { BlockWrapper } from 'app/components/block-wrapper'
import { Pressable, Row, View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { isEmoji } from 'app/lib/util';
import { memo, useEffect, useState } from 'react';
import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'

const depthClassNameMap = {
    0: '',
    1: 'pl-4',
    2: 'pl-8',
    3: 'pl-12',
};

const getDepthClassName = (depth) => depthClassNameMap[depth] || '';
const getItemId = (item, indexPath) => String(item?.id || item?.name || item?.url || item?.link || indexPath);
const hasItemPath = (item) => Boolean(String(item?.url || item?.link || ''));
const normalizePathComparable = (path) => String(path || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');

const getItemPath = (item) => {
    const p = String(item?.url || item?.link || '');
    return p ? (p.startsWith('/') ? p : `/${p}`) : '';
};

const getRouteParam = (value) => Array.isArray(value) ? value[0] : value;

function useCurrentPathComparable() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    return normalizePathComparable(getRouteParam(params?.url) || pathname);
}

function buildExpandedMapForPath(items = [], currentPathComparable, parentIndexPath = '') {
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

function hasActiveDescendant(item, currentPathComparable) {
    const itemPath = String(item?.url || item?.link || '');
    const itemPathComparable = normalizePathComparable(itemPath);
    if (itemPathComparable && itemPathComparable === currentPathComparable) return true;
    const children = item?.subitems || [];
    return children.some((child) => hasActiveDescendant(child, currentPathComparable));
}

function WikiMenuItem({ title, icon, isActive, iconEnd }) {
    const iconClassName = isActive
        ? 'text-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground'
    const iconBackgroundClassName = isActive
        ? ' '
        : ' '

    return (
        <Row className="min-h-8 items-center gap-2">
            <View className={`h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBackgroundClassName}`}>
                {isEmoji(icon) ? (
                    <Text className="text-xs leading-none">{icon}</Text>
                ) : (
                    <Icon icon={icon} size={15} className={iconClassName} />
                )}
            </View>

            <Text className={`min-w-0 flex-1 text-sm leading-snug font-medium ${isActive ? 'text-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>
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

const ActiveMenuLink = memo(function ActiveMenuLink({ itemPath, title, icon }) {
    const currentPathComparable = useCurrentPathComparable();
    const itemPathComparable = normalizePathComparable(itemPath);
    const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
    const activeWrapperClassName = isActive ? 'u-link-ghost-active rounded-lg' : '';

    return (
        <Link
            href={itemPath}
            alt={title}
            variant="ghost"
            size="sm"
            className={`web:group ${activeWrapperClassName}`.trim()}
        >
            <WikiMenuItem title={title} icon={icon} isActive={isActive} />
        </Link>
    );
});

function ActiveBranchExpander({ items, setExpandedMap }) {
    const currentPathComparable = useCurrentPathComparable();

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

function getMenuItemsSignature(items = []) {
    return JSON.stringify(items.map((item) => ({
        id: item?.id,
        name: item?.name,
        title: item?.title,
        icon: item?.icon,
        url: item?.url,
        link: item?.link,
        subitems: getMenuItemsSignature(item?.subitems || []),
    })));
}

function getBlockWrapperSignature(blockWrapperProps) {
    const block = blockWrapperProps?.block || {};
    return JSON.stringify({
        id: block.id,
        title: block.title,
        designbox_id: block.designbox_id,
        wrapperClassses: blockWrapperProps?.wrapperClassses,
        showBg: blockWrapperProps?.showBg,
        showTitle: blockWrapperProps?.showTitle,
        showPadding: blockWrapperProps?.showPadding,
    });
}

function areMenuPropsEqual(prevProps, nextProps) {
    return (
        getMenuItemsSignature(prevProps.data?.content?.items || []) === getMenuItemsSignature(nextProps.data?.content?.items || []) &&
        getBlockWrapperSignature(prevProps.blockWrapperProps) === getBlockWrapperSignature(nextProps.blockWrapperProps)
    );
}

function ElementMenu({ data, blockWrapperProps, url }) {
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
            const icon = item?.icon || 'Circle';
            const canNavigate = hasItemPath(item);

            return (
                <View key={`lmenu-${itemId}`} className={`w-full ${depthClassName}`}>
                    {canNavigate ? (
                        <ActiveMenuLink
                            itemPath={itemPath}
                            title={title}
                            icon={icon}
                        />
                    ) : (
                        <Pressable
                            className="web:group flex-1 rounded-lg"
                            onPress={hasChildren && !canNavigate ? () => toggleExpanded(itemId) : undefined}
                        >
                            <WikiMenuItem title={title} icon={icon} isActive={false} iconEnd={hasChildren ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : null} />
                        </Pressable>
                    )}
                    {hasChildren && isExpanded && (
                        <View className="mt-1.5 gap-1.5">
                            {renderItems(children, depth + 1, indexPath)}
                        </View>
                    )}
                </View>
            );
        });

    return (
        <BlockWrapper {...blockWrapperProps}>
            <ActiveBranchExpander items={topLevelItems} setExpandedMap={setExpandedMap} />
            <View className='w-full gap-1.5'>
                {renderItems(topLevelItems)}
            </View>
        </BlockWrapper>
    );
}

export default memo(ElementMenu, areMenuPropsEqual)
