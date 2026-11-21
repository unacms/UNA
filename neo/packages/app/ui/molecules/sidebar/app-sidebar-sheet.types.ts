import type { ReactElement } from 'react';
import type { AppSidebarListProps } from './app-sidebar.types';

/** The menu as a sheet (app-sidebar-sheet): an iPhone's place for what the drawer holds elsewhere. */
export type AppSidebarSheetProps = AppSidebarListProps & {
    open: boolean;
    onClose: () => void;
    /** Above the menus: the member's profile and switcher, or a guest's Log In and Sign Up. React Native content. */
    head: ReactElement;
};
