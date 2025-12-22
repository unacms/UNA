import Link from './link';
import Button from './button';
import Element from './element';
import Callback from './callback';
import DropdownItem from './dropdown-item';
import Submenu from './submenu';
import Sidebar from './sidebar';
import Unit from './unit';
import SidebarWithWrapper from './sidebar-with-wrapper';
import { memo } from "react";

export const componentsMapDefault = {
    link: memo(Link),
    button: memo(Button),
    element: memo(Element),
    callback: memo(Callback),
    dropdown: memo(DropdownItem),
    sidebar: memo(Sidebar),
    unit: memo(Unit),
    sidebar_with_wrapper: memo(SidebarWithWrapper),
    submenu: memo(Submenu),
};

