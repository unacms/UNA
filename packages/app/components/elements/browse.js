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
import { appSetting, isObjectsEqual } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import { subscribe } from 'app/ui/atoms/socket'
import { useCurrentUser } from 'app/context/user'
import { layoutForList } from 'app/customization/functions'
import Link from 'app/ui/atoms/link'
import Galery from 'app/ui/molecules/gallery'
import { Button } from 'app/design/controls'
import { useWindowHeight } from 'app/context/measure';
import emitter from 'app/context/emitter'
import Snackbar from 'app/ui/atoms/snackbar'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { BlockWrapper } from 'app/components/block-wrapper'

import {
    refetchUniListReducer,
    isSameItemsForUniList,
    flattenPagesForUniList,
    fetchUniListData
} from 'app/lib/conductor-helpers'
import { getComponent } from 'app/components/registry';
import { BrowseItem } from 'app/lib/common-helpers'
import { useIsDesktop } from 'app/context/measure';
import { BlockTitle } from 'app/ui/molecules/page-block'
const blockTheme = appSetting('theme', 'blocks');

export default function Browse(props) {

    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser();
    const Form = getComponent('element', 'form');
    const isDesktop = useIsDesktop();
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

    const [defParams, setDefParams] = useState({
        ...(data.params ?? {}),
        ...(props?.params ?? {}),
        moduleName: data.module ?? '',
    });
    let formProps = data?.filter_form;

    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState({ modules: formProps?.data?.inputs?.modules?.value, media: formProps?.data?.inputs?.media?.value });

    /* unit mode & change unit mode */
    const unitMode = props.unitMode

    const windowHeight = useWindowHeight();

    const numColumns = props.perLine || 1;



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
            dispatch({ type: 'SET_ITEMS', items: [] });
            refetchRef.current.prevItems = [];
            refetchRef.current.isFirstLoad = true;
            refetchRef.current.skipToast = true;

            setDefParams(prev => ({
                ...prev,
                modules: transformedValues.modules,
                media: transformedValues.media,
                ...contexts
            }));

            refetch()
        }
    });

    if (filterValues && formProps) {
        if (formProps.data.inputs.modules)
            formProps.data.inputs.modules.value = filterValues.modules;
        if (formProps.data.inputs.media)
            formProps.data.inputs.media.value = filterValues.media;
        if (formProps.data.inputs.by_context)
            formProps.data.inputs.by_context.value = filterValues.by_context;
    }

    const hOffset = isWeb ? 64 : 56

    const styles = isWeb
        ? {}
        : {
            height: defParams?.height
                ? defParams.height
                : windowHeight - hOffset,
        }

    const qKey = [props.uri || '', data.request_url || '', currentUser?.id, props?.cachePrefix || '', defParams?.context || '', defParams?.modules || '', defParams?.media || '']

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

        //getNextPageParam: (lastPage) => lastPage?.data.length > 0 ? { ...lastPage?.params, start: lastPage?.params.start + lastPage?.params.per_page } : undefined,
        getNextPageParam: (lastPage) => {
            return (lastPage?.data.length > 0 && lastPage?.cursor) ? { ...lastPage?.params, start: lastPage?.cursor } : undefined
        },
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
    }, [])

    useEffect(() => {
        const subscription = emitter.addListener(`page`, (data) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                refetch();
            }
        })

        const subscription2 = emitter.addListener(`feed`, (data) => {
            if (props.data?.unit !== 'feed') return;
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

    useEffect(() => {
        const subscription = emitter.addListener('list', (payload) => {
            if (payload?.action === 'refresh') {
                refetchRef.current.skipToast = true;
                refetch();
            }
        });
        return () => subscription.remove();
    }, [refetch]);

    const dataItems = refetchState.visibleItems

    if (
        dataItems.length == 0 &&
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
        contentElement = items.length == 0 ? null : <Galery items={items} autoscroll={props.extraProps?.autoscroll ?? 5000} />
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
                    listIndex={index}
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
                        listIndex={index}
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

    const NoContent = getComponent('molecule', 'no_content')

    const PreloadComponent = !data?.hide_empty_msg && dataItems.length === 0 ? (hasNextPage === false
        ? <NoContent endpoint={{ request_url: data.request_url, params: {} }} />
        : (!dataItems.params?.loaded ? Preload : null)
    ) : null;


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

    if (!dataItems.length && isShowTitleInside)
        return;

    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <View className={`w-full ${isOneLine ? '' : 'h-full'}`}>
                <View className="w-full" ></View>
                <View className={`w-full ${props.showBg ? blockTheme['u-block-bg'] + ' ' + blockTheme['u-block-pad'] + ' ' + blockTheme['u-block-base'] : ''} ${blockTheme['u-block-rounded-all']}`} style={isOneLine ? {} : styles}>
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
                    <View className="w-full">
                    {contentElement}
                    </View>
                </View>
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
            </View>
        </BlockWrapper>
    )
}
