import { useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Image from 'app/ui/atoms/image';
import Letter from 'app/ui/atoms/letter';
import Link from 'app/ui/atoms/link';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { Button } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile/profile';
import ProfilesList from 'app/ui/molecules/profile/profile-list';
import Badge from 'app/ui/molecules/profile/badge';
import { Skeleton } from 'app/ui/atoms/skeleton';
import { getComponent } from 'app/components/registry';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, tp } from 'app/lib/util';
import { getUnitMenuItems } from 'app/customization/functions';
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router';
import { nativeTabHref } from 'app/lib/tab-history';
import { useTranslation } from 'react-i18next';
import { Card, CardList } from 'app/ui/molecules/page/card';
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal';

const UNIT_SURFACES = { card: Card, list: CardList };

export function getShowInModal(module) {
    return appSetting('browse', 'show_in_modal', module);
}

export function UnitWrapper({
    data,
    module,
    as = 'card',
    padding,
    className,
    children,
}) {
    const Surface = UNIT_SURFACES[as] || Card;
    return (
        <LinkOrModal href={data.url} showInModal={getShowInModal(module ?? data.module)}>
            <Surface padding={padding} className={className}>
                {children}
            </Surface>
        </LinkOrModal>
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
    if (isFollowers) return `${data?.followers_count} followers`;
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
                    : nativeTabHref(url, tabPathRef.current),
            );
        }, t, module),
        [unitType, data, module, t],
    );
}

export function UnitProfileImage({
    data,
    skeleton,
    skeletonClassName = 'h-28 sm:h-auto aspect-square sm:w-full',
    rounded = 'rounded-lg',
}) {
    return (
        <Skeleton className={skeletonClassName} rounded={rounded} visible={skeleton}>
            <View className="h-28 sm:h-auto aspect-square sm:w-full rounded-lg overflow-hidden items-center bg-muted justify-center">
                <Image
                    src={data?.image?.src}
                    alt={data.title}
                    view="cover"
                    className="absolute u-cover rounded-lg"
                    sizes="auto"
                />
                {data?.image?.src ? null : (
                    <Letter title={data?.fullname} id={data?.author_data?.id} />
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
}) {
    const isFollowers = !!unitType && isFollowersUnitType(unitType)
    const list = unitType
        ? getPersonSocialList(data, { isFollowers })
        : data?.[listKey]
    const primaryCount =
        listKey === 'followers_list' ? data?.followers_count : data?.members_count
    const resolvedLabel = unitType
        ? getPersonSocialLabel(data, { isFollowers })
        : (label ?? (
            getCountLabel(primaryCount, countKey) ||
            (fallbackCountKey
                ? getCountLabel(data?.members_count, fallbackCountKey)
                : '')
        ))

    return (
        <Skeleton preset="profile-list" visible={skeleton}>
            <Row className="items-center gap-1 min-w-0 flex-auto">
                <ProfilesList
                    data={list}
                    showEmpty={false}
                    maxCount={maxCount}
                    displaySize={displaySize}
                />
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
    primaryClassName = 'w-full',
    secondaryClassName = 'w-full',
    inlineSecondary = false,
}) {
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
        <View className={className}>
            <View className={primaryClassName}>
                <Skeleton className="h-9 w-full" rounded="rounded-lg" visible={skeleton}>
                    {primaryMenuItem}
                    {inlineSecondary ? secondary : null}
                </Skeleton>
            </View>
            {inlineSecondary ? null : secondary}
        </View>
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
            <Button
                title={t('Accept')}
                size={size}
                variant={variant}
                rounded
                onPress={() => processInvitation(data.callback_accept)}
            />
            <Button
                title={t('Decline')}
                size={size}
                variant={variant}
                rounded
                onPress={() => processInvitation(data.callback_decline)}
            />
        </Row>
    );
}

export function UnitRecommendation({ data, params, primary = false }) {
    const itemData = data?.meta?.items?.[0]?.data;
    if (!itemData) return null;

    const Recommendation = getComponent('molecule', 'recommendation');
    return <Recommendation {...itemData} primary={primary} params={params} />;
}

export function UnitProfileRow({
    data,
    displaySize = 'sm',
    className = 'flex-row p-2 rounded-xl web:active:opacity-90 web:hover:bg-muted/50 items-center',
    titleClassName = 'text-sm px-1.5 leading-tight font-semibold text-secondary-foreground',
    linkProps,
    meta,
}) {
    return (
        <Link href={data.url} emulate={true} {...linkProps}>
            <View className={className}>
                <Profile
                    url_avatar={data?.image?.src}
                    displayType="unit_wo_info"
                    displaySize={displaySize}
                    display_name={data.title}
                />
                <View className="flex-row justify-between flex-auto items-center">
                    <Text numberOfLines={2} className={titleClassName}>
                        {data.title}
                    </Text>
                    {meta ? <View className="flex-none">{meta}</View> : null}
                </View>
            </View>
        </Link>
    );
}
