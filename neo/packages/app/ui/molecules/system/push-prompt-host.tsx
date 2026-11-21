import type { ComponentType } from 'react';
import { components } from 'app/components/registry';

/**
 * Mounts the `push_prompt` molecule (`PushPrompt`, app/lib/push) once per layout. Through the
 * registry, so a fork can replace the dialog in `customization/molecules/_map.js`.
 */
export default function PushPromptHost() {
    const Prompt = (components['molecule'] as Record<string, ComponentType | undefined> | undefined)?.['push_prompt'];
    return Prompt ? <Prompt /> : null;
}
