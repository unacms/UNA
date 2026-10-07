import { useMemo, useRef, useState, useCallback, createContext, use } from 'react';
import { Platform } from 'react-native';
import Image from 'app/ui/atoms/image';
import Letter from 'app/ui/atoms/letter';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton, legacyToNeoButtonProps } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import ProfilesList from 'app/ui/molecules/profile/profile-list';
import Badge from 'app/ui/molecules/profile/badge';
import { Skeleton } from 'app/ui/atoms/skeleton';
import { components } from 'app/components/registry';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn, tp, sanitazeUrl } from 'app/lib/util';
import { getUnitMenuItems } from 'app/customization/functions';
import { UnitActionWidthContext } from 'app/components/units/unit-action-width';
import { useRouter, useCurrentTabPath, useFocusEffect } from 'app/lib/hooks/router';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { useTranslation } from 'react-i18next';
import { Card, CardList } from 'app/ui/molecules/page/card';
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal';
import { NeoButtonLink } from 'app/design/controls'
import { FLUSH_LIST_MODULES } from 'app/components/units/flush-list';

const UNIT_SURFACES = { card: Card, list: CardList };

// Mobile: 16px inside the edge-to-edge row (u-card-list-flush), so the photo
// lines up with the 16px page header and subtabs.
const FLUSH_LIST_PADDING = 'px-4 py-2 sm:p-2';
const FLUSH_ACTION_PRIMARY = 'w-1/2 sm:w-full pr-2 sm:pr-0';

const UnitSurfaceContext = createContext(false);

function shouldFlushListSurface(as, module, data) {
    if (as !== 'list') return false;
    return (
        FLUSH_LIST_MODULES.has(module)
        || FLUSH_LIST_MODULES.has(data?.module)
    );
}

export function getShowInModal(module) {
    return appSetting('browse', 'show_in_modal', module);
}

function shouldIgnoreFlushNavStart(event) {
    if (!event) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
    if (typeof event.button === 'number' && event.button !== 0) return true;
    const target = event.target;
    if (target && typeof target.closest === 'function') {
        const nested = target.closest('button, [role="button"]');
        if (nested && nested !== event.currentTarget) return true;
    }
    return false;
}

function UnitSurface({
    data,
    module,
    as = 'card',
    padding,
    className,
    children,
    flushOnMobile = false,
    navPending = false,
    flushNavProps,
}) {
    const Surface = UNIT_SURFACES[as] || Card;
    return (
        <UnitSurfaceContext.Provider value={flushOnMobile}>
            <LinkOrModal
                href={data.url}
                showInModal={getShowInModal(module ?? data.module)}
                className={flushOnMobile ? 'group' : undefined}
                {...flushNavProps}
            >
                <Surface
                    padding={flushOnMobile ? FLUSH_LIST_PADDING : padding}
                    className={className}
                    flushOnMobile={flushOnMobile}
                    data-nav={flushOnMobile && navPending ? 'pending' : undefined}
                    aria-busy={flushOnMobile && navPending ? true : undefined}
                >
                    {flushOnMobile && Platform.OS !== 'web' && navPending ? (
                        <View
                            pointerEvents="none"
                            className="absolute inset-0 sm:rounded-2xl bg-muted/60 animate-pulse"
                        />
                    ) : null}
                    {children}
                </Surface>
            </LinkOrModal>
        </UnitSurfaceContext.Provider>
    );
}

