import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '../../components/avatar';
import { Icon } from '../../components/icon';
import { ShortcutList } from '../../components/shortcut-list';
import { Switch } from '../../components/switch';
import { autostartAvailable, setStartAtLogin, startsAtLogin } from '../../lib/autostart';
import { useApp } from '../../lib/context';
import { useNavigation } from '../../lib/navigation';
import { SiteMark } from '../../components/site-mark';
import { readKept, siteInfoOf } from '../../lib/branding';
import { errorMessage } from '../../lib/errors';
import { APP_NAME } from '../../lib/brand';
import { LANGUAGE_NAMES, LANGUAGES, t } from '../../lib/i18n';
import { inApp, sessionLabel, SIGNED_OUT_TEXT } from '../../lib/native';
import { platform } from '../../lib/platform';
import type { SettingsTab } from '../../lib/router';
import { appSettings, chooseAppLanguage, chooseTheme, type SettingKey, type Settings, useSettings } from '../../lib/settings';
import { command, shortcutText } from '../../lib/shortcuts';
import { THEMES, type Theme, themeAnnouncement } from '../../lib/theme';
import { appUpdates, type UpdatesState, updatesAvailable, useUpdates } from '../../lib/updates';
import { useSwitchProfile } from '../profile/use-switch-profile';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { SETTINGS_LABELS } from './settings-list';

const THEME_LABELS: Record<Theme, string> = { system: t('System'), light: t('Light'), dark: t('Dark') };

/** A profile's kind, as the Profiles list says it under the name. */
const KIND_WORDS: Record<string, string> = { person: t('person'), organization: t('organization'), group: t('group') };

/** What is said when a theme is on the page but could not be kept. */
function themeNotKept(theme: Theme, reason: string): string {
    if (theme === 'system') return t('Theme follows the system, but not kept: {{reason}}', { reason });
    return theme === 'light' ? t('Light theme, but not kept: {{reason}}', { reason }) : t('Dark theme, but not kept: {{reason}}', { reason });
}

/** A polite live region for what a change did. */
function useStatus(): [string, (text: string) => void] {
    const [status, setStatus] = useState('');
    return [status, setStatus];
}

function Status({ text }: { text: string }) {
    return (
        <p className="small muted settings-status" role="status" aria-live="polite">
            {text}
        </p>
    );
}

/**
 * A setting that is on or off (spec 7.4): its label and help at the start, the switch at the
 * end. While `busy` (a change still being made) it stays enabled and focused, marked
 * aria-disabled, and ignores presses: a disabled control would drop the focus.
 */
function Toggle({ id, label, hint, checked, disabled, busy, onChange }: { id: string; label: string; hint: string; checked: boolean; disabled?: boolean; busy?: boolean; onChange: (on: boolean) => void }) {
    return (
        <div className="settings-row">
            <div className="settings-row-text">
                <label htmlFor={id} className="settings-label">
                    {label}
                </label>
                <p id={`${id}-hint`} className="settings-help">
                    {hint}
                </p>
            </div>
            <Switch id={id} checked={checked} disabled={disabled} busy={busy} describedBy={`${id}-hint`} onChange={onChange} />
        </div>
    );
}

/** A box of settings with its heading: a fieldset, so the heading is said with each control. */
function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="settings-group">
            <legend className="settings-legend">{title}</legend>
            <div className="settings-box">{children}</div>
        </fieldset>
    );
}

/** Change a setting, saying so, or why it could not be kept. */
function useSetSetting(say: (text: string) => void) {
    return <K extends SettingKey>(key: K, value: Settings[K], done: string) => {
        appSettings.set(key, value).then(
            () => say(done),
            (e: unknown) => say(t('Changed for now, but not kept: {{reason}}', { reason: errorMessage(e) })),
        );
    };
}

