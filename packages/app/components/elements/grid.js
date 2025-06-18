import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import Confirm from 'app/ui/molecules/confirm';
import { Button } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import React, { useEffect, useState, useMemo, useCallback, useRef  } from 'react';
import { Theme } from 'app/design/theme';
import { Switch } from 'app/design/controls'
import CheckBox from 'app/ui/atoms/checkbox';
import { InputSmall } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { stripTags } from 'app/lib/util';
import { Modal } from 'app/design/controls'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { useWindowDimensions } from 'react-native';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Icon } from 'app/ui/atoms/icon'
import Redirect from 'app/ui/atoms/redirect';
import Stripe from 'app/ui/molecules/stripe';
const getWidth1 = (width) => {
    if (!width)
        return '';

    return width
}

/*const getWidth = (width) => {
    if(!width)
        return'';

    let iWidth = parseInt(width.replace('%', ''), 10);
        const tailwindClasses = {
            8.333333: 'w-1/12',
            16.666667: 'w-2/12',
            25: 'w-1/4',
            33.333333: 'w-1/3',
            41.666667: 'w-4/12',
            50: 'w-1/2',
            58.333333: 'w-7/12',
            66.666667: 'w-2/3',
            75: 'w-3/4',
            83.333333: 'w-5/6',
            91.666667: 'w-11/12',
            100: 'w-full'
        };
    
        let closest = null;
        let closestDiff = Infinity;
    
        for (let key in tailwindClasses) {
            const diff = Math.abs(key - iWidth);
            if (diff < closestDiff) {
                closest = tailwindClasses[key];
                closestDiff = diff;
            }
        }
    
        return closest;
};*/



