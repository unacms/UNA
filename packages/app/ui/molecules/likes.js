import { useState, useContext } from 'react';

import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { ActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounter, Modal } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';

export default function ElementLikes(oProps) {
    const sClassIconExternal = 'w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base';

    const oParams = {...appSetting('social_actions', 'like'), ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const { actionsData, setActionsData } = useContext(ActionsData);
    const [ actionsDataState, asetActionsDataState ] = useState({});

    const [ popupVisible, setPopupVisible ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const isContextVar = (sName) => {
        const sContextKey = getName();

        if(bShowFull)
            return actionsDataState && actionsDataState[sContextKey] != undefined && actionsDataState[sContextKey][sName] != undefined;
        else
            return actionsData && actionsData[sContextKey] != undefined && actionsData[sContextKey][sName] != undefined;
    };

    const getContextVar = (sName) => {
        const sContextKey = getName();

        if(bShowFull)
            return actionsDataState[sContextKey][sName];
        else
            return actionsData[sContextKey][sName];
    };

    const setContextVars = (mValue) => {
        const sContextKey = getName();

        let oValue = {};
        oValue[sContextKey] = mValue;

        if(bShowFull) {
            if(!actionsDataState)
                asetActionsDataState(oValue);
            else
                asetActionsDataState({...actionsDataState, ...oValue});
        }
        else {
            if(!actionsData)
                setActionsData(oValue);
            else
                setActionsData({...actionsData, ...oValue});
        }
    };

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
            setContextVars(oData);
        });
    };

    const handleUndo = (event) => {
        event.preventDefault();

        performAction('do', {value: 1}, (oData) => {
            setContextVars(oData);
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


    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionVoted = oAction?.is_voted === true || (isContextVar('is_voted') && getContextVar('is_voted') === true);
    const bShowActionDisabled = oAction?.is_disabled === true || (isContextVar('is_disabled') && getContextVar('is_disabled') === true);

    let sTitle = oAction?.title || '';
    if(isContextVar('title'))
        sTitle = getContextVar('title');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    let sAction = undefined;
    if(bShowActionUndo && bShowActionVoted) {
        sAction = (
            <ButtonAction startDecorator="ThumbsUp" title={bShowActionLabel ? sTitle : false} onPress={handleUndo} />
        );
    }
    else {
        sAction = (
            <ButtonAction startDecorator="ThumbsUp" title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? handleDo : () => {}} disabled={bShowActionDisabled} />
        );
    }


    //--- Counter
    let sCounter = undefined;
    if(bShowCounter && oCounter?.count != undefined) {
        let iCount = oCounter.count;
        if(isContextVar('counter')) {
            const oCounterGlobal = getContextVar('counter');
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

        sCounter = (
            <View className={'flex flex-none' + (iCount <= 0 ? ' hidden' : '')}>
                <ButtonMenuCounter startDecorator="ThumbsUp" title={iCount} onPress={(event) => {handleGetPerformedBy(event)}} />
                <Modal title={appSetting('lang_keys', 'vote_performed_by_popup_title')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                    <View className="px-2 pb-2 space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</View>
                </Modal>
            </View>
        );
    }
    
    const sObject = getName();
    return (
        <View className="flex-auto flex-row items-center">
            {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sAction}</View>}
            {bShowCounter && <View key={sObject + '-counter'}>{sCounter}</View>}
        </View>
    );
 }
