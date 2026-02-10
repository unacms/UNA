import Unit from 'app/components/unit'
import {
    useCallback,
    useEffect,
    memo,
    useMemo,
    useRef,
    useReducer,
    useState
} from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import {
    appSetting,
} from 'app/lib/util'
import { Text } from 'app/design/typography'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { Button } from 'app/design/controls'
import { useWindowHeight } from 'app/context/measure';
import emitter from 'app/context/emitter'
import Snackbar from 'app/ui/atoms/snackbar'
import {
    refetchUniListReducer,
    isSameItemsForUniList,
    flattenPagesForUniList,
    fetchUniListData
} from 'app/lib/conductor-helpers'
import { getComponent } from 'app/components/registry';
import { BrowseItem } from 'app/lib/common-helpers'
import { BlockWrapper } from 'app/components/block-wrapper'
import { layoutForList } from 'app/customization/functions'
export default function Browse(props) {
    const isWeb = Platform.OS === 'web'
    const { currentUser } = useCurrentUser();

    const Form = getComponent('element', 'form');

    const uniRef = useRef()
    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false
    })
    const refetchRef = useRef({
        skipToast: false,
        isFirstLoad: true,
        prevItems: []
    })
    //updateMode can be action, auto, none
    const updateMode = (props.updateMode || props.data.unit == 'feed') ? 'action' : 'none';
    const data = props.data

    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list'
    }

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
        refetchRef.current.skipToast = true
        refetch()
    });

    const hOffset = isWeb ? 64 : 56

    const styles = isWeb
        ? {}
        : {
            height: defParams?.height
                ? defParams.height
                : windowHeight - hOffset,
        }

    const qKey = [props.uri || '', data.request_url || '', currentUser?.id, props?.cachePrefix || '']

    const {
        status,
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: qKey,
        //queryFn: fetchData,
        queryFn: ({ pageParam }) => fetchUniListData({
            pageParam,
            requestUrl: data.request_url,
            defaultParams: defParams
        }),

        getNextPageParam: (lastPage) => lastPage?.data.length > 0 ? { ...lastPage?.params, start: lastPage?.params.start + lastPage?.params.per_page } : undefined,
        staleTime: appSetting('browse', 'stale_time'),
        refetchOnWindowFocus: updateMode != 'none',
        refetchOnReconnect: updateMode != 'none',
    })

    const handleEndReached = useCallback(
        (lastItemIndex) => {
            if (!data.request_url) return
            if (!hasNextPage) return
            if (isFetchingNextPage) return
            if (lastItemIndex == false) return

            refetchRef.current.skipToast = true
            fetchNextPage()
        },
        [hasNextPage, isFetchingNextPage]
    )

    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForUniList(pagesData)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            refetchRef.current.skipToast = false
            return
        }
        if (!isSameItemsForUniList(refetchRef.current.prevItems, items)) {
            if (refetchRef.current.skipToast) {
                dispatch({ type: 'SET_ITEMS', items })
                refetchRef.current.skipToast = false
            } else if (updateMode == 'action') {
                dispatch({ type: 'SHOW_NEW_DATA' })
            } else {
                dispatch({ type: 'SET_ITEMS', items })
            }
            refetchRef.current.prevItems = items
        }
    }, [pagesData, updateMode])

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
    }, [])    

    useEffect(() => {

        const subscription = emitter.addListener(`page`, (data) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                refetch();
            }
        })

        const subscription2 = emitter.addListener(`feed`, (data) => {
            if (data.action == 'remove_content') {
                dispatch({ type: 'REMOVE_ITEM', id: data.id })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = refetchRef.current.prevItems.filter(item => item.id != data.id)
                }
                refetchRef.current.skipToast = true
            }
            if (data.action == 'new_content') {
                dispatch({ type: 'PREPEND_ITEM', item: data.data })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = [data.data, ...refetchRef.current.prevItems]
                }
                refetchRef.current.skipToast = true
            }
        })

        return () => {
            subscription.remove();
            subscription2.remove()
        }
    }, [])

    const dataItems = refetchState.visibleItems

    if (
        dataItems.length == 0 &&
        status === 'success' &&
        data.unit == 'notifications' && !hasNextPage
    ) {
        return (
            <View className="p-8">
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                    <Text className="text-center text-base text-muted-foreground ">
                        No notifications
                    </Text>
                </View>
            </View>
        )
    }

    const NoContent = getComponent('molecule', 'no_content')

    const PreloadComponent = dataItems.length === 0 ? (hasNextPage === false
        ? <NoContent endpoint={{request_url: data.request_url, params: {} }}/>
        : (!dataItems.params?.loaded ? Preload : null)
    ) : null;

    const uniListProps = {
        preloadComponent: PreloadComponent,
        refer: uniRef,
        mode: 'simple',
        data: dataItems,
        unit: data.unit,
        height: isWeb ? (props?.isInPanel ? windowHeight - 64 : props?.height) : props?.height,
        url: props?.url,
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
                <Row className="w-full items-end justify-end"><Button startDecorator="Settings2" variant="outline" title={!showFilters ? "Show filters" : "Hide filters"} onPress={() => setShowFilters(!showFilters)} /></Row>
                {showFilters && <Form {...formProps} key="form" name={formProps.name} onChange={handleFilterFormChange} />}
            </View>
            }
            <UniList {...uniListProps} />
            <Snackbar
                visible={refetchState.hasNewData}
                onPress={() => {
                    const latestItems = flattenPagesForUniList(pagesData)
                    dispatch({ type: 'SET_ITEMS', items: latestItems })
                    refetchRef.current.prevItems = latestItems;
                    if (uniRef.current) {
                        uniRef.current.scrollToIndex?.({
                            index: 0,
                            align: 'end',
                            behavior: 'smooth',
                        })
                    }
                }}
                variant="primary"
                title="Show New"
                size="sm"
            />
        </View></BlockWrapper>
    )
}
