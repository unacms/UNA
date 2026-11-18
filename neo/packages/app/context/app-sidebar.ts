'use client';
import { create } from 'zustand';
import type { PageLayout } from 'app/lib/header-layout';

/**
 * The Application layout's sidebar as a drawer (the web below the `xl` breakpoint, a phone in the native apps): open
 * or not. It lives for the page, so it is not a preference; the wide sidebar's expanded / narrow choice is
 * (`sidebarNarrow` in app/context/prefs).
 *
 * Native only: `layout` and `url` are those of the page on screen. The web takes them from the page it renders; in
 * the native apps the sidebar stands outside the tabs, so the focused page reports them here (components/layout.js).
 */
type AppSidebarStore = {
    open: boolean;
    layout: PageLayout | null;
    url: string;
    setOpen: (open: boolean) => void;
    setPage: (layout: PageLayout, url: string) => void;
};

export const useAppSidebarStore = create<AppSidebarStore>()((set) => ({
    open: false,
    layout: null,
    url: '',
    setOpen: (open) => set({ open }),
    setPage: (layout, url) => set((state) => (state.layout === layout && state.url === url ? state : { layout, url })),
}));

export const useAppSidebarOpen = () => useAppSidebarStore((s) => s.open);
export const setAppSidebarOpen = (open: boolean) => useAppSidebarStore.getState().setOpen(open);
export const useAppSidebarLayout = () => useAppSidebarStore((s) => s.layout);
export const useAppSidebarUrl = () => useAppSidebarStore((s) => s.url);
export const setAppSidebarPage = (layout: PageLayout, url: string) => useAppSidebarStore.getState().setPage(layout, url);
