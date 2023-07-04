import { useState, useContext } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { Reaction, ReactionProvider } from 'react-native-reactions';

import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { ActionsData } from 'app/context/actions';
import { Button, ButtonMenuActionDefault, ButtonMenuActionText, ButtonMenuCounterDefault, ButtonMenuCounterText, ButtonMenuGroupItem, ButtonsGroupMenu, Modal } from 'app/design/controls';
import { View, Pressable } from 'app/design/view';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Profile from 'app/ui/molecules/profile';

export default function ElementReactions(oProps) {
    const bWeb = Platform.OS === 'web';
    const sTheme = useColorScheme();

    const oParams = {...appSetting('social_actions', 'reaction'), ...oProps.params};
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';
    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');
    const bShowCounter = oParams?.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both') && !!oCounter && !!oCounter?.items;
    const bShowFull = bShowAction && bShowCounter;
    const bShowCombined = bShowFull && oParams?.show_combined != undefined && oParams.show_combined === true;

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

  

    const getIconType = (sMode) => {
        const aIconType = {
            web: !!oParams?.icon_type_web ? oParams.icon_type_web : 'svg', 
            native: !!oParams?.icon_type_native ? oParams.icon_type_native : 'emoji'
        }

        return aIconType[sMode];
    }

    const getIconAlias = (sName) => {
        const sKey = bWeb ? 'web' : 'native';
        const sType = sName != 'default' ? oParams['icon_type_' + sKey] : 'svg';
        const oAliases = {
            web: {
                default: {svg: 'Smiley', emoji: '🙂'},
                like: {svg: 'ThumbsUp', emoji: '👍'},
                love: {svg: 'Heart', emoji: '🥰'},
                joy: {svg: 'Smiley', emoji: '😂'},
                surprise: {svg: 'SmileyXEyes', emoji: '😮'},
                sadness: {svg: 'SmileySad', emoji: '😔'},
                anger: {svg: 'SmileyAngry', emoji: '😠'},
            },
            native: {
                default: {svg: 'Smiley', emoji: '🙂'},
                like: {svg: '', emoji: '👍'},
                love: {svg: '', emoji: '🥰'},
                joy: {svg: '', emoji: '😂'},
                surprise: {svg: '', emoji: '😮'},
                sadness: {svg: '', emoji: '😔'},
                anger: {svg: '', emoji: '😠'},
            }
        };

        return oAliases[sKey][sName][sType];
    };

    const { actionsData, setActionsData } = useContext(ActionsData);
    const [ actionsDataState, actisetActionsDataState ] = useState({});

    let oCounterState = {};
    for (const i in oParams.items) {
        oCounterState[oParams.items[i].name] = false;
    }

    const [ performedBy, setPerformedBy ] = useState();

    const [ popupVisibleByCpd, setPopupVisibleByCpd ] = useState(false);
    const [ tabVisibleByCpd, setTabVisibleByCpd ] = useState('');

    const [ popupVisibleByDvd, setPopupVisibleByDvd ] = useState(oCounterState);

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

    const getContextVars = () => {
        const sContextKey = getName();

        if(bShowFull)
            return actionsDataState && actionsDataState[sContextKey] ? actionsDataState[sContextKey] : null;
        else
            return actionsData && actionsData[sContextKey] ? actionsData[sContextKey] : null;
    };

    const setContextVars = (mValue) => {
        const sContextKey = getName();
        const oValue = {[sContextKey]: mValue};

        if(bShowFull) {
            if(!actionsDataState)
                actisetActionsDataState(oValue);
            else
                actisetActionsDataState({...actionsDataState, ...oValue});
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

    const handleDo = (event, oItem) => {
        if(event)
            event.preventDefault();

        performAction('do', {value: 1, reaction: oItem.name}, (oData) => {
            setContextVars(oData);
        });

    };

    const handleUndo = (event) => {
        event.preventDefault();

        let sReaction = oProps.action.reaction;
        if(isContextVar('reaction'))
            sReaction = getContextVar('reaction');

        performAction('do', {value: 1, reaction: sReaction}, (oData) => {
            setContextVars(oData);
        });
    };

    const handleGetPerformedByCpd = (event) => {
        event.preventDefault();

        FeedbackHaptics(oParams.haptics_type);

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);

            setTabVisibleByCpd('');
            setPopupVisibleByCpd(true);
        });
    };

    const handleGetPerformedByDvd = (event, oItem) => {
        event.preventDefault();

        FeedbackHaptics(oParams.haptics_type);

        const sReaction = oItem?.name || '';
        if(!sReaction)
            return;

        performAction('get_performed_by', {reaction: sReaction}, (oData) => {
            if(!oData?.performed_by)
                return;
            
            setPerformedBy(oData.performed_by);
            setPopupVisibleByDvd(state => ({...state, [sReaction]: true}));
        });
    };

    const getSkeleton = () => {
        return (
            <View className="gap-2">
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

    
    //--- show action    
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    const bShowActionUndo = oAction?.is_undo === true;

    let bShowActionVoted = oAction?.is_voted === true || false;
    if(isContextVar('is_voted'))
        bShowActionVoted = getContextVar('is_voted') === true;

    let bShowActionDisabled = oAction?.is_disabled === true || false;
    if(isContextVar('is_disabled'))
        bShowActionDisabled = getContextVar('is_disabled') === true;

    let sReaction = oAction?.reaction || '';
    if(isContextVar('reaction'))
        sReaction = getContextVar('reaction');

    let sTitle = oAction?.title || '';
    if(isContextVar('title'))
        sTitle = getContextVar('title');

    const ButtonAction = !bShowCombined ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText) : ButtonMenuGroupItem;

    let sActionButton = undefined;
    let sActionPopup = undefined;
    if(bShowActionUndo && bShowActionVoted) {
        sActionButton = (
            <ButtonAction key="action" size={sDisplaySize} startDecorator={getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : ''} onPress={handleUndo} />
        );
    }
    else {
        if(bWeb) {
            const aItems = oParams.items.map((oItem) => {
                return {
                    id: oItem.id ? oItem.id : oItem.name,
                    name: oItem.name,
                    icon: getIconAlias(oItem.name),
                    class_item: 'transition active:scale-150 duration-300 active:-translate-y-4',
                    class_item_icon: 'text-2xl'
                };
            });

            sActionButton = (
                <Pressable key="action" onPress={(event) => {event.preventDefault()}}>
                    <DropdownMenu variant="horizontal" items={aItems} onSelect={(oItem, event) => {handleDo(event, oItem)}}>
                        <ButtonAction variant={bShowCombined ? 'group-item' : false} size={sDisplaySize} startDecorator={getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : ''} onPress={() => {}} disabled={bShowActionDisabled} />
                    </DropdownMenu>
                </Pressable>
            );
        }
        else {
            const oReactionStyles = StyleSheet.create({
                cardStyle: {
                    backgroundColor: appSetting('theme', sTheme == 'dark' ? 'dark' : 'light', 'backgroundModal'),
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    borderColor: appSetting('theme', sTheme == 'dark' ? 'dark' : 'light', 'bordercolorModal'),
                    borderWidth: 1,
                },
            });

            const aReactionItems = oParams.items.map(oItem => {
                return {
                    id: oItem.id,
                    name: oItem.name,
                    emoji: getIconAlias(oItem.name),
                    title: appSetting('lang_keys', 'rvote_' + oItem.name + '_title')
                };
            });

            const onDoSelect = (item) => {
                FeedbackHaptics(oParams.haptics_type);
                handleDo(undefined, item);
            };

            sActionButton = (
                <Reaction key="action" type="modal" showPopupType="onPress" items={aReactionItems} onTap={(item) => {onDoSelect(item)}} disabled={bShowActionDisabled} cardStyle={oReactionStyles.cardStyle}>
                    <ButtonAction size={sDisplaySize} startDecorator={getIconAlias(sReaction)} title={bShowActionLabel ? sTitle : false} />
                </Reaction>
            );
        }
    }

    //--- show counter
    const sShowCounterStyle = oParams?.show_counter_style || 'compound';
    const bShowCounterAsButton = oParams?.show_counter_as_button != undefined && oParams.show_counter_as_button === true;

    const ButtonCounter = !bShowCombined ? (bShowCounterAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText) : ButtonMenuGroupItem;

    const getCounterDivided = () => {
        let aButtons = [];
        let aPopups = [];

        oCounter.items.forEach((aItem, iKey) => {
            if(aItem.name == 'default')
                return;

            let iCount = aItem.count;
            if(isContextVar('counter')) {
                const oCounterGlobal = getContextVar('counter');
                const sCounterKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounterKey] != undefined)
                    iCount = oCounterGlobal[sCounterKey];
            }

            if(!iCount)
                return;

            let aUsers = undefined;
            if(performedBy && performedBy[aItem.name]) {
                aUsers = performedBy[aItem.name].map(aUser => {
                    return (
                        <View key={aUser.id}><Profile {...aUser} /></View>
                    );
                });
            }

            if(aUsers && aUsers.length != 0)
                aUsers = (
                    <View className="gap-2">{aUsers}</View>
                );
            else
                aUsers = getSkeleton();

            aButtons.push(<ButtonCounter key={'counter-button-' + iKey} size={sDisplaySize} startDecorator={getIconAlias(aItem.name)} title={iCount} onPress={(event) => {handleGetPerformedByDvd(event, aItem)}} />);
            aPopups.push(<Modal key={'counter-popup-' + iKey} title={appSetting('lang_keys', 'rvote_performed_by_popup_title')} onVisible={popupVisibleByDvd[aItem.name]} onClose={() => {setPopupVisibleByDvd(state => ({...state, [aItem.name]: false}))}}>{aUsers}</Modal>)
        });

        return [aButtons, aPopups];
    };

    const getCounterCompound = () => {
        let iTotal = 0;
        let sSelected = tabVisibleByCpd;
        const aCounter = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            let iCount = aItem.count;
            if(isContextVar('counter')) {
                const oCounterGlobal = getContextVar('counter');
                const sCounterKey = 'count_' + aItem.name;
                if(oCounterGlobal[sCounterKey] != undefined)
                    iCount = oCounterGlobal[sCounterKey];
            }

            if(!sSelected && iCount != 0)
                sSelected = aItem.name;

            iTotal += iCount;

            if(!iCount)
                return;
            
            return getIconAlias(aItem.name);
        });

        if(!iTotal)
            return false;

        const aPerformedByMenu = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;
            
            if(performedBy == undefined || performedBy[aItem.name] == undefined || performedBy[aItem.name].length == 0)
                return;

            let sClass = 'flex-0 flex mx-1  flex-row w-min top-px';
            if(aItem.name == sSelected)
                sClass += ' border-b-2 border-primary dark:border-primary-dark ';

            return (
                <View key={aItem.name} className={sClass}>
                    <Button size="sm" variant="text" startDecorator={getIconAlias(aItem.name)} onPress={() => {setTabVisibleByCpd(aItem.name)}} rounded="true" />
                </View>
            );
        });

        const aPerformedByUsers = Object.keys(oCounter.items).map(function(iKey) {
            const aItem = oCounter.items[iKey];
            if(aItem.name == 'default')
                return;

            if(!sSelected && aItem.count != 0)
                sSelected = aItem.name;

            let aUsers = undefined;
            if(performedBy && performedBy[aItem.name]) {
                aUsers = performedBy[aItem.name].map(aUser => {
                    return (
                        <View key={aUser.id}><Profile {...aUser} /></View>
                    );
                });
            }

            if(!aUsers || aUsers.length == 0)
                aUsers = getSkeleton();

            let sClass = '';
            if(aItem.name != sSelected) 
                sClass = 'hidden ';
            sClass += 'gap-2 overflow-y-auto text-neutral-700 dark:text-neutral-200';

            return (
                <View key={aItem.name} className={sClass}>{aUsers}</View>
            );
        });

        return [[
                <ButtonCounter key="counter" size={sDisplaySize} endDecorator={aCounter} title={iTotal} onPress={handleGetPerformedByCpd} />
            ], [
                <Modal key="counter-popup"  title={appSetting('lang_keys', 'rvote_performed_by_popup_title')} onVisible={popupVisibleByCpd} onClose={() => {setPopupVisibleByCpd(false)}}>
                    <View className="relative flex-row  border-b border-bordercolor dark:border-bordercolor-dark ">{aPerformedByMenu}</View>
                    <View className="p-2">{aPerformedByUsers}</View>
                </Modal>
            ]
        ];
    };

    //--- Counter
    let aCounter = [];
    if(bShowCounter && oCounter?.items != undefined)
        switch(sShowCounterStyle) {
            case 'compound':
                aCounter = getCounterCompound()
                break;

            case 'divided':
                aCounter = getCounterDivided();
                break;
        }

    let sResult = undefined;
    if(bShowCombined) {
        let aButtonsGroup = [sActionButton];
        if(!!aCounter[0])
            aCounter[0].forEach(aItem => {
                aButtonsGroup.push(aItem);
            });

        sResult = (
            <View>
                <ButtonsGroupMenu size={sDisplaySize}>{aButtonsGroup}</ButtonsGroupMenu>
                {sActionPopup}
                {aCounter[1]}
            </View>
        );
    }
    else {
        const sObject = getName();
        const bCounter = bShowCounter && !!aCounter;

        sResult = (
            <View className="flex-auto flex-row items-center">
                {bShowAction && !!sActionButton && <View key={sObject + '-action-button'} className={'flex-auto' + (bShowFull && bCounter ? ' mr-2' : '')}>{sActionButton}</View>}
                {bShowAction && !!sActionPopup && <View key={sObject + '-action-popup'}>{sActionPopup}</View>}
                {bCounter && <View key={sObject + '-counter-button'} className="flex-auto flex-row gap-x-1">{aCounter[0]}</View>}
                {bShowCounter && !!aCounter && <View key={sObject + '-counter-popup'}>{aCounter[1]}</View>}
            </View>
        );
    }

    return bWeb ? sResult : (
        <ReactionProvider>{sResult}</ReactionProvider>
    )
 }
