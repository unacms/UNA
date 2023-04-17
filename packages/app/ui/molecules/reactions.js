
import { useState, useContext } from 'react';
import { StyleSheet, Platform, FlatList } from 'react-native';

import { fetcher } from 'app/lib/fetcher';
import { PageData } from 'app/context/page';
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounter, Modal } from 'app/design/controls';
import { View, Pressable } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentH, 
    DropdownMenuTrigger, 
    DropdownMenuItemH, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile';
import SliderBottom from 'app/ui/molecules/slider-bottom';

export default function ElementReactions(oProps) {
    const sClassIconInternal = 'flex h-6 w-6 text-gray-700 dark:text-gray-200';
    const oIconAliases = {
        default: 'Smiley',
        like: 'ThumbsUp',
        love: 'Heart',
        joy: 'Smiley',
        surprise: 'SmileyXEyes',
        sadness: 'SmileySad',
        anger: 'SmileyAngry'
    };
    
    const sCounterType = 'compound';
    //const sCounterType = 'divided';

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

    const getPageVars = () => {
        const sPageKey = getName();

        return pageData && pageData[sPageKey] ? pageData[sPageKey] : null;
    };

    const setPageVars = (mValue) => {
        const sPageKey = getName();
        const oValue = {[sPageKey]: mValue};

        if(!pageData)
            setPageData(oValue);
        else
            setPageData({...pageData, ...oValue});
    };

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;

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

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, oProps) => {
        event.preventDefault();

        /*
         * Disabled for now because user's language differ for initial and dynamic calls.
         * 
         * updateLayout(oProps.name, 1);
         */

        performAction('do', {value: 1, reaction: oProps.name}, (oData) => {
            setPageVars(oData);
        });

    };

    const handleUndo = (event) => {
        event.preventDefault();

        let sReaction = oProps.action.reaction;
        if(isPageVar('reaction'))
            sReaction = getPageVar('reaction');

        /*
         * Disabled for now because user's language differ for initial and dynamic calls.
         * 
         * updateLayout(sReaction, -1);
         */

        performAction('do', {value: 1, reaction: sReaction}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleGetPerformedByCpd = (event) => {
        event.preventDefault();

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);

            setTabVisibleByCpd('');
            setPopupVisibleByCpd(true);
        });
    };

    const handleGetPerformedByDvd = (event, aItem) => {
        event.preventDefault();

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

    const updateLayout = (sReaction, iValueAdd) => {
        const sCounterKey = 'count_' + sReaction;

        let sTitleNew = '';
        let sIconNew = '';
        let iCounterValue = 0;
        for (const i in oCounter.items) {
            if(sReaction != oCounter.items[i].name) 
                continue;

            sTitleNew = oCounter.items[i].title;
            sIconNew = oCounter.items[i].icon;
            iCounterValue = oCounter.items[i].count + iValueAdd;
            break;
        }

        let oPageVars = {};
        if(isPageVar('counter')) {
            oPageVars = getPageVars();
            iCounterValue = oPageVars.counter[sCounterKey] + iValueAdd;
        }

        oPageVars['is_voted'] = true;
        oPageVars['reaction'] = sReaction;
        oPageVars['title'] = sTitleNew;
        oPageVars['icon'] = sIconNew;
        if(!oPageVars['counter'])
            oPageVars['counter'] = {};
        oPageVars['counter'][sCounterKey] = iCounterValue;

        setPageVars(oPageVars);
    }

    const getSkeleton = () => {
        return (
            <View className="gap-2">
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
    
    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowActionAsButton = oParams?.show_do_vote_as_button == undefined || oParams.show_do_vote_as_button === true;
    const bShowActionLabel = oParams?.show_do_vote_label == undefined || oParams.show_do_vote_label === true;

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

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    let sAction = undefined;
    if(bShowActionUndo && bShowActionVoted) {
        sAction = (
            <ButtonAction size="sm" fullWidth startDecorator={oIconAliases[sReaction]} title={bShowActionLabel ? sTitle : false} onPress={handleUndo} />
        );
    }
    else {
        if(Platform.OS === 'web') {
            const sItems = Object.keys(oAction.menu.items).map(function(iKey) {
                const aItem = oAction.menu.items[iKey];               

                return (
                    <DropdownMenuItemH key={aItem.id ? aItem.id : aItem.name} onSelect={(event) => {handleDo(event, aItem)}}>
                        <DropdownMenuItemIcon>
                            <Icon className={sClassIconInternal} icon={oIconAliases[aItem.name]}></Icon>
                        </DropdownMenuItemIcon>
                        <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
                    </DropdownMenuItemH>
                );
            });

            sAction = (
                <Pressable onPress={(event) => {event.preventDefault()}}>
                    <DropdownMenuRoot>
                        <DropdownMenuTrigger>
                            <ButtonAction size="sm" fullWidth startDecorator={oIconAliases[sReaction]} title={bShowActionLabel ? sTitle : false} onPress={() => {}} disabled={bShowActionDisabled} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContentH>{sItems}</DropdownMenuContentH>
                    </DropdownMenuRoot>
                </Pressable>
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

            const onSliderDoSelect = (event, item) => {
                handleDo(event, item);

                onSliderDoClose();
            };

            sAction = (
                <View>
                    <ButtonAction startDecorator={oIconAliases[sReaction]} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? onSliderDoShow : () => {}} disabled={bShowActionDisabled} />
                    <View>
                        <SliderBottom isVisible={sliderDoVisible} onClose={onSliderDoClose}>
                            <View className="p-4">
                                <FlatList horizontal showsHorizontalScrollIndicator={Platform.OS === 'web' ? true : false} data={oAction.menu.items} contentContainerStyle={stylesSlider.listContainer} renderItem={({ item, index }) => {
                                    return (
                                        <Button key={item.name} size="sm" fullWidth variant="text" rounded="true" startDecorator={oIconAliases[item.name]} onPress={(event) => {onSliderDoSelect(event, item)}} />
                                    );                                        
                                }} />
                            </View>
                        </SliderBottom>
                    </View>
                </View>
            );
        }
    }

    //--- show counter
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both') && oCounter && oCounter?.items;

    const getCounterDivided = () => {
        return Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            let iCount = aItem.count;
            if(isPageVar('counter')) {
                const oCounterGlobal = getPageVar('counter');
                const sCounterKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounterKey] != undefined)
                    iCount = oCounterGlobal[sCounterKey];
            }

            let sUsers = undefined;
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
                    <ButtonMenuCounter size="sm" fullWidth startDecorator={oIconAliases[aItem.name]} title={iCount} onPress={(event) => {handleGetPerformedByDvd(event, aItem)}} />
                    <Modal onVisible={popupVisibleByDvd[aItem.name]} onClose={() => {setPopupVisibleByDvd(state => ({...state, [aItem.name]: false}))}}>
                        {sUsers}
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

            let iCount = aItem.count;
            if(isPageVar('counter')) {
                const oCounterGlobal = getPageVar('counter');
                const sCounterKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounterKey] != undefined)
                    iCount = oCounterGlobal[sCounterKey];
            }

            if(!sSelected && iCount != 0)
                sSelected = aItem.name;

            iTotal += iCount;

            if(!iCount)
                return;
            
            return oIconAliases[aItem.name];

