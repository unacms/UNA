/**
 * The app's sections, one entry each: what a section is called, the icon the app draws for it
 * and what Browse is called for it in the sidebar. A new section is added here and in
 * shell/section-panes.tsx (what its list pane draws); the compiler asks for both.
 */
import type { IconName } from '../components/icon';
import { t } from './i18n';
import type { Section } from './router';

export type SectionInfo = {
    name: string;
    icon: IconName;
    /** Browse's name for a section a followed module opens (Browse groups). */
    browse?: string;
};

export const SECTION_INFO: Readonly<Record<Section, SectionInfo>> = {
    home: { name: t('Home'), icon: 'house' },
    explore: { name: t('Explore'), icon: 'compass' },
    notifications: { name: t('Notifications'), icon: 'bell' },
    messages: { name: t('Messages'), icon: 'message-circle' },
    connections: { name: t('Connections'), icon: 'users-round', browse: t('Browse connections') },
    people: { name: t('People'), icon: 'user-round', browse: t('Browse people') },
    posts: { name: t('Posts'), icon: 'newspaper', browse: t('Browse posts') },
    discussions: { name: t('Discussions'), icon: 'messages-square', browse: t('Browse discussions') },
    events: { name: t('Events'), icon: 'calendar', browse: t('Browse events') },
    media: { name: t('Media'), icon: 'film', browse: t('Browse media') },
    tasks: { name: t('Tasks'), icon: 'list-checks', browse: t('Browse tasks') },
    search: { name: t('Search'), icon: 'search' },
    profile: { name: t('Profile'), icon: 'circle-user-round' },
    groups: { name: t('Groups'), icon: 'users-round', browse: t('Browse groups') },
    spaces: { name: t('Spaces'), icon: 'orbit', browse: t('Browse spaces') },
    settings: { name: t('Settings'), icon: 'settings' },
    page: { name: t('Page'), icon: 'file-text', browse: t('Browse all') },
};

export function sectionName(section: Section): string {
    return SECTION_INFO[section].name;
}

/** A sidebar row for a section, as the app names and draws it. */
export function sectionItem<S extends Section>(section: S): { section: S; label: string; icon: IconName } {
    const { name, icon } = SECTION_INFO[section];
    return { section, label: name, icon };
}
