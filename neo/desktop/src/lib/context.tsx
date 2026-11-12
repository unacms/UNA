import { createContext, useContext } from 'react';

import type { Schema, UnaApi } from 'una-api';

import type { SessionSummary } from './native';
import type { CommandId } from './shortcuts';

export type AppContextValue = {
    api: UnaApi;
    siteUrl: string;
    me: Schema<'Me'>;
    signOut: () => void;
    /** A sign-out is under way: its controls are disabled. */
    signingOut: boolean;
    /** Open a conversation with these profiles (from a profile name anywhere). */
    messageTo: (profile: Schema<'Profile'>) => void;
    /** Run an app command as the menu or its keys would (the command palette). */
    runCommand?: (id: CommandId) => void;
    /** The networks signed in to (the sidebar's switcher, Settings > Account). */
    sessions?: SessionSummary[];
    /** This session's network key (`site|account`). */
    sessionKey?: string;
    /** Make another network the active one. */
    switchNetwork?: (key: string) => void;
    /** Sign in to another network, keeping this one. */
    addNetwork?: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
    const value = useContext(AppContext);
    if (!value) throw new Error('useApp outside the signed-in app');
    return value;
}
