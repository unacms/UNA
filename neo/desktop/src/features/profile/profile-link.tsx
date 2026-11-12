import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Schema } from 'una-api';

import { Avatar } from '../../components/avatar';
import { useOptionalNavigation } from '../../lib/navigation';
import { isWindowGesture, useOpenInWindow } from '../../lib/open-in-window';
import type { ProfileTab } from '../../lib/router';
import { profileDetail } from '../../lib/site-modules';
import { profileSummaryKey } from './graph';

type Summary = Schema<'Profile'>;

/**
 * Opens a profile (a group as a group) in the detail pane. The name and picture it was shown with are kept, so the
 * profile shows them at once while the rest loads. Null where there is no router.
 */
export function useOpenProfile(): ((profile: Summary, tab?: ProfileTab) => void) | null {
    const nav = useOptionalNavigation();
    const queryClient = useQueryClient();
    const open = useCallback(
        (profile: Summary, tab: ProfileTab = 'posts') => {
            if (!queryClient.getQueryData(profileSummaryKey(profile.id))) queryClient.setQueryData(profileSummaryKey(profile.id), profile);
            // a group opens as a group, a space as a space (by its module): about, members, joining
            nav?.openDetail(profileDetail(profile, tab));
        },
        [nav, queryClient],
    );
    return nav ? open : null;
}

/**
 * A profile's name that opens the profile: a button that reads as a link. `p` on a post or a
 * comment presses it (data-profile-link). Plain text where nothing can open a profile.
 * `rowName`: the name of a row in a people list, which its arrow keys move between (data-row-name).
 */
export function ProfileName({ profile, id, className, rowName }: { profile: Summary; id?: string; className?: string; rowName?: boolean }) {
    const open = useOpenProfile();
    const openInWindow = useOpenInWindow();
    if (!open) return <strong id={id} className={className}>{profile.display_name}</strong>;
    // Cmd+click (Ctrl+click) or Cmd+Enter: the profile, or the group, in a window of its own
    const inWindow = (e: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (!openInWindow || !isWindowGesture(e)) return false;
        openInWindow(profileDetail(profile));
        return true;
    };
    return (
        <button
            type="button"
            id={id}
            className={`profile-link${className ? ` ${className}` : ''}`}
            data-profile-link={profile.id}
            data-row-name={rowName || undefined}
            onClick={(e) => {
                if (!inWindow(e)) open(profile);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && inWindow(e)) e.preventDefault();
            }}
        >
            {profile.display_name}
        </button>
    );
}

/**
 * A profile picture that opens the profile with a click. It is not a control of its own: the
 * name next to it is (ProfileName), so keyboard and screen reader users get one stop, not two.
 */
export function ProfileAvatar({ profile, size }: { profile: Summary | null | undefined; size?: number }) {
    const open = useOpenProfile();
    if (!profile || !open) return <Avatar profile={profile} size={size} />;
    return (
        // a pointer shortcut only: the name beside it is the control
        <span className="avatar-link" aria-hidden="true" onClick={() => open(profile)}>
            <Avatar profile={profile} size={size} />
        </span>
    );
}
