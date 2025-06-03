import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'

// Retrieve theme settings for the 'card' component.
// Expects an object with `default`, `margin`, `rounded`, and `border` properties.
const themeSettings = appSetting('theme', 'card') || {};

/**
 * Card component.
 *
 * Styles are applied based on a hierarchy:
 * 1. Base theme styles from `themeSettings.default` (e.g., background, shadow).
 * 2. Margin: Applied from `props.margin` if provided. Otherwise, `themeSettings.margin` is used.
 *    If `props.margin` is an empty string (`""`), no margin styling is applied.
 * 3. Rounded Corners & Border: Applied from `props.rounded` if provided (this prop should handle both aspects).
 *    Otherwise, `themeSettings.rounded` and `themeSettings.border` are combined and used.
 *    If `props.rounded` is an empty string (`""`), no rounding or border styling is applied.
 * 4. Additional classes from `props.addClassName` are appended at the end, making them additive.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.margin] - Optional. Custom margin/padding classes. Overrides `themeSettings.margin`.
 *                                  Pass an empty string `""` to remove margin styling.
 * @param {string} [props.rounded] - Optional. Custom classes for rounded corners and border. Overrides `themeSettings.rounded` and `themeSettings.border`.
 *                                   Pass an empty string `""` to remove rounding and border styling.
 * @param {string} [props.addClassName=''] - Optional. Additional CSS classes to append.
 * @param {React.ReactNode} props.children - Content to be rendered inside the card.
 * @returns {JSX.Element}
 */
export default function Card(props) {
    const {
        margin: propMargin,
        rounded: propRounded,
        addClassName = ''
    } = props || {};

    const baseThemeClasses = themeSettings.default || '';

    let marginStyle = '';
    if (propMargin === '') {
        // Explicitly remove margin if propMargin is an empty string
        marginStyle = '';
    } else if (propMargin !== undefined) {
        // Use propMargin if it's defined (and not an empty string)
        marginStyle = propMargin;
    } else {
        // Fallback to themeSettings.margin
        marginStyle = themeSettings.margin || '';
    }

    let roundedBorderStyle = '';
    if (propRounded === '') {
        // Explicitly remove rounded/border if propRounded is an empty string
        roundedBorderStyle = '';
    } else if (propRounded !== undefined) {
        // Use propRounded if it's defined (and not an empty string)
        // This prop is expected to handle both rounding and border.
        roundedBorderStyle = propRounded;
    } else {
        // Fallback to combining themeSettings.rounded and themeSettings.border
        const themeRounded = themeSettings.rounded || '';
        const themeBorder = themeSettings.border || '';
        roundedBorderStyle = `${themeRounded} ${themeBorder}`.trim();
    }

    const finalClassName = [
        baseThemeClasses,
        marginStyle,
        roundedBorderStyle,
        addClassName
    ].filter(Boolean).join(' ').trim();

    return (
        <View className={finalClassName}>
            {props.children}
        </View>
    )
}

