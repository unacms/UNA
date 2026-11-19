import type { PanelSection } from './app-sidebar-entries';

/** Props shared by the web sidebar and its native stand-in. */
export type AppSidebarProps = {
    /** The page's JSON from UNA: its `url` marks the current row. */
    pageData?: { url?: string; uri?: string } | null;
};

/** One of the drawer's Preferences (app-sidebar-prefs): a choice among a few options. */
export type DrawerPref = {
    key: 'language' | 'theme' | 'sounds';
    title: string;
    /** Lucide name; it shows the current choice (the sun for the light theme). */
    icon: string;
    /** The chosen option's id. */
    value: string;
    options: { id: string; title: string }[];
    onSelect: (id: string) => void;
};

/** The drawer's menus in the native apps (app-sidebar-list): SwiftUI on iOS, the app's own rows elsewhere. */
export type AppSidebarListProps = {
    /** The panel's menus (`sys_profile_stats`...), in order, each with the title that heads it. */
    panels: PanelSection[];
    /** After the menus: language, theme, sounds. */
    prefs: DrawerPref[];
    /** The page on screen as a bare path (`comparable`), to mark its row. */
    url: string;
    onNavigate: (href: string) => void;
};
