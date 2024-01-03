import { Text} from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import Confirm from 'app/ui/molecules/confirm';
import { Button } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Theme } from 'app/design/theme';
import { Switch } from 'app/design/controls'
import CheckBox from 'app/ui/atoms/checkbox';
import { Input } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { stripTags } from 'app/lib/util';
import { Modal } from 'app/design/controls'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { useWindowDimensions} from 'react-native';
import dynamic from 'next/dynamic'

function Stripe(props) {
    const computedData = useMemo(() => {
        const StripeCont = React.memo(dynamic(() => import('app/ui/molecules/stripe')));
            return  <StripeCont {...props} />
    }, [props.b]); 
    return computedData;
}

const getWidth = (width) => {
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
};



const ActionButton = React.memo(({ id, index, itemAction, setShowConfirm, deleteRows, fetchData, handleBlock }) => {
    const [hide, setHide] = useState(false);

    const getActionAfter = async (itemAction) => {
        if (itemAction.on_callback == 'hide'){
            setHide(true);
        }
        if (itemAction.on_callback == 'hide_row'){
            deleteRows([itemAction.attr.bx_grid_action_data, id]);
        }
    }

    const getAction = async (itemAction, setShowConfirm) => {
        if (itemAction.confirm == '1'){
            setShowConfirm({
                show: true, 
                cb: () => {
                    fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
                    getActionAfter(itemAction);
                }
             });
        }
        else{
            fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
            getActionAfter(itemAction)
        }
    }

    const getActionButtonIcon = (name) => {
        if (name == 'delete'){
            return 'Trash'
        }
        if(name == 'edit'){     
            return 'Pencil'
        }
        if(name == 'promotion'){     
            return 'ChartLine'
        }
        if(name == 'edit_budget'){     
            return 'Wallet'
        }
        return false;
    };

    let icon = getActionButtonIcon(itemAction.name);

    if (itemAction.name == 'set_role' || hide){
        return <></>;
    }

    if (itemAction.type == 'link'){
        return <Link key={index} href={itemAction.url}><Button startDecorator={icon} size='sm' title={icon? '' : itemAction.title} /></Link>
    }

    if (itemAction.type == 'modal'){
        return <Button startDecorator={icon} size='sm' title={icon? '' : itemAction.title} onPress={() => {console.log(itemAction); handleBlock(itemAction)}}/>
    }

    if (itemAction.type == 'callback'){
        return <Button  key={index} title={icon? '' : itemAction.title} startDecorator={icon} size='sm'  onPress={() => getAction(itemAction, setShowConfirm)} />
    }
});

const Cell = React.memo(({ cell, indexRow, id, toggleSwitch, setSelection, selected, setShowConfirm, deleteRows, fetchData, handleBlock }) => {
    const { colors } = Theme();
    switch(cell?.type) {
        case 'time':
            return <Time ts={cell.data} stylesName={'text-sm text-neutral-800 dark:text-neutral-200'}></Time>
        case 'datetime':
            return <Time ts={cell.data} format='datetime' stylesName={'text-xs text-neutral-800 dark:text-neutral-200'}></Time>
        case 'link':
            return <Link href={cell.data.url}><Text>{cell.data.text}</Text></Link>
        case 'text':
            return <Text className="text-neutral-800 dark:text-neutral-200">{stripTags(cell.value)}</Text>
        case 'order': // TODO
            return <Text></Text>
        case 'switcher':
            return <>
                <Switch
                    trackColor={{false: colors.border, true: colors.primary}}
                    thumbColor={'#ffffff'}
                    onValueChange={() => toggleSwitch(id, indexRow )}
                    activeThumbColor={'#ffffff'}
                    value={cell.data == 'active' ? true : false}
                    ios_backgroundColor={colors.background}
                /></>
        case 'checkbox':
            return <>
                <CheckBox
                    value={selected.includes(cell.data)}
                    onValueChange={() => setSelection(cell.data)}
                /></>
        case 'profile':
            return <Profile {...cell.data}  displaySize="sm" />
        case 'actions':
            return ( <Row className='space-x-2 justify-end'>
            {cell.data.filter(item => item?.type).map((itemAction, index) => (
                <ActionButton
                    key={"ab" + index}
                    index={index}
                    itemAction={itemAction}
                    indexRow={indexRow}
                    id={id}
                    setShowConfirm = {setShowConfirm}
                    deleteRows = {deleteRows}
                    fetchData = {fetchData}
                    handleBlock = {handleBlock}
                    // You need to define this function in your component
                />
            ))}
        </Row>)
           
    }
    return  <Text className="text-neutral-800 dark:text-neutral-200">{JSON.stringify(cell)}</Text>
});

