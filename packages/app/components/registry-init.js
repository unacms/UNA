import { registerComponent, isInited } from 'app/components/registry';
import { createLazyComponent } from 'app/components/registry-lazy';

import { componentsMap as FormFields } from 'app/customization/form-fields/_map';
import { formFieldLazyLoaders } from 'app/components/form-fields/_map.lazy';
import { componentsMap as Elements } from 'app/customization/elements/_map';
import { elementLazyLoaders } from 'app/components/elements/_map.lazy';
import { componentsMap as Molecules } from 'app/customization/molecules/_map';
import { componentsMap as Forms } from 'app/customization/forms/_map';
import { componentsMap as Layouts } from 'app/customization/page-layout/_map';
import { layoutLazyLoaders } from 'app/components/page-layout/_map.lazy';
import { componentsMap as MenuItems } from 'app/customization/menu-items/_map';
import { componentsMap as Units } from 'app/customization/units/_map';
import { componentsMap as ContentList } from 'app/customization/units/content-list/_map';
import { componentsMap as ProfileList } from 'app/customization/units/profile-list/_map';
import { skeletonsMap as Skeletons } from 'app/customization/skeletons/_map';

function registerSyncMap(type, map) {
    for (const [name, Component] of Object.entries(map)) {
        if (Component) {
            registerComponent(type, name, Component);
        }
    }
}

function registerLazyMap(type, loaders) {
    for (const [name, loader] of Object.entries(loaders)) {
        if (loader) {
            registerComponent(type, name, createLazyComponent(loader));
        }
    }
}

export function registerAll() {
    if (!isInited()) {
        registerSyncMap('form-field', FormFields);
        registerLazyMap('form-field', formFieldLazyLoaders);

        registerSyncMap('element', Elements);
        registerLazyMap('element', elementLazyLoaders);

        registerSyncMap('molecule', Molecules);
        registerSyncMap('form', Forms);

        registerSyncMap('layout', Layouts);
        registerLazyMap('layout', layoutLazyLoaders);

        registerSyncMap('menu-item', MenuItems);
        registerSyncMap('unit', Units);
        registerSyncMap('content-list', ContentList);
        registerSyncMap('profile-list', ProfileList);
        registerSyncMap('skeleton', Skeletons);
    }
}
