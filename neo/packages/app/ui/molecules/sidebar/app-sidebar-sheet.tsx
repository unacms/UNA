import type { AppSidebarSheetProps } from './app-sidebar-sheet.types';

/** Only an iPhone shows the menu as a sheet (app-sidebar-sheet.ios.tsx); elsewhere it is the drawer. */
export default function AppSidebarSheet(_props: Readonly<AppSidebarSheetProps>) {
    return null;
}
