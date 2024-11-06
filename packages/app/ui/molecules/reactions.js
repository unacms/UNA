import { useState, useMemo, useCallback, useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { Reaction, ReactionProvider } from 'react-native-reactions';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import { View, Pressable } from 'app/design/view';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Profile from 'app/ui/molecules/profile';
import { subscribe } from 'app/ui/atoms/socket';
import { useTranslation } from 'react-i18next';

const getName = (sType, sSystem, sObjectId, sName) => {
    let aName = [sType, sSystem.replace(/_/g, '-'), sObjectId];
    if (sName)
        aName.push(sName);

    return [].concat(aName).join('-');
};

const getIconAlias = (oParams, oAliases, sName) => {
    const sKey = Platform.OS === 'web' ? 'web' : 'native';
    const sType = sName != 'default' ? oParams['icon_type_' + sKey] : 'svg';

    return oAliases[sKey][sName] && oAliases[sKey][sName][sType];
};

const performAction = async (sSystem, iObjectId, sAction, aParams, onLoad) => {
    const aParamsDefault = {s: sSystem, o: iObjectId};

    aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

    const sResponse = await fetcher(sRequest);    
    if (typeof onLoad === 'function')
        onLoad(sResponse?.data);
};

const handleDo = (performAction, actionsDataState, setActionsDataState, sReaction, oParams, oEvent) => {
    if (oEvent)
        oEvent.preventDefault();

    FeedbackHaptics(oParams.haptics_type);

    const oDataPreset = {reaction:sReaction, title:oParams.t[sReaction]}
    setActionsDataState(!actionsDataState ? oDataPreset : {...actionsDataState, ...oDataPreset});

    performAction('do', {value: 1, reaction: sReaction}, (oData) => {
        setActionsDataState(!actionsDataState ? oData : {...actionsDataState, ...oData});
    });
};

const handleUndo = (performAction, actionsDataState, setActionsDataState, sReaction, oEvent) => {
    oEvent.preventDefault();

    performAction('do', {value: 1, reaction: (actionsDataState?.['reaction'] != undefined ? actionsDataState['reaction'] : sReaction)}, (oData) => {
        setActionsDataState(!actionsDataState ? oData : {...actionsDataState, ...oData});
    });
};

const handleGetPerformedByCpd = (performAction, setPerformedBy, setTabVisibleByCpd, setPopupVisibleByCpd, bAllowViewVoted, sHapticsType, oEvent) => {
    oEvent.preventDefault();

    if (!bAllowViewVoted)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', {}, (oData) => {
        if (!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);

        setTabVisibleByCpd('');
        setPopupVisibleByCpd(true);
    });
};

const handleGetPerformedByDvd = (performAction, setPerformedBy, setPopupVisibleByDvd, bAllowViewVoted, sHapticsType, sReaction, oEvent) => {
    oEvent.preventDefault();

    if (!bAllowViewVoted || !sReaction)
        return;

    FeedbackHaptics(sHapticsType);

    performAction('get_performed_by', { reaction: sReaction }, (oData) => {
        if (!oData?.performed_by)
            return;

        setPerformedBy(oData.performed_by);
        setPopupVisibleByDvd(state => ({ ...state, [sReaction]: true }));
    });
};

