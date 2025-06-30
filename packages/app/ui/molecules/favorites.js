import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, withSequence } from "react-native-reanimated";

const getName = (sType, sSystem, sObjectId, sName) => {
    let aName = [sType, sSystem.replace(/_/g, '-'), sObjectId];
    if(sName)
        aName.push(sName);

    return [].concat(aName).join('-');
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplFavoriteServices&params[]=' + JSON.stringify(aParams);

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

const handleGetPerformedBy = (performAction, setPerformedBy, setPopupVisible, bAllowViewFavorited, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    if(!bAllowViewFavorited)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', {}, (oData) => {
        if(!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);
        setPopupVisible(true);
    });
};

const getSkeleton = () => {
    return (
        <View className="gap-y-2">
        {[...Array(1, 2, 3)].map( i => 
            <View key={i} className="flex-col p-2 bg-bgritem dark:bg-bgritem-d sm:rounded-lg">
                <View className="animate-pulse flex-row items-center gap-3">
                    <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
                    <View className="flex-1 gap-y-1">
                        <View className="h-4 w-1/2 bg-neutral-600/20 rounded-full"></View>    
                        <View className="h-3 w-1/3 bg-neutral-600/20 rounded-full"></View>
                    </View>
                </View>
            </View>
        )}
        </View>
    );
};

export default function ElementFavorites(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'favorite');

    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const oIcons = oProps?.o && oSettings[oProps.o]?.icons != undefined ? oSettings[oProps.o].icons : {
        do: 'Bookmark', 
        undo: 'Bookmark'
    };

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true   

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const [ objectData, setObjectData ] = useState({...oAction, ...{counter: oCounter}});
    const [ popupVisible, setPopupVisible ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const bAllowViewFavorited = oSettings[oProps['system']]?.allow_view_favorited != undefined ? oSettings[oProps['system']].allow_view_favorited : true;

    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((event) => handleDo(_performAction, objectData, setObjectData, oParams.haptics_type, (oProps.params?.on_do ? oProps.params.on_do : false), (oProps.params?.on_done ? oProps.params.on_done : false), event), [_performAction, objectData, setObjectData, oParams.haptics_type, oProps.params.on_do, oProps.params.on_done]);
    const _handleGetPerformedBy = useCallback((event) => handleGetPerformedBy(_performAction, setPerformedBy, setPopupVisible, bAllowViewFavorited, oParams.haptics_type, event), [_performAction, setPerformedBy, setPopupVisible, bAllowViewFavorited, oParams.haptics_type]);

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionFavorited = objectData?.['is_favorited'] != undefined ? objectData['is_favorited'] === true : false;
    const bShowActionDisabled = objectData?.['is_disabled'] != undefined ? objectData['is_disabled'] === true : false;
    const sTitle = objectData?.['title'] != undefined ? objectData['title'] : '';

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    if(oIcons)
        oButtonProps.startDecorator = oIcons[(bShowActionFavorited ? 'un' : '') + 'do'];

    let sActionButton = (
        <ButtonAction key="action" title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? _handleDo : () => {}} pressed={bShowActionUndo && bShowActionFavorited} disabled={bShowActionDisabled} {...oButtonProps} />
    );


    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;
    const iCount = objectData?.['counter'] != undefined && objectData['counter']?.count != undefined ? objectData['counter'].count : '';

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;
    
    const sharedValue = useSharedValue(1);
    const indicatorStyle = useAnimatedStyle(() => {
        return {
        opacity: sharedValue.value,
        };
    }, [sharedValue]);

    useEffect(() => {
        sharedValue.value = withSequence(
        withTiming(0, { duration: 500 }), // fade out
        withTiming(1, { duration: 500 }) // fade in
        );
    }, [iCount]);
    
    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && iCount > 0) {
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
            <Animated.View key="counter" style={indicatorStyle}>
                <ButtonCounter startDecorator={!bShowCombined ? 'Bookmark' : false} title={iCount + ''} onPress={_handleGetPerformedBy} {...oButtonProps} />
            </Animated.View>
        );

        sCounterPopup = (
            <Modal title={t('Favorites')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
            </Modal>
        );
    }

    if(bShowCombined) {
        let aButtonsGroup = [sActionButton];
        if(!!sCounterButton)
            aButtonsGroup.push(sCounterButton);

        return (
            <View>
                <ButtonsGroupMenu {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                {sCounterPopup}
            </View>
        );
    }
    else {
        if(bShowCounter && !bShowAction && !iCount)
            return null;

        return (
            <View className={"flex-auto flex-row items-center text-center" + (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? '  px-0 ': '  pr-1 pb-2 ') : '')}>
                {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
                {bShowCounter &&  !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
            </View>
        );
    }
}