/** Props shared by the web sidebar and its native stand-in. */
export type AppSidebarProps = {
    /** The page's JSON from UNA: its `url` marks the current row. */
    pageData?: { url?: string; uri?: string } | null;
};

/** The sidebar's menus in the native apps (app-sidebar-list): SwiftUI on iOS, the app's own rows elsewhere. */
export type AppSidebarListProps = {
    /** The panel's submenus (`sys_profile_stats`...), in order. */
    panels: string[];
    /** The page on screen as a bare path (`comparable`), to mark its row. */
    url: string;
    /** Icons only: the narrow column of a tablet. */
    narrow?: boolean;
    onNavigate: (href: string) => void;
};
