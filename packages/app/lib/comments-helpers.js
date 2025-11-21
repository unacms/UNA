import { appSetting } from 'app/lib/util';
import { Pressable, View, Row } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Text } from 'app/design/typography'
import { useState, useReducer, useRef, useEffect, useCallback } from 'react';
import { getComponent } from 'app/components/registry';;
import { Button } from 'app/design/controls'
import useFetchForm from 'app/lib/hooks/fetch'
import { fetcher } from 'app/lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from 'app/components/elements/form';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { subscribe } from 'app/ui/atoms/socket';
import { useCurrentUser } from 'app/context/user';
import { useTranslation } from 'react-i18next';
import { getPart } from 'app/lib/parts/part';
import { useInfiniteQuery } from '@tanstack/react-query'
import {
    refetchUniListReducer,
    isSameItemsForUniList
} from 'app/lib/conductor-helpers'
import Toaster from 'app/ui/atoms/toaster2'
import emitter from 'app/context/emitter'

export function CommentsBrowse({ scrollProps,
    browse,
    requestUrl,
    module,
    handleReply,
    addItems,
    isShort = false,
    maxCount,
    height = 0,
    classesBrowse = '',
    commentsTitle = "Comments",
    contentUrl,
    replyId,
    hideActions = false,
    scrollToIndex = false,
    isModal=false 
}) {
    const UnitComments = getComponent('unit', 'comments');
    const { t } = useTranslation();
    const flashListRef = useRef(null);
    const { currentUser } = useCurrentUser();
    const viewMode = browse?.data?.view;

    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false
    })

    const refetchRef = useRef({
        skipToast: false,
        isFirstLoad: true,
        prevItems: []
    })

    const baseParams = {
        //static
        module: module,
        object_id: browse?.data?.object_id,
        per_view: browse?.data?.per_view,
        view: browse?.data?.view,
        max_level: browse?.data?.max_level,

        //dynamic
        order_way: browse?.data?.order,
        start_from: browse?.data?.start,
        total_count: browse?.data?.total_count
    }

    const [browseParams, setBrowseParams] = useState(baseParams);
    const [scrollIndex, setScrollIndex] = useState(scrollToIndex);

    function prepareUrl(params) {
        let def = {
            module: browseParams.module,
            object_id: browseParams.object_id,
            start_from: params?.start_from ?? browse?.data?.start ?? 0,
            order_way: browseParams.order_way,
        }
        return requestUrl + JSON.stringify({ ...def, ...params })
    }

    async function fetchComments({ pageParam }) {
        const {
            start_from = 0,
        } = pageParam || {}

        const sRequest = prepareUrl({
            is_form: false,
            start_from,
        })
        const sResponse = await fetcher(sRequest)
        const data = sResponse?.data?.browse?.data

        return {
            raw: sResponse,
            tree: data?.data,
            start: data?.start,
            count: data?.count,
            per_view: data?.per_view,
            total_count: data?.total_count,
        }
    }

    function buildFlatListFromTree(items, viewMode) {
        const result = []

        function walk(items, level, last_child_in, lvls) {
            if (!items) return

            Object.keys(items).forEach((k) => {
                let ilen = Object.keys(items[k]).length
                let item = ilen == 1 ? items[k][Object.keys(items[k])[0]] : items[k]

                let childs = Object.keys(item.items || {})
                let last_child = 0
                if (childs.length > 0) {
                    last_child = item.items[childs[childs.length - 1]].id
                }

                item.level = level
                item.last_child = last_child_in
                lvls[level] = last_child_in != item.id
                item.lvls = lvls.slice()

                // parent пока оставим как есть — позже можно оптимизировать
                item.parent = result.filter(
                    (item2) => item2.data.cmt_id == item.data.cmt_parent_id
                )[0]

                result.push(item)

                if (item.items && viewMode != 'flat') {
                    walk(item.items, level + 1, last_child, lvls.slice())
                }
            })
        }

        walk(items, 0, 0, [])

        return result
    }

    function flattenPagesForComments(pagesData, viewMode) {
        if (!pagesData?.pages?.length) return []

        const all = []

        pagesData.pages.forEach((page) => {
            const tree =
                page?.raw?.data?.browse?.data?.data
                || page.tree
                || page.data
            if (!tree) return

            const flat = buildFlatListFromTree(tree, viewMode)
            all.push(...flat)
        })

        return all
    }

    //Scroll to item by initial params 
    useEffect(() => {
        if (scrollIndex !== false && scrollIndex !== true) {
            scrollToItemByCommentId(scrollIndex);
        }
        //to the end
        if (scrollIndex === true) {
            scrollToItemByIndex(dataOut.length - 1);
        }
    }, [scrollIndex]);

    useEffect(() => {
        if (!isShort) {
            subscribe('cmts_' + browseParams.module + '_' + browseParams.object_id, 'comment_added', refetch);
            subscribe('cmts_' + browseParams.module + '_' + browseParams.object_id, 'comment_edited', refetch);
            subscribe('cmts_' + browseParams.module + '_' + browseParams.object_id, 'comment_deleted', refetch);
        }

        const subscription = emitter.addListener(`page`, (data) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                refetch();
            }
        })

        const subscription2 = emitter.addListener(`comment_${baseParams.module}_${baseParams.object_id}`, (data) => {
            if (data.action == 'remove_content') {
                dispatch({ type: 'REMOVE_ITEM', id: data.data.id })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = refetchRef.current.prevItems.filter(item => item.id != data.id)
                }
                refetchRef.current.skipToast = true;
                setBrowseParams(prev => ({
                    ...prev,
                    total_count: prev.total_count - 1,
                }));
            }
            if (data.action == 'new_content') {
                //MANY BE NEED TO IMPROVE

                const newItem = data.data;
                // Используем ref, так как он содержит актуальный список внутри замыкания useEffect
                const items = refetchRef.current.prevItems || [];

                // Определяем ID родителя (предполагаем, что он в data.cmt_parent_id)
                const parentId = newItem.data?.cmt_parent_id || newItem.cmt_parent_id || 0;
                let insertIndex = 0;

                if (parentId == 0) {
                    // Корневой комментарий
                    // Если нужно в начало (новые сверху):
                    insertIndex = browseParams.order_way == 'asc' ? items.length : 0;
                    // Если нужно в конец (старые сверху): insertIndex = items.length;

                    newItem.level = 0;
                } else {
                    // Это ответ - ищем родителя
                    const parentIndex = items.findIndex(i => (i.data?.cmt_id == parentId) || (i.id == parentId));

                    if (parentIndex !== -1) {
                        const parent = items[parentIndex];
                        newItem.level = (parent.level || 0) + 1;

                        // Ищем, куда вставить: пропускаем самого родителя и всех его потомков.
                        // Потомки имеют level строго больше, чем у родителя.
                        let i = parentIndex + 1;
                        while (i < items.length && items[i].level > parent.level) {
                            i++;
                        }
                        insertIndex = i;
                    } else {
                        // Если родитель не найден (например, не загружен), вставляем в начало
                        insertIndex = 0;
                        newItem.level = 0;
                    }
                    setBrowseParams(prev => ({
                        ...prev,
                        total_count: prev.total_count + 1,
                    }));
                }

                // Создаем новый массив с вставленным элементом
                const newItems = [...items];
                newItems.splice(insertIndex, 0, newItem);

                // Обновляем список через SET_ITEMS
                dispatch({ type: 'SET_ITEMS', items: newItems })

                if (refetchRef.current) {
                    refetchRef.current.prevItems = newItems;
                    refetchRef.current.skipToast = true;
                }

                setScrollIndex(newItem.id)
                refetchRef.current.skipToast = true;
                refetch()
            }
        })

        return () => {
            subscription.remove();
            subscription2.remove()
        }
    }, [])

    const qKey = ['comments', module, currentUser?.id, browseParams.object_id, browseParams.order_way]

    const {
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: fetchComments,

        initialPageParam: {
            start_from: 0,
        },

        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.start === 0 || lastPage.count === 0) return undefined
            return {
                start_from: lastPage.start
            }
        },

        initialData: () => {
            if (!browse?.data) return undefined
            const d = browse.data
            return {
                pages: [
                    {
                        raw: { data: { browse: { data: d } } },
                        tree: d.data,
                        start: d.start,
                        count: d.count,
                        per_view: d.per_view,
                        total_count: d.total_count,
                    },
                ],
                pageParams: [
                    {
                        start_from: 0,
                    },
                ],
            }
        },
        staleTime: isShort? Infinity : appSetting('browse', 'stale_time'),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        enabled: !isShort
    })


    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForComments(pagesData, viewMode)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            return
        }

        if (isSameItemsForUniList(refetchRef.current.prevItems, items)) {
            return
        }

        if (refetchRef.current.skipToast) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.skipToast = false
        } else {
            dispatch({ type: 'SHOW_NEW_DATA' })
        }


        refetchRef.current.prevItems = items
    }, [pagesData, viewMode])

     useEffect(() => {
        if (isShort) return

        if (refetchRef.current.isFirstLoad && browseParams.order_way === baseParams.order_way) {
            return
        }
        
        // Если order_way изменился, перезагружаем данные
        if (!refetchRef.current.isFirstLoad || browseParams.order_way !== baseParams.order_way) {
            refetchRef.current.skipToast = true
            refetchRef.current.isFirstLoad = true
            refetch()
        }
    }, [browseParams.order_way])

    const handleEndReached = useCallback(
        (lastItemIndex) => {
            if (maxCount) return
            if (!browseParams.object_id) return
            if (!hasNextPage) return
            if (isFetchingNextPage) return
            if (lastItemIndex == false) return

            refetchRef.current.skipToast = true
            fetchNextPage()
        },
        [hasNextPage, maxCount, browseParams.object_id, isFetchingNextPage]
    )

    const handleOrder = async (orderWay) => {
        setBrowseParams(prev => ({
            ...prev,
            order_way: orderWay,
        }));
    }

    console.log("refetchState.visibleItems", refetchState.visibleItems, baseParams.object_id)

    if (isShort) {
        return (maxCount ? refetchState.visibleItems.slice(0, maxCount) : refetchState.visibleItems).map((item, index) => (
            <View key={item.id}>
                <UnitComments contentUrl={contentUrl} module={browseParams.module} {...item} view={viewMode} max_level={browseParams.max_level} handleReply={handleReply} />
            </View>))
    }
    const title = t(module + '_title') === module + '_title' ? t(commentsTitle) : t(module + '_title');

    const header = browseParams.total_count > 0 ? (
        <Row className={'flex-row ' + (classesBrowse ? classesBrowse : `p-3 sm:px-4 justify-between items-center  border-t border-border/60`)}>
            <Text className='flex-auto text-base font-semibold text-secondary-foreground'>{title} ({browseParams.total_count})</Text>
            {!appSetting('comments', 'hide_sort') && <View className="ml-4">
                <Pressable className="flex-auto" onPress={(event) => { event.preventDefault() }}>
                    <DropdownMenu items={[
                        { id: 'newest', name: 'asc', title: t('Oldest first'), selected: browseParams.order_way == 'asc' },
                        { id: 'oldest', name: 'desc', title: t('Newest first'), selected: browseParams.order_way == 'desc' }
                    ]} onSelect={(oItem) => { handleOrder(oItem.name) }}>
                        <Button variant="secondary" startDecorator={browseParams.order_way == 'asc' ? "ArrowDownAZ" : "ArrowDownZA"} size="xs" />
                    </DropdownMenu>
                </Pressable>
            </View>}
        </Row>) : <Text>&nbsp;</Text>;

    const extra = (addItems || []).filter(i => i.id !== 'block_comments-empty' || (!refetchState.visibleItems.length && browseParams.object_id));