export default function ElementGrid({data}) {
    let settings = data.settings;
    let header = data.header.filter((item) => (item?.name != 'reports'))
    const [dataItems, setDataItems] = useState({data: data.data, settings:settings });
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState({show:false, cb:null});
    const [endReached, setEndReached] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [timeStamp, setTimeStamp] = useState(Date.now());
    const [modalContent, setModalContent] = useState(false);
    const [modalContentElement, setModalContentElement] = useState(false);
    const { t } = useTranslation();
    const windowWidth = useWindowDimensions().width;
    
    const deleteRows = useCallback((idsToRemove) => {
        console.log("dataItems", dataItems)
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
        if (data.type == 'modal'){
            let fetchedData = await fetchData(data.action, data.params);
            let cnt = {content: fetchedData.data, designbox_id: 0}
            setModalContent(cnt);
        }
    };

    const handleActionBlockPayment = async () => {
        let cnt =<Stripe seller_id={settings.query_append.seller_id} items={selected} />
        setModalContentElement(cnt);
    };

    const handleCloseModal = () => {
        setModalContent(false);
    };

    const handleCloseModalElement = () => {
        setModalContentElement(false);
    };

    const handleUpdate = () => {
        setTimeout(() => {
            handleCloseModal();
            resetData();
            setTimeStamp(Date.now());
        }, 100);
    }

    const fetchData = useCallback(async (action, params) => {
        let sUrl = '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=' + action;
        if(settings?.query_append)
            Object.keys(settings.query_append).forEach((sKey) => {
                sUrl += '&' + sKey + '=' + settings.query_append[sKey];
            });

        return await fetcher(sUrl + params);
    }, [settings.object]);



    const fetchDisplayData = async() => { 
        let url = "&start=" + dataItems.settings.start;
        url += '&filter=' + (selectedFilter ? selectedFilter.id + '%23-%23' : '') + searchValue;

        let fetchedData = await fetchData('display', url);
        if (fetchedData && fetchedData.data && fetchedData.data?.data) {
            if (fetchedData.data.data.length > 0){
                fetchedData.data.settings.start = parseInt(fetchedData.data.settings.start) + parseInt(fetchedData.data.settings.per_page);
                setDataItems({ 
                    ...dataItems,
                    settings: fetchedData.data.settings,
                    data: [...dataItems.data, ...fetchedData.data.data]
                });
            }
            else{
                setEndReached(true)
            }
        }
    }

    useEffect(() => {
        fetchDisplayData();
    }, [selectedFilter, searchValue, timeStamp]);

    const handleEndReached = async() => { 
        if (!endReached){
            fetchDisplayData();
        }
    };
    const toggleSwitch = async(id, indexRow) => { 
        const updatedData = dataItems.data.map((item, i) => {
            if (i === indexRow) {
                item.switcher.data = item.switcher.data == 'hidden' ? 'active' : 'hidden';
                return item;
            }
            return item;
        });
        setDataItems({ ...dataItems, data: updatedData });
        
        fetchData('enable', '&ids[]=' + id)
    }
    const setSelection = (data) => { 
        if (!selected.includes(data)) {
            setSelected([...selected, data]);
        }
        else{
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

    let a = <View className="w-full xl:px-6">
        {modalContent && (
                <Modal title={" "} onVisible={!!modalContent} outerClickClose={false} onClose={() => handleCloseModal()}>
                    <View className='px-4'>
                        <BlockByData onFormEmpty = {() => handleUpdate()} block = {modalContent}  />
                    </View>
                </Modal>
            )
        }
        {modalContentElement && (
                <Modal title={" "} onVisible={!!modalContentElement} outerClickClose={false} onClose={() => handleCloseModalElement()}>
                    <View className='px-4'>
                        {modalContentElement}
                    </View>
                </Modal>
            )
        }
        <Confirm onVisible={showConfirm.show} title={t("Are you sure?")}  handleCancel ={() => setShowConfirm({show:false, cb:null})} handleOk ={() => {showConfirm.cb(); setShowConfirm({show:false, cb:null})}} />
        <Row className='xl:justify-between mt-2 mb-4 '>
            {Object.keys(settings.filters).length > 0 && 
                <Row className="gap-x-2 ">
                    {settings.filters?.filter1 && settings.filters.filter1.length > 0 && 
                        <DropdownMenu items={dropdownItems}  onSelect={(oItem) => {handleFilter(oItem)}}>
                            <Button title={selectedFilter ? selectedFilter.title: dropdownItems[0].title} size="base" />
                        </DropdownMenu>
                    }
                    {settings.filters?.search && 
                        <Input placeholder= {t('Search')} name="search" onChangeText={(value) => handleSearch(value)} />
                    }
                </Row>
            }
            <Row className="gap-x-2 ml-1">
                {
                    data.actions.bulk.delete && (
                        <Button startDecorator="Trash" size="base"  hideTitleOnSmall={true} title={t("Delete selected")} disabled={selected.length == 0} onPress={() => {handleDeleteSelected()}} />)
                }
                {/*
                    data.actions.bulk.credits && (
                        <Button  size="base" title={t("Checkout with Credits")}  hideTitleOnSmall={true} disabled={selected.length == 0} onPress={() => {alert("TODO Checkout with Credits")}} />)
                    */}
                {/*
                    data.actions.bulk.paypal_api && (
                        <Button  size="base" title={t("Checkout with PayPal")}  hideTitleOnSmall={true} disabled={selected.length == 0} onPress={() => {alert("TODO CheCheckout with PayPal")}} />)
                    */ }
                {
                    data.actions.bulk.stripe_v3 && (
                        <Button  size="base" title={t("Checkout with Stripe")}  hideTitleOnSmall={true} disabled={selected.length == 0} onPress={() => {handleActionBlockPayment('stripe_v3')}} />)
                }
                {
                    data.actions.independent.add && (
                        <Button startDecorator="Plus" size="base"  hideTitleOnSmall={true} title={t("Add new")} onPress={() => {handleActionBlock(data.actions.independent.add)}} />)
                }
            </Row>
        </Row>
        <View className='border border-bdrnavbar dark:border-bdrnavbar-d rounded-xl'>
            <Row className='w-full border-b  rounded-t-xl border-bdrnavbar dark:border-bdrnavbar-d justify-between py-2  bg-bgrcard dark:bg-bgrcard-d lg:px-2'>
                {
                    header.map((itemCell, index) => {
                        return (
                            <View key={'header'  + index} className={getWidth(itemCell.width) + ' py-1 xl:p-2 '}>
                                <Text className="font-bold text-neutral-800 dark:text-neutral-200">{itemCell.title}</Text>
                            </View>
                            
                        );
                    })
                }
            </Row>
            {(endReached && dataItems.data.length == 0) && <View className=" items-center pt-4"><Text className="text-neutral-800 dark:text-neutral-200">Nothing to show</Text></View>}
            <UniList
                height={400}
                data={dataItems.data}
                onEndReached = {handleEndReached} 
                renderItem={({item, index: indexRow }) => {
                    return (
                        <Row className='border-b border-bdrnavbar dark:border-bdrnavbar-d justify-between px-2'>
                            {header.map((cellHeader, index) => (
                                <View key={'cell_' + indexRow + '_' + index} className={`${getWidth(cellHeader.width)} py-1 xl:p-2 justify-center`}>
                                    <Cell 
                                        cell={item[cellHeader.name]} 
                                        indexRow={indexRow + '_' + index} 
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
            <View className='w-full mx-auto ' style={{minWidth:600}} >
                {a}
            </View>
        </ScrollView> : a
    );
}
