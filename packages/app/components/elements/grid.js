import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import Confirm from 'app/ui/molecules/confirm';
import { Button } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import React, { useEffect, useState, useMemo, useCallback, useRef, useReducer } from 'react';
import { Theme } from 'app/design/theme';
import Switch from 'app/ui/atoms/switcher'
import CheckBox from 'app/ui/atoms/checkbox';
import { Input } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { stripTags } from 'app/lib/util';
import { Modal } from 'app/design/controls'
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Icon } from 'app/ui/atoms/icon'
import Redirect from 'app/ui/atoms/redirect';
import Stripe from 'app/ui/molecules/stripe';
import { useBreakpoint } from 'app/context/measure';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useInfiniteQuery } from '@tanstack/react-query'
import Loading from 'app/ui/atoms/loading'
import {
    refetchUniListReducer,
    flattenPagesForUniList,
    isSameItemsForUniList
} from 'app/lib/conductor-helpers'
const getWidth1 = (width) => {
    if (!width)
        return undefined;

    return width
}

const ActionButton = React.memo(({ id, index, itemAction, setTimeStamp, setShowConfirm, deleteRows, fetchData, handleBlock, refetch }) => {
    const [hide, setHide] = useState(false);
    const redirectRef = useRef();
    const getActionAfter = async (itemAction) => {

        /*if (itemAction.on_callback == 'hide') {
            setHide(true);
        }*/
        if (itemAction.on_callback == 'hide_row') {
            deleteRows([itemAction.attr.bx_grid_action_data, id]); 
        }
        if (itemAction.on_callback == 'redirect') {
            redirectRef.current.redirect(itemAction.redirect_url);
        }

       refetch();
    }

    const getAction = async (itemAction, setShowConfirm) => {
        if (itemAction.confirm == '1') {
            setShowConfirm({
                show: true,
                cb: async () =>  {
                    await fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
                    getActionAfter(itemAction);
                    
                }
            });
        }
        else {
            await fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
            getActionAfter(itemAction);
        }
    }

    const getActionButtonIcon = (name) => {
        if (name == 'delete') {
            return 'Trash'
        }
        if (name == 'edit') {
            return 'Pencil'
        }
        if (name == 'promotion') {
            return 'ChartLine'
        }
        if (name == 'edit_budget') {
            return 'Wallet'
        }
        if (name == 'set_role') {
            return 'UserRoundCog'
        }
        return false;
    };

    let icon = getActionButtonIcon(itemAction.name);

    const excludedActions = ['clear_reports', 'set_acl_level'];

    if (excludedActions.includes(itemAction.name) || hide) {
        return <></>;
    }

    const commonProps = {
        variant: itemAction.type === 'link' ? 'outline' : 'text',
        size: 'sm',
        title: icon ? '' : itemAction.title,
        startDecorator: icon
    };

    if (itemAction.type === 'link') {
        return (
            <Link key={index} href={itemAction.url}>
                <Button {...commonProps} />
            </Link>
        );
    }

    if (itemAction.type === 'modal') {
        return (
            <Button
                {...commonProps}
                onPress={() => {
                    handleBlock(itemAction);
                }}
            />
        );
    }

    if (itemAction.type === 'object') {
        return (
            <Button
                {...commonProps}
                onPress={() => {
                    handleBlock(itemAction);
                }}
            />
        );
    }

    if (itemAction.type === 'callback') {
        return (
            <>
                <Redirect ref={redirectRef} />
                <Button
                    key={index}
                    {...commonProps}
                    onPress={() => getAction(itemAction, setShowConfirm)}
                /></>
        );
    }

});

