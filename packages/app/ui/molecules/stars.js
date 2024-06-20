import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { ActionsData } from 'app/context/actions';
import { View } from 'app/design/view'
import { ButtonMenuCounterDefault, ButtonMenuCounterText, Modal } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, withSequence } from "react-native-reanimated";
import StarRating from 'react-native-star-rating-widget';
import StarRatingDisplay from 'react-native-star-rating-widget';
import { StarsView, StarsAction } from 'app/ui/atoms/stars';

export default function ElementStars(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'star');

    const oParams = {...oSettings, ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps?.displayType ? oProps.displayType : 'both';
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;

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

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const { actionsData, setActionsData } = useContext(ActionsData);
    const [ actionsDataState, asetActionsDataState ] = useState({});

    const [ popupVisible, setPopupVisible ] = useState(false);
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
        const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (iNumber) => {
        FeedbackHaptics(oParams.haptics_type);

        performAction('do', {value: iNumber}, (oData) => {
            setContextVars(oData);
        });
    };

    const handleGetPerformedBy = (event) => {
        event.preventDefault();

        if(!bAllowViewVoted)
            return;

        FeedbackHaptics(oParams.haptics_type);

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
        subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            setContextVars(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    //--- show action
    const bShowActionUndo = oAction?.is_undo === true;

    let bShowActionVoted = oAction?.is_voted === true;
    if(isContextVar('is_voted'))
        bShowActionVoted = getContextVar('is_voted') === true;

    let bShowActionDisabled = oAction?.is_disabled === true;
    if(isContextVar('is_disabled'))
        bShowActionDisabled = getContextVar('is_disabled') === true;

    let sTitle = oAction?.title || '';
    if(isContextVar('title'))
        sTitle = getContextVar('title');

    let fRate = '';
    if (oCounter?.rate)
        fRate = oCounter.rate;
    if(isContextVar('counter')) {
        const oCounterGlobal = getContextVar('counter');
        if(oCounterGlobal?.rate)
            fRate = oCounterGlobal.rate;
    }

    let sActionButton = undefined;
    if((bShowActionVoted && !bShowActionUndo) || bShowActionDisabled) {
        sActionButton = (
            <StarsView rating={fRate}  />
        );
    }
    else {
        sActionButton = (
            <StarsAction rating={fRate} onChange={!bShowActionDisabled ? (number) => {handleDo(number)} : () => {}} />
        );
    }

    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;
    const bAllowViewVoted = oSettings[oProps['system']]?.allow_view_voted != undefined ? oSettings[oProps['system']].allow_view_voted : true;

    const ButtonCounter = bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText;

    const sharedValue = useSharedValue(1);
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            opacity: sharedValue.value,
        };
    },[sharedValue]);

    useEffect(() => {
        sharedValue.value = withSequence(
            withTiming(0, { duration: 500 }), // fade out
            withTiming(1, { duration: 500 }) // fade in
        );
    }, [fRate]);    

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && oCounter?.rate != undefined && fRate > 0) {
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
                <ButtonCounter size={sDisplaySize} startDecorator={'Star'} title={fRate + ''} onPress={(event) => {handleGetPerformedBy(event)}} {...oButtonProps} />
            </Animated.View>
        );

        sCounterPopup = (
            <Modal title={t('Likes')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
            </Modal>
        );
    }

    const sObject = getName();
    return (
        <View className="flex-auto flex-row items-center h-full">
            {bShowAction && <View key={sObject + '-action'} className={'flex-auto' + (bShowFull ? ' mr-1' : '')}>{sActionButton}</View>}
            {bShowCounter &&  !!sCounterButton && <View key={sObject + '-counter-button'}>{sCounterButton}</View>}
            {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
        </View>
    );
 }
