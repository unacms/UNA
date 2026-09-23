import type { ReactNode } from 'react'
import { appSetting } from 'app/lib/util'
import { Button, type ButtonProps } from 'app/design/controls/buttons';
import { ButtonsGroup } from 'app/design/controls/button-groups';

const LEGACY_BUTTON_SIZES = new Set(['xs', 'sm', 'base', 'lg']);
const safeLegacySize = (size: string | undefined, fallback = 'sm') => size && LEGACY_BUTTON_SIZES.has(size) ? size : fallback;

export function ButtonMenuGroupItem({ variant, size, ...rest }: ButtonProps) {
    return (
        <Button
            grouped={true}
            variant='text'
            size={safeLegacySize(size, 'sm')}
            {...rest}
        />
    );
}

export function ButtonsGroupMenu(props: ButtonProps & { children?: ReactNode[] }) {
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
            size={safeLegacySize(size, 'xs')}
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
}: ButtonProps) {
    return (
        <Button
            variant={variant ?? appSetting('layout', 'button_style_for_actions')}
            size={safeLegacySize(size)}
            rounded={rounded}
            pressed={pressed}
            disabled={disabled}
            fullWidth={fullWidth}
            {...rest}
        />
    );
}

function ButtonMenuCounter(props: ButtonProps) {
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
        size={safeLegacySize(size)}
        rounded={rounded}
        pressed={pressed}
        disabled={disabled}
        fullWidth={fullWidth}
        {...rest}
    />
}

export { ButtonMenuAction as ButtonMenuActionDefault, ButtonMenuAction as ButtonMenuActionText };
export { ButtonMenuCounter as ButtonMenuCounterDefault, ButtonMenuCounter as ButtonMenuCounterText };