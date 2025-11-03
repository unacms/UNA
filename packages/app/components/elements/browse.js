import Unit from 'app/components/unit'
import {
    useState,
    useCallback,
    useEffect,
    useRef,
    useContext,
    memo,
    useMemo,
} from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { fetcher } from 'app/lib/fetcher'
import {
    appSetting,
    storageKey,
    getDataFromCache,
    storageSet,
    handleFeedLayoutData,
    cloneObject,
} from 'app/lib/util'
import { Text } from 'app/design/typography'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import Toaster from 'app/ui/atoms/toaster'
import { storageClear } from 'app/lib/util'
import { useLayoutData } from 'app/context/layout'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { callFn } from 'app/lib/functions/call'
import Link from 'app/ui/atoms/link'
import Gallery from 'app/ui/molecules/gallery'
import { Button } from 'app/design/controls'
import { useBreakpoint, useWindowHeight } from 'app/context/measure';
import emitter from 'app/context/emitter'

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

export default function (props) {
    const isWeb = Platform.OS === 'web'
    const isValidateActive = props.validate ?? true
    const isShowEmptyMessage = props.empty_message ?? true
    const { layoutData, setLayoutData } = useLayoutData()
    const toasterRef2 = useRef()
    const { t } = useTranslation()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isRevalidate, setIsRevalidate] = useState(false)
    const { currentUser } = useCurrentUser()
    const data = props.data
    const isOneLine = data?.params?.view == 'showcase'
    const isOnePage = props.only_one_page || isOneLine;
    const isShowTitleInside = props.showTitleInside || isOneLine;


    const cacheParams = Object.entries(((p = {}) => {
        const { per_page, start, ...rest } = p;
        return rest;
    })(data?.params))
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join(':');

    const storageKeyValue = storageKey(
        (props.uri ? props.uri : '') +
        (data.request_url ? ':' + data.request_url : '') + ':' + cacheParams +
        (props.cachePrefix ? ':' + props.cachePrefix : '')
    )

    const cachedData = {
        state: getDataFromCache('ul:state', storageKeyValue),
        data: getDataFromCache('ul:data', storageKeyValue),
    }

    useEffect(() => {
        if (cachedData && isValidateActive) {
            revalidateData()
            //TODO revaliadate
        }
        if (props.data.unit == 'feed') {
            subscribe('bx_timeline_0', 'added', setIsRevalidate)
            subscribe('bx_timeline_0', 'deleted', setIsRevalidate)
        }
    }, [])

    useEffect(() => {
        if (isValidateActive) revalidateData()
    }, [isRevalidate])

    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list'
    }

    let defParams = data.params

    if (props?.params) defParams = { ...defParams, ...props.params }

    if (defParams) defParams.moduleName = data.module ? data.module : ''
    const browseParams = defParams

    const getDefaultParams = () => {
        return {
            data:
                appSetting('cache', 'list') && cachedData?.data
                    ? cachedData.data
                    : [],
            params: browseParams,
        }
    }

    const [dataItems, setDataItems] = useState(getDefaultParams())

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

    const fetchData = useCallback(
        async ({ }) => {
            const sUrl = data.request_url + JSON.stringify({ params: dataItems.params })
            if (!data.request_url) return { data: [], params: browseParams }

            const res = await fetcher(sUrl)
            // Expected UNA response shape: { data: [ { data: { data: [...], params: {...} } } ] }
            const nested = res?.data?.[0]?.data
            if (nested && (Array.isArray(nested?.data) || nested?.params)) {
                return nested
            }
            // Fallbacks for looser shapes
            const arrData = Array.isArray(res?.data) ? res.data : []
            if (arrData.length) {
                return { data: arrData, params: browseParams }
            }
            if (Array.isArray(res)) {
                return { data: res, params: browseParams }
            }
            if (Array.isArray(res?.data?.data)) {
                return { data: res.data.data, params: res.data.params || browseParams }
            }
            return { data: [], params: browseParams }
        },
        [dataItems.params]
    )

    const qKey = [
        data.request_url +
        storageKeyValue +
        props?.cachePrefix,
    ]
    const queryClient = useQueryClient()
    const {
        status,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery(qKey, fetchData, {
        getNextPageParam: (lastPage) => {
            if (lastPage.data.length == 0) return
            if (props?.maxItems && lastPage.data.length >= props?.maxItems)
                return

            return lastPage.params
        },
        enabled: isWeb ? false : false, // on native no cashed data
    })

    const onStartRefresh = () => {
        setDataItems(getDefaultParams())
        setIsRefreshing(true)
    }

    useEffect(() => {
        if (isRefreshing) {
            queryClient.removeQueries(qKey)
            setIsRefreshing(false)
            console.log('refetch')
            refetch()
        }
    }, [isRefreshing])

    const handleEndReached = useCallback(
        (lastItemIndex) => {
            if (!data.request_url) return
            if (!hasNextPage) return
            if (isOnePage == true) return
            if (props.extraProps?.limit == true) return
            if (isFetchingNextPage) return
            if (lastItemIndex == false) return
            fetchNextPage()
        },
        [hasNextPage, isOnePage, isFetchingNextPage]
    )

    const getCurrentParams = (isUseDefault = false) => {
        if (newData?.pages.length > 0) {
            let ld = newData.pages[newData.pages.length - 1].params
            let params = Object.assign({}, browseParams, ld)
            if (data.unit != 'notifications')
                params.start = parseInt(ld.start) + parseInt(ld.per_page)
            if (isUseDefault) {
                params.start = 0
            }

            return params
        }
        return browseParams
    }

    let sSkeleton = data.module ? data.module : data.unit
    if (props?.skeleton) sSkeleton = props?.skeleton

    if (props.unitType) sSkeleton = [sSkeleton, props.unitType]
    const Preload = getSkeletonForList(sSkeleton, numColumns)

    useEffect(() => {
        if (newData?.pages) {
            setDataItems({
                data: [
                    ...dataItems.data,
                    ...(newData?.pages
                        ? newData.pages.map((page) => page.data).flat()
                        : []),
                ],
                params: {
                    ...getCurrentParams(),
                    loaded: true,
                },
            })
        }
    }, [newData?.pages])

       useEffect(() => {
        const subscription = emitter.addListener(`page`, (data) => {
            if (data.action == 'reload') {
                showNewContent2();
            }

        })

        return () => {
            subscription.remove()
        }
    }, [])

    /* UPDATE CONTENT PART */

    const setToaster2Visible = (val) => {
        const current = toasterRef2.current
        if (current) {
            current.setVisible(val)
        }
    }

    const revalidateData = async () => {
        let endpointUpdateContent = ''
        let bUpdateContent = false
        const revalidatedData = JSON.parse(isRevalidate)
        if (
            revalidatedData.author_id != currentUser?.id &&
            dataItems.data.length > 0 &&
            props.sidebar !== true &&
            props.no_scroll !== true
        ) {
            const a = [
                ...new Set(
                    dataItems.data
                        .filter((item) => item.type !== 'block')
                        .map((item) => item.id)
                ),
            ]
                .slice(0, 10)
                .join(',')
            if (a) {
                endpointUpdateContent =
                    data.request_url +
                    JSON.stringify({
                        params: { ...getCurrentParams(), validate: a },
                    })
                bUpdateContent = true
            }
        }
        if (bUpdateContent) {
            const validatedData = (await fetcher(endpointUpdateContent))
                .data?.[0]?.data?.data
            if (
                validatedData &&
                (validatedData == 'valid' || validatedData == 'invalid')
            ) {
                setToaster2Visible(validatedData !== 'valid')
            }
        }
    }

    const showNewContent2 = async () => {
        storageClear('ul:data', storageKeyValue)
        storageClear('ul:state', storageKeyValue)
        setDataItems({ data: [], params: browseParams })
        // HECH HERE !!!
        // setToaster2Visible(false);
    }
    /* UPDATE CONTENT PART */

    /* NEW POST TO FEED */
    const handleLayoutDataChange = useCallback(
        (newLayoutData) => {
            if (
                data.unit === 'feed' &&
                newLayoutData &&
                newLayoutData.data &&
                (newLayoutData?.type == 'feed:new_content' ||
                    newLayoutData?.type == 'feed:remove_content')
            ) {
                let clonedData = cloneObject(dataItems.data)
                const data2 = handleFeedLayoutData(newLayoutData, clonedData)
                setDataItems({ data: data2, params: dataItems.params })
                setLayoutData(null)
            }
        },
        [data.unit, dataItems.data, dataItems.params, setLayoutData]
    )

    useEffect(() => {
        handleLayoutDataChange(layoutData)
    }, [layoutData, handleLayoutDataChange])
    /* NEW POST TO FEED */

    useEffect(() => {
        if (dataItems.data.length > 0) {
            storageSet('ul:data', storageKeyValue, dataItems.data)
        }
    }, [dataItems.data])

    useEffect(() => {
        if (dataItems.data.length == 0 && dataItems.params == browseParams && data.request_url) {
            //console.log('refetch2');
            refetch()
        }
    }, [storageKeyValue, dataItems.params, props.cachePrefix])

    if (
        dataItems.data.length == 0 &&
        status === 'success' &&
        data.unit == 'notifications' &&
        dataItems?.params?.start > 0
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

    if (props.extraProps?.gallery) {
        const uniqueItems = dataItems.data.filter(
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
        contentElement = items.length == 0 ? null : <Gallery items={items} />

    }

    if ((props.sidebar && !props.extraProps?.gallery) || isOneLine) {

        const uniqueItems = dataItems.data.filter(
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

    let PreloadComponent = null
    if (dataItems.data.length == 0 && !dataItems.params?.loaded) {
        PreloadComponent = Preload
    } else {
        if (dataItems.params?.loaded && dataItems.data.length == 0) {
            PreloadComponent = callFn("noContentByUrl", [{ request_url: data.request_url, params: dataItems?.params }])
        }
    }




    const memoizedUniListProps = useMemo(
        () => ({
            scrollProps: props?.exProps?.scrollProps,
            preloadComponent: PreloadComponent,
            numColumns,
            mode: 'simple',
            data: dataItems.data,
            viewParams: getCurrentParams(),
            listState: cachedData?.state?.state,
            unit: data.unit,
            storagekey: storageKeyValue,
            // Use viewport height minus header for web in panel layouts
            height: isWeb ? (props?.isInPanel ? windowHeight - 64 : undefined) : props?.height,
            url: props?.url,
            contentContainerStyle: props?.contentContainerStyle,
            isInPanel: props?.isInPanel,
            maxToRenderPerBatch: 10,
            initialNumToRender: 10,
            no_scroll: props.no_scroll,
            onRefresh: onStartRefresh,
            refreshing: isRefreshing,
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

        }),
        [
            props?.exProps?.scrollProps,
            PreloadComponent,
            numColumns,
            dataItems.data,
            getCurrentParams,
            cachedData?.state?.state,
            data.unit,
            storageKeyValue,
            props?.height,
            windowHeight,
            props?.url,
            props?.contentContainerStyle,
            props.no_scroll,
            onStartRefresh,
            isRefreshing,
            isWeb,
            data,
            unitMode,
            props,
            handleEndReached,
            props.exProps?.headerBlocks,
            hasNextPage,
            isFetchingNextPage,
            Preload,
        ]
    )
    if (contentElement === null) {
        return
    }

    if (contentElement === false) {
        contentElement = <UniList {...memoizedUniListProps} />
    }

    if (!dataItems.data.length && isShowTitleInside)
        return;

    return (
        <View className={`w-full ${isOneLine ? '' : 'h-full'}`}>
            <View className="w-full" onLayout={handleLayout}></View>
            <Toaster
                ref={toasterRef2}
                onPress={showNewContent2}
                variant="primary"
                title="Show New Posts"
                size="sm"
            />
            <View className={`w-full ${props.showBg ? blockTheme['u-block-bg'] + ' ' + blockTheme['u-block-pad'] + ' ' + blockTheme['u-block-base'] : ''}`} style={styles}>
                {isShowTitleInside && (
                    <Row className={`items-center justify-between ${props.showBg ? '' : 'px-2 my-3'}`}>
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
        </View>
    )
}
