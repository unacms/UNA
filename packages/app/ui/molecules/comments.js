import { useState, useMemo , useCallback, useRef } from 'react';
import { appSetting, getAlert } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import  { useLayoutData } from 'app/context/layout'

const getName = (type, system, object_id, sName) => {
    let aName = [type, system.replace(/_/g, '-'), object_id];
    if (sName) aName.push(sName);  // Упростили проверку на sName
    return aName.join('-');
};

const handleDo = (redirectdRef, link, callback, event, setLayoutData) => {
    event.preventDefault();

    if (callback) {
        callback();
        return;
    }

    if (!link) return;
    setLayoutData(getAlert('comment:activate'))
    redirectdRef.current.redirect(link);
};

export default function ElementComments(oProps) {
    const { setLayoutData } = useLayoutData();
    const redirectdRef = useRef();

    const oParams = useMemo(() => ({ ...appSetting('social_actions', 'comment'), ...oProps.params }), [oProps.params]);
 
    const oAction = oProps.action;
    const oCounter = oProps.counter;
    const isTextMode = oProps.mode === 'text';
    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType || 'both';

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' :  (isTextMode ? 'custom' :oProps.params?.button_variant),
        size: isTextMode? 'base' : oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const bShowAction = useMemo(() => (oParams.show_action !== false) && (sDisplayType === 'action' || sDisplayType === 'both'), [oParams.show_action, sDisplayType]);
    const bShowCounter = useMemo(() => oParams.show_counter === true && (sDisplayType === 'counter' || sDisplayType === 'both'), [oParams.show_counter, sDisplayType]);
    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true   

    const { actionsData } = useActionsData();
    const [ actionsDataState, asetActionsDataState ] = useState({});

    const isContextVar = useCallback((sName) => {
        const sContextKey = sObject;
        if (bShowFull) return actionsDataState[sContextKey]?.[sName] !== undefined;
      //  return actionsData[sContextKey]?.[sName] !== undefined;
    }, [actionsData, actionsDataState, bShowFull, sObject]);

    const getContextVar = useCallback((sName) => {
        const sContextKey = sObject;
        return bShowFull ? actionsDataState[sContextKey]?.[sName] : 'hz';
    }, [actionsData, actionsDataState, bShowFull, sObject]);

    const handlePress = useCallback(
        (event) => handleDo(redirectdRef, oAction?.link, oProps.callback, event, setLayoutData),
        [oAction?.link, oProps.callback]
    );

    let sTitle = oAction?.title || '';
    if(isContextVar('title'))
        sTitle = getContextVar('title');

    let iCount = 0;
    if(oCounter?.count != undefined) {
        iCount = oCounter.count;
        if(isContextVar('counter')) {
            const oCounterGlobal = getContextVar('counter');
            if(oCounterGlobal?.count)
                iCount = oCounterGlobal.count;
        }
    }

    //--- Action
    const bShowActionAsButton = oParams.show_action_as_button !== false;
    const bShowActionLabel = oParams.show_action_label !== false;
    const bShowActionDisabled = oAction?.is_disabled === true;

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    const sIcon = isTextMode ? "" : "ChatCircleText";
    const sActionButton = useMemo(() => {
//counter
        if (bShowCounter && !bShowAction ){
             if (iCount > 0){
                return <ButtonAction
                key="action"
                startDecorator={sIcon}
                title={iCount}
                onPress={!bShowActionDisabled ? handlePress : undefined}
                disabled={bShowActionDisabled}
                {...oButtonProps}
            />
            
            }
            else{
                return null
            }
        }

        if (!bShowCounter && bShowAction ){
            return <ButtonAction
            key="action"
            startDecorator={sIcon}
            title={bShowActionLabel ? (sTitle) : false}
            onPress={!bShowActionDisabled ? handlePress : undefined}
            disabled={bShowActionDisabled}
            {...oButtonProps}
        />
       }

        return <ButtonAction
            key="action"
            startDecorator={sIcon}
            title={bShowActionLabel ? (iCount > 0 ? iCount : sTitle) : false}
            onPress={!bShowActionDisabled ? handlePress : undefined}
            disabled={bShowActionDisabled}
            {...oButtonProps}
        />
    }, [bShowActionLabel, sTitle, bShowActionDisabled, handlePress, oButtonProps, bShowCounter, iCount]);

    if (sActionButton == null )
        return null

    if(bShowCombined) {
        let aButtonsGroup = [sActionButton];
        return (
            <View>
                <Redirect ref={redirectdRef} />
                <ButtonsGroupMenu  {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
            </View>
        );
    }

    return (
        <View className="flex-auto flex-row items-center ">
            <Redirect ref={redirectdRef} />
            <View key={sObject + '-action'} className={'flex-auto' +(oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? ' 0 ': '  pr-1 pb-2 ') : '')+ (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>
        </View>
    );
 }
