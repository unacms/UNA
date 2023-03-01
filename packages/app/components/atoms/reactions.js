import React from 'react';
import { useEffect, useState, useContext } from 'react';

import { fetcher } from '../../lib/util';
import { PageData } from '../../context/page';
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
import Menu from '../menu';
import Popup from './popup';
import Profile from './profile';

export default function ElementReactions(oProps) {
    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const [ popupVisibleBy, setPopupVisibleBy ] = useState('');
    const [ performedBy, setPerformedBy ] = useState();
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

        let oValue = {};
        oValue[sPageKey] = mValue;

        if(!pageData)
            setPageData(oValue);
        else
            setPageData({...pageData, ...oValue});
    };

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;

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
        event.preventDefault();

        performAction('do', {value: 1, reaction: oProps.name}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleUndo = (event) => {
        event.preventDefault();

        let sReaction = oProps.action.reaction;
        if(isPageVar('reaction'))
            sReaction = getPageVar('reaction');

        performAction('do', {value: 1, reaction: sReaction}, (oData) => {
            setPageVars(oData);

            //--- Reinit 'Do Action' popup.
            setTimeout(function() {
                const oTarget = document.getElementById(getName('action-ddp'));
                const oTrigger = document.getElementById(getName('action-ddb'));
                if(oTarget && oTrigger)
                    new Dropdown(oTarget, oTrigger, {trigger:'click'});
            }, 100);
        });
    };
    
    const handleGetPerformedBy = (event, aItem) => {
        event.preventDefault();

        const sReaction = aItem?.name || '';
        if(!sReaction)
            return;

        performAction('get_performed_by', {reaction: sReaction}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);
            setPopupVisibleBy(sReaction);
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
    const bShowAction = (oParams.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionVoted = oAction?.is_voted === true || (isPageVar('is_voted') && getPageVar('is_voted') === true);
    const bShowActionDisabled = oAction?.is_disabled === true || (isPageVar('is_disabled') && getPageVar('is_disabled') === true);

    let sIcon = oAction?.icon || '';
    if(isPageVar('icon'))
        sIcon = getPageVar('icon');

    let sTitle = oAction?.title || '';
    if(isPageVar('title'))
        sTitle = getPageVar('title');

    let sAction = '';
    if(bShowActionUndo && bShowActionVoted) {
        sAction = (
            <A className="group flex-auto shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-blue-600 hover:text-blue-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline" onPress={handleUndo}>
                <View className="flex gap-1 mx-auto">
                    {sIcon && <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{sIcon}</Text>}
                    {sTitle && <Text className='hidden xl/cell:block pl-1.5 pr-0.5 my-auto'>{sTitle}</Text>}
                </View>
            </A>
        );
    }
    else {
        let sClassNameDo = '';
        if(bShowActionDisabled)
            sClassNameDo = 'group flex-auto  flex-row items-center p-2 shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-500 cursor-not-allowed hover:no-underline';
        else
            sClassNameDo = 'group flex-auto flex-row shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline'

        const sItems = Object.keys(oAction.menu.items).map(function(iKey) {
            const aItem = oAction.menu.items[iKey];

            return (
                <DropdownMenuItemH key={aItem.id ? aItem.id : aItem.name} onSelect={(e) => {handleDo(e, aItem)}}>
                    {aItem.icon && 
                    <DropdownMenuItemIcon>
                        <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{aItem.icon}</Text>
                    </DropdownMenuItemIcon>
                    }
                    <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
                </DropdownMenuItemH>
            );
        });

        sAction = (
            <DropdownMenuRoot>
                <DropdownMenuTrigger>
                    <A id={getName('action-ddb')} disabled={bShowActionDisabled} className={sClassNameDo}>
                        <View className="flex-row gap-1 mx-auto">
                            {sIcon && <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{sIcon}</Text>}
                            {sTitle && <Text className='hidden xl/cell:block pl-1.5 pr-0.5 my-auto'>{sTitle}</Text>}
                        </View>
                    </A>
                </DropdownMenuTrigger>
                <DropdownMenuContentH>{sItems}</DropdownMenuContentH>
            </DropdownMenuRoot>
        );
    }

    //--- show counter
    const bShowCounter = oParams.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');

    //--- Counter
    let sCounter = '';
    if(bShowCounter)
        sCounter = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

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

            if(!sUsers)
                sUsers = getSkeleton();

            return (
                <View key={iKey} className={'inline-flex flex-none' + (!iCount ? ' hidden' : '')}>
                    <A id={getName('performed-by-ddb-' + aItem.name)} className="group inline-flex flex-none active:opacity-80 active:shadow-none items-center p-1.5 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 hover:no-underline" onPress={(event) => {handleGetPerformedBy(event, aItem)}}>
                        {aItem?.icon && <Text className='w-6 h-6 text-base'>{aItem.icon}</Text>}
                        <Text className='pl-1.5 pr-0.5'>{iCount}</Text>
                    </A>
                    <Popup id={getName('performed-by-ddp-' + aItem.name)} visible={[popupVisibleBy == aItem.name, setPopupVisibleBy]}>
                        <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</View>
                    </Popup>
                </View>
            );
        });

    //--- CSR: Initialize Flowbite components.
    useEffect(() => {
        //TODO: Do action dropdown.
    }, []);

    return (
        <View className="inline-flex gap-1 xl/cell:gap-0 ">
            {bShowAction && <View>{sAction}</View>}
            {bShowCounter && <View className="flex-row">{sCounter}</View>}
        </View>
    );
 }
