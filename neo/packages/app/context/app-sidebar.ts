'use client';
import { create } from 'zustand';
import { appSetting } from 'app/lib/util';

/**
 * The sidebar as a drawer: open or not. On the web that is the Application layout's sidebar below the `xl`
 * breakpoint; in the native apps it is the app's drawer (ui/molecules/sidebar/app-sidebar.tsx). It lives for the
 * page, so it is not a preference; the web sidebar's expanded / narrow choice is (`sidebarNarrow` in
 * app/context/prefs).
 *
 * Native only: `url` is the page on screen. The web takes it from the page it renders; in the native apps the drawer
 * stands outside the tabs, so the focused page reports it here (components/layout.js).
 */
type AppSidebarStore = {
    open: boolean;
    url: string;
    /** The drawer's menus the viewer opened or closed (by menu object), kept while the app runs. */
    expanded: Record<string, boolean>;
    setOpen: (open: boolean) => void;
    setUrl: (url: string) => void;
    setExpanded: (object: string, expanded: boolean) => void;
};

export const useAppSidebarStore = create<AppSidebarStore>()((set) => ({
    open: false,
    url: '',
    expanded: {},
    setOpen: (open) => set({ open }),
    setUrl: (url) => set((state) => (state.url === url ? state : { url })),
    setExpanded: (object, expanded) => set((state) => ({ expanded: { ...state.expanded, [object]: expanded } })),
}));

export const useAppSidebarOpen = () => useAppSidebarStore((s) => s.open);
export const setAppSidebarOpen = (open: boolean) => useAppSidebarStore.getState().setOpen(open);
export const useAppSidebarUrl = () => useAppSidebarStore((s) => s.url);
export const setAppSidebarUrl = (url: string) => useAppSidebarStore.getState().setUrl(url);
/** Whether the viewer opened (`true`) or closed (`false`) one of the drawer's menus; `undefined` until they do. */
export const useAppSidebarExpanded = (object: string): boolean | undefined => useAppSidebarStore((s) => s.expanded[object]);
export const setAppSidebarExpanded = (object: string, expanded: boolean) => useAppSidebarStore.getState().setExpanded(object, expanded);

/**
 * Whether the native apps have the drawer for this viewer (`native.drawer`: `member`, `guest`). `currentUser` is
 * `null` until the app knows who is signed in: no drawer yet.
 */
export function hasAppDrawer(currentUser: unknown): boolean {
    if (currentUser === null || currentUser === undefined) return false;
    const drawer = appSetting('native', 'drawer');
    return !!(currentUser ? drawer?.member : drawer?.guest);
}
