/**
 * Action / counter buttons of UNA object menus (likes, reactions, scores, …)
 * and their segmented group. They keep the legacy Button vocabulary
 * (`variant`, `size`, `title`, `startDecorator`, `pressed`, …) and render
 * NeoButton through `legacyToNeoButtonProps`. Neo props passed alongside
 * (`style`, `controlSize`, `borderShape`, `label`, `image`, `selected`, …) win.
 */
import type { ReactNode } from 'react';
import { appSetting } from 'app/lib/util';
import { NeoButton } from 'app/design/controls/neo-button/neo-button';
import { NeoButtonGroup, useNeoButtonGroupItem } from 'app/design/controls/neo-button/neo-button-group';
import { legacyToNeoButtonProps } from 'app/design/controls/neo-button/legacy-button-map';
import { LEGACY_TO_CONTROL_SIZE, NEO_CONTROL_SIZES } from 'app/design/controls/neo-button/control-scale';
import type { NeoButtonProps, NeoControlSize } from 'app/design/controls/neo-button/neo-button.types';

type ButtonMenuProps = Record<string, any>;

/**
 * Adapter sizes: Neo names pass through, `xs/sm/base/lg/xl` map to Neo, and
 * anything else (`md`, `''`, unknown, none) is `small` — the legacy adapters
 * coerced those to `sm` (36px).
 */
function adapterControlSize(size: unknown): NeoControlSize {
    if (typeof size === 'string') {
        if (NEO_CONTROL_SIZES.has(size)) return size as NeoControlSize;
        if (size !== 'md' && LEGACY_TO_CONTROL_SIZE[size]) return LEGACY_TO_CONTROL_SIZE[size]!;
    }
    return 'small';
}

/** Shared adapter defaults: a stable JS render and no default haptics (consumers fire their own). */
function adapterProps(neo: NeoButtonProps, { pressed, haptics, forwardedRef }: {
    pressed: unknown;
    haptics: unknown;
    forwardedRef: unknown;
}): NeoButtonProps {
    return {
        ...neo,
        // Always a boolean: a stable JS render on native, so handlers get real
        // RN events (consumers call `event.preventDefault()` unguarded).
        selected: neo.selected ?? !!pressed,
        haptics: haptics === undefined ? false : (haptics as NeoButtonProps['haptics']),
        // A measured ref (ReactionPopover) needs the JS surface: Expo UI drops refs.
        ...(forwardedRef && neo.expoUI === undefined ? { expoUI: false } : null),
    };
}

function ButtonMenuAction({
    variant,
    size = 'sm',
    rounded = true,
    pressed = false,
    disabled = false,
    fullWidth = false,
    haptics,
    ...rest
}: ButtonMenuProps) {
    const neo = legacyToNeoButtonProps({
        ...rest,
        variant: variant ?? appSetting('layout', 'button_style_for_actions'),
        rounded,
        disabled,
        fullWidth,
        pressed,
    });
    return (
        <NeoButton
            {...adapterProps(neo, { pressed, haptics, forwardedRef: rest.forwardedRef })}
            controlSize={rest.controlSize ?? adapterControlSize(size)}
        />
    );
}

/**
 * Segment of a `ButtonsGroupMenu` / `NeoButtonGroup`: a NeoButton that takes
 * the group's style, size, corners and hit area from the group (see
 * `NeoButtonGroup`). Its own `size` sets its height (default: the group's).
 * Outside a group it renders as a plain text action.
 */
export function ButtonMenuGroupItem({
    variant: _forcedText,
    size,
    pressed = false,
    rounded: _noRounding,
    haptics,
    ...rest
}: ButtonMenuProps) {
    const group = useNeoButtonGroupItem();

    if (!group) {
        return <ButtonMenuAction {...rest} variant="text" size={size} rounded={false} pressed={pressed} haptics={haptics} />;
    }

    const neo = legacyToNeoButtonProps({ ...rest, pressed });
    return (
        <NeoButton
            {...adapterProps(neo, { pressed, haptics, forwardedRef: rest.forwardedRef })}
            controlSize={rest.controlSize ?? (size ? adapterControlSize(size) : group.controlSize)}
        />
    );
}

/**
 * Group of `ButtonMenuGroupItem`s (object menus: reactions, likes, scores…).
 * `style` is the group's button style (default: theme
 * `neo_button.group.defaultStyle`); `size` is its control size (default `sm`
 * → small). Legacy `variant`, `fullWidth` and `rounded` are ignored.
 */
export function ButtonsGroupMenu({ size, style, className, children }: {
    size?: string;
    style?: string;
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
}) {
    return (
        <NeoButtonGroup style={style} controlSize={adapterControlSize(size)} className={className}>
            {children}
        </NeoButtonGroup>
    );
}

export { ButtonMenuAction as ButtonMenuActionDefault, ButtonMenuAction as ButtonMenuActionText };
export { ButtonMenuAction as ButtonMenuCounterDefault, ButtonMenuAction as ButtonMenuCounterText };
