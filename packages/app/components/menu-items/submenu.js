import { Platform } from 'react-native';
import { NeoButton, NeoButtonLink, useNeoButtonExpoUI } from 'app/design/controls';
import { sanitazeUrl } from 'app/lib/util';

const isWeb = Platform.OS === 'web';

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress, href }) {
    const controlSize = 'small';
    const borderShape = 'capsule';
    // Glass on every platform: native draws Expo UI glass (tinted when
    // selected), web the styled JS glass with its `pressedToggle` accent fill.
    // Do not branch on useIsDesktop() — SSR is forced desktop, then the first
    // layout effect flips it on narrow viewports and React 19 hydration
    // recovery can stack-overflow (see measure.js).
    const style = 'glass';
    const native = useNeoButtonExpoUI({ style, controlSize, borderShape });
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
        // Glass NeoButton keeps Expo UI for selected + addon counters.
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
