
export const settingsInputs = {
    dropdown: {
        cnt: ' rounded-2xl overflow-hidden p-1.5 bg-card/80 backdrop-blur-lg shadow-card-outline dark:shadow-card-outline-deep z-50  ',
    },
    checkbox_set: {
        // Same fill, outline and radius as an input; rows inside are inset 4px with rounded-lg corners.
        container: 'rounded-xl shadow-input-outline dark:shadow-input-outline-deep bg-input/50 p-1',
    },
    
    doublerange: {
        // A readout under the track, not input boxes: the values change only by dragging.
        container: 'w-full items-center justify-between px-2',
        value_container: 'items-baseline gap-1.5',
        text_value: 'text-sm font-medium tabular-nums text-card-foreground',
        text_info: 'text-sm text-muted-foreground',
        track_height: 4,
        thumb_size: 16,
        // Colours of the track outside the range, the range and the thumbs, as colour classes
        // (resolved per theme). `outbound_color` / `inbound_color` / `thumb_tint_color`
        // ({ light, dark }) still override them.
        track_class: 'bg-border',
        range_class: 'bg-primary',
        thumb_class: 'bg-primary',
    },
    inputs: {
        // Default radius lives in `size.*`. `full` forces a pill; `default` is for
        // shells/wrappers that need radius without size padding (matches regular).
        rounded:{
            default: 'rounded-xl',
            full: 'rounded-full',
        },
        // Size that inputs, selects and switch rows use when a field doesn't pass one.
        default_size: 'large',
        // Shared control heights + default radius — text inputs, selects, matching surfaces.
        size:{
            small: 'px-3 py-1.5 leading-4 min-h-9 rounded-lg',
            regular: 'px-3 py-2 leading-5 min-h-11 rounded-xl',
            // 52px, the height of a large NeoButton.
            large: 'px-4 py-2 leading-6 min-h-13 rounded-xl',
        },
        // Height-only tokens for chip wells / wrappers that bring their own padding.
        surface_size:{
            small: 'min-h-9',
            regular: 'min-h-11',
            large: 'min-h-13',
        },
        // Inset and gap of a chip well (labels, selector, visibility, members) per input size.
        // Its chips are small (36px) buttons with rounded-lg corners: 4px around them fills a
        // regular 44px well; in a large 52px well they sit 8px from the top and bottom and 6px
        // from the sides, which keeps their corners concentric with the well's.
        well:{
            small: 'p-1 gap-1',
            regular: 'p-1 gap-1',
            large: 'py-2 px-1.5 gap-1.5',
        },
        base: 
        'text-card-foreground placeholder:text-muted-foreground  bg-input/50 shadow-input-outline dark:shadow-input-outline-deep text-base placeholder-muted-foreground web:duration-200 web:file:text-foreground web:selection:bg-primary selection:text-primary-foreground web:focus-visible:bg-card web:focus-visible:border-ring/80 web:focus-visible:border web:focus-visible:shadow-none web:overflow-hidden',
        // Height/padding come from `size` (same as Input) so select stays in sync.
        select: ' pr-10 bg-input/50 shadow-input-outline dark:shadow-input-outline-deep web:focus:bg-card flex-auto text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',

        // Adaptive / floating eyebrow labels (`forms.adaptive_labels`)
        // Chip owns height; web `[&_label]` kills the inherited line-height strut
        // on FieldCaption's <label class="block"> so the span can flex-center.
        // Do not put h-* on the text — web Text is a <span>, height is ignored.
        adaptive_label:
            'ml-3 self-start web:[&_label]:flex web:[&_label]:items-center web:[&_label]:leading-none',
        adaptive_label_floated:
            'bg-accent px-1.5 h-5 rounded-md justify-center web:[&_label]:h-full',
        adaptive_label_text_resting: 'text-base leading-none text-muted-foreground',
        adaptive_label_text_floated: 'text-xs leading-none text-accent-foreground',
        adaptive_label_resting_offset: 0,
        adaptive_label_floated_offset: -1.5,
        adaptive_label_duration: 100,
        // Input sizes whose floated label stays inside the box, near the top edge
        // (others float it onto the top border). The input then sets its text
        // below the label, and the resting label lines up with the text.
        adaptive_label_inside_sizes: ['large'],
        adaptive_label_inside: 'ml-4',
        // Used instead of `adaptive_label_floated`: no chip, the label just
        // shrinks and keeps its resting colour, lined up with the value.
        adaptive_label_floated_inside: 'h-4 justify-center web:[&_label]:h-full',
        adaptive_label_text_floated_inside: 'text-xs leading-none text-muted-foreground',
        adaptive_label_floated_inside_offset: 6,
        // pt-5.5 + leading-6 + pb-1 = 50px, so the 1px focus border fits in min-h-13 without the box growing.
        adaptive_input_inside: 'pt-5.5 pb-1',
    },
    switcher: {
        // Container (height/padding via size.*)
        'u-controls-switcher-container':
            'items-center flex-row-reverse justify-between gap-x-2 min-w-12  flex-auto  shadow-input-outline dark:shadow-input-outline-deep bg-input/50 ',
        size: {
            small: 'min-h-10 px-2 rounded-lg',
            regular: 'min-h-11 px-3 rounded-xl',
            large: 'min-h-13 px-4 rounded-xl',
        },

        // Text
        'u-controls-switcher-text': 'text-card-foreground text-base flex-1 ',

        // Track
        'u-controls-switcher-track':
            'flex-row items-center rounded-full shrink-0 web:transition-colors web:duration-200',
        'u-controls-switcher-track-regular': 'h-7 w-14 px-1 ',
        'u-controls-switcher-track-small': 'h-4 w-8 px-0.5 ',
        'u-controls-switcher-track-large': 'h-8 w-16 px-1',
        'u-controls-switcher-track-disabled': 'opacity-50',

        // Thumb (position/scale animated in `ui/atoms/switcher.tsx` — no CSS transform transition)
        'u-controls-switcher-thumb':
            'rounded-full bg-white/90 shadow-sm',
        'u-controls-switcher-thumb-regular': 'h-5 w-7 ',
        'u-controls-switcher-thumb-small': 'h-3 w-4  ',
        'u-controls-switcher-thumb-large': 'h-6 w-8 ',

        // Thumb travel distance in px (rem=16). Used by Animated spring in switcher atom.
        thumb_travel: {
            small: 12,
            regular: 20,
            large: 24,
        },

        // Legacy active translate classes (unused by animated switcher; kept for forks)
        'u-controls-switcher-thumb-active-regular': 'translate-x-5',
        'u-controls-switcher-thumb-active-small': 'translate-x-3',
        'u-controls-switcher-thumb-active-large': 'translate-x-6',

        // Track Colors
        'u-controls-switcher-track-col':
            ' bg-border  ',
        'u-controls-switcher-track-active-col': 'bg-primary ',
    },
    checkbox: {
        // Container
        'u-controls-checkbox-container':
            'items-center px-3 py-2 rounded-lg w-full gap-2 min-h-11',

        // Hover & Active backgrounds (optional — Web-only): the fills of a chip
        // (bordered small NeoButton) at rest and hovered.
        'u-controls-checkbox-container-bg':
            'web:hover:bg-button web:active:bg-button-hover',

        // Text labels
        'u-controls-checkbox-text':
            'text-secondary-foreground text-sm leading-5 font-medium text-wrap',
        'u-controls-checkbox-text2':
            'text-muted-foreground text-sm leading-5',

        // Icon (e.g. if checkbox is custom-rendered)
        'u-controls-checkbox-icon':
            'text-foreground my-auto h-6 w-6',

        // Checkbox square indicator
        'u-controls-checkbox-indicator':
            'shrink-0 h-5 w-5 rounded-md shadow-btn-outline dark:shadow-btn-outline-deep  bg-input/50 justify-center items-center',
        // Explicit border for contrast on light card / grid surfaces
        'u-controls-checkbox-indicator-border':
            'border border-border',

        // Radiobutton circular indicator
        'u-controls-radiobutton-indicator':
            'h-5 w-5 m-1 rounded-full border-2 border-border bg-transparent justify-center items-center ',

        // Active mark inside checkbox (filled square) — no margin; parent centers it
        'u-controls-checkbox-indicator-active':
            'h-3 w-3 bg-primary rounded',

        // Active mark inside radiobutton (filled circle)
        'u-controls-radiobutton-indicator-active':
            'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center',
    },

}
