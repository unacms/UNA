/**
 * Features — feature / unfeature action (optional NeoButton / dropdown).
 *
 * Props (from backend / entity actions):
 *   system, object_id        — object id for TemplFeatureServices
 *   action                   — title, is_undo, is_featured, is_disabled
 *   params                   — overrides (+ on_do, on_done, button_style, …)
 *   mode                     — 'dropdown-menu' | default
 *   primary                  — button variant=primary
 *   o                        — optional settings key for icons
 */

import { useState } from 'react';

import { appSetting, FeedbackHaptics } from 'app/lib/util';
import {
    mergeState,
    objectRequest,
    buildButtonProps,
    pickActionButton,
    resolveActionButtonFlags,
    ActionMenuLayout,
} from 'app/ui/molecules/objects/helpers';
import { components } from 'app/components/registry';
import { NeoButton } from 'app/design/controls';

export default function ElementFeatures(props) {
    const settings = appSetting('social_actions', 'feature');
    const params = { ...settings, ...props.params };
    const action = props.action;

    const DropdownMenuItem = components['menu-item']['dropdown'];

    const icons =
        props?.o && settings[props.o]?.icons != undefined
            ? settings[props.o].icons
            : { do: 'Star', undo: 'Star' };

    // features: combined flag is just show_combined === true (no counter pair)
    const showCombined = params?.show_combined === true;
    const buttonProps = { ...buildButtonProps(props) };

    const [objectData, setObjectData] = useState(action);

    const object_params = {
        service: 'TemplFeatureServices',
        system: props.system,
        objectId: props.object_id,
    };

    const doFeature = (event) => {
        if (event) event.preventDefault();
        FeedbackHaptics(params.haptics_type);

        if (typeof params?.on_do === 'function') params.on_do();

        objectRequest(object_params, 'perform', {}, (data) => {
            setObjectData((prev) => mergeState(prev, data));
            if (typeof params?.on_done === 'function') params.on_done(data);
        });
    };

    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const canUndo = action?.is_undo === true;
    const isFeatured =
        objectData?.is_featured != undefined
            ? objectData.is_featured === true
            : false;
    const isDisabled =
        objectData?.is_disabled != undefined
            ? objectData.is_disabled === true
            : false;
    const title = objectData?.title != undefined ? objectData.title : '';

    const iconName = icons[(isFeatured ? 'un' : '') + 'do'];
    buttonProps.startDecorator = iconName;

    const ActionButton = pickActionButton(showCombined, showAsButton);

    if (props.mode == 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{
                    title: showLabel ? title : false,
                    icon: iconName,
                }}
                handleSelect={(event) => {
                    !isDisabled ? doFeature(event) : () => {};
                }}
            />
        );
    }

    const neoButtonStyle = props?.primary
        ? props.params?.button_primary_style || props.params?.button_style
        : props.params?.button_style;

    const actionButton = props.params?.button_style ? (
        <NeoButton
            key="action"
            label={showLabel ? title : ''}
            image={buttonProps.startDecorator}
            style={neoButtonStyle}
            controlSize={props.params?.button_size}
            borderShape={props.params?.button_border_shape}
            width={props.params?.button_full_width ? 'fill' : 'auto'}
            selected={canUndo && isFeatured}
            disabled={isDisabled}
            onPress={!isDisabled ? doFeature : () => {}}
        />
    ) : (
        <ActionButton
            key="action"
            title={showLabel ? title : false}
            onPress={!isDisabled ? doFeature : () => {}}
            pressed={canUndo && isFeatured}
            disabled={isDisabled}
            {...buttonProps}
        />
    );

    return (
        <ActionMenuLayout
            combined={true}
            buttonProps={buttonProps}
            combinedGroup={[actionButton]}
        />
    );
}
