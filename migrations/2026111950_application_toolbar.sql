-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The Application layout's sidebar: the logo with the new Application toolbar menu (Search and Add) on its first row, the
-- context switcher, the menus, and the member's account at the foot, so the member's avatar item of the panel menu goes off
-- (only where it is still on as installed).
-- sys_objects_menu (object) and sys_menu_sets (set_name) have unique keys; sys_menu_items has none, so its rows are added only
-- when the menu has no item of that name.
INSERT IGNORE INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('sys_toolbar_application', '_sys_menu_title_toolbar_application', '', 'sys_toolbar_application', 'system', 34, 0, 1, 'BxTemplMenuToolbar', '');

INSERT IGNORE INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`) VALUES
('sys_toolbar_application', 'system', '_sys_menu_set_title_toolbar_application', 0);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on_pt`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_toolbar_application', 'system', 'search', '_sys_menu_item_title_system_search', '', 'javascript:void(0);', 'bx_menu_slide_inline(''#bx-sliding-menu-search'', this, ''site'');', '', 'search', '', '', 0, 2147483646, 0, 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_toolbar_application' AND `name` = 'search');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on_pt`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_toolbar_application', 'system', 'add-content', '_sys_menu_item_title_system_add_content', '', 'javascript:void(0);', 'bx_menu_slide_inline(''#bx-sliding-menu-sys_add_content'', this, ''site'');', '', 'plus', '', '', 0, 2147483646, 0, 1, 1, 1, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_toolbar_application' AND `name` = 'add-content');

UPDATE `sys_menu_items` SET `active` = 0 WHERE `set_name` = 'sys_site_panel' AND `module` = 'system' AND `name` = 'member-avatar' AND `active` = 1;
