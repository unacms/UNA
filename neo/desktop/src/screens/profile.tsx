import { useApp } from '../lib/context';
import { t } from '../lib/i18n';
import type { ListRoute } from '../lib/router';
import { ProfileView } from '../features/profile/profile-view';
import { Pane } from '../shell/pane';

/**
 * The Profile section: a profile's page in the content pane, the acting profile's when the route
 * names none (the sidebar's Profile), at the route's tab. One's own page has Edit profile and the
 * friend requests; acting as another profile and signing out are in the profile menu and Settings.
 */
export function Profile({ list }: { list: ListRoute }) {
    const { me } = useApp();
    const active = me.profiles.find((p) => p.id === me.active_profile_id) ?? me.profiles[0];
    const id = list.profile ?? active?.id;

    if (!id) {
        return (
            <Pane pane="list" title={t('Profile')}>
                <p className="muted empty">{t('This account has no profile yet. Create one on the site.')}</p>
            </Pane>
        );
    }
    return <ProfileView key={id} id={id} tab={list.profileTab ?? 'posts'} />;
}
