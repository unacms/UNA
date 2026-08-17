import { Platform } from 'react-native';
import { NeoButton, NeoButtonLink, useNeoButtonNative } from 'app/design/controls';
import { sanitazeUrl } from 'app/lib/util';

const isWeb = Platform.OS === 'web';

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress, href }) {
    const controlSize = 'small';
    const borderShape = 'capsule';
    // Do not branch on useIsDesktop() — SSR is forced desktop, then the first
    // layout effect flips it on narrow viewports and React 19 hydration
    // recovery can stack-overflow (see measure.js).
    const style = isWeb
        ? (pressed ? 'bordered' : 'borderless')
        : 'glass';
    const native = useNeoButtonNative({ style, controlSize, borderShape });
    const useNativeGlass = !isWeb && !!native;

    const commonProps = {
        label: title,
        image: icon,
        style,
        selected: pressed,
        selectedState: 'pressedToggle',
        controlSize,
        borderShape,
        disabled,
        // Keep addon so conductor nav counters still render. A non-empty
        // addon forces the JS NeoButton path (`canRenderNativeButton`).
        addon,
        haptics: 'Medium',
        onPress,
    };

    const finalHref = sanitazeUrl(href);
    // Custom onPress (conductor tabs) owns navigation — a Link wrapper
    // nests role=button inside <a> and double-fires router.push + pushState.
    if (finalHref && !useNativeGlass && !onPress) {
        return <NeoButtonLink {...commonProps} href={finalHref} />;
    }

    return <NeoButton {...commonProps} interactive />;
}
