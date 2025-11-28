import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { useActionsData } from 'app/context/actions';
import { View, Pressable } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import { StarsView, StarsAction } from 'app/ui/atoms/stars';

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
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleDo = (performAction, setContextVars, setPopupVisibleDo, sHapticsType, iValue) => {
    FeedbackHaptics(sHapticsType);

    performAction('do', {value: iValue}, (oData) => {
        setContextVars(oData);
        setPopupVisibleDo(false);
    });
};

const handleUndo = (performAction, isContextVar, getContextVar, setContextVars, sHapticsType, iValue) => {
    FeedbackHaptics(sHapticsType);

    performAction('do', {value: (isContextVar('value') ? getContextVar('value') : iValue)}, (oData) => {
        setContextVars(oData);
    });
};

const handleGetPerformedBy = (performAction, setPerformedBy, setPopupVisiblePb, bAllowViewVoted, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    if(!bAllowViewVoted)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', {}, (oData) => {
        if(!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);
        setPopupVisiblePb(true);
    });
};

const getSkeleton = () => {
    return (
        <View className="gap-y-2">
        {[...Array(1, 2, 3)].map( i => 
            <View key={i} className="flex-col p-2 bg-muted sm:rounded-lg">
                <View className="animate-pulse flex-row items-center gap-3">
                    <View className="rounded-full bg-muted h-10 w-10"></View>
                    <View className="flex-1 gap-y-1">
                        <View className="h-4 w-1/2 bg-muted rounded-full"></View>    
                        <View className="h-3 w-1/3 bg-muted rounded-full"></View>
                    </View>
                </View>
            </View>
        )}
        </View>
    );
};

export default function ElementStars(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'star');

    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);
    const sIcon = oSettings[oProps['system']]?.icon ? oSettings[oProps['system']].icon : "Star";

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true;

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size,
        ring: oProps.params?.button_ring
    };

    const { actionsData, setActionsData } = useActionsData();
    const [ actionsDataState, setActionsDataState ] = useState({});

    const [ popupVisibleDo, setPopupVisibleDo ] = useState(false);

    const [ popupVisiblePb, setPopupVisiblePb ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const bAllowViewVoted = oSettings[oProps['system']]?.allow_view_voted != undefined ? oSettings[oProps['system']].allow_view_voted : true;

    const _isContextVar = useCallback((sName) => isContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _getContextVar = useCallback((sName) => getContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _setContextVars = useCallback((mValue) => setContextVars(actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject, mValue), [actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((iValue) => handleDo(_performAction, _setContextVars, setPopupVisibleDo, oParams.haptics_type, iValue), [_performAction, _setContextVars, setPopupVisibleDo, oParams.haptics_type]);
    const _handleUndo = useCallback(() => handleUndo(_performAction, _isContextVar, _getContextVar, _setContextVars, oParams.haptics_type, oProps.action.value), [_performAction, _isContextVar, _getContextVar, _setContextVars, oParams.haptics_type, oProps.action.value]);
    const _handleGetPerformedBy = useCallback((event) => handleGetPerformedBy(_performAction, setPerformedBy, setPopupVisiblePb, bAllowViewVoted, oParams.haptics_type, event), [_performAction, setPerformedBy, setPopupVisiblePb, bAllowViewVoted, oParams.haptics_type]);

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            _setContextVars(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    let bShowActionVoted = oAction?.is_voted === true;
    if(_isContextVar('is_voted'))
        bShowActionVoted = _getContextVar('is_voted') === true;

    let bShowActionDisabled = oAction?.is_disabled === true;
    if(_isContextVar('is_disabled'))
        bShowActionDisabled = _getContextVar('is_disabled') === true;

    let sTitle = oAction?.title || '';
    if(_isContextVar('title'))
        sTitle = _getContextVar('title');

    let iCount = 0;
    if (oCounter?.count)
        iCount = oCounter.count;
    if(_isContextVar('counter')) {
        const oCounterGlobal = _getContextVar('counter');
        if(oCounterGlobal?.count != undefined)
            iCount = oCounterGlobal.count;
    }

    let fRate = '';
    if (oCounter?.rate)
        fRate = oCounter.rate;
    if(_isContextVar('counter')) {
        const oCounterGlobal = _getContextVar('counter');
        if(oCounterGlobal?.rate != undefined)
            fRate = oCounterGlobal.rate;
    }

    //--- show action
    let sActionButton = undefined;
    if(bShowAction) {
        const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
        const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

        const bShowActionUndo = oAction?.is_undo === true;

        const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

        if(bShowActionVoted) {
            if(bShowActionUndo)
                sActionButton = (
                    <ButtonAction key="action"  startDecorator={sIcon} title={bShowActionLabel ? sTitle : ''} onPress={_handleUndo} {...oButtonProps} />
                );
            else
                sActionButton = (
                    <ButtonAction key="action"  startDecorator={sIcon} title={bShowActionLabel ? sTitle : ''} onPress={() => {}} disabled={true} {...oButtonProps} />
                );
        }
        else {
            sActionButton = (
                <Pressable key="action" onPress={(event) => {event.preventDefault()}}>
                    <DropdownPopup 
                        trigger={<ButtonAction variant={bShowCombined ? 'group-item' : false}  startDecorator={sIcon} title={bShowActionLabel ? sTitle : ''} 
                        onPress={() => {}} disabled={bShowActionDisabled} {...oButtonProps} />} 
                        size="auto" open={!!popupVisibleDo} 
                        onOpenChange={async (bOpen) => {setPopupVisibleDo(bOpen)}}>
                    <StarsAction rating={fRate} onChange={!bShowActionDisabled ? (number) => {_handleDo(number)} : () => {}} />
                    </DropdownPopup>
                </Pressable>
            );
        }
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    // CSS-based fade animation for counter updates
    const [isAnimating, setIsAnimating] = useState(false);
    const prevRateRef = useMemo(() => ({ current: fRate }), []);
    
    useEffect(() => {
        if (prevRateRef.current !== fRate) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            prevRateRef.current = fRate;
            return () => clearTimeout(timer);
        }
    }, [fRate]);    

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && (iCount > 0 || fRate > 0)) {
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
            <View 
                key="counter" 
                className={`transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}
            >
                <ButtonCounter  startDecorator={'Star'} title={fRate + ''} onPress={_handleGetPerformedBy} {...oButtonProps} />
            </View>
        );

        sCounterPopup = (
            <Modal title={t('Likes')} onVisible={popupVisiblePb} onClose={() => {setPopupVisiblePb(false)}}>
                <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
            </Modal>
        );
    }

    let sResult = undefined;
    if(bShowCombined) {
        let aButtonsGroup = [];

        if(bShowAction && !!sActionButton)
            aButtonsGroup.push(sActionButton)

        if(bShowCounter && !!sCounterButton)
            aButtonsGroup.push(sCounterButton)

        sResult = (
            <View>
                <ButtonsGroupMenu  {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                {sCounterPopup}
            </View>
        );
    }
    else
        sResult = (
            <View className="flex-auto flex-row items-center h-full">
                {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
                {bShowCounter && !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
            </View>
        );

    return sResult;
 }

