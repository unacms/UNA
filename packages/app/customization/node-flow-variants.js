'use client';

import { nodeFlowVariants as nodeFlowVariantsDefault } from 'app/default/node-flow-variants';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// Branch / fork projects: spread the defaults and add or override variants
// here. The dispatcher in `app/ui/atoms/node-flow` reads from this file, so
// any consumer calling `<NodeFlow variant="..." />` automatically picks up
// what is registered. Mirrors the customization pattern of
// `app/customization/animated-icons.js`.
//
// Example:
//
//     import { nodeFlowVariants as nodeFlowVariantsDefault } from 'app/default/node-flow-variants';
//     import { NodeFlowOnboarding } from 'app/ui/atoms/node-flow/variants/onboarding';
//
//     export const nodeFlowVariants = {
//         ...nodeFlowVariantsDefault,
//         onboarding: NodeFlowOnboarding,
//         // Override the default look entirely:
//         // default: NodeFlowOnboarding,
//     };

export const nodeFlowVariants = {
    ...nodeFlowVariantsDefault,
};