console.log("refetchState.visibleItems", refetchState.visibleItems)

    const dataOut = !refetchState.visibleItems.some(i => i.id === 'block_header') && extra.length
        ? [...extra, { id: 'block_header', data: header }, ...refetchState.visibleItems]
        : refetchState.visibleItems;

    function scrollToItemByCommentId(cmtId) {
        const index = refetchState.visibleItems.findIndex(obj => obj.id == cmtId)
        const itemIndex = index ? index + 1 + extra.length : index;
        scrollToItemByIndex(itemIndex);
    }

    function scrollToItemByIndex(itemIndex) {
        if (itemIndex > 0) {
            setTimeout(() => {
                if (flashListRef.current)
                    flashListRef.current.scrollToIndex(
                        {
                            animated: true,
                            index: itemIndex,
                            align: 'end',
                            behavior: 'smooth',
                        }
                    );
            }, 300);
        }
    }

    return (
        <>
            <UniList
                scrollProps={scrollProps}
                mode='simple'
                useWindowScroll={!isModal}
                height={height > 0 ? height : undefined}
                data={dataOut}
                refer={flashListRef}
                onRefresh={refetch}
                refreshing={isRefetching}
                renderItem={({ item, index }) => {

                    if (item.id.toString().includes('block')) {
                        return item.data;
                    }

                    return (
                        <View className="px-3 sm:px-4" key={index}>
                            <UnitComments
                                selectedId={scrollToIndex}
                                hideActions={hideActions}
                                replyId={replyId}
                                module={browseParams.module}
                                {...item}
                                view={viewMode}
                                max_level={browseParams.max_level}
                                handleReply={handleReply}
                                isNewComment={false}//todo
                            />
                        </View>
                    )
                }}
                onEndReached={handleEndReached}
                ListFooterComponent={
                    (browseParams.object_id && hasNextPage && isFetchingNextPage) ? (
                        <View className=''><Loading /></View>
                    ) : null
                }
            />
            {refetchState.hasNewData && (
                <Toaster
                    position="top"
                    onPress={() => {
                        const latestItems = flattenPagesForComments(pagesData, viewMode)
                        dispatch({ type: 'SET_ITEMS', items: latestItems })

                        refetchRef.current.prevItems = latestItems


                        // сюда можно добавить скролл к нужному месту TODO
                        if (flashListRef.current) {
                            flashListRef.current.scrollToIndex?.({
                                index: latestItems.length - 1,
                                animated: true,
                            })
                        }
                        setBrowseParams(prev => ({
                            ...prev,
                            total_count: pagesData.pages[0].total_count,
                        }));
                    }}
                    isVisible={refetchState.hasNewData}
                    variant="primary"
                    title={t('Show new comments')}
                    size="sm"
                />
            )}

        </>
    )
}