/*
            return (
                <Icon className={sClassIconInternal} icon={oIconAliases[aItem.name]}></Icon>
            );
*/
        });

        const aPerformedByMenu = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;
            
            if(performedBy == undefined || performedBy[aItem.name] == undefined || performedBy[aItem.name].length == 0)
                return;

            let sClass = 'flex-0 flex flex-row w-min top-px';
            if(aItem.name == sSelected)
                sClass += ' border-b-2  border-primary dark:border-primary-dark ';

            return (
                <View key={aItem.name} className={sClass}>
                    <Button size="sm" fullWidth variant="text" rounded="true" startDecorator={oIconAliases[aItem.name]} onPress={() => {setTabVisibleByCpd(aItem.name)}} />
                </View>
            );
        });

        const aPerformedByUsers = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            if(!sSelected && aItem.count != 0)
                sSelected = aItem.name;

            let sUsers = undefined;
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
            sClass += ' gap-4 overflow-y-auto text-gray-700 dark:text-gray-200';

            return (
                <View key={aItem.name} className={sClass}>{sUsers}</View>
            );
        });

        return (
            <View className={!iTotal ? "hidden" : ""}>
                <ButtonMenuCounter size="xs" variant='outline' fullWidth startDecorator={aCounter} title={iTotal} onPress={handleGetPerformedByCpd} />
                <Modal title='Reactions' onVisible={popupVisibleByCpd} onClose={() => {setPopupVisibleByCpd(false)}}>
                    <View className="relative flex-row justify-around border-b border-neoborder dark:border-neoborder-dark ">{aPerformedByMenu}</View>
                    <View className="p-4">{aPerformedByUsers}</View>
                </Modal>
            </View>
        );
    };

    //--- Counter
    let sCounter = undefined;
    if(bShowCounter && oCounter?.items != undefined)
        switch(sCounterType) {
            case 'compound':
                sCounter = getCounterCompound()
                break;

            case 'divided':
                sCounter = getCounterDivided();
                break;
        }

    const sObject = getName();
    return (
        <View className="inline-flex gap-1 sm:gap-0">
            {bShowAction && <View key={sObject + '-action'}>{sAction}</View>}
            {bShowCounter && <View key={sObject + '-counter'} className="flex-row">{sCounter}</View>}
        </View>
    );
 }
