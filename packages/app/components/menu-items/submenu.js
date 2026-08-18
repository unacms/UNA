import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { sanitazeUrl } from 'app/lib/util';

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress, href }) {
    const controlSize = 'small';
    const borderShape = 'capsule';
    // Do not branch on useIsDesktop() — SSR is forced desktop, then the first
    // layout effect flips it on narrow viewports and React 19 hydration
    // recovery can stack-overflow (see measure.js).
    // Capsule + selected use JS NeoButton (rounded-full). Native glass maps to
    // Material elevated, which is not pill-shaped on Android.
    const style = pressed ? 'bordered' : 'borderless';
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
    if (finalHref && !onPress) {
        return <NeoButtonLink {...commonProps} href={finalHref} />;
    }
    return <NeoButton {...commonProps} interactive />;
}
