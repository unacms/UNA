/**
 * List-only browse block (`browse_list` in elements/_map).
 *
 * Same `useUniListQuery` + UniList + realtime pipeline as browse.js, but always
 * renders a simple virtualized list (`UniList` mode `"simple"`). No showcase,
 * gallery, sidebar row, or in-block title. Pagination uses `start`/`per_page`
 * (browse.js uses a cursor).
 *
 * Used for UNA page blocks with content type `browse_list`.
 *
 * Differs from:
 * - browse.js — full layouts (showcase, gallery, sidebar, title, cursor paging).
 * - browse-simple.tsx — no fetch; maps already-loaded items to Unit cards.
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { View, Row } from 'app/design/view'
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { Text } from 'app/design/typography'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { NeoButton } from 'app/design/controls'
import { useWindowHeight } from 'app/context/measure';
import emitter, { EVENTS } from 'app/context/emitter'
import Snackbar from 'app/ui/atoms/snackbar'
import { useIsFocused } from 'app/lib/hooks/router'
import { useGetScrollValue } from 'app/context/jotai/layout'
import { setListScrollOffset } from 'app/lib/cache/list-scroll-cache'
import { startPerPageNextPageParam, useUniListQuery } from 'app/lib/browse-query'
import { components } from 'app/components/registry';
import { BrowseItem } from 'app/lib/common-helpers'
import { BlockWrapper } from 'app/components/block-wrapper'
import { layoutForList } from 'app/customization/functions'
import { useTranslation } from 'react-i18next'

const AT_TOP_SCROLL_THRESHOLD = 50;

export default function Browse(props) {
    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser();

    const Form = components['element']['form'];

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

    const [defParams, setDefParams] = useState({
        ...(data.params ?? {}),
        ...(props?.params ?? {}),
        moduleName: data.module ?? '',
    });

    const [showFilters, setShowFilters] = useState(false);

    /* unit mode & change unit mode */
    const unitMode = props.unitMode

    const windowHeight = useWindowHeight();

    const formProps = data?.filter_form;

    const handleFilterFormChange = useCallback((values) => {
        const transformedValues = Object.fromEntries(
            Object.entries(values).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join(',') : value
            ])
        );

        const a = transformedValues.by_hashtag ? { type: 'bx_channels', context: transformedValues.by_hashtag } : { type: 'feed' };

        setDefParams(prev => ({
            ...prev,
            modules: transformedValues.modules,
            media: transformedValues.media,
            ...a
        }));
    });

    const hOffset = isWeb ? 64 : 56

    const styles = isWeb
        ? {}
        : {
            height: defParams?.height
                ? defParams.height
                : windowHeight - hOffset,
        }

    const numColumns = props.perLine || 1

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
        getNextPageParam: startPerPageNextPageParam,
        listenPageReload: true,
        listenFeed: props.data?.unit === 'feed',
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
        () => getSkeletonForList(sSkeleton, 1, true, layout, renderItem),
        [sSkeleton, layout, renderItem]
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

    // Bottom-tab reselect (same event as Conductor / Browse): scroll to top, or reload if already at top.
    useEffect(() => {
        if (props.no_scroll) return;

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
    }, [props.no_scroll, data.request_url, props?.url, refetch, getScrollValue]);

    const dataItems = listItems

    if (
        dataItems.length == 0 &&
        listReady &&
        status === 'success' &&
        data.unit == 'notifications' && !hasNextPage
    ) {
        return (
            <View className="p-8">
                <View className="gap-y-2 items-center opacity-80 justify-center mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-muted-foreground/10 ">
                    <Text className="text-center text-base text-muted-foreground ">
                        No notifications
                    </Text>
                </View>
            </View>
        )
    }

    const NoContent = components['molecule']['no_content']

    const PreloadComponent = !data?.hide_empty_msg && dataItems.length === 0
        ? (listReady && hasNextPage === false
            ? <NoContent endpoint={{request_url: data.request_url, params: {} }}/>
            : Preload)
        : null;

    const uniListProps = {
        preloadComponent: PreloadComponent,
        refer: uniRef,
        mode: 'simple',
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
        ListHeaderComponent: props.exProps?.headerBlocks
            ? (typeof props.exProps?.headerBlocks === 'function'
                ? props.exProps?.headerBlocks
                : () => props.exProps?.headerBlocks)
            : undefined,
        ListFooterComponent: ((hasNextPage && isFetchingNextPage)) ? Preload : null,
    }

    return (
        <BlockWrapper {...props.blockWrapperProps}><View className='w-full' style={styles}>
            {formProps && <View className=" w-full">
                <Row className="w-full items-end justify-end"><NeoButton image="Settings2" label={!showFilters ? "Show filters" : "Hide filters"} onPress={() => setShowFilters(!showFilters)} classNames={{ root: 'self-end' }} /></Row>
                {showFilters && <Form {...formProps} key="form" name={formProps.name} onChange={handleFilterFormChange} />}
            </View>
            }
            <UniList {...uniListProps} />
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
        </View></BlockWrapper>
    )
}
