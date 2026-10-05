/** FOR old UNA versions only
 * Full browse block (`browse` in elements/_map).
 *
 * Fetches a paginated UNA list (`useUniListQuery` + UniList). Supports several
 * layouts: virtualized list, sidebar, showcase (one-line), gallery; filter form;
 * realtime feed updates; "Show New" snackbar; optional in-block title / View All.
 *
 * Used for UNA page blocks with content type `browse`, and imported directly by
 * notifications popup and suggestions.
 *
 * Differs from:
 * - browse-list.js — same fetch/realtime pipeline, but list-only (no showcase/gallery/title).
 * - browse-simple.tsx — no API: renders already-loaded `data.data` items.
 */
import Unit from 'app/components/unit'
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { appSetting, isObjectsEqual } from 'app/lib/util'
import { responsiveClasses } from 'app/lib/responsive-classes'
import { Text } from 'app/design/typography'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { layoutForList } from 'app/customization/functions'
import Link from 'app/ui/atoms/link'
import Galery from 'app/ui/molecules/content/gallery'
import { Button } from 'app/design/controls'
import { useWindowHeight } from 'app/context/measure';
import emitter, { EVENTS } from 'app/context/emitter'
import Snackbar from 'app/ui/atoms/snackbar'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { BlockWrapper } from 'app/components/block-wrapper'
import { useIsFocused } from 'app/lib/hooks/router'
import { useGetScrollValue } from 'app/context/jotai/layout'
import { setListScrollOffset } from 'app/lib/cache/list-scroll-cache'
import { useUniListQuery } from 'app/lib/browse-query'
import { components } from 'app/components/registry';
import { BrowseItem } from 'app/lib/common-helpers'
import { useIsDesktop } from 'app/context/measure';
import { BlockTitle } from 'app/ui/molecules/page/page-block'
const blockTheme = appSetting('theme', 'blocks');
const AT_TOP_SCROLL_THRESHOLD = 50;

