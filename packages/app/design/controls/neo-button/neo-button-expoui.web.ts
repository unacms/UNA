import type { GetNativeIcon, NeoButtonExpoUIComponent } from 'app/design/controls/neo-button/neo-button.types';

/** Web stub — withExpo resolves `.web.ts` first so `@expo/ui` stays out of Next. */
export const NeoButtonExpoUI: NeoButtonExpoUIComponent = null;
export const getNativeIcon: GetNativeIcon = () => null;

/** Custom content (children / element `image`) stays on the JS path. */
export const hostsCustomContent = false;
