-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Dashboard: "Your account", a block the apps draw too: the member's profile with the profile switcher, their stats as
-- tiles (Profile stats on a second menu object, with the new Tiles menu template), their preferences (Settings,
-- language, theme) and Sign out. It takes the place of the apps' own stats block and of "Your profiles".

INSERT IGNORE INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(37, 'menu_tiles.html', '_sys_menu_template_title_tiles', 1);

INSERT IGNORE INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`, `cache`) VALUES
('sys_profile_stats_tiles', '_sys_menu_title_profile_stats_tiles', '', 'sys_profile_stats', 'system', 37, 0, 1, 'BxTemplMenuProfileStats', '', 'per_user'),
('sys_dashboard_account', '_sys_menu_title_dashboard_account', '', 'sys_dashboard_account', 'system', 20, 0, 1, 'BxTemplMenuDashboardAccount', '', 'off'),
('sys_account_preferences', '_sys_menu_title_account_preferences', '', 'sys_account_preferences', 'system', 9, 0, 1, 'BxTemplMenuAccountPreferences', '', 'off');

INSERT IGNORE INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`) VALUES
('sys_dashboard_account', 'system', '_sys_menu_set_title_dashboard_account', 0),
('sys_account_preferences', 'system', '_sys_menu_set_title_account_preferences', 0);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_dashboard_account', 'system', 'profile', '_sys_menu_item_title_system_da_profile', '', '', '', '', '', '', '', 2147483646, 1, 1, 0, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_dashboard_account' AND `name` = 'profile');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_dashboard_account', 'system', 'stats', '_sys_menu_item_title_system_da_stats', '', '', '', '', '', '', 'sys_profile_stats_tiles', 2147483646, 1, 1, 0, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_dashboard_account' AND `name` = 'stats');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_dashboard_account', 'system', 'preferences', '_sys_menu_item_title_system_da_preferences', '', '', '', '', '', '', 'sys_account_preferences', 2147483646, 1, 1, 0, 3
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_dashboard_account' AND `name` = 'preferences');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_dashboard_account', 'system', 'logout', '_sys_menu_item_title_system_logout', '_sys_menu_item_title_logout', 'page.php?i=logout', '', '', 'log-out', '', '', 2147483646, 1, 1, 1, 4
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_dashboard_account' AND `name` = 'logout');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_account_preferences', 'system', 'settings', '_sys_menu_item_title_system_account_settings', '_sys_menu_item_title_account_settings', 'page.php?i=settings', '', '', 'settings', '', '', 2147483646, 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_preferences' AND `name` = 'settings');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_account_preferences', 'system', 'switch-language', '_sys_menu_item_title_system_switch_language', '_sys_menu_item_title_switch_language', 'javascript:void(0);', 'bx_menu_popup(''sys_switch_language_popup'', this, {pointer: {flip: true}});', '', 'languages', '', '', 2147483646, 1, 1, 0, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_preferences' AND `name` = 'switch-language');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_account_preferences', 'system', 'color-scheme', '_sys_menu_item_title_system_color_scheme', '_sys_menu_item_title_color_scheme', 'javascript:void(0);', 'bx_menu_popup_inline(''#bx-menu-account-preferences-color-scheme'', this, {pointer: {flip: true}});', '', 'adjust', '', '', 2147483646, 1, 1, 0, 3
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_preferences' AND `name` = 'color-scheme');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_dashboard', 2, 'system', '_sys_page_block_title_system_dashboard_account', '_sys_page_block_title_dashboard_account', 13, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"account_dashboard";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', '{"designbox": {"bg": ["tablet", "desktop"]}}', 0, 1, 1, 1, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_dashboard_account');

-- The switcher is in "Your account" now; the apps' own stats block gives way to it.
UPDATE `sys_pages_blocks` SET `active` = 0 WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_dashboard_profiles' AND `active` = 1;
UPDATE `sys_pages_blocks` SET `active_api` = 0 WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_dash_stats' AND `active_api` = 1;

-- The account menu's Settings opens the Settings section (/settings), which shows its own first page.
UPDATE `sys_menu_items` SET `link` = 'page.php?i=settings' WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'account-settings' AND `link` = 'page.php?i=account-settings-email';