function FlushNavigatingUnit({ data, module, as, padding, className, children }) {
    const router = useRouter();
    const [navPending, setNavPending] = useState(false);

    const onFlushNavStart = useCallback((event) => {
        if (shouldIgnoreFlushNavStart(event)) return;
        if (Platform.OS === 'web') {
            event?.currentTarget?.querySelector?.('.u-card-list')?.setAttribute('data-nav', 'pending');
        }
        setNavPending(true);
        const href = sanitazeUrl(data?.url);
        if (href && typeof router.prefetch === 'function') {
            try {
                router.prefetch(href);
            } catch {
                // Prefetch is best-effort; click still navigates.
            }
        }
    }, [data?.url, router]);

    useFocusEffect(useCallback(() => {
        setNavPending(false);
    }, []));

    // A press that turns into a scroll never fires the tap, so drop the pending
    // fill then instead of leaving it pulsing until the screen refocuses.
    // Native: onPress fires right after onPressOut on a real tap. Web: touch
    // scrolling cancels the pointer; a mouse released off the row gets no click.
    const pressedRef = useRef(false);
    const clearNavPending = useCallback((el) => {
        el?.querySelector?.('.u-card-list')?.removeAttribute('data-nav');
        setNavPending(false);
    }, []);
    const flushNavProps = Platform.OS === 'web'
        ? {
            onPointerDown: (event) => {
                pressedRef.current = false;
                onFlushNavStart(event);
            },
            // Link rows report the tap through onClick, modal rows through onPress.
            onClick: () => {
                pressedRef.current = true;
            },
            onPress: () => {
                pressedRef.current = true;
            },
            onPointerCancel: (event) => clearNavPending(event.currentTarget),
            onPointerUp: (event) => {
                const el = event.currentTarget;
                setTimeout(() => {
                    if (!pressedRef.current) clearNavPending(el);
                }, 300);
            },
        }
        : {
            onPressIn: (event) => {
                pressedRef.current = false;
                onFlushNavStart(event);
            },
            onPress: () => {
                pressedRef.current = true;
            },
            onPressOut: () => {
                setTimeout(() => {
                    if (!pressedRef.current) setNavPending(false);
                }, 0);
            },
        };

    return (
        <UnitSurface
            data={data}
            module={module}
            as={as}
            padding={padding}
            className={className}
            flushOnMobile
            navPending={navPending}
            flushNavProps={flushNavProps}
        >
            {children}
        </UnitSurface>
    );
}

export function UnitWrapper({
    data,
    module,
    as = 'card',
    padding,
    className,
    children,
}) {
    const flushOnMobile = shouldFlushListSurface(as, module, data);
    if (flushOnMobile) {
        return (
            <FlushNavigatingUnit
                data={data}
                module={module}
                as={as}
                padding={padding}
                className={className}
            >
                {children}
            </FlushNavigatingUnit>
        );
    }
    return (
        <UnitSurface
            data={data}
            module={module}
            as={as}
            padding={padding}
            className={className}
        >
            {children}
        </UnitSurface>
    );
}

export function resolveUnitVariant(Units, { module, unitType, mode } = {}) {
    if (mode === 'search' && Units.Search) return Units.Search;
    const map =
        appSetting('browse', 'unit_by_mode_' + module) ||
        appSetting('browse', 'unit_by_mode_default') ||
        {};
    return Units[map[unitType] || 'Base'];
}

export function getCountLabel(count, key, { value, isHideData } = {}) {
    if (!(count > 0)) return '';
    return tp(key, value ?? count, isHideData);
}

function getVisibilityMeta(visibility, t) {
    const isPublic = String(visibility) === '3';
    return {
        label: t(isPublic ? 'Public' : 'Private'),
        icon: isPublic ? 'Globe' : 'Lock',
        color: isPublic ? 'blue' : 'gray',
    };
}

function isFollowersUnitType(unitType) {
    return (
        unitType === 'person_followers' ||
        unitType === 'person_following' ||
        unitType === 'person_following_recommendations'
    );
}

function getPersonSocialLabel(data, { isFollowers } = {}) {
    if (isFollowers) return tp('followers', data?.followers_count ?? 0, false);
    if (data?.mutual_friends_count > 0) {
        return tp('mutual_friends', data.mutual_friends_count, false);
    }
    return tp('friends', data?.friends_count, false);
}

function getPersonSocialList(data, { isFollowers } = {}) {
    if (isFollowers) return data?.followers_list;
    if (data?.mutual_friends_count > 0) return data?.mutual_friends_list;
    return data?.friends_list;
}

export function getPostedTs(data) {
    return data?.date || data?.added || data?.created;
}

export function getMetaItem(data, name) {
    return data?.meta?.items?.find((item) => item.name === name);
}

export function getStarsRatingData(data) {
    const item = data?.meta?.items?.find(
        (entry) => entry.name === 'votes' && entry.data?.type === 'stars',
    );
    if (!item) return null;
    return {
        ...item.data,
        params: { ...item.data.params, show_counter: false },
    };
}

