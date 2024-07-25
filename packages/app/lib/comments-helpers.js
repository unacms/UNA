import { appSetting, md5 } from 'app/lib/util';
import { Pressable, View, Row } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Text } from 'app/design/typography'
import { useState, useContext, useRef, useEffect } from 'react';
import { componentsMap } from 'app/components/units/_map_internal';
import { Button, Modal } from 'app/design/controls'
import useSWR from "swr";
import { fetcher } from 'app/lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from 'app/components/elements/form';
import { useTheme } from '@react-navigation/native';
import { Keyboard } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { subscribe } from 'app/ui/atoms/socket';
import { useCurrentUser } from 'app/context/user';
import Toaster from 'app/ui/atoms/toaster';
import { useTranslation } from 'react-i18next';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { stripTags } from 'app/lib/util';

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

export function CommentsParts(commentsData, aItems, height = 0, initFormData, isModal = false) {
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});


    const handleReply = async (data) => {
        setFormData({ text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data })
    }

    useEffect(() => {
        if (initFormData) {
            handleReply(initFormData)
        }
    }, []);

    const handleForm = async (data) => {
        setAddData(data)
    }

    return [
        <CommentsBrowse height={height > 0 ? height : undefined} addItems={aItems} handleReply={handleReply} browse={commentsData.browse} addData={addData} module={commentsData.browse?.data?.module ? commentsData.browse.data.module : commentsData?.module} requestUrl={commentsData.url} />,
        <KbAvoidingView>
            <CommentsForm isModal={isModal} handleForm={handleForm} browse={commentsData.browse} module={commentsData.browse?.data?.module ? commentsData.browse.data.module : commentsData?.module} form={commentsData.form} formData={formData} requestUrl={commentsData.url} />
        </KbAvoidingView>
    ]
}

