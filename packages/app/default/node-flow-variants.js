'use client';

import { NodeFlowDefault } from 'app/ui/atoms/node-flow/variants/default';

/**
 * Default `NodeFlow` variant registry. Add new upstream variants here
 * (e.g. `pipeline: NodeFlowPipeline`). Branch / fork projects must NOT
 * edit this file — they extend the registry through
 * `app/customization/node-flow-variants.js` (same contract as the animated
 * icons registry in `app/customization/animated-icons.js`).
 *
 * The dispatcher at `app/ui/atoms/node-flow/index.js` resolves the
 * `variant` prop against this map (after customization spreads it).
 */
export const nodeFlowVariants = {
    default: NodeFlowDefault,
};