export function findParent(data, c, o, insert) {
    if (Array.isArray(data)) {
        //for first level
        data.map(function (d, k) {
            if (o.data.cmt_vparent_id == d[Object.keys(d)[0]].id) {
                if (insert == 'before')
                    data[k][Object.keys(data[k])[0]].items = { ...c, ...data[k][Object.keys(data[k])[0]].items };
                else
                    data[k][Object.keys(data[k])[0]].items = { ...data[k][Object.keys(data[k])[0]].items, ...c };

            }
            data[k][Object.keys(data[k])[0]].items = findParent(data[k][Object.keys(data[k])[0]].items, c, o, insert)
        })
    }
    else {
        //for another levels
        Object.keys(data).forEach(function (k) {
            if (o.data.cmt_vparent_id == data[k].id) {
                if (insert == 'before')
                    data[k].items = { ...c, ...data[k].items };
                else
                    data[k].items = { ...data[k].items, ...c };
            }
            data[k].items = findParent(data[k].items, c, o)
        });

    }
    return data;
}

export function parseData(browse, dynamicData) {
    if (!dynamicData?.data?.browse?.data?.data)
        return;
    dynamicData.data.browse.data.data.map(function (c, kc) {
        let o = c[Object.keys(c)[0]];
        // add in root
        if (o.data.cmt_vparent_id == 0) {
            let bPresent = false;
            browse.data.data.forEach(function (k) {
                if (Object.keys(k)[0] == Object.keys(c)[0])
                    bPresent = true;
            });

            if (!bPresent) {

                if (dynamicData.data.browse.insert == 'before') {
                    browse.data.data = browse.data.data.concat([c]);
                }
                else {
                    browse.data.data = [c].concat(browse.data.data);
                }
            }
        }
        else {
            browse.data.data = findParent(browse.data.data, c, o, dynamicData.data.browse.insert);
        }
    });
    return browse;
}

