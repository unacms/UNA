import React from 'react';
import { useEffect, useState, useContext } from 'react';
import { StyleSheet, Modal, Platform, FlatList } from 'react-native';

import { fetcher } from '../../lib/util';
import { PageData } from '../../context/page';
import Link from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { A, Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentH, 
    DropdownMenuTrigger, 
    DropdownMenuItemH, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import { Icon } from 'app/components/svg';
import Profile from './profile';
import SliderBottom from './slider-bottom';

export default function ElementReactions(oProps) {
    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const { pageData, setPageData } = useContext(PageData);

    const isPageVar = (sName) => {
        const sPageKey = getName();

        return pageData && pageData[sPageKey] != undefined && pageData[sPageKey][sName] != undefined;
    };

    const getPageVar = (sName) => {
        const sPageKey = getName();

        return pageData[sPageKey][sName];
    };

    const setPageVars = (mValue) => {
        const sPageKey = getName();
        const oValue = {[sPageKey]: mValue};

        if(!pageData)
            setPageData(oValue);
        else
            setPageData({...pageData, ...oValue});
    };

    const bUseInternalIcons = true;

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;
    const sCounteType = 'compound'; //divided

    let oCounterState = {};
    for (const i in oAction.menu.items) {
        oCounterState[oAction.menu.items[i].name] = false;
    }

    const [ performedBy, setPerformedBy ] = useState();

    const [ popupVisibleByCpd, setPopupVisibleByCpd ] = useState(false);
    const [ tabVisibleByCpd, setTabVisibleByCpd ] = useState('');

    const [ popupVisibleByDvd, setPopupVisibleByDvd ] = useState(oCounterState);


    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {s: oProps.system, o:oProps.object_id};
        if(aParams)
            aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;

        const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, oProps) => {
        //event.preventDefault();

        performAction('do', {value: 1, reaction: oProps.name}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleUndo = (event) => {
        //event.preventDefault();

        let sReaction = oProps.action.reaction;
        if(isPageVar('reaction'))
            sReaction = getPageVar('reaction');

        performAction('do', {value: 1, reaction: sReaction}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleGetPerformedByCpd = (event) => {
        //event.preventDefault();

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);

            setTabVisibleByCpd('');
            setPopupVisibleByCpd(true);
        });
    };

    const handleGetPerformedByDvd = (event, aItem) => {
        //event.preventDefault();

        const sReaction = aItem?.name || '';
        if(!sReaction)
            return;

        performAction('get_performed_by', {reaction: sReaction}, (oData) => {
            if(!oData?.performed_by)
                return;
            
            setPerformedBy(oData.performed_by);
            setPopupVisibleByDvd(state => ({...state, [sReaction]: true}));
        });
    };

    const getSkeleton = () => {
        return (
            <View className="space-y-2">
            {[...Array(1, 2, 3)].map( i => 
                <View key={i} className="flex-col p-2 bg-gray-500/5 sm:rounded-lg">
                    <View className="animate-pulse flex-row items-center gap-3">
                        <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
                        <View className="flex-1 space-y-1">
                            <View className="h-4 w-1/2 bg-gray-600/20 rounded-full"></View>    
                            <View className="h-3 w-1/3 bg-gray-600/20 rounded-full"></View>
                        </View>
                    </View>
                </View>
            )}
            </View>
        );
    };


    
    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';

    //--- show action
    const [ sliderDoVisible, setSliderDoVisible ] = useState(false);
    const [ pickedEmoji, setPickedEmoji ] = useState(null);

    const bShowAction = (oParams.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');

    const bShowActionUndo = oAction?.is_undo === true;

    let bShowActionVoted = oAction?.is_voted === true || false;
    if(isPageVar('is_voted'))
        bShowActionVoted = getPageVar('is_voted') === true;

    let bShowActionDisabled = oAction?.is_disabled === true || false;
    if(isPageVar('is_disabled'))
        bShowActionDisabled = getPageVar('is_disabled') === true;

    let sReaction = oAction?.reaction || '';
    if(isPageVar('reaction'))
        sReaction = getPageVar('reaction');

    let sIcon = oAction?.icon || '';
    if(isPageVar('icon'))
        sIcon = getPageVar('icon');

    let sTitle = oAction?.title || '';
    if(isPageVar('title'))
        sTitle = getPageVar('title');

    let sAction = '';
    if(bShowActionUndo && bShowActionVoted) {
        sAction = (
            <A onPress={handleUndo}>
                <Button variant="text" variant="default" startDecorator={sReaction} title={sTitle} />
            </A>
        );
    }
    else {
        const sButtonDo = (
            <Button variant="text" variant="default" startDecorator={sReaction} title={sTitle} />
        );

        if(Platform.OS === 'web') {
            const sItems = Object.keys(oAction.menu.items).map(function(iKey) {
                const aItem = oAction.menu.items[iKey];

                let sIcon = '';
                if(bUseInternalIcons)
                    sIcon = <Icon icon={aItem.name} className="flex h-6 w-6"></Icon>;
                else
                    sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{aItem.icon}</Text>;

                return (
                    <DropdownMenuItemH key={aItem.id ? aItem.id : aItem.name} onSelect={(event) => {handleDo(event, aItem)}}>
                        <DropdownMenuItemIcon>{sIcon}</DropdownMenuItemIcon>
                        <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
                    </DropdownMenuItemH>
                );
            });

            sAction = (
                <DropdownMenuRoot>
                    <DropdownMenuTrigger>
                        <A id={getName('action-ddb')} disabled={bShowActionDisabled} onPress={() => {}}>{sButtonDo}</A>
                    </DropdownMenuTrigger>
                    <DropdownMenuContentH>{sItems}</DropdownMenuContentH>
                </DropdownMenuRoot>
            );
        }
        else {
            const stylesSlider = StyleSheet.create({
                listContainer: {
                    width: '100%',
                    borderTopRightRadius: 10,
                    borderTopLeftRadius: 10,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
            });

            const onSliderDoShow = () => {
                setSliderDoVisible(true);
            };

            const onSliderDoClose = () => {
                setSliderDoVisible(false);
            };

            sAction = (
                <View>
                    <A id={getName('action-ddb')} disabled={bShowActionDisabled} onPress={!bShowActionDisabled ? onSliderDoShow : () => {}}>{sButtonDo}</A>
                    <View>
                        <SliderBottom isVisible={sliderDoVisible} onClose={onSliderDoClose}>
                            <View className="p-4">
                                <FlatList horizontal showsHorizontalScrollIndicator={Platform.OS === 'web' ? true : false} data={oAction.menu.items} contentContainerStyle={stylesSlider.listContainer} renderItem={({ item, index }) => {
                                    let sIcon = '';
                                    if(bUseInternalIcons)
                                        sIcon = <Icon icon={item.name} className="flex h-6 w-6"></Icon>
                                    else
                                        sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{item.icon}</Text>

                                    return (
                                        <A key={item.name} className={sClassNameDo} onPress={(event) => {
                                            handleDo(event, item);

                                            onSliderDoClose();
                                        }}>{sIcon}</A>
                                    );
                                  }}
                                />
                            </View>
                        </SliderBottom>
                    </View>
                </View>
            );
        }
    }

    //--- show counter
    const bShowCounter = oParams.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both') && oCounter && oCounter?.items;

    const getCounterDivided = () => {
        return Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            let sIcon = '';
            if(bUseInternalIcons)
                sIcon = <Icon icon={aItem.name} className="flex h-6 w-6"></Icon>
            else
                sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{aItem.icon}</Text>

            let iCount = aItem.count;
            if(isPageVar('counter')) {
                const oCounterGlobal = getPageVar('counter');
                const sCounteKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounteKey] != undefined)
                    iCount = oCounterGlobal[sCounteKey];
            }

            let sUsers = '';
            if(performedBy && performedBy[aItem.name]) {
                sUsers = performedBy[aItem.name].map(aUser => {
                    return (
                        <View key={aUser.id}><Profile {...aUser} /></View>
                    );
                });
            }

            if(!sUsers || sUsers.length == 0)
                sUsers = getSkeleton();

            return (
                <View key={iKey} className={'inline-flex flex-none' + (!iCount ? ' hidden' : '')}>
                    <A id={getName('performed-by-ddb-' + aItem.name)} className="group flex flex-row flex-nowrap active:opacity-80 active:shadow-none items-center p-1.5 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 hover:no-underline" onPress={(event) => {handleGetPerformedByDvd(event, aItem)}}>
                        {sIcon}
                        <Text className='pl-1.5 pr-0.5'>{iCount}</Text>
                    </A>
                    <Modal visible={popupVisibleByDvd[aItem.name]} presentation="formSheet" animationType="fade" transparent={Platform.OS != 'ios'}>
                        <View id={getName('performed-by-ddp-' + aItem.name)} className="flex-row justify-center items-center top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
                            <View className="relative w-full h-full max-w-2xl md:h-auto">
                                <View className="relative bg-white dark:bg-gray-700 rounded-lg shadow">
                                    <View className="p-4">
                                        <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</View>
                                    </View>
                                    <View className="flex-row items-center p-6 border-t border-gray-200 dark:border-gray-600 rounded-b">
                                        <A className="group flex-none shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline" onPress={() => {setPopupVisibleByDvd(state => ({...state, [aItem.name]: false}))}}>
                                            <Text>Close</Text>
                                        </A>                        
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            );
        });
    };

    const getCounterCompound = () => {
        let iTotal = 0;
        let sSelected = tabVisibleByCpd;
        const aCounter = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            let sIcon = '';
            if(bUseInternalIcons)
                sIcon = <Icon icon={aItem.name} className="flex h-6 w-6"></Icon>
            else
                sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{aItem.icon}</Text>

            let iCount = aItem.count;
            if(isPageVar('counter')) {
                const oCounterGlobal = getPageVar('counter');
                const sCounteKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounteKey] != undefined)
                    iCount = oCounterGlobal[sCounteKey];
            }

            if(!sSelected && iCount != 0)
                sSelected = aItem.name;

            iTotal += iCount;

            return (
                <View key={iKey} className={"flex flex-none" + (!iCount ? " hidden" : "")}>{sIcon}</View>
            );
        });

        const aPerformedByMenu = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            let sIcon = '';
            if(bUseInternalIcons)
                sIcon = <Icon icon={aItem.name} className="flex h-6 w-6"></Icon>
            else
                sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{aItem.icon}</Text>

            let sClass = 'flex-1 top-px';
            if(aItem.name == sSelected)
                sClass += ' border-b border-gray-400 dark:border-gray-400';

            return (
                <View className={sClass}>
                    <A className="flex flex-row justify-center items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline" onPress={() => {setTabVisibleByCpd(aItem.name)}}>{sIcon}</A>
                </View>
            );
        });

        const aPerformedByUsers = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            if(!sSelected && aItem.count != 0)
                sSelected = aItem.name;

            let sUsers = '';
            if(performedBy && performedBy[aItem.name]) {
                sUsers = performedBy[aItem.name].map(aUser => {
                    return (
                        <View key={aUser.id}><Profile {...aUser} /></View>
                    );
                });
            }

            if(!sUsers || sUsers.length == 0)
                sUsers = getSkeleton();

            let sClass = '';
            if(aItem.name != sSelected) 
                sClass = 'hidden ';
            sClass += 'space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200';

            return (
                <View className={sClass}>{sUsers}</View>
            );
        });

        return (
            <View>
                <A className="group flex flex-row flex-nowrap active:opacity-80 active:shadow-none items-center p-1.5 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 hover:no-underline" onPress={handleGetPerformedByCpd}>
                    <View className="relative flex flex-row flex-nowrap">{aCounter}</View>
                    <View className="pl-2">{iTotal}</View>
                </A>
                <Modal visible={popupVisibleByCpd} presentation="formSheet" animationType="fade" transparent={Platform.OS != 'ios'}>
                    <View id={getName('performed-by-ddp')} className="flex-row justify-center items-center top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
                        <View className="relative w-full h-full max-w-2xl md:h-auto">
                            <View className="relative bg-white dark:bg-gray-700 rounded-lg shadow">
                                <View className="p-4">
                                    <View className="relative flex-row justify-around border-b border-gray-200 dark:border-gray-600">{aPerformedByMenu}</View>
                                    <View className="p-4">{aPerformedByUsers}</View>
                                </View>
                                <View className="flex-row items-center p-6 border-t border-gray-200 dark:border-gray-600 rounded-b">
                                    <A className="group flex-none shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline" onPress={() => {setPopupVisibleByCpd(false)}}>
                                        <Text>Close</Text>
                                    </A>                        
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };

    //--- Counter
    let aCounter = [];
    if(bShowCounter)
        switch(sCounteType) {
            case 'compound':
                aCounter = getCounterCompound()
                break;

            case 'compound':
                aCounter = getCounterDivided();
                break;
        }

    //--- CSR: Initialize.
    useEffect(() => {
        //Note. Client side code can be executed here. 
    }, []);

    return (
        <View className="inline-flex gap-1 sm:gap-0">
            {bShowAction && <View>{sAction}</View>}
            {bShowCounter && <View className="flex-row">{aCounter}</View>}
        </View>
    );
 }
