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

export function registerAll() {
    if (!isInited()){
        for (const [name, Component] of Object.entries(FormFields)) {
            if (Component) {
                registerComponent('form-field', name, Component);
            }
        }
        for (const [name, Component] of Object.entries(Elements)) {
            if (Component) {
                registerComponent('element', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(Molecules)) {
            if (Component) {
                registerComponent('molecule', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(Forms)) {
            if (Component) {
                registerComponent('form', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(Layouts)) {
            if (Component) {
                registerComponent('layout', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(MenuItems)) {
            if (Component) {
                registerComponent('menu-item', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(Units)) {
            if (Component) {
                registerComponent('unit', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(ContentList)) {
            if (Component) {
                registerComponent('content-list', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(ProfileList)) {
            if (Component) {
                registerComponent('profile-list', name, Component);
            }
        }

        for (const [name, Component] of Object.entries(Skeletons)) {
            if (Component) {
                registerComponent('skeleton', name, Component);
            }
        }
    }
}

