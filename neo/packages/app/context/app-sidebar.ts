'use client';
import { create } from 'zustand';

/**
 * The Application layout's sidebar as a drawer (below the `xl` breakpoint): open or not. It lives for the page, so it
 * is not a preference; the wide sidebar's expanded / narrow choice is (`sidebarNarrow` in app/context/prefs).
 */
type AppSidebarStore = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export const useAppSidebarStore = create<AppSidebarStore>()((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));

export const useAppSidebarOpen = () => useAppSidebarStore((s) => s.open);
export const setAppSidebarOpen = (open: boolean) => useAppSidebarStore.getState().setOpen(open);
