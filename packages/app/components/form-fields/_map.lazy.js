/**
 * Form fields that pull large dependencies (maps, files, rich text, payments).
 */
export const formFieldLazyLoaders = {
    editor: () => import('./editor'),
    textarea: () => import('./editor'),
    files: () => import('./files'),
    location: () => import('./location'),
    location_radius: () => import('./location_radius'),
    embed: () => import('./embed'),
    polls: () => import('./polls'),
    stripe_connect: () => import('./stripe_connect'),
    multi_field: () => import('./multi_field'),
    datetime: () => import('./datetime'),
    datepicker: () => import('./datetime'),
    select_multiple: () => import('./selector'),
    selector: () => import('./selector'),
};
