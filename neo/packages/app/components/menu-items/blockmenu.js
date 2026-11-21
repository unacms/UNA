import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { sanitazeUrl } from 'app/lib/util'

/**
 * A compact control in a block's header: a switcher tab (title), or with `icon` an icon-only button named by its
 * title for screen readers (the Get started block's close: Hide).
 */
export default function MenuItemBlockmenu({ title, icon, pressed, disabled, addon, onPress, href, borderShape = 'roundedRectangle' }) {
    const commonProps = {
        ...(icon ? { image: icon, accessibilityLabel: title } : { label: title }),
        // An icon-only button keeps the regular button's fill, as UNA's header buttons (.bx-btn).
        style: pressed || icon ? 'bordered' : 'borderless',
        selected: pressed,
        selectedState: 'pressed',
        controlSize: 'small',
        // An icon-only button is round, as UNA's (.bx-btn-icon).
        borderShape: icon ? 'circle' : borderShape,
        disabled,
        addon,
        haptics: 'Medium',
        onPress,
    }

    const finalHref = sanitazeUrl(href)
    if (finalHref) {
        return <NeoButtonLink {...commonProps} href={finalHref} />
    }

    return <NeoButton {...commonProps} interactive />
}
