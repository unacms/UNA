import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { ensureOk, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { useNavigation } from '../../lib/navigation';
import { requestSync } from '../../lib/sync';

/**
 * Act as another profile of the account (PUT /me/active-profile). UNA profiles are separate
 * identities: nothing loaded as the previous one stays on screen, in the cache, or behind Back.
 * The open detail closes, history starts over at the own profile, and the badges are the other
 * profile's. The switch answers 204, so the new Me is read before anything is shown
 * as the other profile. Rejects with the site's message.
 */
export function useSwitchProfile(): (profileId: string) => Promise<void> {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { reset } = useNavigation();
    return useCallback(
        async (profileId: string) => {
            ensureOk(await api.PUT('/me/active-profile', { body: { profile_id: profileId } }));
            const fresh = unwrap(await api.GET('/me'));
            queryClient.setQueryData(['me'], fresh);
            reset('profile');
            await queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
            requestSync();
        },
        [api, queryClient, reset],
    );
}
