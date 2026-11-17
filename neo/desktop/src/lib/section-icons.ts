/**
 * The app's icon for each section and each place a site's menu can go: one table for the sidebar's
 * fixed rows, a tab, a pane's title and a site row whose icon the app does not have. They are
 * the icons UNA's and NEO's menus draw for the same places (Connections is `users-round` there).
 * A site row's own icon (Studio's choice) wins over these wherever that row is the current one.
 */
import type { IconName } from '../components/icon';
import { SECTION_INFO } from './sections';

/** Places a site's menu names that are no section of the app's. */
const PLACE_ICONS: Readonly<Record<string, IconName>> = {
    conversations: 'message-circle',
    persons: 'user-round',
    videos: 'film',
    photos: 'image',
    albums: 'images',
    files: 'file',
};

export const SECTION_ICONS: Readonly<Record<string, IconName>> = { ...Object.fromEntries(Object.entries(SECTION_INFO).map(([section, info]) => [section, info.icon])), ...PLACE_ICONS };

/** A section's icon, or a page's for one the table does not name. */
export function sectionIcon(section: string): IconName {
    return SECTION_ICONS[section] ?? 'file-text';
}

/** An icon a site may name, with the app's own for when the app cannot draw it. */
export type ShownIcon = { name: string | null; fallback: IconName };
