import { useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { ActionsData } from 'app/context/actions';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import { useTranslation } from 'react-i18next';

export default function ElementScore(oProps) {
    const { t } = useTranslation();
    
    const bWeb = Platform.OS === 'web';

    const oIconAliases = {
        'up': 'ArrowFatUp',
        'down': 'ArrowFatDown'
    };

    const oParams = {...appSetting('social_actions', 'score'), ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true;

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

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const { actionsData, setActionsData } = useContext(ActionsData);
    const [ actionsDataState, setActionsDataState ] = useState({});
    const [ counterClass, setCounterClass ] = useState('');

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
                setActionsDataState(oValue);
            else
                setActionsDataState({...actionsDataState, ...oValue});
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
        const sRequest = '/api.php?r=system/' + sAction + '/TemplScoreServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, sAction) => {
        event.preventDefault();

        FeedbackHaptics(oParams.haptics_type);

        performAction('do', {a: sAction}, (oData) => onHandleDo(oData));
    };

    const onHandleDo = (oData) => {
        let iScoreOld = oCounter.score;
        if(isContextVar('counter'))
            iScoreOld = getContextVar('counter').score;

        if(oData?.counter != undefined) {
            oData.counter.score_old = iScoreOld;
            if(oData.counter.score != iScoreOld) {
                let iScore = parseInt(oData.counter.score);
                iScoreOld = parseInt(iScoreOld);

                if(iScore > iScoreOld)
                    setCounterClass('translate-y-1/2');
                else 
                    setCounterClass('-translate-y-1/2');
            }
        }

        setContextVars(oData);
    };

    const handleGetPerformedBy = (event) => {
        event.preventDefault();

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
        subscribe( oProps.system + '_scores_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            onHandleDo(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    const aActionButtons = Object.keys(oAction).map(function(sAction) {
        const oItem = oAction[sAction];

        const bShowActionVoted = oItem?.is_voted === true || (isContextVar('is_voted') && getContextVar('is_voted') === true);
        const bShowActionDisabled = oItem?.is_disabled === true || (isContextVar('is_disabled') && getContextVar('is_disabled') === true);

        let sTitle = oItem?.title || '';
        if(isContextVar(sAction)) {
            const oItemGlobal = getContextVar(sAction);
            if(oItemGlobal?.title)
                sTitle = oItemGlobal.title;
        }

        return (
            <ButtonAction key={'action-' + sAction} size={sDisplaySize} startDecorator={oIconAliases[sAction]} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? (event) => {handleDo(event, sAction)} : () => {}} disabled={bShowActionDisabled} {...oButtonProps} />
        );
    });


    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && oCounter?.score != undefined) {
        let iScore = oCounter.score;
        let iScoreOld = oCounter.score;
        let iScoreCountUp = oCounter.count_up;
        let iScoreCountDown = oCounter.count_down;
        if(isContextVar('counter')) {
            const oCounterGlobal = getContextVar('counter');
            if(oCounterGlobal?.score != undefined)
                iScore = oCounterGlobal.score;
            if(oCounterGlobal?.score_old != undefined)
                iScoreOld = oCounterGlobal.score_old;
            if(oCounterGlobal?.count_up != undefined)
                iScoreCountUp = oCounterGlobal.count_up;
            if(oCounterGlobal?.count_down != undefined)
                iScoreCountDown = oCounterGlobal.count_down;
        }

        const bScore = iScoreCountUp != 0 || iScoreCountDown != 0;

        iScore = parseInt(iScore);
        iScoreOld = parseInt(iScoreOld);
        const sScore = bWeb ? (
            <Text className={'flex' + (iScore > iScoreOld ? ' items-end' : ' items-start') + ' h-5 overflow'}>
                <Text className={'flex' + (iScore > iScoreOld ? ' flex-col-reverse' : ' flex-col') + ' transition-all duration-500 ' + counterClass}>
                    <Text className={'sv-old block h-5'}>{iScoreOld.toString()}</Text>
                    <Text className={'sv-new block h-5'}>{iScore.toString()}</Text>
                </Text>
            </Text>
        ) : iScore.toString();

        sCounterButton = (
            <ButtonCounter key="counter" size={sDisplaySize} startDecorator={!bShowCombined ? 'ArrowFatUp' : false} title={sScore} onPress={(event) => {handleGetPerformedBy(event)}} disabled={!bScore} {...oButtonProps} />
        );

        if(bScore) {
            let sUsers = undefined;
            if(performedBy) {
                sUsers = performedBy.map(aVote => {
                    return (
                        <View key={aVote.author_data.id + '-' + aVote.vote_date} className="flex flex-row justify-between items-center">
                            <View className="flex-auto">
                                <Profile {...aVote.author_data} />
                            </View>
                            <View className="flex-none">
                                <Icon icon={oIconAliases[aVote.vote_type]} />
                            </View>
                        </View>
                    );
                });
            }

            if(!sUsers || sUsers.length == 0)
                sUsers = getSkeleton();

            sCounterPopup = (
                <Modal title={t('Upvotes')} onVisible={popupVisible} onClose={() => {setPopupVisible(false)}}>
                    <View className="p-2 gap-y-4 overflow-y-auto text-neutral-700 dark:text-neutral-200">{sUsers}</View>
                </Modal>
            );
        }
    }

    const sObject = getName();
    if(bShowCombined) {
        const aButtonsGroup = [aActionButtons[0], sCounterButton, aActionButtons[1]];

        return (
            <View>
                <ButtonsGroupMenu size={sDisplaySize} {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                {sCounterPopup}
            </View>
        );
    }
    else
        return (
            <View className="flex-auto flex-row items-center">
                {bShowAction && !!aActionButtons[0] && <View key={sObject + '-action-up'} className="flex-auto mr-0.5">{aActionButtons[0]}</View>}
                {bShowCounter && !!sCounterButton && <View key={sObject + '-counter-button'} className={'flex-auto flex-row  ' + (bShowFull ? ' mx-0.5' : '')}>{sCounterButton}</View>}
                {bShowAction && !!aActionButtons[1] && <View key={sObject + '-action-down'} className="flex-auto ml-0.5">{aActionButtons[1]}</View>}
                {bShowCounter && !!sCounterPopup && <View key={sObject + '-counter-popup'}>{sCounterPopup}</View>}
            </View>
        );
}