const getSkeleton = () => {
    return (
        <View className="gap-2">
            {[...Array(1, 2, 3)].map(i =>
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

const getCounterDivided = (getIconAlias, handleGetPerformedByDvd, actionsDataState, performedBy, popupVisibleByDvd, setPopupVisibleByDvd, bShowCombined, oParams, oCounter, oButtonProps) => {
    const { t } = useTranslation();

    let aButtons = [];
    let aPopups = [];

    const bShowCounterAsButton = oParams?.show_counter_as_button === true;
    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    oCounter.items.forEach((aItem, iKey) => {
        if (aItem.name == 'default')
            return;

        let iCount = aItem.count;
        if (actionsDataState?.['counter'] != undefined) {
            const oCounterGlobal = actionsDataState['counter'];
            const sCounterKey = 'count_' + aItem.name;
            if (oCounterGlobal[sCounterKey] != undefined)
                iCount = oCounterGlobal[sCounterKey];
        }

        if (!iCount)
            return;

        let aUsers = undefined;
        if (performedBy && performedBy[aItem.name]) {
            aUsers = performedBy[aItem.name].map(aUser => {
                return (
                    <View key={aUser.id}><Profile {...aUser} /></View>
                );
            });
        }

        if (aUsers && aUsers.length != 0)
            aUsers = (
                <View className="gap-2">{aUsers}</View>
            );
        else
            aUsers = getSkeleton();

        aButtons.push(<ButtonCounter {...oButtonProps} key={'counter-button-' + iKey} startDecorator={getIconAlias(aItem.name)} title={iCount} onPress={(event) => { handleGetPerformedByDvd(aItem?.name || '', event) }} />);
        aPopups.push(<Modal key={'counter-popup-' + iKey} title={t("Reactions")} onVisible={popupVisibleByDvd[aItem.name]} onClose={() => { setPopupVisibleByDvd(state => ({ ...state, [aItem.name]: false })) }}>{aUsers}</Modal>)
    });

    return [aButtons, aPopups];
};

const getCounterCompound = (getIconAlias, handleGetPerformedByCpd, actionsDataState, performedBy, popupVisibleByCpd, setPopupVisibleByCpd, tabVisibleByCpd, setTabVisibleByCpd, bShowCombined, oParams, oCounter, oButtonProps) => {
    const { t } = useTranslation();

    let iTotal = 0;
    let sSelected = tabVisibleByCpd;
    const aCounter = Object.keys(oCounter.items).map(function (iKey) {
        const aItem = oCounter.items[iKey];

        if (aItem.name == 'default')
            return;

        let iCount = aItem.count;
        if (actionsDataState?.['counter'] != undefined) {
            const oCounterGlobal = actionsDataState['counter'];
            const sCounterKey = 'count_' + aItem.name;
            if (oCounterGlobal[sCounterKey] != undefined)
                iCount = oCounterGlobal[sCounterKey];
        }

        if (!sSelected && iCount != 0)
            sSelected = aItem.name;

        iTotal += iCount;

        if (!iCount)
            return;

        return getIconAlias(aItem.name);
    });

    if (!iTotal)
        return false;

    const aPerformedByMenu = Object.keys(oCounter.items).map(function (iKey) {
        const aItem = oCounter.items[iKey];
        if (aItem.name == 'default')
            return;

        if (performedBy == undefined || performedBy[aItem.name] == undefined || performedBy[aItem.name].length == 0)
            return;

        let sClass = 'flex-0 flex mx-1  flex-row w-min top-px';
        if (aItem.name == sSelected)
            sClass += ' border-b-2 border-primary dark:border-primary-d ';

        return (
            <View key={aItem.name} className={sClass}>
                <Button size="sm" variant="text" startDecorator={getIconAlias(aItem.name)} onPress={() => { setTabVisibleByCpd(aItem.name) }} rounded="true" />
            </View>
        );
    });

    const aPerformedByUsers = Object.keys(oCounter.items).map(function (iKey) {
        const aItem = oCounter.items[iKey];
        if (aItem.name == 'default')
            return;

        if (!sSelected && aItem.count != 0)
            sSelected = aItem.name;

        let aUsers = undefined;
        if (performedBy && performedBy[aItem.name]) {
            aUsers = performedBy[aItem.name].map(aUser => {
                return (
                    <View key={aUser.id}><Profile {...aUser} /></View>
                );
            });
        }

        if (!aUsers || aUsers.length == 0)
            aUsers = getSkeleton();

        let sClass = '';
        if (aItem.name != sSelected)
            sClass = 'hidden ';
        sClass += 'gap-2 overflow-y-auto text-neutral-700 dark:text-neutral-200';

        return (
            <View key={aItem.name} className={sClass}>{aUsers}</View>
        );
    });

    const bShowCounterAsButton = oParams?.show_counter_as_button === true;
    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    return [[
        <ButtonCounter {...oButtonProps} fullWidth={false} key="counter" startDecorator={aCounter} title={iTotal} onPress={handleGetPerformedByCpd} />
    ], [
        <Modal key="counter-popup" title={t("Reactions")} onVisible={popupVisibleByCpd} onClose={() => { setPopupVisibleByCpd(false) }}>
            <View className="relative flex-row border-b border-bdr dark:border-bdr-d ">{aPerformedByMenu}</View>
            <View className="p-2">{aPerformedByUsers}</View>
        </Modal>
    ]
    ];
};

export default function ElementReactions(oProps) {
    const { t } = useTranslation();
    const bWeb = Platform.OS === 'web';
    const sTheme = useColorScheme();
    const oSettings = appSetting('social_actions', 'reaction');

    const oParams = { ...oSettings, ...oProps.params };
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    const oItems = oSettings[oProps['system']]?.items ? oSettings[oProps['system']].items : oParams.items;
    const oAliases = oSettings[oProps['system']]?.iconset ? oSettings[oProps['system']].iconset : {
        web: {
            default: { svg: 'Smiley', emoji: '🙂' },
            like: { svg: 'ThumbsUp', emoji: '👍' },
            love: { svg: 'Heart', emoji: '🥰' },
            joy: { svg: 'Smiley', emoji: '😂' },
            surprise: { svg: 'SmileyXEyes', emoji: '😮' },
            sadness: { svg: 'SmileySad', emoji: '😔' },
            anger: { svg: 'SmileyAngry', emoji: '😠' },
        },
        native: {
            default: { svg: 'Smiley', emoji: '🙂' },
            like: { svg: '', emoji: '👍' },
            love: { svg: '', emoji: '🥰' },
            joy: { svg: '', emoji: '😂' },
            surprise: { svg: '', emoji: '😮' },
            sadness: { svg: '', emoji: '😔' },
            anger: { svg: '', emoji: '😠' },
        }
    };

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both') && !!oAction && !!oAction?.title;
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both') && !!oCounter && !!oCounter?.items;
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true;

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const [actionsDataState, setActionsDataState] = useState({});

    const [performedBy, setPerformedBy] = useState();

    const [popupVisibleByCpd, setPopupVisibleByCpd] = useState(false);
    const [tabVisibleByCpd, setTabVisibleByCpd] = useState('');

    let oCounterState = {};
    for (const i in oItems)
        oCounterState[oItems[i].name] = false;

    const [popupVisibleByDvd, setPopupVisibleByDvd] = useState(oCounterState);

    const bAllowViewVoted = oSettings[oProps['system']]?.allow_view_voted != undefined ? oSettings[oProps['system']].allow_view_voted : true;

    const _getIconAlias = useCallback((sName) => getIconAlias(oParams, oAliases, sName), [oParams, oAliases]);
    const _performAction = useCallback((sAction, aParams, onLoad) => performAction(oProps.system, oProps.object_id, sAction, aParams, onLoad), [oProps.system, oProps.object_id]);
    const _handleDo = useCallback((sReaction, event) => handleDo(_performAction, actionsDataState, setActionsDataState, sReaction, oParams, event), [_performAction, actionsDataState, setActionsDataState, oParams]);
    const _handleUndo = useCallback((event) => handleUndo(_performAction, actionsDataState, setActionsDataState, oProps.action.reaction, event), [_performAction, actionsDataState, setActionsDataState, oProps.action.reaction]);
    const _handleGetPerformedByCpd = useCallback((event) => handleGetPerformedByCpd(_performAction, setPerformedBy, setTabVisibleByCpd, setPopupVisibleByCpd, bAllowViewVoted, oParams.haptics_type, event), [_performAction, setPerformedBy, setTabVisibleByCpd, setPopupVisibleByCpd, bAllowViewVoted, oParams.haptics_type]);
    const _handleGetPerformedByDvd = useCallback((sReaction, event) => handleGetPerformedByDvd(_performAction, setPerformedBy, setPopupVisibleByDvd, bAllowViewVoted, oParams.haptics_type, sReaction, event), [_performAction, setPerformedBy, setPopupVisibleByDvd, bAllowViewVoted, oParams.haptics_type]);

    let { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        subscribe(oProps.system + '_' + oProps.type + '_' + oProps.object_id, 'voted', cb);
    }, [])

    const cb = (data) => {
        let aData = JSON.parse(data);
        if (!!aData?.api) {
            const aDataSet = aData.api.performer_id == currentUser.id ? aData.api : { counter: aData.api.counter }; 
            setActionsDataState(!actionsDataState ? aDataSet : { ...actionsDataState, ...aDataSet})
        }
    }

    //--- show action
    let sActionButton = undefined;
    let sActionPopup = undefined;
    if (bShowAction) {
        const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
        const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

        const bShowActionUndo = oAction?.is_undo === true;

        let bShowActionVoted = oAction?.is_voted === true || false;
        if (actionsDataState?.['is_voted'] != undefined)
            bShowActionVoted = actionsDataState['is_voted'] === true;

        let bShowActionDisabled = oAction?.is_disabled === true || false;
        if (actionsDataState?.['is_disabled'] != undefined)
            bShowActionDisabled = actionsDataState['is_disabled'] === true;

        let sReaction = oAction?.reaction || '';
        if (actionsDataState?.['reaction'] != undefined)
            sReaction = actionsDataState['reaction'];

        let sTitle = oAction?.title || '';
        if (actionsDataState?.['title'] != undefined)
            sTitle = actionsDataState['title'];

        const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

        if (bShowActionUndo && bShowActionVoted) {
            sActionButton = (
                <ButtonAction key="action" startDecorator={_getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : ''} pressed={true} onPress={_handleUndo} {...oButtonProps} />
            );
        }
        else {
            const aItems = oItems.map((oItem) => {
                return {
                    id: oItem.id ? oItem.id : oItem.name,
                    name: oItem.name,
                    icon: _getIconAlias(oItem.name),
                    class_item: ' transition active:scale-150 duration-300 active:-translate-y-4  ',
                    class_item_icon: ' text-3xl ',
                    tooltip: oParams.t[oItem.name], //TODO: for Roman use provided Tooltips in popup menus
                };
            });
            if (bWeb) {
                sActionButton = oItems.length > 1 ? (
                    <Pressable key="action" onPress={(event) => { event.preventDefault() }}>
                        <DropdownMenu variant="horizontal" items={aItems} onSelect={(oItem, event) => { _handleDo(oItem.name, event) }}>
                            <ButtonAction variant={bShowCombined ? 'group-item' : false} startDecorator={_getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : ''} disabled={bShowActionDisabled} {...oButtonProps} />
                        </DropdownMenu>
                    </Pressable>
                ) : (
                    <ButtonAction key="action" variant={bShowCombined ? 'group-item' : false} startDecorator={_getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : ''} onPress={(event) => { _handleDo(aItems[0].name, event) }} disabled={bShowActionDisabled} {...oButtonProps} />
                );
            }
            else {
                const oReactionStyles = StyleSheet.create({
                    cardStyle: {
                        backgroundColor: appSetting('theme', sTheme == 'dark' ? 'dark' : 'light', 'bgrmodal'),
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        bdr: appSetting('theme', sTheme == 'dark' ? 'dark' : 'light', 'bdrModal'),
                        borderWidth: 0,
                    },
                });

                const aReactionItems = oItems.map(oItem => {
                    return {
                        id: oItem.id,
                        name: oItem.name,
                        emoji: _getIconAlias(oItem.name),
                        title: t('rvote_' + oItem.name + '_title')
                    };
                });

                sActionButton = sActionButton = oItems.length > 1 ? (
                    <Reaction key="action" type="modal" showPopupType="onPress" items={aReactionItems} onTap={(item) => { _handleDo(item.name) }} disabled={bShowActionDisabled} cardStyle={oReactionStyles.cardStyle}>
                        <ButtonAction startDecorator={_getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : false} {...oButtonProps} />
                    </Reaction>
                ) : (
                    <ButtonAction key="action" startDecorator={_getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : false} onPress={() => { _handleDo(aItems[0].name) }} disabled={bShowActionDisabled} {...oButtonProps} />
                );
            }
        }
    }

    //--- show counter
    const sShowCounterStyle = oParams?.show_counter_style || 'compound';

    const _getCounterDivided = useCallback(() => getCounterDivided(_getIconAlias, _handleGetPerformedByDvd, actionsDataState, performedBy, popupVisibleByDvd, setPopupVisibleByDvd, bShowCombined, oParams, oCounter, oButtonProps), [_getIconAlias, _handleGetPerformedByDvd, actionsDataState, performedBy, popupVisibleByDvd, setPopupVisibleByDvd, bShowCombined, oParams, oCounter, oButtonProps]);
    const _getCounterCompound = useCallback(() => getCounterCompound(_getIconAlias, _handleGetPerformedByCpd, actionsDataState, performedBy, popupVisibleByCpd, setPopupVisibleByCpd, tabVisibleByCpd, setTabVisibleByCpd, bShowCombined, oParams, oCounter, oButtonProps), [_getIconAlias, _handleGetPerformedByCpd, actionsDataState, performedBy, popupVisibleByCpd, setPopupVisibleByCpd, tabVisibleByCpd, setTabVisibleByCpd, bShowCombined, oParams, oCounter, oButtonProps]);

    let aCounter = [];
    if (bShowCounter && oCounter?.items != undefined)
        switch (sShowCounterStyle) {
            case 'compound':
                aCounter = _getCounterCompound()
                break;

            case 'divided':
                aCounter = _getCounterDivided();
                break;
        }

    //--- show final component
    let sResult = undefined;

    if (bShowCombined) {
        let aButtonsGroup = [];

        if (bShowAction)
            aButtonsGroup.push(sActionButton)

        if (!!aCounter[0])
            aCounter[0].forEach(aItem => {
                aButtonsGroup.push(aItem);
            });

        sResult = (
            <View>
                <ButtonsGroupMenu {...oButtonProps}>{aButtonsGroup}</ButtonsGroupMenu>
                {sActionPopup}
                {aCounter[1]}
            </View>
        );
    }
    else {
        const bCounter = bShowCounter && !!aCounter;

        const hasContent =
            (bShowAction && !!sActionButton) ||
            (bShowAction && !!sActionPopup) ||
            bCounter ||
            (bShowCounter && !!aCounter);

        sResult = hasContent ? (
            <View className={"flex-auto flex-row items-center " + (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? '  px-0 ' : ' pr-1 pb-3 sm:pb-3.5 ') : '')} >
                {bShowAction && !!sActionButton && <View key={sObject + '-action-button'} className={'flex-auto' + (bShowFull && bCounter ? ' mr-2' : '')}>{sActionButton}</View>}
                {bShowAction && !!sActionPopup && <View key={sObject + '-action-popup'}>{sActionPopup}</View>}
                {bCounter && <View key={sObject + '-counter-button'} className="flex-auto flex-row gap-x-1">{aCounter[0]}</View>}
                {bShowCounter && !!aCounter && <View key={sObject + '-counter-popup'}>{aCounter[1]}</View>}
            </View>
        ) : null;
    }

    return bWeb ? sResult : (
        <ReactionProvider>{sResult}</ReactionProvider>
    )
}
