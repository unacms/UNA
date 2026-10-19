SET @sName = 'bx_messenger';

-- MENUS
DELETE FROM `sys_menu_items` WHERE `set_name`=CONCAT(@sName, '_nav_menu') AND `module`=@sName AND `name`='favorites';
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
(CONCAT(@sName, '_nav_menu'), @sName, 'favorites', '_bx_messenger_nav_menu_item_title_favorites', '_bx_messenger_nav_menu_item_title_favorites', 'javascript:void(0);', '', '_self', 'star col-red2', '', 2147483647, 0, 0, 6);
