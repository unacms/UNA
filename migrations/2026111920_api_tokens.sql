-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Personal access tokens for API v2 and the MCP server (/api/mcp), made in account settings > Connectors
-- and in Studio > Agents > Connectors (BxDolApiTokens).
CREATE TABLE IF NOT EXISTS `sys_api_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `hash` binary(32) NOT NULL,
  `hint` varchar(8) NOT NULL DEFAULT '',
  `added` int(10) unsigned NOT NULL,
  `expires` int(10) unsigned NOT NULL DEFAULT '0',
  `last_used` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash` (`hash`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB;

-- The grid of the signed-in account's tokens. sys_objects_grid, sys_grid_fields and sys_grid_actions have unique keys
-- on the object (and name), so INSERT IGNORE leaves rows that are already there alone.
INSERT IGNORE INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('sys_grid_api_tokens', 'Sql', 'SELECT `id`, `title`, `hint`, `added`, `expires`, `last_used` FROM `sys_api_tokens` WHERE `account_id` = {account_id} ', 'sys_api_tokens', 'id', '', '', '', 20, NULL, 'start', '', '', '', 'auto', '', '', 2147483646, 1, 'BxDolGridApiTokens', '');

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `hidden_on`, `order`) VALUES
('sys_grid_api_tokens', 'title', '_sys_api_tokens_txt_title', '30%', '', '', 1),
('sys_grid_api_tokens', 'hint', '_sys_api_tokens_txt_hint', '10%', '', '1', 2),
('sys_grid_api_tokens', 'added', '_sys_api_tokens_txt_added', '15%', '', '1', 3),
('sys_grid_api_tokens', 'last_used', '_sys_api_tokens_txt_last_used', '15%', '', '1', 4),
('sys_grid_api_tokens', 'expires', '_sys_api_tokens_txt_expires', '15%', '', '', 5),
('sys_grid_api_tokens', 'actions', '', '15%', '', '', 6);

INSERT IGNORE INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_grid_api_tokens', 'independent', 'add', '_sys_api_tokens_btn_add', 'plus', 0, 0, 1),
('sys_grid_api_tokens', 'single', 'delete', '_sys_api_tokens_btn_revoke', 'remove', 1, 1, 1);

-- The page (sys_objects_page has unique keys on the object and the uri).
INSERT IGNORE INTO `sys_objects_page` (`object`, `uri`, `title_system`, `title`, `module`, `cover`, `layout_id`, `submenu`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `sticky_columns`) VALUES
('sys_account_settings_connectors', 'account-settings-connectors', '_sys_page_title_system_account_settings_connectors', '_sys_page_title_account_settings_connectors', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=account-settings-connectors', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0);

-- Its block and the menu item: neither table has a unique key on them, so they are added only while missing.
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`)
SELECT 'sys_account_settings_connectors', 1, 'system', '', '_sys_page_block_title_account_settings_connectors', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:27:"account_settings_connectors";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_account_settings_connectors' AND `title` = '_sys_page_block_title_account_settings_connectors');

SET @iMiAccountSettingsAccount = (SELECT `id` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'account-settings-section-account' LIMIT 1);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`, `parent_id`)
SELECT 'sys_account_settings', 'system', 'account-settings-connectors', '_sys_menu_item_title_system_account_settings_connectors', '_sys_menu_item_title_account_settings_connectors', 'page.php?i=account-settings-connectors', '', '', 'plug', '', 2147483646, '', 1, 1, 6, IFNULL(@iMiAccountSettingsAccount, 0) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'account-settings-connectors');
