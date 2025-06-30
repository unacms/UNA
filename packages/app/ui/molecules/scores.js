import { useState, useMemo, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import { useTranslation } from 'react-i18next';

const getName = (sType, sSystem, sObjectId, sName) => {
    let aName = [sType, sSystem.replace(/_/g, '-'), sObjectId];
    if(sName)
        aName.push(sName);

    return [].concat(aName).join('-');
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplScoreServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);
    if(typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleDo = (performAction, onHandleDo, sHapticsType, sAction, oEvent) => {
    oEvent.preventDefault();

    FeedbackHaptics(sHapticsType);

    performAction('do', {a: sAction}, (oData) => onHandleDo(oData));
};

const onHandleDo = (objectData, setObjectData, setCounterClass, oCounter, oData) => {
    if(oData?.counter != undefined) {
        oData.counter.score_old = objectData?.['counter'] != undefined ? objectData['counter'].score : oCounter.score;
        if(oData.counter.score != oData.counter.score_old) {
            if(parseInt(oData.counter.score) > parseInt(oData.counter.score_old))
                setCounterClass('translate-y-1/2');
            else 
                setCounterClass('-translate-y-1/2');
        }
    }

    setObjectData(!objectData ? oData : {...objectData, ...oData});
};

const handleGetPerformedBy = (performAction, setPerformedBy, setPopupVisible, sHapticsType, oEvent) => {
    oEvent.preventDefault();

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

export default function ElementScore(oProps) {
    const { t } = useTranslation();
    
    const bWeb = Platform.OS === 'web';

    const oIconAliases = {
        'up': 'ArrowBigUp',
        'down': 'ArrowBigDown'
    };

    const oParams = {...appSetting('social_actions', 'score'), ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true;

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const [ objectData, setObjectData ] = useState({...oAction, ...{counter: oCounter}});
    const [ counterClass, setCounterClass ] = useState('');

    const [ popupVisible, setPopupVisible ] = useState(false);
    const [ performedBy, setPerformedBy ] = useState();

    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _onHandleDo = useCallback((oData) => onHandleDo(objectData, setObjectData, setCounterClass, oCounter, oData), [objectData, setObjectData, setCounterClass, oCounter]);
    const _handleDo = useCallback((sAction, event) => handleDo(_performAction, _onHandleDo, oParams.haptics_type, sAction, event), [_performAction, _onHandleDo, oParams.haptics_type]);
    const _handleGetPerformedBy = useCallback((event) => handleGetPerformedBy(_performAction, setPerformedBy, setPopupVisible, oParams.haptics_type, event), [_performAction, setPerformedBy, setPopupVisible, oParams.haptics_type]);

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        subscribe( oProps.system + '_scores_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if(!!aData?.api)
            _onHandleDo(aData.api.performer_id == currentUser.id ? aData.api : {counter: aData.api.counter});
    }

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    const aActionButtons = Object.keys(oAction).map(function(sAction) {
        const bShowActionVoted = objectData?.[sAction]?.['is_voted'] != undefined ?  objectData[sAction]['is_voted'] === true : false;
        const bShowActionDisabled = objectData?.[sAction]?.['is_disabled'] != undefined ?  objectData[sAction]['is_disabled'] === true : false;
        const sTitle = objectData?.[sAction]?.['title'] != undefined ? objectData[sAction]['title'] : '';

        return (
            <ButtonAction key={'action-' + sAction} startDecorator={oIconAliases[sAction]} title={bShowActionLabel ? sTitle : false} onPress={!bShowActionDisabled ? (event) => {_handleDo(sAction, event)} : () => {}} disabled={bShowActionDisabled} {...oButtonProps} />
        );
    });


    //--- Counter
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    let sCounterButton = undefined;
    let sCounterPopup = undefined;
    if(bShowCounter && objectData?.['counter'] != undefined && objectData['counter']?.score != undefined) {
        const iScore = parseInt(objectData['counter'].score);
        const iScoreOld = objectData['counter']?.score_old != undefined ? parseInt(objectData['counter'].score_old) : iScore;
        const iScoreCountUp = objectData['counter'].count_up;
        const iScoreCountDown = objectData['counter'].count_down;
        const bScore = iScoreCountUp != 0 || iScoreCountDown != 0;

        const sScore = bWeb ? (
            <Text className={'flex' + (iScore > iScoreOld ? ' items-end' : ' items-start') + ' h-5 overflow'}>
                <Text className={'flex' + (iScore > iScoreOld ? ' flex-col-reverse' : ' flex-col') + ' transition-allweb:duration-500 ' + counterClass}>
                    <Text className={'sv-old block h-5'}>{iScoreOld.toString()}</Text>
                    <Text className={'sv-new block h-5'}>{iScore.toString()}</Text>
                </Text>
            </Text>
        ) : iScore.toString();

        sCounterButton = (
            <ButtonCounter key="counter" startDecorator={!bShowCombined ? 'ArrowBigUp' : false} title={sScore} onPress={_handleGetPerformedBy} disabled={!bScore} {...oButtonProps} />
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

    if(bShowCombined) {
        const aButtonsGroup = [aActionButtons[0], sCounterButton, aActionButtons[1]];

        return (
            <View>
                <ButtonsGroupMenu {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
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
