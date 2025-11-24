import { registerComponent, isInited, setEnsureComponentResolver } from 'app/components/registry';

const componentMapLoaders = {
    'form-field': () => require('app/components/form-fields/_map').componentsMap,
    element: () => require('app/components/elements/_map').componentsMap,
    molecule: () => require('app/ui/molecules/_map').componentsMap,
    form: () => require('app/components/forms/_map').componentsMap,
    layout: () => require('app/components/page-layout/_map').componentsMap,
   // 'menu-item': () => require('app/components/menu-items/_map').componentsMap,
   // unit: () => require('app/components/units/_map').componentsMap,
   // 'content-list': () => require('app/components/units/content-list/_map').componentsMap,
   // 'profile-list': () => require('app/components/units/profile-list/_map').componentsMap,
   // skeleton: () => require('app/components/skeletons/_map').skeletonsMap,
};

const componentMapsCache = {};

function getComponentMap(type) {
    if (componentMapsCache[type]) {
        return componentMapsCache[type];
    }
    const loader = componentMapLoaders[type];
    if (!loader) {
        return null;
    }
    const map = loader();
    componentMapsCache[type] = map;
    return map;
}

function registerMap(type) {
    const map = getComponentMap(type);
    if (!map) {
        return;
    }
    for (const [name, Component] of Object.entries(map)) {
        if (Component) {
            registerComponent(type, name, Component);
        }
    }
}

export function registerAll() {
    if (isInited()) {
        return;
    }
    for (const type of Object.keys(componentMapLoaders)) {
        registerMap(type);
    }
}

function ensureComponent(type, name) {
    const map = getComponentMap(type);
    if (!map) {
        return null;
    }
    const Component = map[name];
    if (Component) {
        registerComponent(type, name, Component);
    }
    return Component;
}

setEnsureComponentResolver(ensureComponent);

