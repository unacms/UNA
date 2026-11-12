/**
 * The app's icon for each section and each place a site's menu can go: one table for the sidebar's
 * fixed rows, a tab, a pane's title and a site row whose icon the app does not have. They are
 * the icons UNA's and NEO's menus draw for the same places (Connections is `users-round` there).
 * A site row's own icon (Studio's choice) wins over these wherever that row is the current one.
 */
import type { IconName } from '../components/icon';

export const SECTION_ICONS: Readonly<Record<string, IconName>> = {
    home: 'house',
    explore: 'compass',
    notifications: 'bell',
    messages: 'message-circle',
    conversations: 'message-circle',
    profile: 'circle-user-round',
    connections: 'users-round',
    people: 'user-round',
    persons: 'user-round',
    posts: 'newspaper',
    discussions: 'messages-square',
    events: 'calendar',
    groups: 'users-round',
    spaces: 'orbit',
    tasks: 'list-checks',
    media: 'film',
    videos: 'film',
    photos: 'image',
    albums: 'images',
    files: 'file',
    search: 'search',
    settings: 'settings',
    page: 'file-text',
};

/** A section's icon, or a page's for one the table does not name. */
export function sectionIcon(section: string): IconName {
    return SECTION_ICONS[section] ?? 'file-text';
}

/** An icon a site may name, with the app's own for when the app cannot draw it. */
export type ShownIcon = { name: string | null; fallback: IconName };
