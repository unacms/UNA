import { useState, useContext, useEffect, forwardRef, useRef, useImperativeHandle } from 'react';
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
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSequence } from "react-native-reanimated";
import Dropdown from 'app/ui/atoms/dropdown'
import { InputMulti } from 'app/design/controls'
import { Platform } from 'react-native';

const ElementReports = forwardRef((oProps, ref) => {
    const { t } = useTranslation();
    const elementRef = useRef(null);

    useImperativeHandle(ref, () => {
        return {
            report(e) {
                if(!elementRef.current.is_reported)
                    handleGetDo(e);
                else
                    handleUndo(e);
            }
        };
    }, []);

    const oSettings = appSetting('social_actions', 'report');

    const oParams = {...oSettings, ...oProps.params};
    const sIcon = oSettings[oProps['system']]?.icon != undefined ? oSettings[oProps['system']].icon : "WarningCircle"
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true   

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const { actionsData, setActionsData } = useActionsData();
    const [ actionsDataState, asetActionsDataState ] = useState({});

    const [ popupVisibleDo, setPopupVisibleDo ] = useState(false);
    const [ popupVisiblePerformed, setPopupVisiblePerformed ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const isContextVar = (sName) => {
        const sContextKey = getName();

        if(bShowFull)
            return actionsDataState && actionsDataState[sContextKey] != undefined && actionsDataState[sContextKey][sName] != undefined;
        else
            return actionsData && actionsData[sContextKey] != undefined && actionsData[sContextKey][sName] != undefined;
    };

    const getContextVar = (sName) => {
        const sContextKey = getName();

        if(bShowFull)
            return actionsDataState[sContextKey][sName];
        else
            return actionsData[sContextKey][sName];
    };

    const setContextVars = (mValue) => {
        const sContextKey = getName();

        let oValue = {};
        oValue[sContextKey] = mValue;

        if(bShowFull) {
            if(!actionsDataState)
                asetActionsDataState(oValue);
            else
                asetActionsDataState({...actionsDataState, ...oValue});
        }
        else {
            if(!actionsData)
                setActionsData(oValue);
            else
                setActionsData({...actionsData, ...oValue});
        }
    };

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {s: oProps.system, o:oProps.object_id};

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplReportServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleGetDo = (event) => {
        if(!!event)
            event.preventDefault();

        if (Platform.OS == 'web') {
            const popperDiv = document.querySelector('div[data-radix-popper-content-wrapper]');
            if (popperDiv) {
                popperDiv.classList.add('radix-hide');
            }
        }
        setPopupVisibleDo(true);
    };

    let valuesType = oParams.types.map(function (item) {
        return item.name ? {label: item.title, value: item.name} : null
    }); 
    valuesType = valuesType.filter(Boolean);

    const [ valueType, setValueType ] = useState(valuesType[0].value);
    const [ valueText, setValueText ] = useState('');

    const handleDo = (event, oDataSubmit) => {
        if(!!event)
            event.preventDefault();

        FeedbackHaptics(oParams.haptics_type);

        performAction('do', oDataSubmit, (oData) => {
            setContextVars(oData);
            setPopupVisibleDo(false);

            if(oProps?.onChangeTitle)
                oProps?.onChangeTitle(oData['title']);
        });

        setValueType(valuesType[0].value);
        setValueText('');
    };

    const handleUndo = (event) => {
        if(!!event)
            event.preventDefault();

        performAction('do', {}, (oData) => {
            setContextVars(oData);

            if(oProps?.onChangeTitle)
                oProps?.onChangeTitle(oData['title']);
        });
    };

    const handleGetPerformedBy = (event) => {
        event.preventDefault();

        if(!bAllowViewReported)
            return;

        FeedbackHaptics(oParams.haptics_type);

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);
            setPopupVisiblePerformed(true);
        });
    };

    const getSkeleton = () => {
        return (
            <View className="gap-y-2">
            {[...Array(1, 2, 3)].map( i => 
                <View key={i} className="flex-col p-2 bg-neutral-500/5 sm:rounded-lg">
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

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'reported', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            setContextVars(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;

    if(isContextVar('is_reported'))
        oAction.is_reported = getContextVar('is_reported') === true;
    let bShowActionReported = oAction?.is_reported === true;

    if(isContextVar('is_disabled'))
        oAction.is_disabled = getContextVar('is_disabled') === true;
    let bShowActionDisabled = oAction?.is_disabled === true;

    if(isContextVar('title'))
        oAction.title = getContextVar('title');
    let sTitle = oAction?.title || '';

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
    if(oProps.params?.button_hide_title_on_small != undefined)
        oButtonProps.hideTitleOnSmall = oProps.params.button_hide_title_on_small;

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    let sActionButton = undefined;
    let sActionPopup = undefined;
    if(bShowActionUndo && bShowActionReported) {
        sActionButton = (
            <ButtonAction key="action" size={sDisplaySize} startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={handleUndo} {...oButtonProps} />
        );
    }
    else {
        sActionButton = (
            <ButtonAction key="action" size={sDisplaySize} startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? (event) => {handleGetDo(event)} : () => {}} disabled={bShowActionDisabled} {...oButtonProps} />
        );

        

        sActionPopup = (
            <Modal title={t('Report')} onVisible={popupVisibleDo} onClose={() => {setPopupVisibleDo(false)}}>
                <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">
                    <View>
                        <Text>Report Type:</Text>
                    </View>
                    <Dropdown 
                        labelField="label"
                        valueField="value"
                        onChange={setValueType}
                        value={valueType}
                        data={valuesType}
                    />
                    <View>
                        <Text>Report Text:</Text>
                    </View>
                    <InputMulti
                        multiline
                        numberOfLines={4}
                        onChangeText={setValueText}
                        value={valueText}
                    />
                    <Button size={sDisplaySize} title={t('Send report')} onPress={(event) => {handleDo(event, {type: valueType, text: valueText})}} />
                </View>
            </Modal>
        );
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;
    const bAllowViewReported = oSettings[oProps['system']]?.allow_view_reported != undefined ? oSettings[oProps['system']].allow_view_reported : true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let iCount = '';
    if (oCounter?.count != undefined)
        iCount = oCounter.count;
    if(isContextVar('counter')) {
        const oCounterGlobal = getContextVar('counter');
        if(oCounterGlobal?.count != undefined)
            iCount = oCounterGlobal.count;
    }    

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
                <ButtonCounter size={sDisplaySize} startDecorator={!bShowCombined ? sIcon : false} title={iCount+''} onPress={(event) => {handleGetPerformedBy(event)}} {...oButtonProps} />
            </Animated.View>
        );

        sCounterPopup = (
            <Modal title={t('Reports')} onVisible={popupVisiblePerformed} onClose={() => {setPopupVisiblePerformed(false)}}>
                <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
            </Modal>
        );
    }

    /**
     * Save current state in 'ref' to use in Imperative functions.
     */
    elementRef.current = oAction;

    const sObject = getName();
    if(bShowCombined) {
        let aButtonsGroup = [sActionButton];
        if(!!sCounterButton)
            aButtonsGroup.push(sCounterButton);

        return (
            <View className={(bShowActionUndo && bShowActionReported ? ' undo' : ' do')}>
                <ButtonsGroupMenu size={sDisplaySize} {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                    {sActionPopup}
                    {sCounterPopup}
            </View>
        );
    }
    else
        return (
            <View className={'flex-auto flex-row items-center' + (bShowActionUndo && bShowActionReported ? ' undo' : ' do')}>
                {bShowAction && !!sActionButton && <View key={sObject + '-action-button'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
                {bShowAction && !!sActionPopup && <View key={sObject + '-action-popup'}>{sActionPopup}</View>}
                {bShowCounter &&  !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
                {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
            </View>
        );
 });

export default ElementReports;