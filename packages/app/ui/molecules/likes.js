import React from 'react';
import { useEffect, useState, useContext } from 'react';
import { fetcher } from '../../lib/fetcher';
import { PageData } from '../../context/page';
import Profile from './profile';

import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button, Modal } from 'app/design/controls';
import { Icon } from 'app/components/svg';

export default function ElementLikes(oProps) {

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const [ popupVisible, setPopupVisible ] = useState(false);
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

    const bUseInternalIcons = true;

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;

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

        performAction('do', {value: 1}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleUndo = (event) => {
        event.preventDefault();

        performAction('do', {value: 1}, (oData) => {
            setPageVars(oData);
        });
    };

    const handleGetPerformedBy = (event) => {
        event.preventDefault();

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);
            setPopupVisible(true);
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
            <Button variant="default" startDecorator="like" title={sTitle} onPress={handleUndo} />
        );
    }
    else {
        if(bUseInternalIcons)
            sIcon = sIcon && <Icon icon="like" className="flex h-6 w-6"></Icon>
        else
            sIcon = sIcon && <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{sIcon}</Text>

        sAction = (
            <Button id={getName('action-ddb')} variant="default" disabled={bShowActionDisabled} onPress={!bShowActionDisabled ? handleDo : () => {}}>
                <View className="flex-row flex-nowrap items-center gap-1 mx-auto">
                    {sIcon}
                    {sTitle && <Text className='hidden sm:block pl-0.5'>{sTitle}</Text>}
                </View>
            </Button>
        );
    }

    //--- show counter
    const bShowCounter = oParams.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');

    //--- Counter
    let sCounter = '';
    if(bShowCounter) {
        let sIcon = undefined;
        if(bUseInternalIcons)
            sIcon = <Icon icon="like" className="flex h-6 w-6"></Icon>
        else
            sIcon = <Text className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{oCounter.icon}</Text>

        let iCount = oCounter.count;
        if(isPageVar('counter')) {
            const oCounterGlobal = getPageVar('counter');
            if(oCounterGlobal?.count)
                iCount = oCounterGlobal.count;
        }

        let sUsers = undefined;
        if(performedBy) {
            sUsers = performedBy.map(aUser => {
                return (
                    <View key={aUser.id}><Profile {...aUser} /></View>
                );
            });
        }

        if(!sUsers || sUsers.length == 0)
            sUsers = getSkeleton();

        return (
            <View className={'flex flex-none' + (iCount <= 0 ? ' hidden' : '')}>
                <Button id={getName('performed-by-ddb')} variant="text" rounded="true" onPress={(event) => {handleGetPerformedBy(event)}}>
                    {sIcon}
                    <Text className='pl-1.5 pr-0.5'>{iCount}</Text>
                </Button>
                <Modal id={getName('performed-by-ddp')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                    <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</View>
                </Modal>
            </View>
        );
    }

    //--- CSR: Initialize.
    useEffect(() => {
        //Note. Client side code can be executed here. 
    }, []);

    return (
        <View className="inline-flex gap-1 sm:gap-0">
            {bShowAction && <View>{sAction}</View>}
            {bShowCounter && <View>{sCounter}</View>}
        </View>
    );
 }
