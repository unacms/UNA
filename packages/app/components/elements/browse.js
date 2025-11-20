import Unit from 'app/components/unit'
import {
    useState,
    useCallback,
    useEffect,
    memo,
    useRef,
    useReducer
} from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { fetcher } from 'app/lib/fetcher'
import {
    appSetting,
} from 'app/lib/util'
import { Text } from 'app/design/typography'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { callFn } from 'app/lib/functions/call'
import Link from 'app/ui/atoms/link'
import Galery from 'app/ui/molecules/gallery'
import { Button } from 'app/design/controls'
import { useBreakpoint, useWindowHeight } from 'app/context/measure';
import emitter from 'app/context/emitter'
import Toaster from 'app/ui/atoms/toaster2'
import {
    refetchUniListReducer,
    isSameItemsForUniList,
    flattenPagesForUniList,
    fetchUniListData
} from 'app/lib/conductor-helpers'

const blockTheme = appSetting('theme', 'blocks');

const Item = memo(({ item, index, numColumns, data, unitMode, props }) => (
    <View
        className={
            numColumns > 1
                ? 'w-full pb-2 '
                : ' ' + (data.unit != 'feed' ? 'w-full mb-0.5  ' : '  ') + '  '
        }
    >
        <Unit
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            sidebar={props.sidebar}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            {...props}
            data={item}
        />
    </View>
))

const getNumCols = (width, props, data) => {
    if (props.perLine) return props.perLine

    if (data.unit.startsWith('general-') || data.unit.startsWith('search-')) {
        return width > 600 ? 4 : 1
    }
    return 1
}

export default function Browse(props) {
    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
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
    const isOneLine = data?.params?.view == 'showcase'
    const isOnePage = props.only_one_page || isOneLine;
    const isShowTitleInside = props?.showTitleInside || props?.extraProps?.showTitleInside || isOneLine;

    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list'
    }

    const defParams = {
        ...(data.params ?? {}),
        ...(props?.params ?? {}),
        moduleName: data.module ?? '',
    };

    /* unit mode & change unit mode */
    const unitMode = props.unitMode

    const currentBreakpoint = useBreakpoint();
    const windowHeight = useWindowHeight();


    const [numColumns, setNumColumns] = useState(
        getNumCols(currentBreakpoint, props, data)
    )

    const handleLayout = (event) => {
        const containerWidth = event.nativeEvent.layout.width
        const numColumnsNew = getNumCols(containerWidth, props, data)
        if (numColumnsNew != numColumns) {
            setNumColumns(numColumnsNew)
        }
    }

    const hOffset = isWeb ? 64 : 56

    const styles = isWeb
        ? {}
        : {
            height: defParams?.height
                ? defParams.height
                : windowHeight - hOffset,
        }

   /* async function fetchData({ pageParam = defParams }) {
        const sUrl = data.request_url + JSON.stringify({ params: pageParam })
        const res = await fetcher(sUrl)
        const payload = Array.isArray(res?.data) ? res.data[0]?.data : undefined

        if (payload?.data) {
            return {
                data: payload.data,
                params: payload.params ?? pageParam ?? {},
                pageParams: 'zzz'
            }
        }

        return { data: [], params: pageParam || {}, pageParams: 'zzz' }
    }
*/  
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
            if (isOnePage == true) return
            if (props.extraProps?.limit == true) return
            if (isFetchingNextPage) return
            if (lastItemIndex == false) return

            refetchRef.current.skipToast = true
            fetchNextPage()
        },
        [hasNextPage, isOnePage, isFetchingNextPage]
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
    const Preload = getSkeletonForList(sSkeleton, numColumns)

    useEffect(() => {
        if (props.data.unit == 'feed') {
            subscribe('bx_timeline_0', 'added', refetch)
            subscribe('bx_timeline_0', 'deleted', refetch)
        }

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
        contentElement = items.length == 0 ? null : <Galery items={items} />
    }

    if ((props.sidebar && !props.extraProps?.galery) || isOneLine) {
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
                    {...props}
                    data={item}
                />);
            }
            return (
                <View key={`item${index}`} className={`mb-3  ${data.unit !== 'feed' ? (isOneLine ? ' p-2 w-1/' + numColumns : 'w-full') : ''}`}>
                    <Unit
                        unit={data.unit ? data.unit : ''}
                        mode={unitMode}
                        module={data.module ? data.module : ''}
                        sidebar={props.sidebar}
                        object_id={data.object_id ? data.object_id : ''}
                        view={data.view ? data.view : ''}
                        {...props}
                        data={item}
                    />
                </View>
            )
        })
        if (isOneLine && !props.noContainer) {
            contentElement = <Row>{contentElement}</Row>
        }
        if (isOneLine && props.noContainer) {
            contentElement = <ScrollView horizontal={true}><Row className='gap-4 pb-8'>{contentElement}</Row></ScrollView>
        }
    }

    const PreloadComponent = dataItems.length === 0 ? (hasNextPage === false
        ? callFn("noContentByUrl", [{ request_url: data.request_url, params: {} }])
        : (!dataItems.params?.loaded ? Preload : null)
    ) : null;

    const uniListProps = {
        scrollProps: props?.exProps?.scrollProps,
        preloadComponent: PreloadComponent,
        numColumns,
        refer:uniRef,
        mode: 'simple', 
        data: dataItems,
        unit: data.unit,
        height: isWeb ? (props?.isInPanel ? windowHeight - 64 : undefined) : props?.height,
        url: props?.url,
        contentContainerStyle: props?.contentContainerStyle,
        isInPanel: props?.isInPanel,
        maxToRenderPerBatch: 10,
        initialNumToRender: 10,
        no_scroll: props.no_scroll,
        onRefresh: refetch,
        refreshing: isRefetching,
        renderItem: ({ item, index }) => {
            return isWeb ? (
                <Item
                    key={'item' + item.id}
                    item={item}
                    index={index}
                    numColumns={numColumns}
                    data={data}
                    unitMode={unitMode}
                    props={props}
                />
            ) : (
                <Item
                    item={item}
                    index={index}
                    numColumns={numColumns}
                    data={data}
                    unitMode={unitMode}
                    props={props}
                />
            );
        },
        onEndReached: handleEndReached,
        ListHeaderComponent: props.exProps?.headerBlocks
            ? (typeof props.exProps?.headerBlocks === 'function'
                ? props.exProps?.headerBlocks
                : () => props.exProps?.headerBlocks)
            : undefined,
        ListFooterComponent: ((hasNextPage && isFetchingNextPage)) ? Preload : null,
    }

    if (contentElement === null) {
        return
    }

    if (contentElement === false) {
        contentElement = <UniList {...uniListProps} />
    }

    if (!dataItems.length && isShowTitleInside)
        return;

    return (
        <View className={`w-full ${isOneLine ? '' : 'h-full'}`}>
            <View className="w-full" onLayout={handleLayout}></View>
            <View className={`w-full ${props.showBg ? blockTheme['u-block-bg'] + ' ' + blockTheme['u-block-pad'] + ' ' + blockTheme['u-block-base'] : ''}`} style={isOneLine ? {} : styles}>
                {isShowTitleInside && (
                    <Row className={`items-center justify-between ${props.showBg ? '' : 'px-2 '}`}>
                        <Text className=" text-card-foreground text-xl font-bold leading-none lg:leading-none tracking-tight ">
                            {t(props.block.title)}
                        </Text>
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
                {contentElement}
            </View>
            {refetchState.hasNewData && <Toaster
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
                isVisible={refetchState.hasNewData}
                variant="primary"
                title="Show New"
                size="sm"
            />}
        </View>
    )
}
