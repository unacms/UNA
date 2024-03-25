import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { CardData } from 'app/context/card';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';

export default function ElementRecommendations(oProps) {
    const { t } = useTranslation();

    const { cardData, setCardData } = useContext(CardData);
    const [ elementData, setElementData ] = useState(false);

    const oParams = {...appSetting('social_actions', 'recommendation'), ...oProps.params};

    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;

    let oButtonProps = {};
    if(oProps.primary)
        oButtonProps.variant = 'primary';
    if(oProps.params?.button_variant != undefined)
        oButtonProps.variant = oProps.params.button_variant;
    if(oProps.params?.button_size != undefined)
        oButtonProps.size = oProps.params.button_size;
    if(oProps.params?.button_rounded != undefined)
        oButtonProps.rounded = oProps.params.button_rounded;
    if(oProps.params?.button_full_width != undefined)
        oButtonProps.fullWidth = oProps.params.button_full_width;
    if(oProps.params?.only_icon != undefined)
        oButtonProps.onlyIcon = oProps.params.only_icon;

    const getName = (sName) => {
        let aName = [oProps.type, oProps.o.replace(/_/g, '-'), oProps.iid, oProps.cid];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const isElementVar = (sName, bUseContext = false, bUseContextWide = false) => {
        if(bUseContext) {
            if(!bUseContextWide) {
                const sContextKey = getName();

                return cardData && cardData[sContextKey] != undefined && cardData[sContextKey][sName] != undefined;
            }
            else
                return cardData && cardData[sName] != undefined;
        }
        else
            return elementData && elementData[sName] != undefined;
    };

    const getElementVar = (sName, bUseContext = false, bUseContextWide = false) => {
        if(bUseContext) {
            if(!bUseContextWide) {
                const sContextKey = getName();

                return cardData[sContextKey][sName];
            }
            else
                return cardData[sName];
        }
        else
            return elementData[sName];
    };

    const setElementVars = (mValue, bUseContext = false, bUseContextWide = false) => {
        if(bUseContext) {
            let oValue = undefined;
            if(!bUseContextWide) {
                const sContextKey = getName();
                oValue = {[sContextKey]: mValue};
            }
            else
                oValue = mValue;

            if(!cardData)
                setCardData(oValue);
            else
                setCardData({...cardData, ...oValue});
        }
        else {
            if(!elementData)
                setElementData(mValue);
            else
                setElementData({...elementData, ...mValue});
        }
    };

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {o:oProps.o, iid:oProps.iid, cid:oProps.cid};

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplServiceRecommendations&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, sAction) => {
        event.preventDefault();

        performAction('perform', {a:sAction}, (oData) => {
            if(!oData.a) {
                if(!oParams?.on_done || oParams.on_done != 'hide') {
                    let sTitle = '';
                    switch(oProps.o) {
                        case 'sys_friends':
                            sTitle = t("Request Sent");
                            break;

                        case 'sys_subscriptions':
                            sTitle = t("Following");
                            break;
                    }
                    oData = {...oData, a: 'sent', title:sTitle, disabled: true};
                }
                else
                    setElementVars({hidden:true}, true, true);    
            }

            setElementVars(oData);
        });
    };

    let sAction = oProps?.a || '';
    if(isElementVar('a'))
        sAction = getElementVar('a');

    if(!sAction)
        return;

    let sTitle = oProps?.title || '';
    if(isElementVar('title'))
        sTitle = getElementVar('title');

    let bDisabled = false;
    if(isElementVar('disabled'))
        bDisabled = getElementVar('disabled');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    let sIcon = undefined;
    switch(sAction) {
        case 'ignore':
            if (oButtonProps.onlyIcon){
                sTitle = '';
                sIcon = 'X';
            }
           
            break;
    }

    return (
        <ButtonAction title={sTitle} startDecorator={sIcon} onPress={(event) => handleDo(event, sAction)} disabled={bDisabled} {...oButtonProps} />
    );
}