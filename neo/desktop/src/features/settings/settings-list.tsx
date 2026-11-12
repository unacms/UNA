import { Icon, type IconName } from '../../components/icon';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { SETTINGS_TABS, type SettingsTab } from '../../lib/router';
import { Pane } from '../../shell/pane';

export const SETTINGS_LABELS: Record<SettingsTab, string> = {
    account: t('Account'),
    appearance: t('Appearance'),
    notifications: t('Notifications'),
    keyboard: t('Keyboard'),
    startup: t('Start at login'),
    about: t('About', { context: 'app' }),
};

/** Each part's icon (spec 7.4). */
const SETTINGS_ICONS: Record<SettingsTab, IconName> = {
    account: 'circle-user-round',
    appearance: 'sun-moon',
    notifications: 'bell',
    keyboard: 'keyboard',
    startup: 'power',
    about: 'info',
};

/** The parts of Settings in the list pane; the open one is shown in the detail pane. */
export function SettingsList() {
    const route = useRoute();
    const { openDetail } = useNavigation();
    const open = route.detail?.kind === 'settings' ? route.detail.tab : route.detail?.kind === 'edit-profile' ? 'account' : null;
    return (
        <Pane pane="list" title={t('Settings')}>
            <nav aria-label={t('Settings')} className="settings-nav sidebar-like">
                <ul className="nav-list">
                    {SETTINGS_TABS.map((tab) => (
                        <li key={tab}>
                            <button className="nav-item" aria-current={open === tab ? 'page' : undefined} onClick={() => openDetail({ kind: 'settings', tab })}>
                                <span className="nav-icon">
                                    <Icon name={SETTINGS_ICONS[tab]} />
                                </span>
                                <span className="nav-label truncate">{SETTINGS_LABELS[tab]}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </Pane>
    );
}
