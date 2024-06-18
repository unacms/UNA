import { useState} from 'react';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function ElementFeatures(oProps) {
    const [ elementData, setElementData ] = useState(false);
    const { t } = useTranslation();

    const oSettings = appSetting('social_actions', 'feature');
    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;

    const oIcons = oProps?.o && oSettings[oProps.o]?.icons != undefined ? oSettings[oProps.o].icons : {
        do: 'UserPlus', 
        undo: 'UserMinus'
    };

    //--- default display type: action, counter, both.
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    let oButtonProps = {};
    if(oProps.params?.button_variant != undefined)
        oButtonProps.variant = oProps.params.button_variant;
    if(oProps.primary)
        oButtonProps.variant = 'primary';
  
    if(oProps.params?.button_size != undefined)
        oButtonProps.size = oProps.params.button_size;
    if(oProps.params?.button_rounded != undefined)
        oButtonProps.rounded = oProps.params.button_rounded;
    if(oProps.params?.button_full_width != undefined)
        oButtonProps.fullWidth = oProps.params.button_full_width;
    if(oProps.params?.button_hide_title_on_small != undefined)
        oButtonProps.hideTitleOnSmall = oProps.params.button_hide_title_on_small;

    const isElementVar = (sName) => {
        return elementData && elementData[sName] != undefined;
    };

    const getElementVar = (sName) => {
        return elementData[sName];
    };

    const setElementVars = (mValue) => {
        if(!elementData)
            setElementData(mValue);
        else
            setElementData({...elementData, ...mValue});
    };

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {s: oProps.system, o:oProps.object_id};

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplFeatureServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };      

    const handleDo = (event) => {
        if(!!event)
            event.preventDefault();

        FeedbackHaptics(oParams.haptics_type);

        if(oProps.params?.on_do && typeof oProps.params.on_do === 'function')
            oProps.params.on_do();

        performAction('perform', {}, (oData) => {
            setElementVars(oData);

            if(oProps.params?.on_done && typeof oProps.params.on_done === 'function')
                oProps.params.on_done(oData);
        });
    };

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;

    let bShowActionFeatured = oAction?.is_featured === true;
    if(isElementVar('is_featured'))
        bShowActionFeatured = getElementVar('is_featured') === true;

    let bShowActionDisabled = oAction?.is_disabled === true;
    if(isElementVar('is_disabled'))
        bShowActionDisabled = getElementVar('is_disabled') === true;

    let sTitle = oAction?.title || '';
    if(isElementVar('title'))
        sTitle = getElementVar('title');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if(oIcons)
        oButtonProps.startDecorator = oIcons[(bShowActionFeatured ? 'un' : '') + 'do'];

    return (
        <ButtonAction key="action" size={sDisplaySize} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? (event) => {handleDo(event)} : () => {}} pressed={bShowActionUndo && bShowActionFeatured} disabled={bShowActionDisabled} {...oButtonProps} />
    );
}