import { useIsDesktop } from 'app/context/measure';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { sanitazeUrl } from 'app/lib/util';

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress, href }) {
    const isDesktop = useIsDesktop();
    const controlSize = isDesktop ? 'regular' : 'small';
    const borderShape = isDesktop ? 'roundedRectangle' : 'capsule';

    const commonProps = {
        label: title,
        image: icon,
        style: pressed ? 'bordered' : 'borderless',
        selected: pressed,
        selectedState: 'pressed',
        controlSize,
        borderShape,
        disabled,
        addon,
        haptics: 'Medium',
        onPress,
    };

    const finalHref = sanitazeUrl(href);
    if (finalHref) {
        return <NeoButtonLink {...commonProps} href={finalHref} />;
    }

    return <NeoButton {...commonProps} interactive />;
}