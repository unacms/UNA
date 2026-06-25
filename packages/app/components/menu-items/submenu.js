import { useIsDesktop } from 'app/context/measure';
import { NeoButtonLink } from 'app/design/controls'

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress, href }) {
    const isDesktop = useIsDesktop();
    const controlSize = isDesktop ? 'regular' : 'small';
    const borderShape = isDesktop ? 'roundedRectangle' : 'capsule';

    return (
        <NeoButtonLink
            label={title}
            href={href}
            image={icon}
            style={pressed ? 'bordered' : 'borderless'}
            selected={pressed}
            selectedState="pressed"
            controlSize={controlSize}
            borderShape={borderShape}
            disabled={disabled}
            addon={addon}
            haptics="Medium"
            onPress={onPress}
        />
    )
}