const Cell = React.memo(({ cell, indexRow, id, toggleSwitch, setSelection, selected,setTimeStamp,  setShowConfirm, deleteRows, refetch, fetchData, handleBlock }) => {
    switch (cell?.type) {
        case 'time':
            return <Time ts={cell.data} stylesName={'text-sm text-label-secondary '}></Time>
        case 'datetime':
            return <Time ts={cell.data} format='datetime' stylesName={'text-xs text-label-secondary '}></Time>
        case 'link':
            return <Link href={cell.data.url}><Text className="text-primary">{cell.data.text}</Text></Link>
        case 'text':
            return <Text className="text-label-secondary  truncate overflow-hidden">{stripTags(cell.value)}</Text>
        case 'price':
            return <Text className="text-label-secondary  truncate overflow-hidden">{cell.value.value +' '+ cell.value.currency}</Text>
        case 'period':
            return <Text className="text-label-secondary  truncate overflow-hidden">{cell.value.period +' '+ cell.value.unit}</Text>
        case 'order':
            return <Text className="text-label-secondary  text-lg">
                <Icon icon='MoveVertical' />
            </Text>
        case 'switcher':
            return <>
                <Switch
                    size="sm"
                    onValueChange={() => toggleSwitch(id, indexRow)}
                    value={cell.data == 'active' || cell.data == '1' ? true : false}

                /></>
        case 'checkbox':
            return <>
                <CheckBox
                    value={selected.includes(cell.data)}
                    status={selected.includes(cell.data) ? 'checked' : 'unchecked'}
                    onPress={() => setSelection(cell.data)}
                    isBackground={false}
                /></>
        case 'profile':
            return <Profile {...cell.data} displaySize="sm" />
        case 'actions':
            return (<Row className='space-x-2 justify-end'>
                {cell.data.filter(item => item?.type).map((itemAction, index) => (
                    <ActionButton
                        key={"ab" + index}
                        index={index}
                        itemAction={itemAction}
                        indexRow={indexRow}
                        id={id}
                        setShowConfirm={setShowConfirm}
                        deleteRows={deleteRows}
                        fetchData={fetchData}
                        refetch={refetch}
                        setTimeStamp={setTimeStamp}
                        handleBlock={handleBlock}
                    // You need to define this function in your component
                    />
                ))}
            </Row>)

    }
    return <Text className="text-label-secondary ">{JSON.stringify(cell)}</Text>
});


const MultiAdd = React.memo(({ data, setBottomSheetData, handleUpdate }) => {

    const handleAction = async (item) => {

        const fetchedData = await fetcher("/api.php?r=" + item.callback);
        let cnt = { content: fetchedData.data, designbox_id: 0 }
        setBottomSheetData({ title: cnt.content[0]?.title ? cnt.content[0]?.title : " ", content: <View className='px-1'><BlockByData onFormEmpty={() => handleUpdate()} block={cnt} /></View> });
    };

    return <DropdownMenu items={data.values} onSelect={(oItem) => { handleAction(oItem) }}>
        <Button startDecorator="Plus" variant="default" size="sm" title={data.title} />
    </DropdownMenu>
})
    ;

const fetchGridData = async ({ pageParam, settings, selectedFilter, searchValue }) => {
    const start = pageParam?.start || 0;
    let url = "&start=" + start;
    url += '&filter=' + (selectedFilter ? selectedFilter.id + '%23-%23' : '') + searchValue;
    
    let sUrl = '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=display';
    if (settings?.query_append) {
        Object.keys(settings.query_append).forEach((sKey) => {
            sUrl += '&' + sKey + '=' + settings.query_append[sKey];
        });
    }
    
    const fetchedData = await fetcher(sUrl + url);
    
    return {
        data: fetchedData.data?.data || [],
        settings: fetchedData.data?.settings || settings,
        params: {
            start: start,
            per_page: fetchedData.data?.settings?.per_page || settings.per_page
        }
    };
};

