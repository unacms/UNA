// Props shared by more-sheet.tsx (no-op) and more-sheet.ios.tsx (native sheet).

/** Items from `buildTabBarMoreMenuItems`: tab routes, a separator, overflow routes. */
export type MoreSheetItem = {
    id?: string;
    type?: 'separator' | string;
    title?: string;
    icon?: string;
    selected?: boolean;
    /** The tab-bar menu entry (native mode). */
    tab?: { url?: string; [key: string]: unknown };
    [key: string]: unknown;
};

/** Own profile heading the sheet: its menu item plus what the header shows. */
export type MoreSheetProfile = {
    item: MoreSheetItem;
    name?: string;
    avatar?: string | null;
};

export type NativeMoreSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: MoreSheetItem[];
    onSelect: (item: MoreSheetItem) => void;
    profile?: MoreSheetProfile | null;
    /** Toggles the operator agent; shown as an icon on the right of the header row. */
    onAgentPress?: () => void;
    /** Agent chat is open: the icon shows the toggled (selected) look. */
    agentActive?: boolean;
};
