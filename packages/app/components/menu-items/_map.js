import Link from './link';
import Button from './button';
import Element from './element';
import Callback from './callback';
import Modal from './modal';
import DropdownItem from './dropdown-item';
import Submenu from './submenu';
import Blockmenu from './blockmenu';
import TopMenu from './topmenu';
import Sidebar from './sidebar';
import Unit from './unit';
import SidebarWithWrapper from './sidebar-with-wrapper';
import { memo } from "react";

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

