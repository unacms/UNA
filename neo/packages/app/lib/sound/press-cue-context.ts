import { createContext, useContext } from 'react';
import type { PressCue } from './cues';

/**
 * The press cue for buttons inside, when their job is not a plain tap: the
 * items of a menu select, a menu's trigger opens it. A button's own `sound`
 * prop still wins.
 */
export const PressCueContext = createContext<PressCue | undefined>(undefined);

export function usePressCueOverride(): PressCue | undefined {
    return useContext(PressCueContext);
}
