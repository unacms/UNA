import { appSetting } from 'app/lib/util'
import { Button } from 'app/design/controls/buttons';
import { ButtonsGroup, NeoButtonsGroup } from 'app/design/controls/button_groups';

export function ButtonMenuGroupItem({ variant, ...rest }) {
    return (
        <Button
            grouped={true}
            variant='text'
            {...rest}
        />
    );
}

export function ButtonsGroupMenu(props) {
    const {
        variant,
        size = 'xs',
        rounded = true,
        children,
        ...rest
    } = props;

    return (
        <ButtonsGroup
            fullWidth={true}
            variant={variant ?? appSetting('layout', 'button_style_for_actions')}
            size={size}
            rounded={rounded}
            {...rest}
        >
            {children}
        </ButtonsGroup>
    )
}

function ButtonMenuAction({
    variant,
    size = 'sm',
    rounded = true,
    pressed = false,
    disabled = false,
    fullWidth = false,
    ...rest
}) {
    return (
        <Button
            variant={variant ?? appSetting('layout', 'button_style_for_actions')}
            size={size}
            rounded={rounded}
            pressed={pressed}
            disabled={disabled}
            fullWidth={fullWidth}
            {...rest}
        />
    );
}

function ButtonMenuCounter(props) {
    const {
        variant,
        size = 'sm',
        rounded = true,
        pressed = false,
        disabled = false,
        fullWidth = false,
        ...rest
    } = props;

    return <Button
        variant={variant ?? appSetting('layout', 'button_style_for_actions')}
        size={size}
        rounded={rounded}
        pressed={pressed}
        disabled={disabled}
        fullWidth={fullWidth}
        {...rest}
    />
}

export { ButtonMenuAction as ButtonMenuActionDefault, ButtonMenuAction as ButtonMenuActionText };
export { ButtonMenuCounter as ButtonMenuCounterDefault, ButtonMenuCounter as ButtonMenuCounterText };