function Account() {
    const { me, sessions = [], sessionKey, switchNetwork, addNetwork, signOut, signingOut, siteUrl } = useApp();
    const { openDetail } = useNavigation();
    const switchProfile = useSwitchProfile();
    const [status, say] = useStatus();
    const here = sessions.find((s) => s.key === sessionKey);
    const label = here ? sessionLabel(here) : new URL(siteUrl).host;
    return (
        <>
            <section aria-labelledby="settings-networks" className="settings-section">
                <h3 id="settings-networks" className="settings-legend">
                    {t('Networks')}
                </h3>
                <div className="settings-box">
                    {sessions.length ? (
                        <ul className="settings-rows">
                            {sessions.map((s, i) => {
                                const current = s.key === sessionKey;
                                return (
                                    <li key={s.key} className="settings-row">
                                        <SiteMark site={siteInfoOf(s.siteUrl, s.siteName, readKept(s.siteUrl), s.accountName)} siteUrl={s.siteUrl} size={24} />
                                        <span className="settings-row-text">
                                            <span className="settings-label truncate">{sessionLabel(s)}</span>
                                            <span className="settings-help truncate">
                                                {s.needsSignIn ? SIGNED_OUT_TEXT : current ? t('Open now') : shortcutText(command(`switch-network-${i + 1}` as 'switch-network-1'), platform.mac)}
                                            </span>
                                        </span>
                                        {current ? null : (
                                            <button className="btn small" onClick={() => switchNetwork?.(s.key)}>
                                                {t('Switch')}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="settings-row settings-label">{label}</p>
                    )}
                </div>
                <div className="settings-actions">
                    {addNetwork && inApp ? (
                        <button className="btn" onClick={addNetwork}>
                            <Icon name="plus" />
                            {t('Add network…')}
                        </button>
                    ) : null}
                    <button className="btn" onClick={signOut} aria-disabled={signingOut || undefined} aria-busy={signingOut || undefined}>
                        <Icon name="log-out" />
                        {t('Sign out of {{name}}', { name: label })}
                    </button>
                </div>
                <p className="settings-note">{t('Signing out also deletes what the app saved of this network for reading offline.')}</p>
            </section>

            <section aria-labelledby="settings-profiles" className="settings-section">
                <h3 id="settings-profiles" className="settings-legend">
                    {t('Profiles')}
                </h3>
                <ul className="settings-rows settings-box">
                    {me.profiles.map((p) => {
                        const acting = p.id === me.active_profile_id;
                        return (
                            <li key={p.id} className="settings-row">
                                <Avatar profile={p} size={24} />
                                <span className="settings-row-text">
                                    <span className="settings-label truncate">{p.display_name}</span>
                                    <span className="settings-help">{acting ? t('Acting now') : (KIND_WORDS[p.kind] ?? p.kind)}</span>
                                </span>
                                <button className="btn small" onClick={() => openDetail({ kind: 'edit-profile', id: p.id })} aria-label={t('Edit profile: {{name}}', { name: p.display_name })}>
                                    {t('Edit profile')}
                                </button>
                                {acting ? null : (
                                    <button
                                        className="btn small"
                                        onClick={() => {
                                            switchProfile(p.id).then(
                                                () => say(t('Acting as {{name}}', { name: p.display_name })),
                                                (e: unknown) => say(errorMessage(e)),
                                            );
                                        }}
                                        aria-label={t('Act as {{name}}', { name: p.display_name })}
                                    >
                                        {t('Act as')}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </section>
            <Status text={status} />
        </>
    );
}

/**
 * The theme as three preview tiles (spec 7.4): a radio group of native radios, visually hidden
 * inside their labels, so the arrow keys move between them. The chosen tile has a bar inside its
 * edge and a check; keyboard focus is the ring outside it, a different shape.
 */
function Appearance() {
    const { theme, language } = useSettings();
    const [status, say] = useStatus();
    const name = useId();
    const languageId = useId();
    return (
        <section className="settings-section">
            <fieldset className="settings-group">
                <legend className="settings-legend">{t('Theme')}</legend>
                <div className="theme-tiles">
                    {THEMES.map((choice) => (
                        <label key={choice} className="theme-tile" data-theme-tile={choice}>
                            <input
                                className="sr-only"
                                type="radio"
                                name={name}
                                value={choice}
                                checked={theme === choice}
                                onChange={() => {
                                    chooseTheme(choice).then(
                                        () => say(themeAnnouncement(choice)),
                                        (e: unknown) => say(themeNotKept(choice, errorMessage(e))),
                                    );
                                }}
                            />
                            <span className="theme-preview" aria-hidden="true">
                                <span className="theme-preview-side" />
                                <span className="theme-preview-main" />
                                {theme === choice ? (
                                    <span className="theme-check">
                                        <Icon name="check" size={12} strong />
                                    </span>
                                ) : null}
                            </span>
                            <span className="theme-name">{THEME_LABELS[choice]}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
            <p className="settings-note">{t('The window’s title bar follows the theme too. The themes are also in the View menu and the command palette.')}</p>
            <div className="settings-box">
                <div className="settings-row">
                    <div className="settings-row-text">
                        <label htmlFor={languageId} className="settings-label">
                            {t('Language')}
                        </label>
                    </div>
                    <select
                        id={languageId}
                        value={language}
                        aria-describedby={`${languageId}-note`}
                        onChange={(e) => {
                            chooseAppLanguage(e.target.value).catch((err: unknown) => say(t('Language not kept: {{reason}}', { reason: errorMessage(err) })));
                        }}
                    >
                        <option value="system">{t('System', { context: 'language' })}</option>
                        {LANGUAGES.map((code) => (
                            <option key={code} value={code}>
                                {LANGUAGE_NAMES[code] ?? code}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <p id={`${languageId}-note`} className="settings-note">
                {t('The app’s own words. What a network says comes in this language when the network has it.')}
            </p>
            <Status text={status} />
        </section>
    );
}

function Notifications() {
    const settings = useSettings();
    const [status, say] = useStatus();
    const set = useSetSetting(say);
    return (
        <section className="settings-section">
            <Group title={t('Notifications')}>
                <Toggle
                    id="setting-os-notifications"
                    label={t('Show notifications from the system')}
                    hint={t('New notifications show as the system’s notifications while the app’s window is not in front. In front, the app says them itself.')}
                    checked={settings.osNotifications}
                    disabled={!inApp}
                    onChange={(on) => set('osNotifications', on, on ? t('System notifications on') : t('System notifications off'))}
                />
            </Group>
            <Group title={t('When the window is closed')}>
                <Toggle
                    id="setting-close-to-tray"
                    label={t(`Keep running when the window is closed`)}
                    hint={
                        platform.mac
                            ? t('Closing the window leaves the app in the Dock, with its unread count and notifications. Quit ends it.')
                            : t('Closing the window leaves the app in the tray, with its unread count and notifications. Quit ends it.')
                    }
                    checked={settings.closeToTray}
                    disabled={!inApp}
                    onChange={(on) => set('closeToTray', on, on ? t('The app keeps running when its window is closed') : t('Closing the window quits the app'))}
                />
            </Group>
            {!inApp ? <p className="settings-note">{t('These work in the desktop app.')}</p> : null}
            <Status text={status} />
        </section>
    );
}

function Keyboard() {
    const { singleKeyShortcuts, sendWithCmdEnter } = useSettings();
    const [status, say] = useStatus();
    const set = useSetSetting(say);
    const mod = platform.mac ? '⌘↩' : 'Ctrl+Enter';
    return (
        <>
            <section className="settings-section">
                <Group title={t('Keys')}>
                    <Toggle
                        id="setting-single-keys"
                        label={t('Single-key shortcuts')}
                        hint={t('Keys such as J, K, L, E and ? act without Cmd or Ctrl. Turn them off if they get in the way of speech input or other tools; Esc and the shortcuts with Cmd or Ctrl keep working.')}
                        checked={singleKeyShortcuts}
                        onChange={(on) => set('singleKeyShortcuts', on, on ? t('Single-key shortcuts on') : t('Single-key shortcuts off'))}
                    />
                    <Toggle
                        id="setting-send-with-cmd-enter"
                        label={t('Send messages with {{keys}}', { keys: mod })}
                        hint={t('In a conversation, Enter starts a new line and only {{keys}} sends. Off: Enter sends and Shift+Enter starts a new line.', { keys: mod })}
                        checked={sendWithCmdEnter}
                        onChange={(on) => set('sendWithCmdEnter', on, on ? t('Messages send with {{keys}}', { keys: mod }) : t('Messages send with Enter'))}
                    />
                </Group>
                <Status text={status} />
            </section>
            <section aria-labelledby="settings-shortcuts" className="settings-section">
                <h3 id="settings-shortcuts" className="settings-legend">
                    {t('Shortcuts')}
                </h3>
                <div className="settings-box settings-box-table">
                    <ShortcutList mac={platform.mac} singleKeys={singleKeyShortcuts} labelledBy="settings-shortcuts" />
                </div>
            </section>
        </>
    );
}

function Startup() {
    const [on, setOn] = useState<boolean | null>(null);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const [status, say] = useStatus();
    useEffect(() => {
        let live = true;
        startsAtLogin().then(
            (v) => live && setOn(v),
            (e: unknown) => {
                if (!live) return;
                setOn(false);
                say(t('Could not tell whether the app starts at login: {{reason}}', { reason: errorMessage(e) }));
            },
        );
        return () => {
            live = false;
        };
    }, [say]);
    return (
        <section className="settings-section">
            <Group title={t('Start at login')}>
                <Toggle
                    id="setting-autostart"
                    label={t('Start {{app}} when you log in', { app: APP_NAME })}
                    hint={
                        platform.mac
                            ? t('It starts with its window closed and keeps the unread count and notifications current; open it from the Dock.')
                            : t('It starts with its window closed and keeps the unread count and notifications current; open it from the tray.')
                    }
                    checked={!!on}
                    disabled={!autostartAvailable || on === null}
                    busy={busy}
                    onChange={(next) => {
                        if (busyRef.current) return;
                        busyRef.current = true;
                        setBusy(true);
                        setStartAtLogin(next)
                            .then(
                                () => {
                                    setOn(next);
                                    say(next ? t('{{app}} starts when you log in', { app: APP_NAME }) : t('{{app}} no longer starts when you log in', { app: APP_NAME }));
                                },
                                (e: unknown) => say(t('Not changed: {{reason}}', { reason: errorMessage(e) })),
                            )
                            .finally(() => {
                                busyRef.current = false;
                                setBusy(false);
                            });
                    }}
                />
            </Group>
            {!autostartAvailable ? <p className="settings-note">{t('This works in the desktop app.')}</p> : null}
            <Status text={status} />
        </section>
    );
}

/** What Settings > About says of updates: the last answer, or that a check is under way. */
export function updateStatusText(state: UpdatesState): string {
    switch (state.phase) {
        case 'checking':
            return t('Checking for updates…');
        case 'current':
            return t('Up to date');
        case 'available':
            return t('Version {{version}} is available', { version: state.update.version });
        case 'failed':
            if (state.update) return t('Version {{version}} is available', { version: state.update.version });
            return t('Could not check: {{reason}}', { reason: state.reason });
        case 'downloading':
        case 'installing':
            return t('Installing version {{version}}…', { version: state.update.version });
        default:
            return '';
    }
}

function Updates() {
    const { checkForUpdates } = useSettings();
    const updates = useUpdates();
    const [status, say] = useStatus();
    const set = useSetSetting(say);
    const text = updateStatusText(updates);
    return (
        <>
            <Group title={t('Updates')}>
                <Toggle
                    id="setting-check-for-updates"
                    label={t('Check for updates automatically')}
                    hint={t('{{app}} looks for a new version when it starts and once a day, and asks before installing one. Off: only when you choose Check for Updates.', { app: APP_NAME })}
                    checked={checkForUpdates}
                    disabled={!updatesAvailable}
                    onChange={(on) => set('checkForUpdates', on, on ? t('Automatic update checks on') : t('Automatic update checks off'))}
                />
            </Group>
            <div className="settings-actions">
                <button className="btn" onClick={() => void appUpdates.check({ manual: true })} disabled={!updatesAvailable}>
                    <Icon name="refresh-cw" />
                    {t('Check for Updates…')}
                </button>
                {appUpdates.pending ? (
                    <button className="btn btn-primary" onClick={() => appUpdates.openDialog()}>
                        {t('Update to {{version}}…', { version: appUpdates.pending.version })}
                    </button>
                ) : null}
            </div>
            {text ? <p className="settings-note">{text}</p> : null}
            {!updatesAvailable ? <p className="settings-note">{t('This works in the desktop app.')}</p> : null}
            <Status text={status} />
        </>
    );
}

function About() {
    const { siteUrl, runCommand } = useApp();
    return (
        <section className="settings-section">
            <dl className="settings-facts settings-box">
                <dt>{t('Version')}</dt>
                <dd>{__APP_VERSION__}</dd>
                <dt>{t('Network')}</dt>
                <dd>{siteUrl}</dd>
            </dl>
            <Updates />
            <div className="settings-actions">
                <button className="btn" onClick={() => runCommand?.('report-issue')}>
                    <Icon name="bug" />
                    {t('Report an issue')}
                </button>
            </div>
        </section>
    );
}

/** One part of Settings in the detail pane. */
export function SettingsPanel({ tab }: { tab: SettingsTab }) {
    return (
        <Pane pane="detail" title={SETTINGS_LABELS[tab]} actions={<CloseDetailButton />}>
            <div className="column settings">
                {tab === 'account' ? <Account /> : null}
                {tab === 'appearance' ? <Appearance /> : null}
                {tab === 'notifications' ? <Notifications /> : null}
                {tab === 'keyboard' ? <Keyboard /> : null}
                {tab === 'startup' ? <Startup /> : null}
                {tab === 'about' ? <About /> : null}
            </div>
        </Pane>
    );
}
