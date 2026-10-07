import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { sanitazeUrl } from 'app/lib/util'

/** Compact title-only control for block header switcher menus. */
export default function MenuItemBlockmenu({ title, pressed, disabled, addon, onPress, href, borderShape = 'roundedRectangle' }) {
    const commonProps = {
        label: title,
        style: pressed ? 'bordered' : 'borderless',
        selected: pressed,
        selectedState: 'pressed',
        controlSize: 'small',
        borderShape,
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
