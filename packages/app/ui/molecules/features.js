import { useState, useCallback } from 'react';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';

const isElementVar = (elementData, sName) => {
    return elementData?.[sName];
};

const getElementVar = (elementData, sName) => {
    return elementData[sName];
};

const setElementVars = (elementData, setElementData, mValue) => {
    if(!elementData)
        setElementData(mValue);
    else
        setElementData({...elementData, ...mValue});
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplFeatureServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(sResponse?.data);
};      

const handleDo = (performAction, setElementVars, sHapticsType, fOnDo, fOnDone, oEvent) => {
    if(!!oEvent)
        oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    if(fOnDo && typeof fOnDo === 'function')
        fOnDo();

    performAction('perform', {}, (oData) => {
        setElementVars(oData);

        if(fOnDone && typeof fOnDone === 'function')
            fOnDone(oData);
    });
};

export default function ElementFeatures(oProps) {
    const [ elementData, setElementData ] = useState(false);

    const oSettings = appSetting('social_actions', 'feature');
    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;

    const oIcons = oProps?.o && oSettings[oProps.o]?.icons != undefined ? oSettings[oProps.o].icons : {
        do: 'Star', 
        undo: 'Star'
    };

    //--- default display type: action, counter, both.
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        hideTitleOnSmall: oProps.params?.button_hide_title_on_small
    };

    const _isElementVar = useCallback((sName) => isElementVar(elementData, sName), [elementData]);
    const _getElementVar = useCallback((sName) => getElementVar(elementData, sName), [elementData]);
    const _setElementVars = useCallback((mValue) => setElementVars(elementData, setElementData, mValue), [elementData, setElementData]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((event) => handleDo(_performAction, _setElementVars, oParams.haptics_type, (oProps.params?.on_do ? oProps.params.on_do : false), (oProps.params?.on_done ? oProps.params.on_done : false), event), [_performAction, _setElementVars, oParams.haptics_type, oProps.params.on_do, oProps.params.on_done]);

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;

    let bShowActionFeatured = oAction?.is_featured === true;
    if(_isElementVar('is_featured'))
        bShowActionFeatured = _getElementVar('is_featured') === true;

    let bShowActionDisabled = oAction?.is_disabled === true;
    if(_isElementVar('is_disabled'))
        bShowActionDisabled = _getElementVar('is_disabled') === true;

    let sTitle = oAction?.title || '';
    if(_isElementVar('title'))
        sTitle = _getElementVar('title');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if(oIcons)
        oButtonProps.startDecorator = oIcons[(bShowActionFeatured ? 'un' : '') + 'do'];

    return (
        <ButtonAction key="action" size={sDisplaySize} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleDo : () => {}} pressed={bShowActionUndo && bShowActionFeatured} disabled={bShowActionDisabled} {...oButtonProps} />
    );
}