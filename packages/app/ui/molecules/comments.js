import { useState, useMemo , useCallback, useRef } from 'react';
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';

const getName = (type, system, object_id, sName) => {
    let aName = [type, system.replace(/_/g, '-'), object_id];
    if (sName) aName.push(sName);  // Упростили проверку на sName
    return aName.join('-');
};

const handleDo = (redirectdRef, link, callback, event) => {
    event.preventDefault();

    if (callback) {
        callback();
        return;
    }

    if (!link) return;

    redirectdRef.current.redirect(link);
};

export default function ElementComments(oProps) {
    const redirectdRef = useRef();

    const oParams = useMemo(() => ({ ...appSetting('social_actions', 'comment'), ...oProps.params }), [oProps.params]);
 
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType || 'both';
    const sDisplaySize = oProps.displaySize || oParams.display_size || false;

    const oButtonProps = {
        variant: oProps.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        hideTitleOnSmall: oProps.params?.button_hide_title_on_small
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
        return actionsData[sContextKey]?.[sName] !== undefined;
    }, [actionsData, actionsDataState, bShowFull, sObject]);

    const getContextVar = useCallback((sName) => {
        const sContextKey = sObject;
        return bShowFull ? actionsDataState[sContextKey]?.[sName] : actionsData[sContextKey]?.[sName];
    }, [actionsData, actionsDataState, bShowFull, sObject]);

    const handlePress = useCallback(
        (event) => handleDo(redirectdRef, oAction?.link, oProps.callback, event),
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

    const sActionButton = useMemo(() => (
        <ButtonAction
            key="action"
            size={sDisplaySize}
            startDecorator="ChatCircleText"
            title={bShowActionLabel ? (iCount > 0 ? iCount : sTitle) : false}
            onPress={!bShowActionDisabled ? handlePress : undefined}
            disabled={bShowActionDisabled}
            {...oButtonProps}
        />
    ), [sDisplaySize, bShowActionLabel, sTitle, bShowActionDisabled, handlePress, oButtonProps]);

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
        <View className="flex-auto flex-row items-center">
            <Redirect ref={redirectdRef} />
            {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
           
        </View>
    );
 }
