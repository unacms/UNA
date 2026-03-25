/**
 * Accordion appearance — consumed by `app/ui/atoms/accordion.js` via `appSetting('theme', 'accordion')`.
 * Override per instance with `className`, `titleClassName`, `innerClassName`, `chevronClassName`, etc.
 */
export const settingsAccordion = {
    accordion: {
        root: 'web:overflow-hidden',
        item: 'border-b border-border/60 overflow-hidden group',
        trigger:
            'flex flex-row items-center justify-between py-4 font-medium transition-all',
        /** Applied by `AccordionTriggerTitle` and when `AccordionTrigger` receives a string `title` prop */
        trigger_text: 'text-lg font-semibold text-secondary-foreground group-hover:text-foreground',
        /** Icon only — rotation is `style.transform` on `chevron_container` so NativeWind does not remount the icon when toggling open. */
        chevron: 'text-foreground',
        chevron_container: 'shrink-0 transition-transform duration-200',
        content:
            'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        /** Inner wrapper around panel children (padding + default body typography) */
        content_inner: 'pb-4 pt-4 text-base text-secondary-foreground',
    },
};
