import { registerComponent, isInited } from 'app/components/registry';

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

