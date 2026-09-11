/**
 * Favorites — bookmark action + counter + "who favorited" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for TemplFavoriteServices
 *   action                   — title, is_undo, is_favorited, is_disabled
 *   counter                  — { count }
 *   params                   — overrides (+ on_do, on_done callbacks)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   primary                  — button variant=primary
 *   o                        — optional settings key for icons
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { appSetting, FeedbackHaptics } from 'app/lib/util';
import {
    objectKey,
    mergeState,
    objectRequest,
    openPerformedBy,
    ActionMenuLayout,
    resolveDisplayFlags,
    buildButtonProps,
    pickActionButton,
    pickCounterButton,
    resolveActionButtonFlags,
    resolveCounterAsButton,
    PerformedByModal,
} from 'app/ui/molecules/objects/helpers';
import { View } from 'app/design/view';

export default function ElementFavorites(props) {
    const { t } = useTranslation();

    const settings = appSetting('social_actions', 'favorite');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);

    const icons =
        props?.o && settings[props.o]?.icons != undefined
            ? settings[props.o].icons
            : { do: 'Bookmark', undo: 'Bookmark' };

    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(params, props?.displayType);

    // favorites: show_combined === true (same result as resolveDisplayFlags)
    const buttonProps = {
        ...buildButtonProps(props),
    };

    const [objectData, setObjectData] = useState({
        ...action,
        ...{ counter },
    });
    const [popupVisible, setPopupVisible] = useState(false);
    const [performedBy, setPerformedBy] = useState();

    const allowViewFavorited =
        settings[props.system]?.allow_view_favorited != undefined
            ? settings[props.system].allow_view_favorited
            : true;

    const object_params = {
        service: 'TemplFavoriteServices',
        system: props.system,
        objectId: props.object_id,
    };

    // --- do / undo favorite (same endpoint: perform) ---

    const doFavorite = (event) => {
        if (event) event.preventDefault();
        FeedbackHaptics(params.haptics_type);

        if (typeof params?.on_do === 'function') params.on_do();

        objectRequest(object_params, 'perform', {}, (data) => {
            setObjectData((prev) => mergeState(prev, data));
            if (typeof params?.on_done === 'function') params.on_done(data);
        });
    };

    // --- who favorited ---

    const openVoters = (event) =>
        openPerformedBy({
            event,
            object_params,
            allowed: allowViewFavorited,
            hapticsType: params.haptics_type,
            setPerformedBy,
            setPopupVisible,
        });

    // --- action button ---

    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const canUndo = action?.is_undo === true;
    const isFavorited =
        objectData?.is_favorited != undefined
            ? objectData.is_favorited === true
            : false;
    const isDisabled =
        objectData?.is_disabled != undefined
            ? objectData.is_disabled === true
            : false;
    const title = objectData?.title != undefined ? objectData.title : '';

    const ActionButton = pickActionButton(showCombined, showAsButton);
    buttonProps.startDecorator = icons[(isFavorited ? 'un' : '') + 'do'];

    const actionButton = (
        <ActionButton
            key="action"
            title={showLabel ? title : false}
            onPress={!isDisabled ? doFavorite : () => {}}
            pressed={canUndo && isFavorited}
            disabled={isDisabled}
            {...buttonProps}
        />
    );

    // --- counter ---

    const showCounterAsButton = resolveCounterAsButton(params);
    const count =
        objectData?.counter != undefined &&
        objectData.counter?.count != undefined
            ? objectData.counter.count
            : '';

    const CounterButton = pickCounterButton(showCombined, showCounterAsButton);

    let counterButton;
    let counterPopup;

    if (showCounter && count > 0) {
        counterButton = (
            <View key="counter">
                <CounterButton
                    startDecorator={!showCombined ? 'Bookmark' : false}
                    title={count + ''}
                    onPress={openVoters}
                    {...buttonProps}
                />
            </View>
        );

        counterPopup = (
            <PerformedByModal
                title={t('Favorites')}
                visible={popupVisible}
                onClose={() => setPopupVisible(false)}
                users={performedBy}
            />
        );
    }

    // --- layout ---

    const combinedGroup = [actionButton];
    if (counterButton) combinedGroup.push(counterButton);

    return (
        <ActionMenuLayout
            combined={showCombined}
            buttonProps={buttonProps}
            itemKey={key}
            showAction={showAction}
            showCounter={showCounter}
            showBoth={showBoth}
            params={props.params}
            actionSlots={[{ element: actionButton }]}
            counterButton={counterButton}
            counterPopup={counterPopup}
            combinedGroup={combinedGroup}
            emptyCheck={showCounter && !showAction && !count}
        />
    );
}
