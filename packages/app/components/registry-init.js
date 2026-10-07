import { registerComponent, isInited } from 'app/components/registry';

import { componentsMap as FormFields } from 'app/customization/form-fields/_map';
import { componentsMap as Elements  } from 'app/customization/elements/_map';
import { componentsMap as Molecules} from 'app/customization/molecules/_map'
import { componentsMap as Forms } from 'app/customization/forms/_map';
import { componentsMap as Layouts } from 'app/customization/page-layout/_map';
import { componentsMap as MenuItems } from 'app/customization/menu-items/_map';
import { componentsMap as Units} from 'app/customization/units/_map';
import { componentsMap as ContentList } from "app/customization/units/content-list/_map";
import { componentsMap as ProfileList} from "app/customization/units/profile-list/_map";
import { skeletonsMap as Skeletons} from 'app/customization/skeletons/_map'

function registerGroup(type, map) {
    for (const [name, Component] of Object.entries(map)) {
        if (Component) {
            registerComponent(type, name, Component);
        }
    }
}

export function registerAll() {
    const already = isInited();
    // Form fields always — HMR of `_map` must replace `phone: TextField` → `Phone`.
    registerGroup('form-field', FormFields);
    if (already) return;

    registerGroup('element', Elements);
    registerGroup('molecule', Molecules);
    registerGroup('form', Forms);
    registerGroup('layout', Layouts);
    registerGroup('menu-item', MenuItems);
    registerGroup('unit', Units);
    registerGroup('content-list', ContentList);
    registerGroup('profile-list', ProfileList);
    registerGroup('skeleton', Skeletons);
}

