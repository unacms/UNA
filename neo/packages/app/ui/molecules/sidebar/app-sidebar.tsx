import type { AppSidebarProps } from './app-sidebar.types';

/**
 * Native: no sidebar yet. The tabs and the More sheet carry the navigation; the sidebar that matches the web one
 * (the same three states and the `sys_site_panel` menu) is a separate piece of work.
 */
export default function AppSidebar(_props: AppSidebarProps) {
    return null;
}

export function AppSidebarOpenButton() {
    return null;
}