export function CommentsBrowse({ browse, requestUrl, module, handleReply, handleEdit, addData, addItems, isShort = false, maxCount, height = 0, showCommentsModal, classesBrowse='', commentsTitle="Comments", contentUrl, replyId }) {
    const UnitComments = componentsMap['comments'];

    const { t } = useTranslation();
    const flashListRef = useRef(null);
    let { currentUser, setCurrentUser } = useCurrentUser();

    let dataOut = [];
    let viewMode = browse?.data?.view;

    const [commentData, setCommentData] = useState({
        parentId: 0,
        startFrom: browse?.data?.start,
        perView: browse?.data?.per_view,
        last_count: browse?.data?.count,
        moduleName: module,
        orderWay: browse?.data?.order,
        view: browse?.data?.view,
        objectId: browse?.data?.object_id,
        maxLevel: browse?.data?.max_level,
        formText: '',
        formAuthor: '',
        postData: null,
        num: 0,
        listData: browse,
        lastInserted: 0,
        total_count: browse?.data?.total_count
    });

    useEffect(() => {
        if (isShort){
            setCommentData(
                prevData => ({
                    ...prevData,
                    listData: browse
                })
            );
        }
    }, [browse]);


    const addCommentData = (params) => {
        if (!params.postData)
            params.postData = null;
        if (!params.lastInserted)
            params.lastInserted = 0;
        setCommentData(Object.assign({}, commentData, params));
    }

    const handleDelete = () => {
        addCommentData({ total_count: commentData.total_count - 1 })
    }

    function prepareUrl(params) {
        let def = { 'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay };
        return requestUrl + JSON.stringify({ ...def, ...params });
    }

    useEffect(() => {
        if (addData && addData?.data?.browse && addData?.data?.browse?.insert) {
            let browse = parseData(commentData.listData, addData);

            let i = Object.keys(addData?.data?.browse.data.data[0])[0].replace('i', '');
            addCommentData({ listData: browse, total_count: commentData.total_count + 1, lastInserted: i })
        }
    }, [addData]);

    useEffect(() => {
        // flashListRef.current.scrollToIndex({ animated: true, index:  });
    }, []);




    function DataForList(items, level, last_child_in, lvls) {
        if (!items)
            return;
        Object.keys(items).forEach(function (k) {
            let ilen = Object.keys(items[k]).length
            let item = null;
            if (ilen == 1) {
                item = items[k][Object.keys(items[k])[0]];
            }
            else {
                item = items[k]
            }

            let childs = Object.keys(item.items);
            let last_child = 0;
            if (childs.length > 0) {
                last_child = item.items[childs[childs.length - 1]].id;
            }

            item.level = level;
            item.last_child = last_child_in;
            lvls[level] = (last_child_in != item.id ? true : false);
            item.lvls = lvls.slice();

            item.parent = dataOut.filter(item2 => (item2.data.cmt_id == item.data.cmt_parent_id))[0];
            dataOut.push(item)
            if (item.items && viewMode != 'flat') {
                DataForList(item.items, level + 1, last_child, lvls.slice());
            }
        })
    }

    const handleMore = async (force = false) => {
        if (maxCount)
            return;

        if (!commentData.objectId)
            return;

        if (commentData.last_count == commentData.perView) {
            handleMoreInner();
        }
    }

    const handleMoreInner = async () => {
        const sRequest = prepareUrl({ 'is_form': false });
        const sResponse = await fetcher(sRequest);
        if (sResponse && sResponse.data != undefined && sResponse?.data?.browse?.data) {
            let browse = parseData(commentData.listData, sResponse);
            let iCount = sResponse?.data?.browse?.data?.count;
            if (sResponse.data.browse.data.start == 0)
                iCount = 0;
            addCommentData({ startFrom: sResponse.data.browse.data.start, last_count: iCount, listData: browse })
        }
    }

    const handleMoreNew = async () => {
        const sRequest = prepareUrl({ 'is_form': false, comment_id: dataArrayRef.current.join(',') });
        const sResponse = await fetcher(sRequest);
        if (sResponse && sResponse.data != undefined) {
            let browse = parseData(commentData.listData, sResponse);
            let iCount = sResponse?.data?.browse?.data?.count;
            let i = Object.keys(sResponse.data.browse.data.data[0])[0].replace('i', '');
            addCommentData({ last_count: iCount, listData: browse, total_count: commentData.total_count + iCount, lastInserted: i })
        }
    }

    const handleOrder = async (orderWay) => {
        const sRequest = prepareUrl({ 'start_from': 0, 'is_form': false, 'order_way': orderWay });
        const sResponse = await fetcher(sRequest);
        if (sResponse && sResponse.data != undefined) {
            browse.data.data = [];
            browse = parseData(browse, sResponse);
            addCommentData({ startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start, last_count: sResponse.data.browse.data.count, postData: null })
        }
    }

    DataForList(commentData?.listData?.data?.data, 0, 0, []);

    const toasterRef = useRef();

    const cb = (data) => {
        let k = JSON.parse(data);
        if (currentUser && currentUser.id != k.author_id) {
            if (!dataArrayRef.current.includes(k.id)) {
                dataArrayRef.current.push(k.id);
            }
            cb2(true);
        }
    }

    const showNewContent = () => {
        cb2(false);
        handleMoreNew();
        dataArrayRef.current = [];
    }

    const cb2 = (val) => {
        if(toasterRef){
            const current = toasterRef.current;
            if (current) {
                current.setVisible(val);
            }
        }
    }

    useEffect(() => {

        if (commentData.lastInserted > 0) {
            let itemIndex = dataOut.findIndex(obj => obj.id == commentData.lastInserted);
            //TODO
            flashListRef.current.scrollToIndex({ animated: true, index: itemIndex });
        }
    }, [commentData.lastInserted]);

    useEffect(() => {
        if (!isShort)
            subscribe('cmts_' + commentData.moduleName + '_' + commentData.objectId, 'comment_added', cb);
    }, [])

    const dataArrayRef = useRef([]);
    
    if (isShort) {
        if (maxCount)
            dataOut = dataOut.slice(0, maxCount);
        return dataOut.map((item, index) => (
            <View key={index}>
                <UnitComments  contentUrl={contentUrl} module={commentData.moduleName} {...item} view={viewMode} max_level={commentData.maxLevel} handleReply={handleReply} handleEdit={handleEdit} handleDelete={handleDelete} />
            </View>))
    }


    let header = commentData.total_count > 0 ? (
        <Row className={'flex-row ' + (classesBrowse? classesBrowse: 'items-center my-4 pt-4 border-t border-bdr/50 dark:border-bdr-d/50')}>
            <Text className='flex-auto text-base font-bold text-neutral-900 dark:text-neutral-50'>{t(commentsTitle)} ({commentData.total_count})</Text>
            {!appSetting('layout', 'hide_comments_sort') && <View className="ml-4">
                <Pressable className="flex-auto" onPress={(event) => { event.preventDefault() }}>
                    <DropdownMenu items={[
                        { id: 'newest', name: 'desc', title: t('Oldest first') },
                        { id: 'oldest', name: 'asc', title: t('Newest first') }
                    ]} onSelect={(oItem) => { handleOrder(oItem.name) }}>
                        <Button variant="outline" startDecorator="SortAscending" size="xs" />
                    </DropdownMenu>
                </Pressable>
            </View>}
        </Row>) : <Text>&nbsp;</Text>;

    if (addItems) {
        if (dataOut.length > 0 || !commentData.objectId) {
            let actionsItemIndex = addItems.findIndex(item => item.id === 'block_comments-empty');
            if (actionsItemIndex > 0)
                addItems.splice(actionsItemIndex, 1);
        }
    }
    let h = dataOut.find(item => item.id === 'block_header')

    if (!h && addItems)
        dataOut = [...addItems, { id: 'block_header', data: header }, ...dataOut];

    //dataOut = dataOut.filter(item => (!item.id.toString().includes('block') || typeof item.data?.props?.children !== 'undefined') );

   

    return (
        <>
         <Toaster ref={toasterRef} onPress={showNewContent} variant="primary" title="New comment" size="sm" />
            <UniList
                useWindowScroll
                height={height > 0 ? height : undefined}
                data={dataOut}
                refer={flashListRef}
                //onScrollToIndex={handleScrollToIndex}
                renderItem={({ item, index }) => {

                    if (item.id.toString().includes('block')) {
                        return item.data;
                    }
                    return (
                        <View className='' key={index}>
                            <UnitComments replyId={replyId} module={commentData.moduleName} {...item} view={viewMode} max_level={commentData.maxLevel} handleReply={handleReply} handleEdit={handleEdit} handleDelete={handleDelete} />
                        </View>
                    )
                }}


                onEndReached={handleMore}
                ListFooterComponent={
                    (commentData.objectId && commentData.last_count == commentData.perView) ? (
                        <View className='m-2'><Loading /></View>
                    ) : null
                }
            />
           
        </>
    )
}

export function CommentsForm({ form, requestUrl, module, browse, formData, handleForm, isModal }) {

    if (!form)
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
        if (formData.parent_id > 0) {
            form.data.inputs.cmt_parent_id.value = formData.parent_id;
            if (appSetting('layout', 'comments_mentions')){
                if (formData.author.url == "/javascript:"){
                    form.data.inputs.cmt_text.value = '<a class="bx-mention-link" data-id="[object Object]" href="#" title="'+formData.author.display_name+'" dchar="@" data-profile-id="-1" contenteditable="false">'+formData.author.display_name+'</a> ';
                }
                else{
                    form.data.inputs.cmt_text.value = '<a class="bx-mention-link" href="' + formData.author.url + '">' + formData.author.display_name + '</a> ';
                }
            }
            form.data.reset = true;
            addCommentData({ formText: formData.text, formAuthor: formData.author.display_name, parentId: formData.parent_id })
        }
    }, [formData.parent_id]);

    const [commentForm, setCommentForm] = useState();

    let immutable = form ? form.request.immutable : false;
    let { data: dynamicData, error } = useSWR(
        commentForm ? [prepareUrl(), '', commentForm] : null,
        fetcher,
        !immutable ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    useEffect(() => {
        if (dynamicData?.data?.browse) {
            handleForm(dynamicData);
            handleCancel()
        }
    }, [dynamicData]);

    const handleCancel = async () => {
        form.data.inputs.cmt_parent_id.value = 0;
        form.data.inputs.cmt_text.value = '';
        form.data.reset = true;
        formData.parent_id = 0;
        addCommentData({ formText: '', formAuthor: '', parentId: 0 })
    }

    function prepareUrl(params) {
        let def = { 'module': module, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay };
        return requestUrl + JSON.stringify({ ...def, ...params });
    }

    const onFormSubmit = (formData, d) => {
        setCommentForm(formData);
        Keyboard.dismiss();
    }

    let padding = 16;
    if (isModal)
        padding = 0;
    const { colors } = useTheme();

    let className = "w-full backdrop-blur rounded-b-xl";
    if (isModal)
        className = "w-full h-screen bg-bgrcard dark:bg-bgrcard-d";
    return (
        <View className={className} style={{ backgroundColor: colors.barsBackground, paddingTop: padding, paddingBottom: padding }}>
            {
                form.data.inputs.cmt_parent_id.value > 0 && (<View className=' rounded-sm border-l-2 border-primary/50  py-1 pl-2 mx-3 mb-2'>
                    <Row className='items-start justify-between max-w-full relative'>
                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to: </Text>
                                <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{commentData.formAuthor.replace(" (anonymized)", '')}</Text>
                            </Row>
                            <Text className='text-sm overflow-hidden text-neutral-900 dark:text-neutral-50' numberOfLines={3}>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text>
                        </View>
                        <View className=" right-0 t-0">
                            <Button align="start" rounded startDecorator="X" size="xs" variant="outline" onPress={() => handleCancel()} />
                        </View>
                    </Row>
                </View>)
            }
            <Form {...form} resetOnSubmit={true} classContainerName={(isModal ? "" : "  ") + " flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
        </View>
    )
}