export function useUnitActions({ unitType, data, module, t = null }) {
    const router = useRouter();
    const tabPath = useCurrentTabPath();
    const routerRef = useRef(router);
    const tabPathRef = useRef(tabPath);
    routerRef.current = router;
    tabPathRef.current = tabPath;

    return useMemo(
        () => getUnitMenuItems(unitType, data, (event, url) => {
            event?.preventDefault?.();
            const currentRouter = routerRef.current;
            if (!currentRouter || !url) return;
            currentRouter.push(
                Platform.OS === 'web'
                    ? url
                    : nativeTabPageHref(url, tabPathRef.current),
            );
        }, t, module),
        [unitType, data, module, t],
    );
}

// Mobile rows use the theme's `xl` avatar (56px), like Messages and
// Notifications; the sm+ grid shows the photo as a full-width square.
const ROW_AVATAR = appSetting('theme', 'profile_sizes', 'xl');

// Profile row name and count line: the feed author / Messages title type, then
// a 20px line like the Messages snippet, with no gap between them.
export const PROFILE_ROW_NAME = 'text-base leading-6 font-semibold tracking-tight text-foreground web:hover:underline';
export const PROFILE_ROW_NAME_SKELETON = 'h-4 my-1 w-3/4';
export const PROFILE_ROW_COUNT = 'truncate text-sm leading-5 font-normal flex-auto text-secondary-foreground';

export function UnitProfileImage({
    data,
    skeleton,
    skeletonClassName = `${ROW_AVATAR.container} sm:h-auto sm:w-full aspect-square`,
    rounded = 'rounded-full sm:rounded-lg',
}) {
    return (
        <Skeleton className={skeletonClassName} rounded={rounded} visible={skeleton}>
            <View className={`${ROW_AVATAR.container} sm:h-auto sm:w-full aspect-square rounded-full sm:rounded-lg overflow-hidden items-center bg-muted justify-center`}>
                <Image
                    src={data?.image?.src}
                    alt={data.title}
                    view="cover"
                    className="absolute u-cover rounded-full sm:rounded-lg"
                    sizes="auto"
                />
                {data?.image?.src ? null : (
                    <Letter
                        title={data?.fullname || data?.title}
                        id={data?.author_data?.id}
                        className="w-full h-full rounded-full sm:rounded-lg"
                        textClassName={`${ROW_AVATAR.letter_font} sm:text-6xl xl:text-7xl`}
                    />
                )}
            </View>
        </Skeleton>
    );
}

export function UnitTitle({
    title,
    skeleton,
    numberOfLines = 2,
    className = 'text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-5 font-semibold',
    skeletonClassName = 'h-5 w-3/4',
}) {
    return (
        <Skeleton className={skeletonClassName} visible={skeleton}>
            <Text numberOfLines={numberOfLines || undefined} className={className}>
                {title}
            </Text>
        </Skeleton>
    );
}

export function UnitText({
    text,
    skeleton,
    numberOfLines = 2,
    className,
    skeletonClassName,
    rounded = 'rounded-lg',
}) {
    return (
        <Skeleton className={skeletonClassName} rounded={rounded} visible={skeleton}>
            <Text numberOfLines={numberOfLines} className={className}>
                {text}
            </Text>
        </Skeleton>
    );
}

export function UnitAuthor({ authorData, skeleton, displaySize = 'xs', className, children }) {
    const content = (
        <Skeleton preset="author" visible={skeleton}>
            <Profile
                {...authorData}
                displayType="unit"
                displaySize={displaySize}
                showInfo={children || false}
                emulate
            />
        </Skeleton>
    );
    if (!className) return content;
    return <View className={className}>{content}</View>;
}

export function UnitImage({
    image,
    alt,
    skeleton,
    priority,
    view,
    className = 'u-cover',
    skeletonClassName,
    rounded = 'rounded-lg',
    optimizedWidthCap = 640,
    sizes = 'auto',
}) {
    return (
        <Skeleton className={skeletonClassName} rounded={rounded} visible={skeleton}>
            {image ? (
                <Image
                    {...image}
                    alt={alt}
                    view={view}
                    className={className}
                    sizes={sizes}
                    optimizedWidthCap={optimizedWidthCap}
                    priority={priority}
                />
            ) : null}
        </Skeleton>
    );
}

