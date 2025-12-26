import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
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


const performAction = async (sAction, aParams, onLoad) => {
    const sRequest = '/api.php?r=bx_timeline/' + sAction + '/Module&params=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if (typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleDo = (setContextVars, sHapticsType, oAction, oEvent) => {
    oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    performAction('repost', Object.values(oAction.data), (oData) => {
        setContextVars(oData);
    });
};

export default function ElementReposts(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'repost');
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const oParams = { ...oSettings, ...oProps.params };
    const sIcon = oSettings[oProps['system']]?.icon ? oSettings[oProps['system']].icon : "RotateCw"
    const oAction = oProps.action;
    const oCounter = oProps?.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true

    let oButtonProps = {};
    if (oProps.primary)
        oButtonProps.variant = 'primary';
    if (oProps.params?.button_variant != undefined)
        oButtonProps.variant = oProps.params.button_variant;
    if (oProps.params?.button_size != undefined)
        oButtonProps.size = oProps.params.button_size;
    if (oProps.params?.button_rounded != undefined)
        oButtonProps.rounded = oProps.params.button_rounded;
    if (oProps.params?.button_full_width != undefined)
        oButtonProps.fullWidth = oProps.params.button_full_width;
    if (oProps.params?.button_show_title_from_size != undefined)
        oButtonProps.showTitleFromSize = oProps.params.button_show_title_from_size;
    // ring support removed

    const { actionsData, setActionsData } = useActionsData();
    const [actionsDataState, setActionsDataState] = useState({});

    const [popupVisible, setPopupVisible] = useState(false);
    const [performedBy, setPerformedBy] = useState();

    const _isContextVar = useCallback((sName) => isContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _getContextVar = useCallback((sName) => getContextVar(actionsData, actionsDataState, bShowFull, sObject, sName), [actionsData, actionsDataState, bShowFull, sObject]);
    const _setContextVars = useCallback((mValue) => setContextVars(actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject, mValue), [actionsData, setActionsData, actionsDataState, setActionsDataState, bShowFull, sObject]);
    const _handleDo = useCallback((event) => handleDo(_setContextVars, oParams.haptics_type, oAction, event), [_setContextVars, oParams.haptics_type, oAction]);

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionPerformed = oAction?.is_performed === true || (_isContextVar('is_performed') && _getContextVar('is_performed') === true);
    const bShowActionDisabled = oAction?.is_disabled === true || (_isContextVar('is_disabled') && _getContextVar('is_disabled') === true);

    let sTitle = oAction?.title || '';
    if (_isContextVar('title'))
        sTitle = _getContextVar('title');

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    let sActionButton = undefined;
    if (bShowActionUndo && bShowActionPerformed) {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={handleUndo} pressed={true} {...oButtonProps} />
        );
    }
    else {
        sActionButton = (
            <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleDo : () => { }} disabled={bShowActionDisabled} {...oButtonProps} />
        );
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let iCount = '';
    if (oCounter?.count)
        iCount = oCounter.count;
    if (_isContextVar('counter')) {
        const oCounterGlobal = _getContextVar('counter');
        if (oCounterGlobal?.count)
            iCount = oCounterGlobal.count;
    }

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if (bShowCounter && oCounter?.count != undefined) {
        //TODO: Counter can be added here.
    }
    if (oProps.mode == 'dropdown-menu') {
         return <DropdownMenuItem
                    item={{
                        title: sTitle,
                        icon: sIcon
                    }}
                    icon={sIcon}
                    handleSelect={(event) => { _handleDo(event) }}
                />;
    }
    else {
        if (bShowCombined) {
            let aButtonsGroup = [sActionButton];
            if (!!sCounterButton)
                aButtonsGroup.push(sCounterButton);

            return (
                <View>
                    <ButtonsGroupMenu  {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                    {sCounterPopup}
                </View>
            );
        }
        else {
            return (
                <View className={"flex-auto flex-row items-center" + (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? ' ' : 'me-3') : '')}>
                    {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
                    {bShowCounter && !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                    {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
                </View>
            );
        }
    }
}