export default function Browse(props) {

    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser();
    const Form = components['element']['form'];
    const isDesktop = useIsDesktop();
    const uniRef = useRef()
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);
    useEffect(() => {
        isFocusedRef.current = isFocused;
    }, [isFocused]);
    const getScrollValue = useGetScrollValue();
    //updateMode can be action, auto, none
    const updateMode = (props.updateMode || props.data.unit == 'feed') ? 'action' : 'none';
    // Props are read-only: derive a copy instead of rewriting `props.data.unit`.
    const data = useMemo(
        () => (props.data?.unit == 'mixed' ? { ...props.data, unit: 'general-profile-list' } : props.data),
        [props.data]
    );
    const isOneLine = data?.params?.view == 'showcase'
    const isOnePage = props.only_one_page || props.extraProps?.only_one_page || isOneLine;
    // Nested in the conductor list: no height is passed, so a second UniList
    // collapses to 0 on native. Draw the cards in the parent list instead.
    // Not when the list is the page scroller itself (home feed with header blocks).
    const inlineCards = !isWeb && !props.height && !props.isInPanel && !props.exProps?.headerBlocks;
    const isShowTitleInside = props?.showTitleInside || props?.extraProps?.showTitleInside || isOneLine;

    const [defParams, setDefParams] = useState({
        ...(data.params ?? {}),
        ...(props?.params ?? {}),
        moduleName: data.module ?? '',
    });
    const filterForm = data?.filter_form;

    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState({ modules: filterForm?.data?.inputs?.modules?.value, media: filterForm?.data?.inputs?.media?.value });

    /* unit mode & change unit mode */
    const unitMode = props.unitMode

    const windowHeight = useWindowHeight();

    const numColumns = props.perLine || 1;
    const personListSkeleton = appSetting('browse', 'skeletons')?.[data.unit]
    const isPersonList =
        personListSkeleton === 'bx_persons' ||
        data.module === 'bx_persons' ||
        (data.unit || '').includes('person') ||
        data.unit === 'general-profile-list'



    const handleFilterFormChange = useCallback((values) => {
        if (!isObjectsEqual(filterValues, values)) {

            setFilterValues(values)
            const transformedValues = Object.fromEntries(
                Object.entries(values).map(([key, value]) => [
                    key,
                    Array.isArray(value) ? value.join(',') : value
                ])
            );
            const by_context = transformedValues.by_context ? transformedValues.by_context.split('|') : [];
            const contexts = by_context[0] ? { type: by_context[0], context: by_context[1] } : { type: 'feed', context: '' };

            setDefParams(prev => ({
                ...prev,
                modules: transformedValues.modules,
                media: transformedValues.media,
                ...contexts
            }));
        }
    });

    // Current filter values go into a derived copy of the form config (the
    // page data object itself is never mutated).
    const formProps = useMemo(() => {
        if (!filterForm || !filterValues || !filterForm.data?.inputs) return filterForm;
        const inputs = { ...filterForm.data.inputs };
        for (const key of ['modules', 'media', 'by_context']) {
            if (inputs[key]) inputs[key] = { ...inputs[key], value: filterValues[key] };
        }
        return { ...filterForm, data: { ...filterForm.data, inputs } };
    }, [filterForm, filterValues]);

    const hOffset = isWeb ? 64 : 56

    const styles = isWeb
        ? {}
        : {
            height: defParams?.height
                ? defParams.height
                : windowHeight - hOffset,
        }

    const paramsKey = useMemo(() => {
        const { start, ...rest } = defParams || {}
        return JSON.stringify(rest)
    }, [defParams])

    const qKeyUri = props.uri || ''
    const qKeyRequestUrl = data.request_url || ''
    const qKeyUserId = currentUser?.id
    const qKeyCachePrefix = props?.cachePrefix || ''
    const qKey = useMemo(
        () => [qKeyUri, qKeyRequestUrl, qKeyUserId, qKeyCachePrefix, paramsKey],
        [qKeyUri, qKeyRequestUrl, qKeyUserId, qKeyCachePrefix, paramsKey]
    )

    const {
        status,
        listItems,
        hasNewData,
        acceptNewData,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
        handleEndReached,
        listReady,
    } = useUniListQuery({
        queryKey: qKey,
        requestUrl: data.request_url,
        defaultParams: defParams,
        enabled: !!data.request_url,
        deferNewItems: updateMode === 'action',
        refetchOnWindowFocus: updateMode != 'none',
        refetchOnReconnect: updateMode != 'none',
        listenPageReload: true,
        listenFeed: props.data?.unit === 'feed',
        canFetchNext: () => isOnePage != true && props.extraProps?.limit != true,
    })

    let sSkeleton = data.module ? data.module : data.unit
    if (props?.skeleton) sSkeleton = props?.skeleton

    if (props.unitType) sSkeleton = [sSkeleton, props.unitType]

    const renderItem = useCallback(
        ({ item, index }) => {
            return isWeb ? (
                <BrowseItem
                    key={'item' + item.id}
                    item={item}
                    index={index}
                    numColumns={numColumns}
                    data={data}
                    unitMode={unitMode}
                    props={props}
                />
            ) : (
                <BrowseItem
                    item={item}
                    index={index}
                    numColumns={numColumns}
                    data={data}
                    unitMode={unitMode}
                    props={props}
                />
            );

        },
        [data, unitMode, numColumns, props]
    )

    const layout = layoutForList(data.module);
    const Preload = useMemo(
        () => getSkeletonForList(sSkeleton, numColumns, true, layout, renderItem),
        [sSkeleton, numColumns, layout, renderItem]
    )


    useEffect(() => {
        if (props.data?.unit !== 'feed') return;

        const offAdded = subscribe('bx_timeline_0', 'added', refetch);
        const offDeleted = subscribe('bx_timeline_0', 'deleted', refetch);

        return () => {
            offAdded();
            offDeleted();
        };
    }, [refetch, props.data?.unit])

    // Bottom-tab reselect (same event as Conductor): scroll to top, or reload if already at top.
    useEffect(() => {
        if (props.data?.unit !== 'feed' || isOneLine || isOnePage) return;

        const subscription = emitter.addListener(EVENTS.conductor, (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action !== 'reset_to_first') return;

            const requestUrl = data.request_url || props?.url;
            if (getScrollValue() > AT_TOP_SCROLL_THRESHOLD) {
                if (requestUrl) {
                    setListScrollOffset(requestUrl, 0);
                }
                if (uniRef.current?.scrollToOffset) {
                    uniRef.current.scrollToOffset({ offset: 0, animated: true });
                } else {
                    uniRef.current?.scrollToIndex?.({ index: 0, animated: true });
                }
                return;
            }

            refetch();
        });
        return () => subscription.remove();
    }, [props.data?.unit, isOneLine, isOnePage, data.request_url, props?.url, refetch, getScrollValue]);

    const dataItems = listItems

    if (
        dataItems.length == 0 &&
        listReady &&
        status === 'success' &&
        data.unit == 'notifications' && !hasNextPage
    ) {
        
        return (
            <View className="p-8 mt-8">
                <View className="gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 rounded-2xl  bg-muted-foreground/10 ">
                    <Text className="text-center text-base text-muted-foreground ">
                        No notifications
                    </Text>
                </View>
            </View>
        )
    }

    let contentElement = false;

    if (props.extraProps?.galery) {
        const uniqueItems = dataItems.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        )
        const limitedItems = props.extraProps?.limit
            ? uniqueItems.slice(0, props.extraProps?.limit)
            : uniqueItems

        const items = limitedItems.map((item, index) => (
            <Unit
                key={item.id || item.name || item.url || `gallery-${index}`}
                unit={data.unit ? data.unit : ''}
                mode={unitMode}
                module={data.module ? data.module : ''}
                sidebar={props.sidebar}
                object_id={data.object_id ? data.object_id : ''}
                view={data.view ? data.view : ''}
                {...props}
                data={item}
            />
        ));
        contentElement = items.length == 0
            ? (!listReady ? Preload : null)
            : <Galery items={items} autoscroll={props.extraProps?.autoscroll ?? 5000} />
    }

    if ((props.sidebar && !props.extraProps?.galery) || isOneLine || inlineCards) {
        if (!listReady) {
            contentElement = Preload
        } else {
            const uniqueItems = dataItems.filter(
                (v, i, a) => a.findIndex((t) => t.id === v.id) === i
            )
            const limitedItems = props.extraProps?.limit
                ? uniqueItems.slice(0, props.extraProps?.limit)
                : (isOneLine && !props.noContainer) ? uniqueItems.slice(0, numColumns) : uniqueItems
            contentElement = limitedItems.map((item, index) => {
                if (props.noContainer) {
                    return (<Unit
                        key={`item${index}`}
                        unit={data.unit ? data.unit : ''}
                        mode={unitMode}
                        module={data.module ? data.module : ''}
                        sidebar={props.sidebar}
                        object_id={data.object_id ? data.object_id : ''}
                        view={data.view ? data.view : ''}
                        listIndex={index}
                        {...props}
                        data={item}
                    />);
                }
                const margin = isOneLine && numColumns > 1 ? appSetting('browse', 'margin') : '';
                return (
                    <View key={`item${index}`} className={`${margin} ${data.unit !== 'feed' ? (isOneLine && numColumns > 1 ? ' p-2 w-1/' + numColumns : 'w-full') : ''}`}>
                        <Unit
                            unit={data.unit ? data.unit : ''}
                            mode={unitMode}
                            module={data.module ? data.module : ''}
                            sidebar={props.sidebar}
                            object_id={data.object_id ? data.object_id : ''}
                            view={data.view ? data.view : ''}
                            listIndex={index}
                            {...props}
                            data={item}
                        />
                    </View>
                )
            })
            if (isOneLine && !props.noContainer) {
                contentElement = isPersonList
                    ? <View className="w-full gap-0.5">{contentElement}</View>
                    : <Row>{contentElement}</Row>
            }
            if (isOneLine && props.noContainer) {
                contentElement = <ScrollView horizontal={true}><Row className='gap-4 pb-8'>{contentElement}</Row></ScrollView>
            }
        }
    }

    const NoContent = components['molecule']['no_content']

    const PreloadComponent = !data?.hide_empty_msg && dataItems.length === 0
        ? (listReady && hasNextPage === false
            ? <NoContent endpoint={{ request_url: data.request_url, params: {} }} />
            : Preload)
        : null;


    const handleOpenChange = (open) => {
        setShowFilters(open)
    }

    const filterElement = !!formProps ? (
        <Row className="w-full items-end justify-end mb-3 mt-3 sm:mt-0">
            <DropdownPopup
                trigger={

                    <Button startDecorator="Settings2" variant="outline" title={!showFilters ? "Show filters" : "Hide filters"} />

                }
                minPopupWidth={120}
                open={showFilters}
                onOpenChange={handleOpenChange}
            >
                <View className="m-2">
                    <Form
                        {...formProps}
                        key="form"
                        name={formProps.name}
                        onChange={handleFilterFormChange}
                    />
                </View>
            </DropdownPopup>
        </Row>
    ) : false

    let ListHeaderComponent = props.exProps?.headerBlocks
        ? (typeof props.exProps?.headerBlocks === 'function'
            ? props.exProps?.headerBlocks
            : () => props.exProps?.headerBlocks)
        : undefined

    if (filterElement && !isDesktop) {
        ListHeaderComponent = () => filterElement
    }

    const uniListProps = {
        preloadComponent: PreloadComponent,
        refer: uniRef,
        layout: layout,
        mode: layout == 'w-full' ? 'simple' : '',
        data: dataItems,
        unit: data.unit,
        height: isWeb ? (props?.isInPanel ? windowHeight - 64 : props?.height) : props?.height,
        url: data.request_url || props?.url,
        contentContainerStyle: props?.contentContainerStyle,
        isInPanel: props?.isInPanel,
        maxToRenderPerBatch: 10,
        initialNumToRender: 10,
        no_scroll: props.no_scroll,
        onRefresh: refetch,
        refreshing: isRefetching,
        renderItem: renderItem,
        onEndReached: handleEndReached,
        ListHeaderComponent: ListHeaderComponent,
        ListFooterComponent: ((hasNextPage && isFetchingNextPage)) ? Preload : null,
    }

    if (contentElement === null) {
        return
    }

    if (contentElement === false) {
        contentElement = <UniList {...uniListProps} />
    }

    if (!dataItems.length && listReady && isShowTitleInside)
        return;

    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <View className={`w-full ${isOneLine ? '  ' : 'web:h-full '}`}>
                <View className="w-full" ></View>
                <View className={`w-full ${props.showBg ? blockTheme['u-block-bg'] + ' ' + blockTheme['u-block-pad'] + ' ' + blockTheme['u-block-base'] : ''} ${responsiveClasses('rounded', props.blockWrapperProps?.config?.rounded)}`} style={isOneLine || !isWeb ? {} : styles}>
                    {isShowTitleInside && (
                        <Row className={`items-center justify-between ${props.showBg ? '' : 'p-2 '}`}>
                             <View className="p-2">
                                <BlockTitle>
                                {t(props.block.title)}
                                </BlockTitle>
                            </View>
                            {!!props.addLink && (
                                <Link href={props.addLink.url}>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        rounded
                                        title={t(props.addLink.text)}
                                    />
                                </Link>
                            )}
                            {(isOneLine && data.params.home_url) && (
                                <Link href={data.params.home_url}>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        rounded
                                        title={t('View All')}
                                    />
                                </Link>
                            )}

                        </Row>
                    )}
                    {isDesktop && filterElement}
                    <View className={`w-full ${!isOneLine || numColumns <= 1 ? 'gap-0.5' : ''}`}>
                    {contentElement}
                    </View>
                </View>
                <Snackbar
                    visible={hasNewData}
                    onPress={() => {
                        acceptNewData()
                        if (uniRef.current) {
                            uniRef.current.scrollToIndex?.({
                                index: 0,
                                align: 'end',
                                behavior: 'smooth',
                            })
                        }
                    }}
                    variant="primary"
                    title={t('Show New')}
                    size="sm"
                />
            </View>
        </BlockWrapper>
    )
}