const ActionButton = React.memo(({ id, index, itemAction, setShowConfirm, deleteRows, fetchData, handleBlock, item }) => {
    const [hide, setHide] = useState(false);
    const redirectRef = useRef();
    const getActionAfter = async (itemAction) => {
        console.log("itemAction.on_callback", itemAction)
        if (itemAction.on_callback == 'hide') {
            setHide(true);
        }
        if (itemAction.on_callback == 'hide_row') {
            deleteRows([itemAction.attr.bx_grid_action_data, id]);
        }
        if (itemAction.on_callback == 'redirect') {
            redirectRef.current.redirect(itemAction.redirect_url);
        }
    }

    const getAction = async (itemAction, setShowConfirm) => {
        if (itemAction.confirm == '1') {
            setShowConfirm({
                show: true,
                cb: () => {
                    fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
                    getActionAfter(itemAction);
                }
            });
        }
        else {
            fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
            getActionAfter(itemAction)
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
        return false;
    };

    let icon = getActionButtonIcon(itemAction.name);

    const excludedActions = ['set_role', 'clear_reports', 'set_acl_level'];

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

const Cell = React.memo(({ cell, indexRow, id, toggleSwitch, setSelection, selected, setShowConfirm, deleteRows, fetchData, handleBlock }) => {
    const { colors } = Theme();
    switch (cell?.type) {
        case 'time':
            return <Time ts={cell.data} stylesName={'text-sm text-neutral-800 dark:text-neutral-200'}></Time>
        case 'datetime':
            return <Time ts={cell.data} format='datetime' stylesName={'text-xs text-neutral-800 dark:text-neutral-200'}></Time>
        case 'link':
            return <Link href={cell.data.url}><Text>{cell.data.text}</Text></Link>
        case 'text':
            return <Text className="text-neutral-800 dark:text-neutral-200">{stripTags(cell.value)}</Text>
        case 'order':
            return <Text className="text-neutral-800 dark:text-neutral-200 text-lg">
                <Icon icon='MoveVertical' />
            </Text>
        case 'switcher':
            return <>
                <Switch
                    size="sm"
                    onValueChange={() => toggleSwitch(id, indexRow)}
                    value={cell.data == 'active' ? true : false}

                /></>
        case 'checkbox':
            return <>
                <CheckBox
                    value={selected.includes(cell.data)}
                    status={selected.includes(cell.data) ? 'checked' : 'unchecked'}
                    onPress={() => setSelection(cell.data)}
                    isBackground = {false}
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
                        handleBlock={handleBlock}
                    // You need to define this function in your component
                    />
                ))}
            </Row>)

    }
    return <Text className="text-neutral-800 dark:text-neutral-200">{JSON.stringify(cell)}</Text>
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

export default function ElementGrid(props) {

    const { setBottomSheetData } = useBottomSheetData();
    const data = props.data;
    let settings = data.settings;
    if (!data.header)
        return <></>
    const header = data.header.filter((item) => (item?.name != 'reports'))
    const isSortable = header.find((item) => item?.name == 'order');
    const [dataItems, setDataItems] = useState({ data: data.data, settings: settings });
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState({ show: false, cb: null });
    const [endReached, setEndReached] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [timeStamp, setTimeStamp] = useState(Date.now());
    const [modalContent, setModalContent] = useState(false);
    const [modalContentElement, setModalContentElement] = useState(false);
    const { t } = useTranslation();
    const windowWidth = useWindowDimensions().width;

    const deleteRows = useCallback((idsToRemove) => {
        const newItems = dataItems.data.filter(item => !idsToRemove.includes(item.id));
        setDataItems({ ...dataItems, data: newItems });
    }, [dataItems.data]);

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
            setBottomSheetData({ title: cnt.content[0]?.title ? cnt.content[0]?.title : " ", content: <View className='px-1'><BlockByData onFormEmpty={() => handleUpdate()} block={cnt} /></View> });
        }
        if (data.type == 'object'){
            setModalContentElement(<Stripe seller_id={data.seller_id } items={data.items} />);
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
        console.log("aaa");
        setTimeout(() => {
            handleCloseModal();
            resetData();
            setTimeStamp(Date.now());
        }, 100);
    }

    const fetchData = useCallback(async (action, params, callback) => {
        let sUrl = callback ? '/api.php?r='+callback : '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=' + action;
        if (settings?.query_append && !callback)
            Object.keys(settings.query_append).forEach((sKey) => {
                sUrl += '&' + sKey + '=' + settings.query_append[sKey];
            });
      
        return await fetcher(sUrl + (callback? '' :params));
    }, [settings.object]);



    const fetchDisplayData = async () => {
        let url = "&start=" + dataItems.settings.start;
        url += '&filter=' + (selectedFilter ? selectedFilter.id + '%23-%23' : '') + searchValue;

        let fetchedData = await fetchData('display', url);
        if (fetchedData && fetchedData.data && fetchedData.data?.data) {
            if (fetchedData.data.data.length > 0) {
                fetchedData.data.settings.start = parseInt(fetchedData.data.settings.start) + parseInt(fetchedData.data.settings.per_page);
                setDataItems({
                    ...dataItems,
                    settings: fetchedData.data.settings,
                    data: [...dataItems.data, ...fetchedData.data.data]
                });
            }
            else {
                setEndReached(true)
            }
        }
    }

    useEffect(() => {
        fetchDisplayData();
    }, [selectedFilter, searchValue, timeStamp]);

    const handleEndReached = async () => {
        if (!endReached) {
            fetchDisplayData();
        }
    };
    const toggleSwitch = async (id, indexRow) => {
        let bChecked = false;
        const oSwitcher = { active: 'hidden', hidden: 'active' };

        const updatedData = dataItems.data.map((item, i) => {
            if (i === indexRow) {
                item.switcher.data = oSwitcher[item.switcher.data];
                if (item.switcher.data == 'active')
                    bChecked = true;
            }

            return item;
        });

        setDataItems({ ...dataItems, data: updatedData });

        fetchData('enable', '&ids[]=' + id + (bChecked ? '&checked=1' : ''))
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
        resetData();
        setSearchValue(value)
    };

    const handleFilter = (value) => {
        resetData();
        setSelectedFilter(value);
    };

    const handleSort = useCallback((result) => {
        if (!result.destination) return;
        const updatedData = [...dataItems.data];
        const [removed] = updatedData.splice(result.source.index, 1);
        updatedData.splice(result.destination.index, 0, removed);
        setDataItems({ ...dataItems, data: updatedData });
        fetchData('reorder', '&' + updatedData.map(item => `${settings.object}_row[]=${item.id}`).join('&'));
    }, [dataItems, settings, fetchData]);


    const resetData = () => {
        setEndReached(false);
        let s = dataItems.settings;
        s.start = 0;
        setDataItems({
            ...dataItems,
            settings: s,
            data: []
        });
    }

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

    
    let a = <View className="w-full xl:px-6">
        <Text className="tracking-tight text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-2">{stripTags(props?.block?.title)}</Text>
        {modalContent && (
            <Modal title={modalContent.content[0]?.title ? modalContent.content[0]?.title : " "} onVisible={!!modalContent} outerClickClose={false} onClose={() => handleCloseModal()}>
                <View className='px-4'>
                    <BlockByData onFormEmpty={() => handleUpdate()} block={modalContent} />
                </View>
            </Modal>
        )
        }
        {modalContentElement && (
            <Modal scrollable title="Checkout" onVisible={!!modalContentElement} outerClickClose={false} onClose={() => handleCloseModalElement()}>
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
                        <InputSmall placeholder={t('Search')} name="search" onChangeText={(value) => handleSearch(value)} />
                    }
                </Row>
            }
            <Row className="gap-x-2 ml-1 items-center">

                {actionsIndependent.map((item, index) => {
                    if (item.type == 'modal') {
                        return <Button startDecorator="Plus" size="sm" showTitleFromSize='sm' title={t(item?.title || "Add new")} onPress={() => { handleActionBlock(item) }} />
                    }
                    if (item.type == 'menu') {
                        return <MultiAdd handleUpdate={handleUpdate} setBottomSheetData={setBottomSheetData} data={item} />
                    }
                    if (item.type == 'link') {
                        return <Link href={item.link}><Button size="sm" title={item.title} showTitleFromSize='sm' /></Link>
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
        <View className=''>{/*border border-bdrnavbar dark:border-bdrnavbar-d rounded-xl*/}
            <Row className='w-full justify-between  py-2 bg-bgritem dark:bg-bgritem-d'>{/* border-b  rounded-t-xl border-bdrnavbar dark:border-bdrnavbar-d*/}
                {
                    header.map((itemCell, index) => {
                        //getWidth(itemCell.width) 
                        return (
                            <View key={'header' + index} style={{ width: getWidth1(itemCell.width) }} className={' py-1 p-1 xl:p-2 '}>
                                <Text className="font-bold text-neutral-800 dark:text-neutral-200">{itemCell.title == 'Select' ? '' : itemCell.title}</Text>
                            </View>

                        );
                    })
                }
            </Row>
            {(endReached && dataItems.data.length == 0) && <View className=" items-center pt-4"><Text className="text-neutral-800 dark:text-neutral-200">Nothing to show</Text></View>}
            <UniList
                height={400}
                sortable={isSortable}
                onSort={handleSort}
                data={dataItems.data}
                onEndReached={handleEndReached}
                renderItem={({ item, index: indexRow }) => {
                    return (
                        //className={`${getWidth(cellHeader.width)}
                        //border-b border-bdrnavbar dark:border-bdrnavbar-d
                        <Row className={` justify-between  ${indexRow % 2 != 0 && 'bg-bgritem dark:bg-bgritem-d'}`}>
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
                                        handleBlock={handleActionBlock}
                                    />
                                </View>
                            ))}
                        </Row>
                    )
                }}
            />

        </View>
    </View>;

    return (
        windowWidth < 600 ? <ScrollView horizontal={true} className='min-w-full'>
            <View className='w-full mx-auto ' style={{ minWidth: 600 }} >
                {a}
            </View>
        </ScrollView> : a
    );
}
