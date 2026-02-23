import { useState, useMemo, useCallback, useEffect, forwardRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { useActionsData } from 'app/context/actions';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import Dropdown from 'app/ui/atoms/dropdown'
import { InputMulti } from 'app/design/controls'
import { Platform } from 'react-native';
import { getComponent } from 'app/components/registry'

const getName = (sType, sSystem, sObjectId, sName) => {
    let aName = [sType, sSystem.replace(/_/g, '-'), sObjectId];
    if (sName)
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

    if (bShowFull) {
        if (!actionsDataState)
            setActionsDataState(oValue);
        else
            setActionsDataState({ ...actionsDataState, ...oValue });
    }
    else {
        if (!actionsData)
            setActionsData(oValue);
        else
            setActionsData({ ...actionsData, ...oValue });
    }
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = { s: sSystem, o: iObjectId };

    aParams = aParams ? { ...aParamsDefault, ...aParams } : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplReportServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if (typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleGetDo = (setPopupVisibleDo, oEvent) => {
    //if(!!oEvent)
    //   oEvent.preventDefault();

    if (Platform.OS == 'web') {
        const popperDiv = document.querySelector('div[data-radix-popper-content-wrapper]');
        if (popperDiv) {
            popperDiv.classList.add('radix-hide');
            document.body.style.pointerEvents = 'auto';
        }
    }

    setPopupVisibleDo(true);
};

const handleDo = (performAction, setContextVars, setPopupVisibleDo, valuesType, setValueType, setValueText, sHapticsType, fOnChangeTitle, oDataSubmit, oEvent) => {
    if (!!oEvent)
        oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    performAction('do', oDataSubmit, (oData) => {
        setContextVars(oData);
        setPopupVisibleDo(false);

        if (fOnChangeTitle && typeof fOnChangeTitle === 'function')
            fOnChangeTitle(oData['title']);
    });

    setValueType(valuesType[0].value);
    setValueText('');
};

const handleUndo = (performAction, setContextVars, fOnChangeTitle, oEvent) => {
    if (!!oEvent)
        oEvent.preventDefault();

    performAction('do', {}, (oData) => {
        setContextVars(oData);

        if (fOnChangeTitle && typeof fOnChangeTitle === 'function')
            fOnChangeTitle(oData['title']);
    });
};

const handleGetPerformedBy = (performAction, setPerformedBy, setPopupVisiblePerformed, bAllowViewReported, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    if (!bAllowViewReported)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', {}, (oData) => {
        if (!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);
        setPopupVisiblePerformed(true);
    });
};

const getSkeleton = () => {
    return (
        <View className="gap-y-2">
            {[...Array(1, 2, 3)].map(i =>
                <View key={i} className="flex-col p-2 bg-muted  sm:rounded-lg">
                    <View className="animate-pulse flex-row items-center gap-3">
                        <View className="rounded-full bg-secondary-foreground/20 h-10 w-10"></View>
                        <View className="flex-1 gap-y-1">
                            <View className="h-4 w-1/2 bg-secondary-foreground/20 rounded-full"></View>
                            <View className="h-3 w-1/3 bg-secondary-foreground/20 rounded-full"></View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const ElementReports = forwardRef((oProps, ref) => {
    const { t } = useTranslation();
     const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const elementRef = useRef(null);
    const [popupVisibleDo, setPopupVisibleDo] = useState(false);

    const isTextMode = oProps.mode === 'text';

    const oSettings = appSetting('social_actions', 'report');

    const oParams = { ...oSettings, ...oProps.params };
    const sIcon = isTextMode ? '' : oSettings[oProps['system']]?.icon != undefined ? oSettings[oProps['system']].icon : "AlertCircle"
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true

    const { actionsData, setActionsData } = useActionsData();
    const [actionsDataState, setActionsDataState] = useState({});


    const [popupVisiblePerformed, setPopupVisiblePerformed] = useState(false);
    const [performedBy, setPerformedBy] = useState();

    let valuesType = oParams.types.map(function (item) {
        return item.name ? { label: item.title, value: item.name } : null
    });
    valuesType = valuesType.filter(Boolean);

    const [valueType, setValueType] = useState(valuesType[0].value);
    const [valueText, setValueText] = useState('');

    const bAllowViewReported = oSettings[oProps['system']]?.allow_view_reported != undefined ? oSettings[oProps['system']].allow_view_reported : true;

    const _isContextVar = useCallback((sName) => isContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _getContextVar = useCallback((sName) => getContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _setContextVars = useCallback((mValue) => setContextVars(actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject, mValue), [actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleGetDo = useCallback((event) => handleGetDo(setPopupVisibleDo, event), [setPopupVisibleDo]);
    const _handleDo = useCallback((oDataSubmit, event) => handleDo(_performAction, _setContextVars, setPopupVisibleDo, valuesType, setValueType, setValueText, oParams.haptics_type, (oProps?.onChangeTitle ? oProps.onChangeTitle : false), oDataSubmit, event), [_performAction, _setContextVars, setPopupVisibleDo, valuesType, setValueType, setValueText, oParams.haptics_type, oProps.onChangeTitle]);
    const _handleUndo = useCallback((event) => handleUndo(_performAction, _setContextVars, (oProps?.onChangeTitle ? oProps.onChangeTitle : false), event), [_performAction, _setContextVars, oProps.onChangeTitle]);
    const _handleGetPerformedBy = useCallback((event) => handleGetPerformedBy(_performAction, setPerformedBy, setPopupVisiblePerformed, bAllowViewReported, oParams.haptics_type, event), [_performAction, setPerformedBy, setPopupVisiblePerformed, bAllowViewReported, oParams.haptics_type]);

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        const sub1 = subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'reported', cb);
        return () => {
            sub1();
        };
    }, [])


    const cb = (data) => {
        let aData = JSON.parse(data);
        if (!!aData?.api)
            _setContextVars(aData.api.performer_id == currentUser.id ? aData.api : { counter: aData.api.counter });
    }

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;

    if (_isContextVar('is_reported'))
        oAction.is_reported = _getContextVar('is_reported') === true;
    let bShowActionReported = oAction?.is_reported === true;

    if (_isContextVar('is_disabled'))
        oAction.is_disabled = _getContextVar('is_disabled') === true;
    let bShowActionDisabled = oAction?.is_disabled === true;

    if (_isContextVar('title'))
        oAction.title = _getContextVar('title');
    let sTitle = oAction?.title || '';


    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : (isTextMode ? 'custom' : oProps.params?.button_variant),
        size: isTextMode ? (Platform.OS == 'web' ? 'sm' : 'base') : oProps.params?.button_size,
        classTextName: Platform.OS == 'web' ? '' : " font-medium text-muted-foreground   ",
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size,
        ring: oProps.params?.button_ring
    };



    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    let sActionButton = undefined;
    let sActionPopup = undefined;
    if (bShowActionUndo && bShowActionReported) {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={_handleUndo} {...oButtonProps} />
        );
    }
    else {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleGetDo : () => { }} disabled={bShowActionDisabled} {...oButtonProps} />
        );

        sActionPopup = (
            <Modal title={t('Report')} onVisible={popupVisibleDo} onClose={() => { setPopupVisibleDo(false) }}>
                <View className="p-2 gap-y-4 overflow-y-auto">
                    <View>
                        <Text className="font-semibold text-sm text-card-foreground font-main">Report Type:</Text>
                    </View>
                    <Dropdown
                        labelField="label"
                        valueField="value"
                        onChange={setValueType}
                        value={valueType}
                        data={valuesType}
                    />
                    <View>
                        <Text className="font-semibold text-sm text-card-foreground font-main">Report Text:</Text>
                    </View>
                    <InputMulti
                        multiline
                        numberOfLines={4}
                        onChangeText={setValueText}
                        value={valueText}
                    />
                    <Button title={t('Send report')} onPress={(event) => { _handleDo({ type: valueType, text: valueText }, event) }} />
                </View>
            </Modal>
        );
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let iCount = '';
    if (oCounter?.count != undefined)
        iCount = oCounter.count;
    if (_isContextVar('counter')) {
        const oCounterGlobal = _getContextVar('counter');
        if (oCounterGlobal?.count != undefined)
            iCount = oCounterGlobal.count;
    }

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if (bShowCounter && iCount > 0) {
        let sUsers = undefined;
        if (performedBy) {
            sUsers = performedBy.map(aUser => {
                return (
                    <View key={aUser.id}><Profile {...aUser} /></View>
                );
            });
        }

        if (!sUsers || sUsers.length == 0)
            sUsers = getSkeleton();

        sCounterButton = (
            <View key="counter">
                <ButtonCounter startDecorator={!bShowCombined ? sIcon : false} title={iCount + ''} onPress={_handleGetPerformedBy} {...oButtonProps} />
            </View>
        );

        sCounterPopup = (
            <Modal title={t('Reports')}  onVisible={popupVisiblePerformed} onClose={() => { setPopupVisiblePerformed(false) }}>
                <View className="p-2 gap-y-4 overflow-y-auto text-muted-foreground ">{sUsers}</View>
            </Modal>
        );
    }

    /**
     * Save current state in 'ref' to use in Imperative functions.
     */
    elementRef.current = oAction;

    if (oProps.mode == 'dropdown-menu') {
        return <>
            <DropdownMenuItem
                disabled={bShowActionDisabled}
                counter={iCount > 0 ? iCount : ''}
                handleCounter={_handleGetPerformedBy}
                item={{ 
                    title: sTitle, 
                    icon: bShowCombined ? 'AlertCircle' : ''
                }}
                icon='AlertCircle'
                handleSelect={(event) => { bShowActionUndo && bShowActionReported ? _handleUndo(event) : (!bShowActionDisabled ? _handleGetDo(event) : () => { }) }}
            />{sActionPopup}{sCounterPopup}</>;
    }
    else {
        if (bShowCombined) {
            let aButtonsGroup = [sActionButton];
            if (!!sCounterButton)
                aButtonsGroup.push(sCounterButton);

            return (
                <View className={(bShowActionUndo && bShowActionReported ? ' undo' : ' do')}>
                    <ButtonsGroupMenu  {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                    {sActionPopup}
                    {sCounterPopup}
                </View>
            );
        }
        else {
            return (
                <View className={'flex-auto flex-row items-center' + (bShowActionUndo && bShowActionReported ? ' undo' : ' do')}>
                    {bShowAction && !!sActionButton && <View key={sObject + '-action-button'} className={'flex-auto' + (bShowFull ? (isTextMode ? ' mr-4' : ' mr-1') : '')}>{sActionButton}</View>}
                    {bShowAction && !!sActionPopup && <View key={sObject + '-action-popup'}>{sActionPopup}</View>}
                    {(bShowCounter && !!sCounterButton && !isTextMode) && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                    {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
                </View>
            );
        }
    }
});

export default ElementReports;