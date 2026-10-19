-- MENUS
DELETE FROM `sys_menu_items` WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='reactions';
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`, `hidden_on_col`) VALUES
('bx_forum_snippet_meta_main', 'bx_forum', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, 0, 0, 1, 4, 3);

UPDATE `sys_menu_items` SET `order`='5' WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='comments';
UPDATE `sys_menu_items` SET `order`='6' WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='sticked';
UPDATE `sys_menu_items` SET `order`='7' WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='locked';
UPDATE `sys_menu_items` SET `order`='8' WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='status';
