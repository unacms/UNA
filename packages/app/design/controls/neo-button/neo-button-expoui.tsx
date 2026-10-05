import type { GetNativeIcon, NeoButtonExpoUIComponent } from 'app/design/controls/neo-button/neo-button.types';

/**
 * Fallback stub. Web uses `.web.ts`; Metro picks `.ios.tsx` / `.android.tsx` on device.
 * Keep this file `.tsx`: Metro tries every platform variant of one extension before the
 * next (`ts` before `tsx`), so a `.ts` stub shadows `.ios.tsx` and disables Expo UI buttons.
 */
export const NeoButtonExpoUI: NeoButtonExpoUIComponent = null;
export const getNativeIcon: GetNativeIcon = () => null;

/** Custom content (children / element `image`) stays on the JS path. */
export const hostsCustomContent = false;
