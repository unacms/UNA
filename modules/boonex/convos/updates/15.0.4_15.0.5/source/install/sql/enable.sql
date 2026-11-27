
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_convos', '_bx_cnv', 'bx_convos@modules/boonex/convos/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_convos', '_bx_cnv', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_convos_preview_messages_num', '3', @iCategId, '_bx_cnv_option_preview_messages_num', 'digit', '', '', '', 1);

-- PAGE: dash
SET @iPBCellDashboard = 3;
SET @iPBOrderDashboard = 0;
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_dashboard', @iPBCellDashboard, 'bx_convos', '_bx_cnv_page_block_title_convos', 11, 2147483644, 'service', 'a:3:{s:6:"module";s:9:"bx_convos";s:6:"method";s:17:"messages_previews";s:6:"params";a:2:{i:0;i:0;i:1;b:0;}}', 0, 1, 0, @iPBOrderDashboard);


-- PAGE: create entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_create_entry', '_bx_cnv_page_title_sys_create_entry', '_bx_cnv_page_title_create_entry', 'bx_convos', 5, 2147483647, 1, 'start-convo', 'page.php?i=start-convo', '', '', '', 0, 1, 0, 'BxCnvPageBrowse', 'modules/boonex/convos/classes/BxCnvPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_convos_create_entry', 1, 'bx_convos', '_bx_cnv_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: edit entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_edit_entry', '_bx_cnv_page_title_sys_edit_entry', '_bx_cnv_page_title_edit_entry', 'bx_convos', 5, 2147483647, 0, 'edit-convo', '', '', '', '', 0, 0, 0, 'BxCnvPageBrowse', 'modules/boonex/convos/classes/BxCnvPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_convos_edit_entry', 1, 'bx_convos', '_bx_cnv_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: view entry

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_view_entry', 'view-convo', '_bx_cnv_page_title_sys_view_entry', '_bx_cnv_page_title_view_entry', 'bx_convos', 10, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxCnvPageEntry', 'modules/boonex/convos/classes/BxCnvPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_convos_view_entry', 1, 'bx_convos', '_bx_cnv_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 1, 0),
('bx_convos_view_entry', 1, 'bx_convos', '_bx_cnv_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:14:\"entity_actions\";}', 0, 0, 1, 1),
('bx_convos_view_entry', 4, 'bx_convos', '_bx_cnv_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 0),
('bx_convos_view_entry', 3, 'bx_convos', '_bx_cnv_page_block_title_entry_collaborators', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:20:\"entity_collaborators\";}', 0, 0, 1, 0),
('bx_convos_view_entry', 2, 'bx_convos', '_bx_cnv_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:13:\"entity_author\";}', 0, 0, 1, 0),
('bx_convos_view_entry', 4, 'bx_convos', '_bx_cnv_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:18:\"entity_attachments\";}', 0, 0, 1, 1),
('bx_convos_view_entry', 4, 'bx_convos', '_bx_cnv_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_convos\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1, 2);


-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_home', '_bx_cnv_page_title_sys_folder', '_bx_cnv_page_title_folder', 'bx_convos', 5, 2147483647, 1, 'convos-folder', 'modules/?r=convos/folder/1', '', '', '', 0, 1, 0, 'BxCnvPageBrowse', 'modules/boonex/convos/classes/BxCnvPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_convos_home', 1, 'bx_convos', '_bx_cnv_page_block_title_folder', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_convos";s:6:"method";s:23:"conversations_in_folder";s:6:"params";a:1:{i:0;s:11:"{folder_id}";}}', 0, 1, 0);


-- MENU: actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_view', '_bx_cnv_menu_title_view_entry', 'bx_convos_view', 'bx_convos', 9, 0, 1, 'BxCnvMenuView', 'modules/boonex/convos/classes/BxCnvMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_convos_view', 'bx_convos', '_bx_cnv_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_convos_view', 'bx_convos', 'edit-convo', '_bx_cnv_menu_item_title_system_edit_entry', '_bx_cnv_menu_item_title_edit_entry', 'page.php?i=edit-convo&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 1),
('bx_convos_view', 'bx_convos', 'delete-convo', '_bx_cnv_menu_item_title_system_delete_entry', '_bx_cnv_menu_item_title_delete_entry', 'javascript:void(0);', 'bx_cnv_delete(this, \'{content_id}\')', '', 'remove', '', 2147483647, 1, 0, 2),
('bx_convos_view', 'bx_convos', 'mark-unread-convo', '_bx_cnv_menu_item_title_system_mark_unread_entry', '_bx_cnv_menu_item_title_mark_unread_entry', 'javascript:void(0);', 'bx_cnv_mark_unread(this, \'{content_id}\')', '', 'check', '', 2147483647, 1, 0, 3);


-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_convos_submenu', '_bx_cnv_menu_title_submenu', 'bx_convos_submenu', 'bx_convos', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_convos_submenu', 'bx_convos', '_bx_cnv_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_convos_submenu', 'bx_convos', 'convos-folder-inbox', '_bx_cnv_menu_item_title_system_folder_inbox', '_bx_cnv_menu_item_title_folder_inbox', 'modules/?r=convos/folder/1', '', '', '', '', 2147483647, 1, 1, 1),
('bx_convos_submenu', 'bx_convos', 'convos-drafts', '_bx_cnv_menu_item_title_system_folder_drafts', '_bx_cnv_menu_item_title_folder_drafts', 'modules/?r=convos/folder/2', '', '', '', '', 2147483647, 1, 1, 2),
('bx_convos_submenu', 'bx_convos', 'convos-spam', '_bx_cnv_menu_item_title_system_folder_spam', '_bx_cnv_menu_item_title_folder_spam', 'modules/?r=convos/folder/3', '', '', '', '', 2147483647, 1, 1, 3),
('bx_convos_submenu', 'bx_convos', 'convos-trash', '_bx_cnv_menu_item_title_system_folder_trash', '_bx_cnv_menu_item_title_folder_trash', 'modules/?r=convos/folder/4', '', '', '', '', 2147483647, 1, 1, 4);
-- ('bx_convos_submenu', 'bx_convos', 'convos-folder-more', '_bx_cnv_menu_item_title_system_folder_more', '_bx_cnv_menu_item_title_folder_more', 'javascript:void(0);', 'bx_menu_popup(''bx_convos_menu_folders_more'', this);', '', '', '', 2147483647, 1, 1, 5)

