/**
 * Accordion appearance — consumed by `app/ui/atoms/accordion.js` via `appSetting('theme', 'accordion')`.
 * Override per instance with `className`, `titleClassName`, `innerClassName`, `chevronClassName`, etc.
 */
export const settingsAccordion = {
    accordion: {
        root: 'web:overflow-hidden',
        /** `overflow-hidden` only on web — on iOS it clips the chevron row when the title wraps (transform + RN layout). */
        item: 'border-b border-border/60 web:overflow-hidden web:group',
        trigger:
            'flex flex-row items-center justify-between py-4 font-medium',
        /** Applied by `AccordionTriggerTitle` and when `AccordionTrigger` receives a string `title` prop */
        trigger_text: 'text-base lg:text-lg font-semibold text-secondary-foreground web:group-hover:text-foreground',
        /** Icon only — rotation is `style.transform` on `chevron_container` so NativeWind does not remount the icon when toggling open. */
        chevron: 'text-foreground',
        chevron_container: 'shrink-0 transition-transform duration-200',
        content:
            'overflow-hidden text-sm  data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        /** Inner wrapper around panel children (padding + default body typography) */
        content_inner: 'pb-4 pt-4 text-base text-secondary-foreground',
    },
};
