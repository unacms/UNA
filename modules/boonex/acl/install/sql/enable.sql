SET @sName = 'bx_acl';


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_acl', 'bx_acl@modules/boonex/acl/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_acl', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_acl_recurring_reserve', '2', @iCategId, '_bx_acl_option_recurring_reserve', 'digit', '', '', '', 1),
('bx_acl_recurring_prioritize', 'on', @iCategId, '_bx_acl_option_recurring_prioritize', 'checkbox', '', '', '', 2),
('bx_acl_show_to_unauthenticated', '', @iCategId, '_bx_acl_option_show_to_unauthenticated', 'checkbox', '', '', '', 10);


-- PAGE: view levels
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_acl_view', '_bx_acl_page_title_sys_view', '_bx_acl_page_title_view', @sName, 5, 2147483647, 1, 'acl-view', 'page.php?i=acl-view', '', '', '', 0, 1, 0, 'BxAclPageView', 'modules/boonex/acl/classes/BxAclPageView.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_acl_view', 1, @sName, '_bx_acl_page_block_title_system_view', '_bx_acl_page_block_title_view', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:6:\"bx_acl\";s:6:\"method\";s:14:\"get_block_view\";}', 0, 1, 0);


-- MENU: account settings menu
SET @iMoAccountSettings = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `order` < 9999 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_settings', 'bx_acl', 'acl-view', '_bx_acl_menu_item_title_system_acl_view', '_bx_acl_menu_item_title_acl_view', 'page.php?i=acl-view', '', '', 'shield-alt', '', '', 2147483646, 1, 0, 1, @iMoAccountSettings + 1);
-- under the current profile's section of the settings (the apps show it under the profile's name)
SET @iMiAccountSettingsProfile = (SELECT `id` FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-section-profile' LIMIT 1);
UPDATE `sys_menu_items` SET `parent_id`=IFNULL(@iMiAccountSettingsProfile, 0) WHERE `set_name`='sys_account_settings' AND `module`='bx_acl' AND `name`='acl-view';


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES 
(@sName, '_bx_acl_et_txt_name_subscription_cancel_required', 'bx_acl_subscription_cancel_required', '_bx_acl_et_txt_subject_subscription_cancel_required', '_bx_acl_et_txt_body_subscription_cancel_required');


-- ALERTS
INSERT INTO `sys_alerts_handlers`(`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxAclResponse', 'modules/boonex/acl/classes/BxAclResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'page_output_block_acl_level', @iHandler),
('acl', 'deleted', @iHandler);