export default function ElementGrid(props) {

    const { setBottomSheetData } = useBottomSheetData();
    const data = props.data;
    let settings = data.settings;
    if (!data.header)
        return <></>
    const header = data.header.filter((item) => (item?.name != 'reports'))
    const isSortable = header.find((item) => item?.name == 'order');
    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false
    })
    const refetchRef = useRef({
        isFirstLoad: true,
        prevItems: []
    })
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState({ show: false, cb: null });
    const [selectedFilter, setSelectedFilter] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [timeStamp, setTimeStamp] = useState(Date.now());
    const [modalContent, setModalContent] = useState(false);
    const [modalContentElement, setModalContentElement] = useState(false);
    const { t } = useTranslation();
    const currentBreakpoint = useBreakpoint();

    const queryKey = [
        'grid',
        settings.object,
        selectedFilter?.id || '',
        searchValue,
        timeStamp
    ];

    const {
        status,
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: queryKey,
        queryFn: ({ pageParam }) => fetchGridData({
            pageParam,
            settings,
            selectedFilter,
            searchValue
        }),
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length > 0) {
                return {
                    start: lastPage.params.start + lastPage.params.per_page
                };
            }
            return undefined;
        },
        staleTime: 1000,
        initialPageParam: { start: 0 }
    });

    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForUniList(pagesData)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            return
        }
        
        // Обновляем элементы при изменении данных
        dispatch({ type: 'SET_ITEMS', items })
        refetchRef.current.prevItems = items
    }, [pagesData])

    


    const dataItems = refetchState.visibleItems


    const deleteRows = useCallback((idsToRemove) => {

        idsToRemove.forEach(id => {
            dispatch({ type: 'REMOVE_ITEM', id: id })
        })
        

        if (refetchRef.current?.prevItems) {
            refetchRef.current.prevItems = refetchRef.current.prevItems.filter(item => !idsToRemove.includes(item.id))
        }
        
    }, [refetch]);

    const handleDeleteSelected = () => {
        setShowConfirm({
            show: true,
            cb: () => {
                deleteRows(selected);
                fetchData('delete', '&' + selected.map(id => `ids[]=${id}`).join('&'))
            }
        });
    };

    const handleActionBlock = async (data) => {

        if (data.type == 'modal') {
            let fetchedData = await fetchData(data.action, data.params, data.callback);
            let cnt = { content: fetchedData.data, designbox_id: 0 }
            setBottomSheetData({ title: cnt.content[0]?.title || data.title, content: <View className='px-1'><BlockByData onFormEmpty={() => handleUpdate()} block={cnt} /></View> });
        }
        if (data.type == 'object') {
            setModalContentElement(<Stripe seller_id={data.seller_id} items={data.items} />);
        }
    };

    const handleActionBlockPayment = async () => {
        setModalContentElement(<Stripe seller_id={settings.query_append.seller_id} items={selected} />);
    };

    const handleCloseModal = () => {
        setBottomSheetData(false);
        setModalContent(false);
    };

    const handleCloseModalElement = () => {
        setModalContentElement(false);
    };

    const handleUpdate = () => {
        setTimeout(() => {
            handleCloseModal();
            setTimeStamp(Date.now());
        }, 100);
    }

    const fetchData = useCallback(async (action, params, callback) => {
        let sUrl = callback ? '/api.php?r=' + callback : '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=' + action;
        if (settings?.query_append && !callback)
            Object.keys(settings.query_append).forEach((sKey) => {
                sUrl += '&' + sKey + '=' + settings.query_append[sKey];
            });

        return await fetcher(sUrl + (callback ? '' : params));
    }, [settings.object]);

    const handleEndReached = useCallback(() => {
        if (!hasNextPage) return;
        if (isFetchingNextPage) return;
        fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    const toggleSwitch = async (id, indexRow) => {
        let bChecked = false;
        const oSwitcher = { active: 'hidden', hidden: 'active', 0: '1', 1: '0' };

        // Оптимистичное обновление UI - мутируем напрямую
        const currentItem = dataItems[indexRow];
        if (currentItem?.switcher) {
            currentItem.switcher.data = oSwitcher[currentItem.switcher.data] ;
            if (currentItem.switcher.data == 'active' || currentItem.switcher.data == '1')
                bChecked = true;
        }

        // Отправляем запрос на сервер
        await fetchData('enable', '&ids[]=' + id + (bChecked ? '&checked=1' : ''));
        
        // Обновляем данные с сервера для синхронизации
        refetch();
    }
    const setSelection = (data) => {
        if (!selected.includes(data)) {
            setSelected([...selected, data]);
        }
        else {
            setSelected(selected.filter((item) => (item != data)));
        }
    }

    const handleSearch = (value) => {
        setSearchValue(value);
        setTimeStamp(Date.now());
    };

    const handleFilter = (value) => {
        setSelectedFilter(value);
        setTimeStamp(Date.now());
    };

    const handleSort = useCallback((result) => {
        if (!result.destination) return;
        const updatedData = [...dataItems];
        const [removed] = updatedData.splice(result.source.index, 1);
        updatedData.splice(result.destination.index, 0, removed);
        fetchData('reorder', '&' + updatedData.map(item => `${settings.object}_row[]=${item.id}`).join('&'));
        refetch();
    }, [dataItems, settings, fetchData, refetch]);

    const dropdownItems = useMemo(() => {
        // Check the condition inside useMemo
        if (settings.filters?.filter1 && settings.filters.filter1.length > 0) {
            return settings.filters.filter1.map((aItem) => ({
                id: aItem.value,
                name: aItem.title.toLowerCase(),
                title: aItem.title
            }));
        }
        return []; // Return an empty array if the condition is not met
    }, [settings.filters?.filter1]);


    const actionsBulk = Object.values(data.actions.bulk);
    const actionsIndependent = Object.values(data.actions.independent);


    /*   <Text className="tracking-tight text-lg font-bold text-popover-foreground  mb-2">{stripTags(props?.block?.title)}</Text>*/
    let a = <View className="w-full">

        {modalContent && (
            <Modal title={modalContent.content[0]?.title ? modalContent.content[0]?.title : " "} onVisible={!!modalContent} onClose={() => handleCloseModal()}>
                <View className='px-4'>
                    <BlockByData onFormEmpty={() => handleUpdate()} block={modalContent} />
                </View>
            </Modal>
        )
        }
        {modalContentElement && (
            <Modal scrollable title="Checkout" onVisible={!!modalContentElement} onClose={() => handleCloseModalElement()}>
                <View className='px-4'>
                    {modalContentElement}
                </View>
            </Modal>
        )
        }


        <Confirm onVisible={showConfirm.show} title={t("Are you sure?")} handleCancel={() => setShowConfirm({ show: false, cb: null })} handleOk={() => { setShowConfirm({ show: false, cb: null }); showConfirm.cb(); }} />
        <Row className='xl:justify-between mt-2 mb-4 '>
            {Object.keys(settings.filters).length > 0 &&
                <Row className="gap-x-2 ">
                    {settings.filters?.filter1 && settings.filters.filter1.length > 0 &&
                        <DropdownMenu items={dropdownItems} onSelect={(oItem) => { handleFilter(oItem) }}>
                            <Button title={selectedFilter ? selectedFilter.title : dropdownItems[0].title} size="sm" />
                        </DropdownMenu>
                    }
                    {settings.filters?.search &&
                        <Input size="small" placeholder={t('Search')} name="search" onChangeText={(value) => handleSearch(value)} />
                    }
                </Row>
            }
            <Row className="gap-x-2 ml-1 items-center">

                {actionsIndependent.map((item, index) => {
                    if (item.type == 'modal') {
                        return <Button key={`btn-${item.name}`} startDecorator="Plus" size="sm" showTitleFromSize='sm' title={t(item?.title || "Add new")} onPress={() => { handleActionBlock(item) }} />
                    }
                    if (item.type == 'menu') {
                        return <MultiAdd key={`btn-${item.name}`} handleUpdate={handleUpdate} setBottomSheetData={setBottomSheetData} data={item} />
                    }
                    if (item.type == 'link') {
                        return <Link key={`btn-${item.name}`} href={item.link || item.url}><Button size="sm" title={item.title} showTitleFromSize='sm' /></Link>
                    }
                })}

                {actionsBulk.map((item, index) => {
                    if (item.name == 'delete') {
                        return <Button key={item.name} startDecorator="Trash" size="sm" showTitleFromSize='sm' title={t("Delete selected")} disabled={selected.length == 0} onPress={() => { handleDeleteSelected() }} />
                    }
                    if (item.name == 'stripe_v3') {
                        return <Button size="sm" title={t("Checkout with Stripe")} showTitleFromSize='sm' disabled={selected.length == 0} onPress={() => { handleActionBlockPayment('stripe_v3') }} />
                    }
                })}

                {
                    /*
                       {
                                        data.actions.bulk.credits && (
                                            <Button  size="base" title={t("Checkout with Credits")}  showTitleFromSize='sm' disabled={selected.length == 0} onPress={() => {alert("TODO Checkout with Credits")}} />)
                                        }
                                    {
                                        data.actions.bulk.paypal_api && (
                                            <Button  size="base" title={t("Checkout with PayPal")}  showTitleFromSize='sm' disabled={selected.length == 0} onPress={() => {alert("TODO CheCheckout with PayPal")}} />)
                                         }
                                    
                    */

                }
            </Row>
        </Row>
        <View className=''>
            <Row className='w-full justify-between  py-2 bg-muted '>
                {
                    header.map((itemCell, index) => {
                        //getWidth(itemCell.width) 
                        return (
                            <View key={'header' + index} style={{ width: getWidth1(itemCell.width) }} className={' py-1 p-1 xl:p-2 '}>
                                <Text className="font-bold text-label-secondary ">{itemCell.title == 'Select' ? '' : itemCell.title}</Text>
                            </View>

                        );
                    })
                }
            </Row>
            {(!dataItems || dataItems.length === 0) && status === 'success' && !hasNextPage && (
                <View className="items-center pt-4">
                    <Text className="text-label-secondary ">Nothing to show</Text>
                </View>
            )}
           
            <UniList
                height={400}
                sortable={isSortable}
                onSort={handleSort}
                data={dataItems}
                onEndReached={handleEndReached}
                refreshing={isRefetching}
                onRefresh={refetch}
                ListFooterComponent={hasNextPage && isFetchingNextPage ? (
                    <View className="p-4 items-center">
                       <Loading size="small" />
                    </View>
                ) : null}
                renderItem={({ item, index: indexRow }) => {
                    return (
                        <Row className={` justify-between  ${indexRow % 2 != 0 && 'bg-muted '}`}>
                            {header.map((cellHeader, index) => (
                                <View key={'cell_' + indexRow + '_' + index} style={{ width: getWidth1(cellHeader.width) }} className={`py-1 p-1 xl:p-2 justify-center`}>
                                    <Cell
                                        cell={item[cellHeader.name]}
                                        indexRow={indexRow}
                                        id={item[settings.field_id]}
                                        toggleSwitch={toggleSwitch}
                                        setSelection={setSelection}
                                        selected={selected}
                                        setShowConfirm={setShowConfirm}
                                        deleteRows={deleteRows}
                                        fetchData={fetchData}
                                        refetch={refetch}
                                        setTimeStamp={setTimeStamp}
                                        handleBlock={handleActionBlock}
                                    />
                                </View>
                            ))}
                        </Row>
                    );
                }}
            />

        </View>
    </View>;

    const gridContent = (
        currentBreakpoint === 0 ? <ScrollView horizontal={true} className='min-w-full'>
            <View className='w-full mx-auto ' style={{ minWidth: 600 }} >
                {a}
            </View>
        </ScrollView> : a
    );

    return <BlockWrapper {...props.blockWrapperProps}>{gridContent}</BlockWrapper>
}
