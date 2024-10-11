import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, getAlert} from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCardData } from 'app/context/card';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { useLayoutData } from 'app/context/layout'
import { storageClear } from 'app/lib/util'

const getKey = (sO, iIid, iCid) => {
    return sO + '_' + iIid + '_' + iCid;
}

const getName = (sType, sO, iIid, iCid, sName) => {
    let aName = [sType, sO.replace(/_/g, '-'), iIid, iCid];
    if(sName != undefined && sName.length > 0)
        aName.push(sName);

    return [].concat(aName).join('-');
};

const isElementVar = (cardData, elementData, sContextKey, sName, bUseContext = false, bUseContextWide = false) => {
    if(bUseContext) {
        if(!bUseContextWide)
            return cardData && cardData[sContextKey] != undefined && cardData[sContextKey][sName] != undefined;
        else
            return cardData && cardData[sName] != undefined;
    }
    else
        return elementData && elementData[sName] != undefined;
};

const getElementVar = (cardData, elementData, sContextKey, sName, bUseContext = false, bUseContextWide = false) => {
    if(bUseContext) {
        if(!bUseContextWide)
            return cardData[sContextKey][sName];
        else
            return cardData[sName];
    }
    else
        return elementData[sName];
};

const setElementVars = (cardData, setCardData, elementData, setElementData, sContextKey, mValue, bUseContext = false, bUseContextWide = false) => {
    if(bUseContext) {
        let oValue = undefined;
        if(!bUseContextWide)
            oValue = {[sContextKey]: mValue};
        else
            oValue = mValue;

        /*  
        if(!cardData)
            setCardData(oValue);
        else
            setCardData({...cardData, ...oValue});
        */
    }
    else {
        if(!elementData)
            setElementData(mValue);
        else
            setElementData({...elementData, ...mValue});
    }
};

const performAction = async (setLayoutData, sO, iIid, iCid, sKey, sAction, aParams, onLoad) => {
    const aParamsDefault = {o: sO, iid: iIid, cid: iCid};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplServiceRecommendations&params[]=' + JSON.stringify(aParams);

    const oResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(oResponse?.data);

    storageClear();
    setLayoutData(getAlert('сonnections:action', {object: sO, time:Date.now(), action: aParams, data: oResponse?.data, key: sKey} ));
};

const handleDo = (performAction, setElementVars, t, sO, fOnDone, sAction, oEvent) => {
    oEvent.preventDefault();

    performAction('perform', {a:sAction}, (oData) => {
        if(!oData.a) {
            if(!fOnDone || fOnDone != 'hide') {
                let sTitle = '';
                switch(sO) {
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

export default function ElementRecommendations(oProps) {
    const { t } = useTranslation();
    const { layoutData, setLayoutData } = useLayoutData()
    const { cardData, setCardData } = useCardData();
    const [ elementData, setElementData ] = useState(false);

    const oParams = {...appSetting('social_actions', 'recommendation'), ...oProps.params};

    const sKey = useMemo(() => getKey(oProps.o, oProps.iid, oProps.cid), [oProps.o, oProps.iid, oProps.cid]);
    const sContextKey = useMemo(() => getName(oProps.type, oProps.o, oProps.iid, oProps.cid), [oProps.type, oProps.o, oProps.iid, oProps.cid]);

    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size,
        onlyIcon: oProps.params?.only_icon
    }; 

    const _isElementVar = useCallback((sName, bUseContext, bUseContextWide) => isElementVar(cardData, elementData, sContextKey, sName, bUseContext, bUseContextWide), [cardData, elementData, sContextKey]);
    const _getElementVar = useCallback((sName, bUseContext, bUseContextWide) => getElementVar(cardData, elementData, sContextKey, sName, bUseContext, bUseContextWide), [cardData, elementData, sContextKey]);
    const _setElementVars = useCallback((mValue, bUseContext, bUseContextWide) => setElementVars(cardData, setCardData, elementData, setElementData, sContextKey, mValue, bUseContext, bUseContextWide), [cardData, setCardData, elementData, setElementData, sContextKey]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(setLayoutData, oProps.o, oProps.iid, oProps.cid, sKey, sAction, aParams, onLoad), [setLayoutData, oProps.o, oProps.iid, oProps.cid, sKey]);
    const _handleDo = useCallback((sAction, event) => handleDo(_performAction, _setElementVars, t, oProps.o, (oParams?.on_done ? oParams.on_done : false), sAction, event), [_performAction, _setElementVars, t, oProps.o, oParams.on_done]);

    let sAction = oProps?.a || '';
    if(_isElementVar('a'))
        sAction = _getElementVar('a');

    if(!sAction)
        return;

    let sTitle = oProps?.title || '';
    if(_isElementVar('title'))
        sTitle = _getElementVar('title');

    let bDisabled = false;
    if(_isElementVar('disabled'))
        bDisabled = _getElementVar('disabled');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    let sIcon = undefined;
    console.log("sAction", oProps.o)
    switch(sAction) {
        case 'ignore':
            if (oButtonProps.onlyIcon){
                sTitle = '';
                sIcon = 'X';
            }
           
            break;
        case 'add':
            if (oButtonProps.onlyIcon){
                sTitle = '';
                if (oProps.o == 'sys_friends')
                    sIcon = 'UserCirclePlus';
                if (oProps.o == 'sys_subscriptions')
                    sIcon = 'UserCircleCheck';
            }
            
            break;
    }

    return (
        <ButtonAction title={sTitle} startDecorator={sIcon} onPress={(event) => _handleDo(sAction, event)} disabled={bDisabled} {...oButtonProps} />
    );
}