-- TODO: Remove it completely if 'more' menu item isn't needed.
-- MENU: more folders
-- INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
-- ('bx_convos_menu_folders_more', '_bx_cnv_menu_title_folders_more', 'bx_convos_menu_folders_more', 'bx_convos', 4, 0, 1, '', '');

-- INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
-- ('bx_convos_menu_folders_more', 'bx_convos', '_bx_cnv_menu_set_title_folders_more', 0);

-- INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
-- ('bx_convos_menu_folders_more', 'bx_convos', 'convos-drafts', '_bx_cnv_menu_item_title_system_folder_drafts', '_bx_cnv_menu_item_title_folder_drafts', 'modules/?r=convos/folder/2', '', '', '', '', 2147483647, 1, 1, 1);


-- MENU: notifications
SET @iMIOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `order` < 9999);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_account_notifications', 'bx_convos', 'notifications-convos', '_bx_cnv_menu_item_title_system_convos', '_bx_cnv_menu_item_title_convos', 'modules/?r=convos/folder/1', '', '', 'comments', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:23:"get_unread_messages_num";}', '', 2147483646, 1, 0, @iMIOrder + 1);


-- MENU: the apps' menu (sys_apps_menu: the first section of the apps' sidebar, GET /api/v2/navigation), between Profile and Notifications.
-- Hidden while Messenger is enabled, whose own Messages item takes its place.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_apps_menu', 'bx_convos', 'convos-messages', '_bx_cnv_menu_item_title_system_messages', '_bx_cnv_menu_item_title_messages', 'modules/?r=convos/folder/1', '', '', 'comment', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:23:"get_unread_messages_num";}', '', 2147483646, 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:27:"is_messages_menu_item_shown";}', 1, 1, 4);

-- MENU: profile stats

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_convos', 'profile-stats-unread-messages', '_bx_cnv_menu_item_title_system_unread_messages', '_bx_cnv_menu_item_title_unread_messages', 'modules/?r=convos/folder/1', '', '', 'comments', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:23:"get_unread_messages_num";}', '', 2147483646, 1, 0, 2);

