import { memo } from "react";
import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each menu item type is its own chunk (see lib/dynamic-fallback.js).
const Link = dynamic(() => import('./link'), { loading: DynamicFallback });
const Button = dynamic(() => import('./button'), { loading: DynamicFallback });
const Element = dynamic(() => import('./element'), { loading: DynamicFallback });
const Callback = dynamic(() => import('./callback'), { loading: DynamicFallback });
const Modal = dynamic(() => import('./modal'), { loading: DynamicFallback });
const DropdownItem = dynamic(() => import('./dropdown-item'), { loading: DynamicFallback });
const Submenu = dynamic(() => import('./submenu'), { loading: DynamicFallback });
const Blockmenu = dynamic(() => import('./blockmenu'), { loading: DynamicFallback });
const TopMenu = dynamic(() => import('./topmenu'), { loading: DynamicFallback });
const Sidebar = dynamic(() => import('./sidebar'), { loading: DynamicFallback });
const Unit = dynamic(() => import('./unit'), { loading: DynamicFallback });
const SidebarWithWrapper = dynamic(() => import('./sidebar-with-wrapper'), { loading: DynamicFallback });

export const componentsMapDefault = {
    link: memo(Link),
    button: memo(Button),
    element: memo(Element),
    callback: memo(Callback),
   // modal: memo(Callback),
    modal: memo(Modal),
    dropdown: memo(DropdownItem),
    sidebar: memo(Sidebar),
    unit: memo(Unit),
    sidebar_with_wrapper: memo(SidebarWithWrapper),
    submenu: memo(Submenu),
    blockmenu: memo(Blockmenu),
    topmenu: memo(TopMenu),
};
