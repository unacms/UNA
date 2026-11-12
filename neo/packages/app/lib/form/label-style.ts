import { appSetting } from 'app/lib/util';

/** How a form labels its fields: above them, or floating inside them (UNA's "adaptive"). */
export type FormLabelStyle = 'regular' | 'adaptive';

/** Field types that can draw a floating label; every other field keeps its label above it. */
const ADAPTIVE_LABEL_TYPES = new Set(['text', 'password', 'phone', 'price', 'embed']);

/**
 * The label style of a form. UNA sends it with every form as `params.label_style`
 * (Studio > Designer > Settings, or the form display's own style). `forms.adaptive_labels`
 * overrides it for the whole app: `false` never floats labels, `true` always does.
 * Anything else, a UNA without the setting included, is regular.
 */
export function resolveLabelStyle(unaStyle?: unknown): FormLabelStyle {
    const forced = appSetting('forms', 'adaptive_labels');
    if (forced === true) return 'adaptive';
    if (forced === false) return 'regular';
    return unaStyle === 'adaptive' ? 'adaptive' : 'regular';
}

/** Whether this field (its UNA input JSON plus the `label_style` its form adds) floats its label. */
export function hasAdaptiveLabel(props: {
    label_style?: unknown;
    caption?: unknown;
    format?: unknown;
    type?: unknown;
    use_caption_as_placeholder?: unknown;
} | null | undefined): boolean {
    if (!props || props.label_style !== 'adaptive') return false;
    if (!props.caption || props.format === 'notitle' || props.use_caption_as_placeholder) return false;
    return typeof props.type === 'string' && ADAPTIVE_LABEL_TYPES.has(props.type);
}
