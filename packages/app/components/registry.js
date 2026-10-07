const TYPES = [
    'form-field',
    'element',
    'molecule',
    'form',
    'layout',
    'menu-item',
    'unit',
    'content-list',
    'profile-list',
    'skeleton',
];

/**
 * Registered components by type and name, filled by `registerAll()` before
 * the first render:
 *
 *   const NoContent = components['molecule']['no_content'];
 *   const Unit = components['content-list'][module] || components['content-list']['default'];
 *
 * Read it as a plain object, not through a function: the React Compiler then
 * sees a static component (a `getComponent()` call in render trips
 * `react-hooks/static-components` and the caller is left uncompiled).
 * A missing name is `undefined` — guard with `isComponent()` or a fallback.
 */
export const components = Object.fromEntries(TYPES.map((type) => [type, {}]));

/**
 * Core form-field components (`form-fields/_map` as shipped, before fork
 * overrides), filled by that map. form-initial-values compares the registered
 * field with these instead of importing the map, which would close a require
 * cycle through the fields that use the form helpers.
 */
export const coreFormFields = {};

export function registerComponent(type, name, component) {
    (components[type] ||= {})[name] = component;
}

export function isComponent(type, name) {
    return !!components[type]?.[name];
}

export function isInited() {
    return TYPES.some((type) => Object.keys(components[type]).length > 0);
}

const warnedDeprecated = new Set();

/** @deprecated Read `components[type][name]` instead — kept for forks. */
export function getComponent(type, name) {
    const key = `${type}/${name}`;
    if (process.env.NODE_ENV !== 'production' && !warnedDeprecated.has(key)) {
        warnedDeprecated.add(key);
        console.warn(`getComponent('${type}', '${name}') is deprecated — use components['${type}']['${name}'] from 'app/components/registry'`);
    }
    return components[type]?.[name];
}