export function CommentsForm({ form, requestUrl, module, browse, formData, isModal = false }) {

    if (!form?.data?.inputs)
        return <></>
    const [commentData, setCommentData] = useState({
        parentId: 0,
        startFrom: browse.data.start,
        perView: browse.data.per_view,
        last_count: browse.data.count,
        moduleName: module,
        orderWay: browse.data.order,
        view: browse.data.view,
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null,
        num: 0,
        listData: null,
        total_count: browse.data.total_count
    });

    const addCommentData = (params) => {
        setCommentData(Object.assign({}, commentData, params));
    }

    useEffect(() => {
        const updateFormData = async () => {
            if (formData.parent_id > 0) {
                form.data.inputs.cmt_parent_id.value = formData.parent_id;
                if (appSetting('comments', 'mentions')) {
                    const sUrl = appSetting('urls', 'cmts_menthion_url');
                    if (sUrl) {
                        const sResponse = await fetcher(`/api.php?r=${sUrl}&params[]=${formData.cmt_id}&params[]=${formData.cmt_object_id}`);

                        if (sResponse.data) {
                            form.data.inputs.cmt_text.value = `<a class="bx-mention-link ${sResponse.data.add_classes}" ts="${formData.ts}" data-id="[object Object]" href="/mention${sResponse.data.id}" title="${sResponse.data.name.trim()}" dchar="@" data-profile-id="-1" contenteditable="false">${sResponse.data.name.trim()}</a>&shy;&nbsp;`;
                        }
                        else {
                            form.data.inputs.cmt_text.value = '';
                        }
                    }
                    else {
                        if (formData.author.url == "/javascript:") {
                            form.data.inputs.cmt_text.value = `<a class="bx-mention-link" ts="${formData.ts}" data-id="[object Object]" href="#" title="${formData.author.display_name.trim()}" dchar="@" data-profile-id="-1" contenteditable="false">${formData.author.display_name.trim()}</a>&shy;&nbsp;`;
                        }
                        else {
                            form.data.inputs.cmt_text.value = '<a class="bx-mention-link" ts=' + formData.ts + ' href="' + formData.author.url + '">' + formData.author.display_name.trim() + '</a>&shy;&nbsp;';
                        }

                    }
                }
                // form.data.reset = true;
                form.data.inputs.cmt_text.autofocus = formData.parent_id;
                addCommentData({ formText: formData.text, formAuthor: formData.author.display_name, parentId: formData.parent_id })
            }
        }
        updateFormData();
    }, [formData.parent_id, formData.ts]);

    const [commentForm, setCommentForm] = useState();

    const { data: dynamicData, error } = useFetchForm(prepareUrl(), commentForm);

    useEffect(() => {
        if (dynamicData?.data?.browse) {
            // console.log("datadata2", dynamicData.data.browse.data.data[0]['i'+dynamicData.data.browse.new[0]], dynamicData.data.browse.new[0])
            emitter.emit(`comment_${module}_${browse.data.object_id}`, { action: 'new_content', data: dynamicData.data.browse.data.data[0]['i' + dynamicData.data.browse.new[0]] });
            //handleForm(dynamicData);
            handleCancel() // DISABLED TO AVOID ANY REREBDERS AFTER NEW COMMENTS
        }
    }, [dynamicData]);

    const handleCancel = async () => {
        form.data.inputs.cmt_parent_id.value = 0;
        form.data.inputs.cmt_text.value = '';
        //form.data.inputs.cmt_text.autofocus = false;
        //  form.data.reset = true;
        formData.parent_id = 0;

        addCommentData({ formText: '', formAuthor: '', parentId: 0 }) // DISABLED TO AVOID ANY REREBDERS AFTER NEW COMMENTS
    }

    function prepareUrl(params) {
        let def = { 'module': module, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay };
        return requestUrl + JSON.stringify({ ...def, ...params });
    }

    const onFormSubmit = (formData, d) => {
        setCommentForm(formData);
    }




    const combinedExProps = {
        ...(form?.exProps || {}),
        browse: dynamicData?.data?.browse,
        isModal,
    };
    console.log("form?.data?.inputs?.cmt_parent_id?.value", form?.data?.inputs?.cmt_parent_id?.value)
    return (
        <View className="lg:rounded-b-2xl max-w-4xl p-4 bg-card " >
            {
                form?.data?.inputs?.cmt_parent_id?.value > 0 && (<View className=' rounded-sm border-l-2 border-bgritemprimary dark:border-bgritemprimary-d  py-1 pl-2 mb-2'>
                    <Row className='items-start justify-between max-w-full relative'>
                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to: </Text>
                                <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{getPart("ProfileDisplayName", [commentData.formAuthor])}</Text>
                            </Row>
                            <Text className=' text-base overflow-hidden text-neutral-900 dark:text-neutral-50 text-sm' numberOfLines={3}>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text>
                        </View>
                        <View className=" right-0 t-0">
                            <Button align="start" rounded startDecorator="X" size="xs" variant="outline" onPress={() => handleCancel()} />
                        </View>
                    </Row>
                </View>)
            }
            <Form {...form} exProps={combinedExProps} resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
        </View>
    )
}