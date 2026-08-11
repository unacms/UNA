import { useState, useMemo, useCallback, useRef } from 'react';
import { appSetting, getAlert } from 'app/lib/util';
import { useActionsData } from 'app/context/actions';
import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import { useLayoutData } from 'app/context/layout';
import {
    objectKey,
    resolveDisplayFlags,
    buildButtonProps,
    pickActionButton,
    resolveActionButtonFlags,
    ActionMenuLayout,
} from 'app/lib/object-helpers';

const handleDo = (redirectRef, link, callback, event, setLayoutData) => {
    event.preventDefault();

    if (callback) {
        callback();
        return;
    }

    if (!link) return;
    setLayoutData(getAlert('comment:activate'));
    redirectRef.current.redirect(link);
};

export default function ElementComments(props) {
    const { setLayoutData } = useLayoutData();
    const redirectRef = useRef();
    const settings = useMemo(
        () => ({ ...appSetting('social_actions', 'comment'), ...props.params }),
        [props.params]
    );
    const isTextMode = props.mode === 'text';

    const key = objectKey(props.type, props.system, props.object_id);
    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(settings, props.displayType);

    const buttonProps = isTextMode
        ? {
              ...buildButtonProps(props),
              variant: props?.primary ? 'primary' : 'custom',
              size: 'base',
          }
        : buildButtonProps(props);

    const { showAsButton, showLabel } = resolveActionButtonFlags(settings);
    const ActionButton = pickActionButton(showCombined, showAsButton);

    const { actionsData } = useActionsData();
    const [actionsDataState, setActionsDataState] = useState({});

    const isContextVar = useCallback(
        (name) => {
            if (showBoth)
                return actionsDataState[key]?.[name] !== undefined;
            return false;
        },
        [actionsDataState, showBoth, key]
    );

    const getContextVar = useCallback(
        (name) => {
            return showBoth ? actionsDataState[key]?.[name] : undefined;
        },
        [actionsDataState, showBoth, key]
    );

    const action = props.action;
    const counter = props.counter;

    const handlePress = useCallback(
        (event) =>
            handleDo(redirectRef, action?.link, props.callback, event, setLayoutData),
        [action?.link, props.callback]
    );

    let title = action?.title || '';
    if (isContextVar('title')) title = getContextVar('title');

    let count = 0;
    if (counter?.count != undefined) {
        count = counter.count;
        if (isContextVar('counter')) {
            const globalCounter = getContextVar('counter');
            if (globalCounter?.count) count = globalCounter.count;
        }
    }

    const isDisabled = action?.is_disabled === true;
    const iconName = isTextMode ? '' : 'MessageCircleMore';

    const neoButtonStyle = props.params?.button_style
        ? props?.primary
            ? props.params?.button_primary_style || props.params.button_style
            : props.params.button_style
        : null;

    const actionButton = useMemo(() => {
        const actionLabel = showCounter
            ? count > 0
                ? count
                : showLabel
                  ? title
                  : false
            : showLabel
              ? title
              : false;

        if (showCounter && !showAction && !(count > 0)) return null;

        if (neoButtonStyle) {
            const neoLabel =
                actionLabel === false || actionLabel == null
                    ? ''
                    : String(actionLabel);
            return (
                <NeoButton
                    key="action"
                    label={neoLabel}
                    image={iconName}
                    style={neoButtonStyle}
                    controlSize={props.params?.button_size}
                    borderShape={props.params?.button_border_shape}
                    width={props.params?.button_full_width ? 'fill' : 'auto'}
                    onPress={!isDisabled ? handlePress : undefined}
                    disabled={isDisabled}
                    accessibilityLabel={neoLabel || undefined}
                />
            );
        }

        if (showCounter && !showAction) {
            return (
                <ActionButton
                    key="action"
                    startDecorator={iconName}
                    title={count}
                    onPress={!isDisabled ? handlePress : undefined}
                    disabled={isDisabled}
                    {...buttonProps}
                />
            );
        }

        if (!showCounter && showAction) {
            return (
                <ActionButton
                    key="action"
                    startDecorator={iconName}
                    title={showLabel ? title : false}
                    onPress={!isDisabled ? handlePress : undefined}
                    disabled={isDisabled}
                    {...buttonProps}
                />
            );
        }

        return (
            <ActionButton
                key="action"
                startDecorator={iconName}
                title={showLabel ? (count > 0 ? count : title) : false}
                onPress={!isDisabled ? handlePress : undefined}
                disabled={isDisabled}
                {...buttonProps}
            />
        );
    }, [
        showAction,
        showLabel,
        isDisabled,
        showCounter,
        handlePress,
        count,
        neoButtonStyle,
        buttonProps,
        props.params?.button_border_shape,
        props.params?.button_full_width,
        props.params?.button_size,
        iconName,
        title,
    ]);

    if (actionButton == null) return null;

    // NeoButton path skips ButtonsGroupMenu
    if (neoButtonStyle) {
        return (
            <View>
                <Redirect ref={redirectRef} />
                {actionButton}
            </View>
        );
    }

    if (showCombined) {
        return (
            <>
                <Redirect ref={redirectRef} />
                <ActionMenuLayout
                    combined={true}
                    buttonProps={buttonProps}
                    combinedGroup={[actionButton]}
                />
            </>
        );
    }

    const isCounterOnly = showCounter && !showAction;
    const wrapperClass =
        'flex-auto' +
        (isCounterOnly && props.params?.counter_button_class
            ? ' ' + props.params.counter_button_class
            : '') +
        (props.params?.no_gap_between_buttons === true
            ? props.params?.button_full_width
                ? ' 0 '
                : ' pr-1 pb-2 '
            : '') +
        (showBoth ? ' mr-1' : '');

    return (
        <View className="flex-auto flex-row items-center">
            <Redirect ref={redirectRef} />
            <View key={key + '-action'} className={wrapperClass}>
                {actionButton}
            </View>
        </View>
    );
}
