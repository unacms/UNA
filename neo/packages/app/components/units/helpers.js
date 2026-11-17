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
import { appSetting, cn, tp, sanitazeUrl, withMenuButtonParams } from 'app/lib/util';
import { getUnitMenuItems } from 'app/customization/functions';
import { useCurrentUser } from 'app/context/user';
import { CONNECTIONS_PREVIEW_MAX, getCardCountParts, getCardPreviewLists, mergeConnectionProfiles } from 'app/lib/profile-connections';
import { getContentCardImage, getContentCardPrice, getContentCardSummary, getContentCardTime } from 'app/lib/content-card';
import Time from 'app/ui/atoms/time';
import { UnitActionWidthContext } from 'app/components/units/unit-action-width';
import { useRouter, useCurrentTabPath, useFocusEffect } from 'app/lib/hooks/router';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
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

/**
 * A card's counts as it shows them, as UNA's site card does (lib/profile-connections.ts getCardCountParts): a group's
 * members, a profile's friends (the ones it shares with the viewer, when there are any) and followers, an event's
 * "going" and "interested", each as its count text ("2 friends"). A count of zero is left out, so a card with none
 * has no part. A group, an event or a space that is not public says so first, as the site's card does.
 */
export function getProfileConnectionsParts(data) {
    const isContext = data?.module === 'bx_groups' || data?.module === 'bx_events' || data?.module === 'bx_spaces';
    const isPrivate = isContext && data?.visibility !== undefined && data?.visibility !== null && String(data.visibility) !== '3';
    return [
        ...(isPrivate ? [{ key: 'privacy', label: i18n.t('Private') }] : []),
        ...getCardCountParts(data).map((part) => ({ key: part.key, label: tp(part.labelKey, part.count, false) })),
    ]
        .map((part) => ({ ...part, label: String(part.label || '').trim() }))
        .filter((part) => part.label);
}

/** The same as one text: "2 friends · 5 followers". */
export function getProfileConnectionsLabel(data) {
    return getProfileConnectionsParts(data).map((part) => part.label).join(' · ');
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

    // The card of the viewer's current profile. A person's `author_data` is its own profile; a group's or an
    // organization's is the profile that made it, which is not the card.
    const { currentUser } = useCurrentUser();
    const cardProfileId = (data?.module ?? module) === 'bx_persons' ? data?.author_data?.id : null;
    const isOwn = !!currentUser?.id && !!cardProfileId && String(currentUser.id) === String(cardProfileId);

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
        }, t, module, { isOwn }),
        [unitType, data, module, t, isOwn],
    );
}

// Mobile rows use the theme's `xl` avatar (56px), like Messages and
// Notifications; the sm+ grid shows the photo as a full-width square.
// Its corners there are 12px (rounded-xl): the card's 20px (rounded-block) less its 8px padding, so they run parallel.
const ROW_AVATAR = appSetting('theme', 'profile_sizes', 'xl');

// Profile row name and count line: the feed author / Messages title type, then
// a 20px line like the Messages snippet, with no gap between them.
export const PROFILE_ROW_NAME = 'text-base leading-6 font-semibold tracking-tight text-foreground web:hover:underline';
export const PROFILE_ROW_NAME_SKELETON = 'h-4 my-1 w-3/4';
export const PROFILE_ROW_COUNT = 'truncate text-sm leading-5 font-normal flex-auto text-secondary-foreground';
// A line that belongs to the name (an event's date): the count line's type.
const PROFILE_ROW_SUBTITLE = 'truncate text-sm leading-5 font-normal text-secondary-foreground';