-- MENU: add menu item to profiles modules actions menu (trigger* menu sets are processed separately upon modules enable/disable)

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_actions', 'bx_convos', 'convos-compose', '_bx_cnv_menu_item_title_system_message', '_bx_cnv_menu_item_title_message', 'page.php?i=start-convo&profiles={profile_id}', '', '', 'envelope', '', 2147483646, 'a:3:{s:6:"module";s:9:"bx_convos";s:6:"method";s:18:"is_allowed_contact";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0),
('trigger_group_view_actions', 'bx_convos', 'convos-compose', '_bx_cnv_menu_item_title_system_message_group', '_bx_cnv_menu_item_title_message_group', 'page.php?i=start-convo&profiles={recipients}', '', '', 'envelope', '', 2147483646, '', 1, 0, 0);

-- GRID

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_convos', 'Sql', 'SELECT `c`.`id`, `c`.`author`, `c`.`text`, `c`.`added`, `c`.`comments`, `f`.`read_comments`, `last_reply_timestamp`, `last_reply_profile_id`, `cmt`.`cmt_text` FROM `bx_convos_conversations` AS `c` INNER JOIN `bx_convos_conv2folder` AS `f` ON (`c`.`id` = `f`.`conv_id` AND `f`.`folder_id` = {folder_id} AND `f`.`collaborator` = {profile_id}) LEFT JOIN `bx_convos_cmts` AS `cmt` ON (`cmt`.`cmt_id` = `c`.`last_reply_comment_id`)', 'bx_convos_conversations', 'id', 'last_reply_timestamp', '', 10, NULL, 'start', '', 'text', 'auto', 'comments,last_reply_timestamp', 2147483646, 'BxCnvGrid', 'modules/boonex/convos/classes/BxCnvGrid.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_convos', 'checkbox', '_sys_select', '2%', '', 1),
('bx_convos', 'collaborators', '_bx_cnv_field_collaborators', '25%', '', 2),
('bx_convos', 'last_reply_timestamp', '_bx_cnv_field_preview', '68%', '', 3),
('bx_convos', 'comments', '_bx_cnv_field_comments', '5%', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_convos', 'bulk', 'delete', '_bx_cnv_grid_action_delete', '', 1, 1),
('bx_convos', 'independent', 'add', '_bx_cnv_grid_action_compose', '', 0, 1);


-- ACL

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_convos', 'create entry', NULL, '_bx_cnv_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_convos', 'delete entry', NULL, '_bx_cnv_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_convos', 'view entry', NULL, '_bx_cnv_acl_action_view_entry', '', 0, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();


SET @iUnauthenticated = 1;
SET @iAccount = 2;
SET @iStandard = 3;
SET @iUnconfirmed = 4;
SET @iPending = 5;
SET @iSuspended = 6;
SET @iModerator = 7;
SET @iAdministrator = 8;
SET @iPremium = 9;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- entry create
(@iStandard, @iIdActionEntryCreate),
(@iModerator, @iIdActionEntryCreate),
(@iAdministrator, @iIdActionEntryCreate),
(@iPremium, @iIdActionEntryCreate),

-- entry delete
(@iStandard, @iIdActionEntryDelete),
(@iModerator, @iIdActionEntryDelete),
(@iAdministrator, @iIdActionEntryDelete),
(@iPremium, @iIdActionEntryDelete),

-- entry view
(@iUnauthenticated, @iIdActionEntryView),
(@iAccount, @iIdActionEntryView),
(@iStandard, @iIdActionEntryView),
(@iUnconfirmed, @iIdActionEntryView),
(@iPending, @iIdActionEntryView),
(@iModerator, @iIdActionEntryView),
(@iAdministrator, @iIdActionEntryView),
(@iPremium, @iIdActionEntryView);


-- LIVE UPDATES
INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
('bx_convos', 1, 'a:3:{s:6:"module";s:9:"bx_convos";s:6:"method";s:16:"get_live_updates";s:6:"params";a:3:{i:0;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:1;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:20:"notifications-convos";}i:2;s:7:"{count}";}}', 1);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_convos', 'BxCnvAlertsResponse', 'modules/boonex/convos/classes/BxCnvAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('bx_convos', 'commentPost', @iHandler),
('bx_convos', 'commentRemoved', @iHandler),
('profile', 'delete', @iHandler);


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_convos', '_bx_cnv_email_new_message', 'bx_cnv_new_message', '_bx_cnv_email_new_message_subject', '_bx_cnv_email_new_message_body'),
('bx_convos', '_bx_cnv_email_new_reply', 'bx_cnv_new_reply', '_bx_cnv_email_new_reply_subject', '_bx_cnv_email_new_reply_body');