/** The count text UnitProfileList shows ("6 friends", "12 members"); '' when there is none. */
export function getProfileListLabel({
    data,
    label,
    unitType,
    listKey = 'members_list',
    countKey = 'members',
    fallbackCountKey,
}) {
    const primaryCount =
        listKey === 'followers_list' ? data?.followers_count : data?.members_count
    const resolved = unitType
        ? getPersonSocialLabel(data, { isFollowers: isFollowersUnitType(unitType) })
        : (label ?? (
            getCountLabel(primaryCount, countKey) ||
            (fallbackCountKey
                ? getCountLabel(data?.members_count, fallbackCountKey)
                : '')
        ))
    // en hides zero counts with a blank translation ("friends_0": " ").
    return typeof resolved === 'string' ? resolved.trim() : resolved
}

export function UnitProfileList({
    data,
    label,
    unitType,
    /** Which array on `data` to show when not a person unitType. Default: members_list */
    listKey = 'members_list',
    countKey = 'members',
    /** If primary count label is empty, try this key with members_count (events: going). */
    fallbackCountKey,
    skeleton,
    labelClassName = 'truncate text-sm tracking-tight flex-auto text-secondary-foreground',
    maxCount = 3,
    displaySize = '2xs',
    /** false: just the count label, without the avatar previews. */
    showList = true,
}) {
    const isFollowers = !!unitType && isFollowersUnitType(unitType)
    const list = unitType
        ? getPersonSocialList(data, { isFollowers })
        : data?.[listKey]
    const resolvedLabel = getProfileListLabel({
        data,
        label,
        unitType,
        listKey,
        countKey,
        fallbackCountKey,
    })

    return (
        <Skeleton preset={showList ? 'profile-list' : undefined} className="h-4 w-20" visible={skeleton}>
            <Row className="items-center gap-1 min-w-0 flex-auto">
                {showList ? (
                    <ProfilesList
                        data={list}
                        showEmpty={false}
                        maxCount={maxCount}
                        displaySize={displaySize}
                    />
                ) : null}
                {resolvedLabel ? (
                    <Text className={labelClassName}>{resolvedLabel}</Text>
                ) : null}
            </Row>
        </Skeleton>
    );
}

export function UnitVisibility({
    visibility,
    skeleton,
    size = 'xs',
    className = 'flex-none',
    skeletonClassName = 'h-5 w-16 flex-none',
}) {
    const { t } = useTranslation();
    const meta = getVisibilityMeta(visibility, t);
    return (
        <Skeleton visible={skeleton} className={skeletonClassName}>
            <Badge
                data={{
                    text: meta.label,
                    icon: meta.icon,
                    color: meta.color,
                }}
                size={size}
                className={className}
            />
        </Skeleton>
    );
}

export function UnitActions({
    primaryMenuItem,
    secondaryMenuItem,
    skeleton,
    className = 'flex-row sm:flex-col gap-2',
    primaryClassName,
    secondaryClassName = 'w-full',
    inlineSecondary = false,
    /** Give it a width when the buttons size to their content (no w-full parent). */
    skeletonClassName = 'h-9 w-full',
    /** Buttons hug their label below `sm` (profile rows on phones); see unit-action-width.js. */
    compactOnMobile = false,
}) {
    const flushOnMobile = use(UnitSurfaceContext);
    const resolvedPrimaryClassName = primaryClassName ?? (
        flushOnMobile ? FLUSH_ACTION_PRIMARY : 'w-full'
    );
    const secondary = secondaryMenuItem ? (
        <View
            className={
                inlineSecondary
                    ? (primaryMenuItem ? 'sm:mt-2 ml-2 sm:ml-0' : undefined)
                    : secondaryClassName
            }
        >
            {secondaryMenuItem}
        </View>
    ) : null;

    return (
        <UnitActionWidthContext value={compactOnMobile ? 'compact-mobile' : 'fill'}>
            <View className={className}>
                <View className={resolvedPrimaryClassName}>
                    <Skeleton className={skeletonClassName} rounded="rounded-lg" visible={skeleton}>
                        {primaryMenuItem}
                        {inlineSecondary ? secondary : null}
                    </Skeleton>
                </View>
                {inlineSecondary ? null : secondary}
            </View>
        </UnitActionWidthContext>
    );
}

