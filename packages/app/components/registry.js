const registry = {};
let ensureComponentResolver;

export function registerComponent(type, name, component) {
    if (!registry[type]) {
        registry[type] = {};
    }
    registry[type][name] = component;
}

export function setEnsureComponentResolver(resolver) {
    ensureComponentResolver = resolver;
}

export function getComponent(type, name) {
    const component = registry[type]?.[name];
    if (!component && ensureComponentResolver) {
        ensureComponentResolver(type, name);
        return registry[type]?.[name];
    }
    return component;
}

export function isComponent(type, name) {
    return !!registry[type]?.[name];
}

export function getRegisteredComponents() {
    return Object.keys(registry);
}

export function isInited() {
    return Object.keys(registry).length !== 0;
}
