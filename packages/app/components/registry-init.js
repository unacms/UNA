import { registerComponent, isInited, setEnsureComponentResolver } from 'app/components/registry';

import { componentsMap as FormFields } from 'app/components/form-fields/_map';
import { componentsMap as Elements  } from 'app/components/elements/_map';
import { componentsMap as Molecules} from 'app/ui/molecules/_map'
import { componentsMap as Forms } from 'app/components/forms/_map';
import { componentsMap as Layouts } from 'app/components/page-layout/_map';
import { componentsMap as MenuItems } from 'app/components/menu-items/_map';
import { componentsMap as Units} from 'app/components/units/_map';
import { componentsMap as ContentList } from "app/components/units/content-list/_map";
import { componentsMap as ProfileList} from "app/components/units/profile-list/_map";
import { skeletonsMap as Skeletons} from 'app/components/skeletons/_map'

const componentMaps = {
    'form-field': FormFields,
    element: Elements,
    molecule: Molecules,
    form: Forms,
    layout: Layouts,
    'menu-item': MenuItems,
    unit: Units,
    'content-list': ContentList,
    'profile-list': ProfileList,
    skeleton: Skeletons,
};

function registerMap(type, map) {
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
    for (const [type, map] of Object.entries(componentMaps)) {
        registerMap(type, map);
    }
}

function ensureComponent(type, name) {
    const map = componentMaps[type];
    if (!map || !map[name]) {
        return null;
    }
    registerComponent(type, name, map[name]);
    return map[name];
}

setEnsureComponentResolver(ensureComponent);

