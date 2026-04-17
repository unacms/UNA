'use client';

import { nodeFlowVariants } from 'app/customization/node-flow-variants';
import { NodeFlowDefault } from './variants/default';

/**
 * `NodeFlow` — variant dispatcher for icon-flow graphics (3+ icon nodes
 * connected by a wavy line, horizontal or vertical).
 *
 * Mirrors the registry/customization pattern of animated icons:
 * - Default variants live in `app/default/node-flow-variants.js`.
 * - Branches / forks override `default` or add new keys in
 *   `app/customization/node-flow-variants.js` — never edit the upstream
 *   registry from a fork.
 * - Unknown `variant` falls back to `default` with a dev-only warn (same
 *   shape as `Icon`'s missing-animated-icon fallback in `app/ui/atoms/icon.js`).
 *
 * Web bundle hygiene: import via `next/dynamic` at the call site so the
 * `react-native-svg` machinery stays out of routes that don't render a flow:
 *
 * ```js
 * import dynamic from 'next/dynamic';
 * const NodeFlow = dynamic(() => import('app/ui/atoms/node-flow'), { ssr: false });
 * ```
 *
 * On native, import directly: `import NodeFlow from 'app/ui/atoms/node-flow'`.
 *
 * See `variants/default.js` for the full prop list; everything besides
 * `variant` is forwarded to the resolved variant component.
 */
export function NodeFlow({ variant = 'default', ...props }) {
    const Component = nodeFlowVariants?.[variant] ?? null;

    if (!Component) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
                `[NodeFlow] Unknown variant "${variant}". Falling back to "default". ` +
                'Register custom variants in app/customization/node-flow-variants.js.',
            );
        }
        return <NodeFlowDefault {...props} />;
    }

    return <Component {...props} />;
}

export default NodeFlow;

export { buildWaveLayout } from './lib/wave-path';
