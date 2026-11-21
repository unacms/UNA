-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The operators' setup checklist becomes the "Get started" onboarding checklist: a menu (sys_onboarding_operator) whose items
-- are its steps, drawn by the new standard menu template "List with descriptions", in a "Get started" block on the home page
-- and in the block library. Rows with no unique key are added only when missing; the account menu item and hidden checklists
-- move over from the setup checklist.
INSERT IGNORE INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(35, 'menu_list_desc.html', '_sys_menu_template_title_list_desc', 1);

INSERT IGNORE INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('sys_onboarding_operator', '_sys_menu_title_onboarding_operator', '', 'sys_onboarding_operator', 'system', 35, 0, 1, 'BxTemplMenuOnboarding', '');

INSERT IGNORE INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`) VALUES
('sys_onboarding_operator', 'system', '_sys_menu_set_title_onboarding_operator', 0);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_onboarding_operator', 'system', 'profile', '_sys_menu_item_title_system_onboarding_profile', '_sys_menu_item_title_onboarding_profile', '_sys_menu_item_info_onboarding_profile', 'page.php?i=account-profile-switcher', '', '', 'circle-user-round', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_onboarding_step_state";s:6:"params";a:1:{i:0;s:7:"profile";}s:5:"class";s:19:"TemplServiceAccount";}', 2147483646, '', 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'system' AND `name` = 'profile');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_onboarding_operator', 'system', 'logo', '_sys_menu_item_title_system_onboarding_logo', '_sys_menu_item_title_onboarding_logo', '_sys_menu_item_info_onboarding_logo', '{url_studio}designer.php?page=logo', '', '', 'target', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_onboarding_step_state";s:6:"params";a:1:{i:0;s:4:"logo";}s:5:"class";s:19:"TemplServiceAccount";}', 2147483646, '', 1, 1, 1, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'system' AND `name` = 'logo');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_onboarding_operator', 'system', 'cover', '_sys_menu_item_title_system_onboarding_cover', '_sys_menu_item_title_onboarding_cover', '_sys_menu_item_info_onboarding_cover', '{url_studio}designer.php?page=cover', '', '', 'gallery-vertical', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_onboarding_step_state";s:6:"params";a:1:{i:0;s:5:"cover";}s:5:"class";s:19:"TemplServiceAccount";}', 2147483646, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"is_onboarding_step_available";s:6:"params";a:1:{i:0;s:5:"cover";}s:5:"class";s:19:"TemplServiceAccount";}', 1, 1, 1, 3
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'system' AND `name` = 'cover');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_onboarding_operator', 'system', 'join', '_sys_menu_item_title_system_onboarding_join', '_sys_menu_item_title_onboarding_join', '_sys_menu_item_info_onboarding_join', '', '', '', 'user-plus', '', 2147483646, '', 1, 1, 1, 10
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'system' AND `name` = 'join');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_home', 1, 'system', '_sys_page_block_title_system_onboarding_operator', '_sys_page_block_title_onboarding', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_block_onboarding";s:6:"params";a:1:{i:0;s:23:"sys_onboarding_operator";}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_onboarding_operator');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT '', 0, 'system', '_sys_page_block_title_system_onboarding', '_sys_page_block_title_onboarding', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_block_onboarding";s:6:"params";a:1:{i:0;s:23:"sys_onboarding_operator";}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 0, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = '' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_onboarding');

UPDATE `sys_menu_items` SET `title_system` = '_sys_menu_item_title_system_onboarding', `title` = '_sys_menu_item_title_onboarding', `link` = 'index.php?onboarding=1'
WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'tour' AND `title` = '_sys_menu_item_title_setup';

UPDATE IGNORE `sys_accounts_tours` SET `tour` = 'sys_onboarding_operator' WHERE `tour` = 'home';
DELETE FROM `sys_accounts_tours` WHERE `tour` = 'home';
