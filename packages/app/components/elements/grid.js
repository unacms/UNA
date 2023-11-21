import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import Confirm from 'app/ui/molecules/confirm';
import { Button } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import { useEffect, useState } from 'react';
import { Theme } from 'app/design/theme';
import { Switch } from 'app/design/controls'
import {CheckBox} from 'react-native';
import { Input } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';

export default function ElementGrid({data}) {
    const { colors } = Theme();
    let settings = data.settings;
    let header = data.header.filter((item) => (item?.name != 'reports'))
    const [dataItems, setDataItems] = useState({data: data.data, settings:settings });
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState({show:false, cb:null});
    const [endReached, setEndReached] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const { t } = useTranslation();
    
    const deleteRows = (idsToRemove) => {
        const newItems = dataItems.data.filter(item => !idsToRemove.includes(item.id));
        setDataItems({ ...dataItems, data: newItems });
    };

    const deleteSelected = () => {
        setShowConfirm({
            show: true, 
            cb: () => {
                deleteRows(selected); 
                fetchData('delete', '&' + selected.map(id => `ids[]=${id}`).join('&'))
            }
        });
    };
    
    const getAction = async (itemAction, indexRow) => {
        if (itemAction.name == 'delete'){
            setShowConfirm({
                show: true, 
                cb: () => {
                    deleteRows([itemAction.attr.bx_grid_action_data]);
                    fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
                }
             });
        }
    }
      
    const fetchData = async (action, params) => {
        return await fetcher('/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o='+settings.object+'&a='+action+params);
    }

    function getActionButton(itemAction, indexRow, index) {
        let icon = getActionButtonIcon(itemAction.name);
        if (itemAction.type == 'link'){
            return <Link key={index} href={itemAction.url}><Button startDecorator={icon} size='sm' title={icon? '' : itemAction.title} /></Link>
        }
        if (itemAction.type == 'callback'){
            return <Button  key={index} title={icon? '' : itemAction.title} startDecorator={icon} size='sm' onPress={() => getAction(itemAction, indexRow)} />
        }
    }

    function getActionButtonIcon(name) {
        if (name == 'delete'){
            return 'Trash'
        }
        if(name == 'edit'){     
            return 'Pencil'
        }
        return false;
    }

    const fetchDisplayData = async() => { 
        let url = "&start=" + dataItems.settings.start;
        url += '&filter=' + (selectedFilter ? selectedFilter.id : '') + '%23-%23%23-%23' + searchValue;
        let fetchedData = await fetchData('display', url);
        if (fetchedData && fetchedData.data) {
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
    }, [selectedFilter, searchValue]);

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
    
    function getCell(cell, indexRow, id) {
        switch(cell.type) {
            case 'time':
                return <Time ts={cell.data} stylesName={'text-sm'}></Time>
            case 'link':
                return <Link href={cell.data.url}><Text>{cell.data.text}</Text></Link>
            case 'text':
                return <Text>{cell.value}</Text>
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
                        tintColors={{ true: 'red', false: 'blue' }} // Colors for checked and unchecked state
                        style={{ backgroundColor:'red'}}
                        className={'bg-red-500'}
                        color= {colors.primary}
                        value={selected.includes(cell.data)}
                        onValueChange={() => setSelection(cell.data)}
                    /></>
            case 'profile':
                return <Profile {...cell.data}  displaySize="sm" />
            case 'actions':
                return (<Row className='space-x-2 justify-end'>
                    {cell.data.filter((item) => (item?.type )).map((itemAction, index) => {
                        return  getActionButton(itemAction, indexRow, index)   
                    })}
                </Row>)
               
        }
        return  <Text>{JSON.stringify(cell)}</Text>
    }

    function getWidth(width) {
        let iWidth = parseInt(width.replace('%', ''), 10);
        const tailwindClasses = {
            8.333333: 'w-1/12',
            16.666667: 'w-2/12',
            25: 'w-1/4',
            33.333333: 'w-1/3',
            41.666667: 'w-5/12',
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
    }

    const handleSearch = (value) => {
        setEndReached(false);
        let s = dataItems.settings;
        s.start = 0;
        setDataItems({ 
            ...dataItems,
            settings: s,
            data: [dataItems.data[0]]
        });
        setSearchValue(value)
    };

    const handleFilter = (value) => {
        setEndReached(false);
        let s = dataItems.settings;
        s.start = 0;
        setDataItems({ 
            ...dataItems,
            settings: s,
            data: []
        });
        setSelectedFilter(value);       
    };

    let dropdownItems = Object.entries(settings.filter1).map(([id, title]) => ({
        id: id,
        name: title.toLowerCase(),
        title: title
    }));


    return (
        <View className="w-full px-4 xl:px-6 ">
            <Confirm onVisible={showConfirm.show} title={t("Are you sure?")}  handleCancel ={() => setShowConfirm({show:false, cb:null})} handleOk ={() => {showConfirm.cb(); setShowConfirm({show:false, cb:null})}} />
            <Row className='justify-between mt-2 mb-4 '>
                <Row className="space-x-2 ">
                    <DropdownMenu items={dropdownItems}  onSelect={(oItem) => {handleFilter(oItem)}}>
                        <Button title={selectedFilter ? selectedFilter.title: dropdownItems[0].title} size="base" />
                    </DropdownMenu>
     
                    <Input placeholder= {t('Search')} name="search" onChangeText={(value) => handleSearch(value)}  />
                </Row>
                {data.actions.bulk.delete && (
                    <Button startDecorator="Trash" size="base" title={"Delete selected"} disabled={selected.length == 0} onPress={() => {deleteSelected()}} />)
                }
            </Row>
            <View className='border border-bdrnavbar dark:border-bdrnavbar-d'>
                <Row className='w-full border-b border-bdrnavbar dark:border-bdrnavbar-d justify-between py-2  bg-bgrcard dark:bg-bgrcard px-2'>
                    {
                        header.map((itemCell, index) => {
                            return (
                                <View key={index} className={getWidth(itemCell.width) + ' p-2'}>
                                <Text className="font-bold">{itemCell.title}</Text>
                                </View>
                                
                            );
                        })
                    }
                </Row>
                {(endReached && dataItems.data.length == 0) && <View className=" items-center pt-4"><Text>Nothing to show</Text></View>}
                <UniList
                    height={400}
                    data={dataItems.data}
                    onEndReached = {handleEndReached} 
                    renderItem={({item, index: indexRow }) => {
                        return (
                            <Row className='border-b border-bdrnavbar dark:border-bdrnavbar-d justify-between px-2'>
                                {
                                    header.map((cell, index) => {
                                        return (
                                            <View key={index} className={getWidth(cell.width) + '  p-2 justify-center'}>
                                            {getCell(item[cell.name], indexRow, item[settings.field_id])}
                                            </View>
                                        );
                                    })
                                }
                            </Row>
                        )
                    }}
                />
                
            </View>
        </View>
    );
}
