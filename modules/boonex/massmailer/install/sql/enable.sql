SET @sName = 'bx_massmailer';

-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_options_types` WHERE `group` = 'modules');

INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) 
VALUES('modules', @sName, '_bx_massmailer_adm_stg_cpt_type', 'bx_massmailer@modules/boonex/massmailer/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));

SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId,  'bx_massmailer_general', '_bx_massmailer_adm_stg_cpt_category_general', 0, 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_massmailer_delete_sent_email_in_days', '_bx_massmailer_delete_sent_email_in_days', '365', 'digit', '', '', '', '', 1);


-- PAGE: create campaign
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_massmailer_create_campaign', '_bx_massmailer_page_title_sys_create_campaign', '_bx_massmailer_page_title_create_campaign', 'bx_massmailer', 5, 128, 1, 'create-campaign', 'page.php?i=create-campaign', '', '', '', 0, 1, 0, 'BxMassMailerPageEntry', 'modules/boonex/massmailer/classes/BxMassMailerPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_massmailer_create_campaign', 1, @sName, '_bx_massmailer_page_block_title_entry_breadcrumb', 13, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 0),
('bx_massmailer_create_campaign', 1, @sName, '_bx_massmailer_page_block_title_create_campaign', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:13:"entity_create";}', 0, 1, 1),
('bx_massmailer_create_campaign', 0, @sName, '_bx_massmailer_page_block_title_attributes', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:10:"attributes";}', 0, 0, 1);

-- PAGE: edit campaign
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_massmailer_edit_campaign', '_bx_massmailer_page_title_sys_edit_campaign', '_bx_massmailer_page_title_edit_campaign', 'bx_massmailer', 5, 128, 1, 'edit-campaign', '', '', '', '', 0, 1, 0, 'BxMassMailerPageEntry', 'modules/boonex/massmailer/classes/BxMassMailerPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_massmailer_edit_campaign', 1, @sName, '_bx_massmailer_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 0),
('bx_massmailer_edit_campaign', 1, @sName, '_bx_massmailer_page_block_title_edit_campaign', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:11:"entity_edit";}', 0, 0, 1),
('bx_massmailer_edit_campaign', 0, @sName, '_bx_massmailer_page_block_title_attributes', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:10:"attributes";}', 0, 0, 1);

-- PAGE: view campaign
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_massmailer_view_campaign', '_bx_massmailer_page_title_sys_view_campaign', '_bx_massmailer_page_title_view_campaign', 'bx_massmailer', 5, 128, 1, 'view-campaign', '', '', '', '', 0, 1, 0, 'BxMassMailerPageEntry', 'modules/boonex/massmailer/classes/BxMassMailerPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_massmailer_view_campaign', 1, @sName, '_bx_massmailer_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 0),
('bx_massmailer_view_campaign', 1, @sName, '_bx_massmailer_page_block_title_view_campaign_info', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:12:"campagn_info";}', 0, 0, 1),
('bx_massmailer_view_campaign', 1, @sName, '_bx_massmailer_page_block_title_view_campaign_subscribers', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:19:"campagn_subscribers";}', 0, 0, 2),
('bx_massmailer_view_campaign', 1, @sName, '_bx_massmailer_page_block_title_view_campaign_links', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:13:"campagn_links";}', 0, 0, 3);

-- PAGE: campaigns administration
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_massmailer_campaigns', '_bx_massmailer_page_title_sys_manage_campaigns', '_bx_massmailer_page_title_manage_campaigns', @sName, 5, 128, 1, 'massmailer-campaigns', 'page.php?i=massmailer-campaigns', '', '', '', 0, 1, 0, 'BxMassMailerPageBrowse', 'modules/boonex/massmailer/classes/BxMassMailerPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_massmailer_campaigns', 1, @sName, '_bx_massmailer_page_block_title_system_manage_campaigns', '_bx_massmailer_page_block_title_manage_campaigns', 11, 128, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_massmailer\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:9:\"campaigns\";}}', 0, 1, 0),
('bx_massmailer_campaigns', 1, @sName, '_bx_massmailer_page_block_title_system_viewsubscribers', '_bx_massmailer_page_block_title_viewsubscribers', 11, 128, 'service', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:17:"total_subscribers";}', 0, 0, 1);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_massmailer_submenu', '_bx_massmailer_menu_title_submenu', 'bx_massmailer_submenu', 'bx_massmailer', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_massmailer_submenu', @sName, '_bx_massmailer_menu_set_title_submenu', 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', @sName, 'massmailer-campaigns', '_bx_massmailer_menu_item_title_system_admt_mailer', '_bx_massmailer_menu_item_title_admt_mailer', 'page.php?i=massmailer-campaigns', '', '_self', 'mail-bulk', 'a:2:{s:6:"module";s:13:"bx_massmailer";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 128, 1, 0, @iManageMenuOrder + 1);

-- MENU: account dashboard
SET @iMoAccountDashboard = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard' LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_dashboard', @sName, 'dashboard-massmailer', '_bx_massmailer_menu_item_title_system_admt_mailer', '_bx_massmailer_menu_item_title_admt_mailer', 'page.php?i=massmailer-campaigns', '', '', 'mail-bulk col-red', '', '', 128, 1, 0, 1, @iMoAccountDashboard + 1);

-- GRIDS: campaigns administration
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_massmailer_campaigns', 'Sql', 'SELECT * FROM `bx_massmailer_campaigns` WHERE 1 ', 'bx_massmailer_campaigns', 'id', 'added', '', '', 20, NULL, 'start', '', 'title', '', 'like', '', '', 2147483647, 'BxMassMailerGridCampaigns', 'modules/boonex/massmailer/classes/BxMassMailerGridCampaigns.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_massmailer_campaigns', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_massmailer_campaigns', 'title', '_bx_massmailer_grid_column_title_adm_title', '26%', 0, '22', '', 2),
('bx_massmailer_campaigns', 'author', '_bx_massmailer_grid_column_title_adm_author', '8%', 0, '22', '', 3),
('bx_massmailer_campaigns', 'segments', '_bx_massmailer_grid_column_title_adm_segment', '10%', 0, '22', '', 4),
('bx_massmailer_campaigns', 'is_one_per_account', '_bx_massmailer_grid_column_title_adm_is_one_per_account', '10%', 0, '0', '', 5),
('bx_massmailer_campaigns', 'added', '_bx_massmailer_grid_column_title_adm_date_created', '10%', 0, '15', '', 6),
('bx_massmailer_campaigns', 'date_sent', '_bx_massmailer_grid_column_title_adm_date_sent', '10%', 0, '22', '', 7),
('bx_massmailer_campaigns', 'actions', '', '24%', 0, '', '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_massmailer_campaigns', 'bulk', 'delete', '_bx_massmailer_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_massmailer_campaigns', 'single', 'edit', '_bx_massmailer_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_massmailer_campaigns', 'single', 'delete', '_bx_massmailer_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_massmailer_campaigns', 'single', 'copy', '_bx_massmailer_grid_action_title_adm_copy', 'copy', 1, 0, 4),
('bx_massmailer_campaigns', 'single', 'send_test', '_bx_massmailer_grid_action_title_adm_send_test', 'envelope-open', 1, 0, 5),
('bx_massmailer_campaigns', 'single', 'view', '_bx_massmailer_grid_action_title_adm_view', 'eye', 1, 0, 6),
('bx_massmailer_campaigns', 'single', 'send_all', '_bx_massmailer_grid_action_title_adm_send_all', 'envelope', 1, 0, 7),
('bx_massmailer_campaigns', 'independent', 'add', '_bx_massmailer_grid_action_title_adm_add', '', 0, 0, 1);

-- GRIDS: campaign subscribers
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_massmailer_letters', 'Sql', 'SELECT * FROM `bx_massmailer_letters` WHERE 1 ', 'bx_massmailer_letters', 'id', 'date_sent', '', '', 20, NULL, 'start', '', 'email', '', 'like', 'email,date_sent,date_seen,date_click', '', 2147483647, 'BxMassMailerGridLetters', 'modules/boonex/massmailer/classes/BxMassMailerGridLetters.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_massmailer_letters', 'email', '_bx_massmailer_txt_title_email', '55%', 0, '48', '', 1),
('bx_massmailer_letters', 'date_sent', '_bx_massmailer_txt_title_date_sent', '15%', 0, '0', '', 2),
('bx_massmailer_letters', 'date_seen', '_bx_massmailer_txt_title_date_seen', '15%', 0, '0', '', 3),
('bx_massmailer_letters', 'date_click', '_bx_massmailer_txt_title_date_click', '15%', 0, '0', '', 4);

-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
(@sName, '_bx_massmailer_email_name', 'bx_massmailer_email', '_bx_massmailer_email_subject', '_bx_massmailer_email_body');

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_massmailer', 'use massmailer', NULL, '_bx_massmailer_acl_action_use_massmailer', '', 1, 3);
SET @iIdActionUseMassmailer = LAST_INSERT_ID();

SET @iAdministrator = 8;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES
(@iAdministrator, @iIdActionUseMassmailer);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_massmailer_cron', '0 1 * * *', 'BxMassMailerCron', 'modules/boonex/massmailer/classes/BxMassMailerCron.php', '');


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxMassMailerAlertsResponse', 'modules/boonex/massmailer/classes/BxMassMailerAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'change_receive_news', @iHandler);
