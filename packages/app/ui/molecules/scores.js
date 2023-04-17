import { useState, useContext } from 'react';

import { fetcher } from 'app/lib/fetcher';
import { PageData } from 'app/context/page';
import { View } from 'app/design/view';
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounter, Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile';

export default function ElementScore(oProps) {
    const oIconAliases = {
        'arrow-up': 'ArrowFatUp',
        'arrow-down': 'ArrowFatDown'
    };

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

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {s: oProps.system, o:oProps.object_id};

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplScoreServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, sAction) => {
        event.preventDefault();

        performAction('do', {a: sAction}, (oData) => {
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
    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowActionAsButton = oParams?.show_do_vote_as_button == undefined || oParams.show_do_vote_as_button === true;
    const bShowActionLabel = oParams?.show_do_vote_label == undefined || oParams.show_do_vote_label === true;

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    const aActions = Object.keys(oAction).map(function(sAction) {
        const oItem = oAction[sAction];

        const bShowActionVoted = oItem?.is_voted === true || (isPageVar('is_voted') && getPageVar('is_voted') === true);
        const bShowActionDisabled = oItem?.is_disabled === true || (isPageVar('is_disabled') && getPageVar('is_disabled') === true);

        let sIcon = oItem?.icon || '';
        let sTitle = oItem?.title || '';
        if(isPageVar(sAction)) {
            const oItemGlobal = getPageVar(sAction);
            if(oItemGlobal?.icon)
                sIcon = oItemGlobal.icon;
            if(oItemGlobal?.title)
                sTitle = oItemGlobal.title;
        }

        return (
            <ButtonAction size="sm" variant='text' startDecorator={oIconAliases[sIcon]} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? (event) => {handleDo(event, sAction)} : () => {}} disabled={bShowActionDisabled} />
        );
    });

    //--- show counter
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');

    //--- Counter
    let sCounter = undefined;
    if(bShowCounter && oCounter?.score != undefined) {
        let iScore = oCounter.score;
        if(isPageVar('counter')) {
            const oCounterGlobal = getPageVar('counter');
            if(oCounterGlobal?.score)
                iScore = oCounterGlobal.score;
        }

        let sUsers = undefined;
        if(performedBy) {
            sUsers = performedBy.map(aVote => {
                return (
                    <View key={aVote.author_data.id + '-' + aVote.vote_date} className="flex flex-row justify-between items-center">
                        <Profile {...aVote.author_data} />
                        <Icon icon={oIconAliases[oCounter[aVote.vote_type].icon]} />
                    </View>
                );
            });
        }

        if(!sUsers || sUsers.length == 0)
            sUsers = getSkeleton();

        sCounter = (
            <View className={'flex flex-none' + (iScore == 0 ? ' hidden' : '')}>
                <ButtonMenuCounter size="xs" variant='outline' startDecorator="ArrowFatUp" title={iScore.toString()} onPress={(event) => {handleGetPerformedBy(event)}} />
                <Modal onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                    <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</View>
                </Modal>
            </View>
        );
    }

    const sObject = getName();
    return (
        <View className="flex flex-row items-center">
            {bShowAction && <View key={sObject + '-action-up'} className="pr-1">{aActions[0]}</View>}
            {bShowCounter && <View key={sObject + '-counter'} className={bShowAction ? 'px-1' : ''}>{sCounter}</View>}
            {bShowAction && <View key={sObject + '-action-down'} className="pl-1">{aActions[1]}</View>}
        </View>
    );
}
