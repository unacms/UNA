import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { useActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSequence } from "react-native-reanimated";

const getName = (sType, sSystem, sObjectId, sName) => {
    let aName = [sType, sSystem.replace(/_/g, '-'), sObjectId];
    if(sName)
        aName.push(sName);

    return [].concat(aName).join('-');
};

const isContextVar = (actionsData, actionsDataState, bShowFull, sContextKey, sName) => {
    return bShowFull ? actionsDataState?.[sContextKey]?.[sName] != undefined : actionsData?.[sContextKey]?.[sName] != undefined;
};

const getContextVar = (actionsData, actionsDataState, bShowFull, sContextKey, sName) => {
    return bShowFull ? actionsDataState[sContextKey][sName] : actionsData[sContextKey][sName];
};

const setContextVars = (actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sContextKey, mValue) => {
    let oValue = {};
    oValue[sContextKey] = mValue;

    if(bShowFull) {
        if(!actionsDataState)
            setActionsDataState(oValue);
        else
            setActionsDataState({...actionsDataState, ...oValue});
    }
    else {
        if(!actionsData)
            setActionsData(oValue);
        else
            setActionsData({...actionsData, ...oValue});
    }
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o:iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleDo = (performAction, setContextVars, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    performAction('do', {value: 1}, (oData) => {
        setContextVars(oData);
    });
};

const handleUndo = (performAction, setContextVars, oEvent) => {
    oEvent.preventDefault();

    performAction('do', {value: 1}, (oData) => {
        setContextVars(oData);
    });
};

const handleGetPerformedBy = (performAction, setPerformedBy, setPopupVisible, bAllowViewVoted, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    if(!bAllowViewVoted)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', {}, (oData) => {
        if(!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);
        setPopupVisible(true);
    });
};

const getSkeleton = () => {
    return (
        <View className="gap-y-2">
        {[...Array(1, 2, 3)].map( i => 
            <View key={i} className="flex-col p-2 bg-neutral-500/5 sm:rounded-lg">
                <View className="animate-pulse flex-row items-center gap-3">
                    <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
                    <View className="flex-1 gap-y-1">
                        <View className="h-4 w-1/2 bg-neutral-600/20 rounded-full"></View>    
                        <View className="h-3 w-1/3 bg-neutral-600/20 rounded-full"></View>
                    </View>
                </View>
            </View>
        )}
        </View>
    );
};

export default function ElementLikes(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'like');

    const oParams = {...oSettings, ...oProps.params};
    const sIcon = oSettings[oProps['system']]?.icon ? oSettings[oProps['system']].icon : "ThumbsUp"
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true   

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        hideTitleOnSmall: oProps.params?.button_hide_title_on_small
    };

    const { actionsData, setActionsData } = useActionsData();
    const [ actionsDataState, setActionsDataState ] = useState({});

    const [ popupVisible, setPopupVisible ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const bAllowViewVoted = oSettings[oProps['system']]?.allow_view_voted != undefined ? oSettings[oProps['system']].allow_view_voted : true;

    const _isContextVar = useCallback((sName) => isContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _getContextVar = useCallback((sName) => getContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _setContextVars = useCallback((mValue) => setContextVars(actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject, mValue), [actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((event) => handleDo(_performAction, _setContextVars, oParams.haptics_type, event), [_performAction, _setContextVars, oParams.haptics_type]);
    const _handleUndo = useCallback((event) => handleUndo(_performAction, _setContextVars, event), [_performAction, _setContextVars]);
    const _handleGetPerformedBy = useCallback((event) => handleGetPerformedBy(_performAction, setPerformedBy, setPopupVisible, bAllowViewVoted, oParams.haptics_type, event), [_performAction, setPerformedBy, setPopupVisible, bAllowViewVoted, oParams.haptics_type]);

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            _setContextVars(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionVoted = oAction?.is_voted === true || (_isContextVar('is_voted') && _getContextVar('is_voted') === true);
    const bShowActionDisabled = oAction?.is_disabled === true || (_isContextVar('is_disabled') && _getContextVar('is_disabled') === true);

    let sTitle = oAction?.title || '';
    if(_isContextVar('title'))
        sTitle = _getContextVar('title');

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    let sActionButton = undefined;
    if(bShowActionUndo && bShowActionVoted) {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={_handleUndo} pressed={true} {...oButtonProps} />
        );
    }
    else {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleDo : () => {}} disabled={bShowActionDisabled} {...oButtonProps} />
        );
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let iCount = '';
    if (oCounter?.count)
        iCount = oCounter.count;
    if(_isContextVar('counter')) {
        const oCounterGlobal = _getContextVar('counter');
        if(oCounterGlobal?.count)
            iCount = oCounterGlobal.count;
    }    

    const sharedValue = useSharedValue(1);
    const indicatorStyle = useAnimatedStyle(() => {
        return {
        opacity: sharedValue.value,
        };
    }, [sharedValue]);

    useEffect(() => {
        sharedValue.value = withSequence(
        withTiming(0, { duration: 500 }), // fade out
        withTiming(1, { duration: 500 }) // fade in
        );
    }, [iCount]);

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && oCounter?.count != undefined) {

        if(iCount > 0) {
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

            sCounterButton = (
                <Animated.View key="counter" style={indicatorStyle}>
                    <ButtonCounter startDecorator={!bShowCombined ? 'ThumbsUp' : false} title={iCount+''} onPress={_handleGetPerformedBy} {...oButtonProps} />
                </Animated.View>
            );

            sCounterPopup = (
                <Modal title={t('Likes')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                    <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
                </Modal>
            );
        }
    }

    if(bShowCombined) {
        let aButtonsGroup = [sActionButton];
        if(!!sCounterButton)
            aButtonsGroup.push(sCounterButton);

        return (
            <View>
                <ButtonsGroupMenu {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                {sCounterPopup}
            </View>
        );
    }
    else
        if (bShowCounter && !bShowAction && !iCount)
            return null

        return (
            <View className={"flex-auto flex-row items-center" + (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? '  px-0 ': '  px-2 ') : '')}>
                {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
                {bShowCounter &&  !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
            </View>
        );
 }
