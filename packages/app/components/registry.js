const registry = {};

export function registerComponent(type, name, component) {

    if (!registry[type]) {
        registry[type] = {};
    }
    registry[type][name] = component;
}

export function getComponent(type, name) {
    const a = registry[type][name];
    if (!a){
    }
    return a;
}

export function isComponent(type, name) {
    return !!registry[type][name];
}

export function getRegisteredComponents() {
    return Object.keys(registry);
}

export function isInited() {
    return Object.keys(registry).length !== 0;
}
