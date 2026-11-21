-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Account settings > Privacy: who sees the current profile, posts on it and contacts it (the profile module's
-- privacy form), in the profile section of the settings menu, on the site and in the apps.
INSERT INTO `sys_objects_page` (`object`, `uri`, `title_system`, `title`, `module`, `cover`, `layout_id`, `submenu`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `sticky_columns`)
SELECT 'sys_account_settings_privacy', 'account-settings-privacy', '_sys_page_title_system_account_settings_privacy', '_sys_page_title_account_settings_privacy', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=account-settings-privacy', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_page` WHERE `object` = 'sys_account_settings_privacy');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_account_settings_privacy', 1, 'system', '', '_sys_page_block_title_account_settings_privacy', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:24:"account_settings_privacy";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_account_settings_privacy' AND `module` = 'system' AND `title` = '_sys_page_block_title_account_settings_privacy');

SET @iMiAccountSettingsProfile = (SELECT `id` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'account-settings-section-profile' LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`, `parent_id`)
SELECT 'sys_account_settings', 'system', 'account-settings-privacy', '_sys_menu_item_title_system_account_settings_privacy', '_sys_menu_item_title_account_settings_privacy', 'page.php?i=account-settings-privacy', '', '', 'lock', '', 2147483646, 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:20:"is_privacy_available";s:5:"class";s:19:"TemplServiceAccount";}', 1, 1, 1, 6, IFNULL(@iMiAccountSettingsProfile, 0) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system' AND `name` = 'account-settings-privacy');
