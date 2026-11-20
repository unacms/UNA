
-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_chat_plus', '_bx_chat_plus_adm_stg_cpt_type', 'bx_chat_plus@modules/boonex/chat_plus/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_chat_plus_general', '_bx_chat_plus_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_chat_plus_url', '', @iCategId, '_bx_chat_plus_option_url', 'digit', '', '', 10, ''),
('bx_chat_plus_helpdesk', '', @iCategId, '_bx_chat_plus_option_helpdesk', 'checkbox', '', '', 20, ''),
('bx_chat_plus_helpdesk_guest_only', 'on', @iCategId, '_bx_chat_plus_option_helpdesk_guest_only', 'checkbox', '', '', 30, '');

-- Menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_chat_plus', 'chat-plus', '_bx_chat_plus_menu_item_title_system_entries_home', '_bx_chat_plus_menu_item_title_entries_home', 'page.php?i=chat-plus', '', '', 'comment-alt', '', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_chat_plus', 'chat-plus', '_bx_chat_plus_menu_item_title_system_entries_home', '_bx_chat_plus_menu_item_title_entries_home', 'page.php?i=chat-plus', '', '', 'comment-alt', '', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- Page

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_chat_plus_chat', 'chat-plus', '_bx_chat_plus_page_title_sys_chat', '_bx_chat_plus_page_title_chat', 'bx_chat_plus', 5, 2147483647, 1, 'page.php?i=chat-plus', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_chat_plus_chat', 1, 'bx_chat_plus', '_bx_chat_plus_page_block_title_chat', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:12:\"bx_chat_plus\";s:6:\"method\";s:10:\"chat_block\";}', 0, 1, 1);

-- Injections

INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_chat_plus', 0, 'injection_footer', 'service', 'a:2:{s:6:"module";s:12:"bx_chat_plus";s:6:"method";s:13:"helpdesk_code";}', 0, 1);