export function useInvitationAction() {
    const [dismissed, setDismissed] = useState(false);

    const processInvitation = async (request_url) => {
        await fetcher(request_url);
        setDismissed(true);
    };

    return { dismissed, processInvitation };
}

export function UnitInvitationActions({
    data,
    processInvitation,
    size = 'sm',
    variant = 'secondary',
}) {
    const { t } = useTranslation();
    if (data?.meta?.items?.[0] !== 'invitation') return null;

    return (
        <Row className="gap-x-2">
            <NeoButton
                {...legacyToNeoButtonProps({ variant, size, rounded: true, title: t('Accept') })}
                expoUI={false}
                onPress={() => processInvitation(data.callback_accept)}
            />
            <NeoButton
                {...legacyToNeoButtonProps({ variant, size, rounded: true, title: t('Decline') })}
                expoUI={false}
                onPress={() => processInvitation(data.callback_decline)}
            />
        </Row>
    );
}

const NEO_CONTROL_SIZES = new Set(['mini', 'small', 'regular', 'large', 'xlarge']);

function recommendationControlSize(size) {
    if (NEO_CONTROL_SIZES.has(size)) return size;
    if (size === 'xs' || size === 'sm') return 'small';
    return 'small';
}

export function UnitRecommendation({ data, params, primary = false }) {
    const itemData = data?.meta?.items?.[0]?.data;
    if (!itemData) return null;

    const isIgnore = itemData.a === 'ignore';
    const Recommendation = components['molecule']['recommendation'];
    return (
        <Recommendation
            {...itemData}
            primary={primary}
            params={{
                ...params,
                button_style: params?.button_style ?? 'borderless',
                button_size: recommendationControlSize(params?.button_size),
                button_full_width: false,
                only_icon: params?.only_icon ?? isIgnore,
                button_border_shape: params?.button_border_shape ?? (isIgnore ? 'circle' : undefined),
            }}
        />
    );
}

export function UnitProfileRow({
    data,
    displaySize = 'sm',
    className,
    titleClassName,
    linkProps,
    meta,
}) {
    // Profile-list units had no skeleton UI — empty Profile rows looked broken.
    if (data?.skeleton) {
        return (
            <Row className={cn('w-full items-center py-1', className)}>
                <Skeleton visible preset="author" className="w-full" />
            </Row>
        );
    }

    const neoLinkProps = { ...(linkProps || {}) };
    const linkStyle = neoLinkProps.style;
    const linkControlSize = neoLinkProps.controlSize;
    const linkContentInsets = neoLinkProps.contentInsets;
    const linkClassNames = neoLinkProps.classNames;
    delete neoLinkProps.variant;
    delete neoLinkProps.size;
    delete neoLinkProps.emulate;
    delete neoLinkProps.style;
    delete neoLinkProps.controlSize;
    delete neoLinkProps.contentInsets;
    delete neoLinkProps.classNames;

    return (
        <Row className={cn('w-full items-center', className)}>
            <NeoButtonLink
                href={data.url}
                {...neoLinkProps}
                style={linkStyle ?? 'borderless'}
                width="fill"
                align="start"
                controlSize={linkControlSize ?? 'regular'}
                contentInsets={linkContentInsets ?? 'mediaLeading'}
                image={
                    <View className="pointer-events-none">
                        <Profile
                            url_avatar={data?.image?.src}
                            displayType="unit_wo_info"
                            displaySize={displaySize}
                            display_name={data.title}
                            showLinks={false}
                        />
                    </View>
                }
                label={data.title}
                className="group"
                classNames={{
                    ...linkClassNames,
                    text: cn(linkClassNames?.text, titleClassName),
                }}
            />
            {meta ? <View className="flex-none">{meta}</View> : null}
        </Row>
    );
}