export function UnitProfileImage({
    data,
    skeleton,
    skeletonClassName = `${ROW_AVATAR.container} sm:h-auto sm:w-full aspect-square`,
    rounded = 'rounded-full sm:rounded-xl',
}) {
    // The picture; a card with none of its own (a group, an event) shows its cover in the picture's place, and the
    // letter where it has neither, as UNA's site card does.
    const src = data?.image?.src || data?.cover?.src;
    return (
        <Skeleton className={skeletonClassName} rounded={rounded} visible={skeleton}>
            <View className={`${ROW_AVATAR.container} sm:h-auto sm:w-full aspect-square rounded-full sm:rounded-xl overflow-hidden items-center bg-muted justify-center`}>
                <Image
                    src={src}
                    alt={data.title}
                    view="cover"
                    className="absolute u-cover rounded-full sm:rounded-xl"
                    sizes="auto"
                />
                {src ? null : (
                    <Letter
                        title={data?.fullname || data?.title}
                        id={data?.author_data?.id}
                        className="w-full h-full rounded-full sm:rounded-xl"
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

/**
 * The count text UnitProfileList shows ("6 friends · 2 followers", "12 members"); '' when there is none. `profile`: the
 * unit is a profile's card (People, Organizations), which shows its connections on every list, not only the
 * connections' own (a `unitType`).
 */
export function getProfileListLabel({
    data,
    label,
    unitType,
    profile = false,
    listKey = 'members_list',
    countKey = 'members',
    fallbackCountKey,
}) {
    const primaryCount =
        listKey === 'followers_list' ? data?.followers_count : data?.members_count
    const resolved = unitType || profile
        ? getProfileConnectionsLabel(data)
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
    /** A profile's card: its connections text on every list (see getProfileListLabel). */
    profile = false,
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
        profile,
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
    // The button is the first item of the unit's meta menu, so its look is that menu's in UNA (Studio >
    // Navigation > the snippet meta menu > "Button style" / "Button size"). Borderless and small are the
    // defaults for a menu UNA leaves on Automatic.
    const buttonParams = withMenuButtonParams(
        { button_style_default: 'borderless', button_size_default: 'small', ...params },
        data.meta
    );
    return (
        <Recommendation
            {...itemData}
            primary={primary}
            params={{
                ...buttonParams,
                button_style: buttonParams.button_style ?? 'borderless',
                button_size: recommendationControlSize(buttonParams.button_size),
                button_full_width: false,
                only_icon: params?.only_icon ?? isIgnore,
                button_border_shape: params?.button_border_shape ?? (isIgnore ? 'circle' : undefined),
            }}
        />
    );
}

/**
 * A card's connections line (20px high): the counts as one text ("2 friends · 5 followers"), and in the card
 * grid (from `sm` up) one group of avatars before it: the first of a group's members and of the profile's mutual
 * friends, friends and followers, each person once and without the viewer (lib/profile-connections.ts), as on UNA's site card. A phone row
 * has room for the text only. The avatars are not links: the card itself is one. They are 20px and go through the
 * image optimizer at that size (`Profile`), never the stored picture as it is.
 */
export function UnitProfileConnections({ data, skeleton, labelClassName = PROFILE_ROW_COUNT, maxCount = CONNECTIONS_PREVIEW_MAX }) {
    const { currentUser } = useCurrentUser();
    const label = skeleton ? '' : getProfileConnectionsLabel(data);
    const profiles = skeleton || !label
        ? []
        : mergeConnectionProfiles(
            getCardPreviewLists(data),
            { max: maxCount, exclude: currentUser?.id },
        );
    return (
        <Row className="items-center gap-1 h-5 min-w-0">
            <Skeleton className="h-4 w-20" visible={skeleton}>
                {profiles.length > 0 ? (
                    <View className="hidden sm:flex flex-none">
                        <ProfilesList
                            data={profiles}
                            showEmpty={false}
                            maxCount={maxCount}
                            displaySize="2xs"
                            showLinks={false}
                        />
                    </View>
                ) : null}
                {label ? <Text numberOfLines={1} className={labelClassName}>{label}</Text> : null}
            </Skeleton>
        </Row>
    );
}

/**
 * The card of a profile or a context in a list: people, organizations, groups, events and spaces share it, as on UNA's
 * site (unit_card.html). Below `sm` it is a row: a round picture, the name over the counts, and the buttons as icons
 * at the end. From `sm` it is the grid card: a square picture with 12px corners inside the card's 8px padding, the
 * name, the counts 8px under it (like the two buttons), then the buttons 12px lower, full width. `subtitle` is a
 * line that belongs to the name (an event's date), 4px under it.
 */
export function UnitProfileCard({ data, unitType, module, subtitle = null }) {
    const { t } = useTranslation();
    const { primaryMenuItem, secondaryMenuItem, deleteMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    });

    const isSkeleton = data?.skeleton;
    // No count: drop the line so the name centres on the photo (mobile).
    const hasCount = isSkeleton || !!getProfileConnectionsLabel(data);
    const hasSubtitle = !!subtitle;

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-3 sm:p-2">
            <View className="flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-1">
                <UnitProfileImage data={data} skeleton={isSkeleton} />
                {deleteMenuItem ? <View className="hidden sm:flex absolute right-1 top-1 z-10 shrink-0">{deleteMenuItem}</View> : null}
                <View className="flex-row sm:flex-col items-center sm:items-stretch sm:p-1 sm:justify-between gap-2 sm:gap-3 flex-auto min-w-0">
                    {/* The grid card: 24px name + 8px + 20px counts (with a date: 24px + 4px + 20px + 8px + 20px);
                        the block keeps its height on a card with no counts, so every card's buttons line up. */}
                    <View className={cn('sm:gap-2 flex-1 sm:flex-none min-w-0', hasSubtitle ? 'sm:h-19' : 'sm:h-13')}>
                        <View className="sm:gap-1 min-w-0">
                            <UnitTitle
                                title={data.title}
                                skeleton={isSkeleton}
                                numberOfLines={1}
                                className={PROFILE_ROW_NAME}
                                skeletonClassName={PROFILE_ROW_NAME_SKELETON}
                            />
                            {hasSubtitle ? (
                                <Skeleton visible={isSkeleton} className="h-4 w-1/2">
                                    <Text numberOfLines={1} className={PROFILE_ROW_SUBTITLE}>{subtitle}</Text>
                                </Skeleton>
                            ) : null}
                        </View>
                        {hasCount ? (
                            <UnitProfileConnections data={data} skeleton={isSkeleton} />
                        ) : null}
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-none flex-row sm:flex-col gap-2"
                        primaryClassName="sm:w-full"
                        compactOnMobile
                        secondaryClassName="sm:w-full"
                        skeletonClassName="h-9 w-24 sm:w-full"
                    />
                    {deleteMenuItem ? <View className="sm:hidden flex-none">{deleteMenuItem}</View> : null}
                </View>
            </View>
        </UnitWrapper>
    );
}

// A content card's title: the profile card's name type on up to two lines.
const CONTENT_CARD_TITLE = 'text-base leading-6 font-semibold tracking-tight text-foreground web:hover:underline';
const CONTENT_CARD_TEXT = 'text-sm leading-5 font-normal text-secondary-foreground';

/**
 * A content card's last line (20px): the author's 20px avatar, "Name · 3 days ago", and the price at the end where the
 * item has one. The avatar is no link: the card is one.
 */
export function UnitContentByline({ data, skeleton }) {
    const author = data?.author_data;
    const ts = getContentCardTime(data);
    const price = getContentCardPrice(data);
    return (
        <Skeleton preset="author" className="h-5 w-32" visible={skeleton}>
            <Row className="items-center gap-1 h-5 min-w-0">
                {author?.display_name ? (
                    <>
                        <View className="flex-none pointer-events-none">
                            <Profile
                                url_avatar={author.url_avatar}
                                display_name={author.display_name}
                                id={author.id}
                                displayType="unit_wo_info"
                                displaySize="2xs"
                                showLinks={false}
                            />
                        </View>
                        <Text numberOfLines={1} className={cn(CONTENT_CARD_TEXT, 'flex-shrink min-w-0')}>{author.display_name}</Text>
                    </>
                ) : null}
                {ts ? (
                    <>
                        {author?.display_name ? <Text className={cn(CONTENT_CARD_TEXT, 'flex-none')}>·</Text> : null}
                        <Time ts={ts} stylesName={cn(CONTENT_CARD_TEXT, 'flex-none')} />
                    </>
                ) : null}
                {price ? (
                    <Text numberOfLines={1} className="ml-auto pl-2 flex-none text-sm leading-5 font-semibold text-foreground">{price}</Text>
                ) : null}
            </Row>
        </Skeleton>
    );
}

/**
 * The card of a content item in a list (a post, an ad, a poll, a product, a file, a photo, an album, a video), as
 * UNA's site draws it (`modules/base/general/template/css/unit_content_card.css`). The whole card is the link; it has
 * no buttons.
 *
 * From `sm` it is the grid card: the picture (16:9, 12px corners inside the card's 8px padding) where the item has
 * one, the title on up to two lines, the summary, and the byline at the card's foot, so the bylines of a row line up.
 * An item without a picture draws no empty box. Below `sm` it is a row: a 56px thumbnail, the title over the byline.
 */
export function UnitContentCard({ data, module, listIndex, summary = true }) {
    const isSkeleton = data?.skeleton;
    const image = getContentCardImage(data);
    const showMedia = isSkeleton || !!image;
    const summaryText = summary && !isSkeleton ? getContentCardSummary(data) : '';

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-3 sm:p-2" className="sm:h-full">
            <View className="flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-1 sm:flex-1">
                {showMedia ? (
                    <View className={`${ROW_AVATAR.container} sm:h-auto sm:w-full aspect-square sm:aspect-video flex-none rounded-xl overflow-hidden bg-muted`}>
                        <UnitImage
                            image={image}
                            alt={data.title}
                            skeleton={isSkeleton}
                            view="cover"
                            className="absolute u-cover"
                            skeletonClassName="h-full w-full"
                            rounded="rounded-xl"
                            priority={listIndex === 0}
                        />
                    </View>
                ) : null}
                <View className="flex-auto sm:flex-1 min-w-0 sm:p-1 gap-1 sm:gap-3">
                    <View className="gap-1 min-w-0">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={2}
                            className={CONTENT_CARD_TITLE}
                            skeletonClassName={PROFILE_ROW_NAME_SKELETON}
                        />
                        {summaryText ? (
                            <View className="hidden sm:flex">
                                <Text numberOfLines={2} className={CONTENT_CARD_TEXT}>{summaryText}</Text>
                            </View>
                        ) : null}
                    </View>
                    <View className="sm:mt-auto">
                        <UnitContentByline data={data} skeleton={isSkeleton} />
                    </View>
                </View>
            </View>
        </UnitWrapper>
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
