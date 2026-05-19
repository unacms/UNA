import { createLazyComponent } from 'app/components/registry-lazy';

const registry = {};
const lazyLoaders = {};
let registryInitialized = false;

export function registerComponent(type, name, component) {
    if (!registry[type]) {
        registry[type] = {};
    }
    registry[type][name] = component;
}

/** Store loader only — React.lazy wrapper is created on first getComponent (reduces TBT). */
export function registerLazyLoader(type, name, loader) {
    if (!loader) {
        return;
    }
    if (!lazyLoaders[type]) {
        lazyLoaders[type] = {};
    }
    lazyLoaders[type][name] = loader;
}

function ensureLazyComponent(type, name) {
    if (registry[type]?.[name] || !lazyLoaders[type]?.[name]) {
        return;
    }
    registerComponent(type, name, createLazyComponent(lazyLoaders[type][name]));
}

export function getComponent(type, name) {
    ensureLazyComponent(type, name);
    return registry[type]?.[name];
}

export function isComponent(type, name) {
    return !!(registry[type]?.[name] || lazyLoaders[type]?.[name]);
}

export function getRegisteredComponents() {
    return Object.keys(registry);
}

export function isInited() {
    return registryInitialized;
}

export function markRegistryInitialized() {
    registryInitialized = true;
}
