import { useState, useCallback } from 'react';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplFeatureServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(sResponse?.data);
};      

const handleDo = (performAction, objectData, setObjectData, sHapticsType, fOnDo, fOnDone, oEvent) => {
    if(!!oEvent)
        oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    if(fOnDo && typeof fOnDo === 'function')
        fOnDo();

    performAction('perform', {}, (oData) => {
        setObjectData(!objectData ? oData : { ...objectData, ...oData})

        if(fOnDone && typeof fOnDone === 'function')
            fOnDone(oData);
    });
};

export default function ElementFeatures(oProps) {
    const oSettings = appSetting('social_actions', 'feature');
    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;

    const oIcons = oProps?.o && oSettings[oProps.o]?.icons != undefined ? oSettings[oProps.o].icons : {
        do: 'Star', 
        undo: 'Star'
    };

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const [ objectData, setObjectData ] = useState(oAction);

    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((event) => handleDo(_performAction, objectData, setObjectData, oParams.haptics_type, (oProps.params?.on_do ? oProps.params.on_do : false), (oProps.params?.on_done ? oProps.params.on_done : false), event), [_performAction, objectData, setObjectData, oParams.haptics_type, oProps.params.on_do, oProps.params.on_done]);

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionFeatured = objectData?.['is_featured'] != undefined ? objectData['is_featured'] === true : false;
    const bShowActionDisabled = objectData?.['is_disabled'] != undefined ? objectData['is_disabled'] === true : false;
    const sTitle = objectData?.['title'] != undefined ? objectData['title'] : '';

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if(oIcons)
        oButtonProps.startDecorator = oIcons[(bShowActionFeatured ? 'un' : '') + 'do'];

    return (
        <ButtonAction key="action" title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleDo : () => {}} pressed={bShowActionUndo && bShowActionFeatured} disabled={bShowActionDisabled} {...oButtonProps} />
    );
}