
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_resources', '_bx_resources', 'bx_resources@modules/boonex/resources/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_resources', '_bx_resources', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_resources_enable_auto_approve', 'on', @iCategId, '_bx_resources_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_resources_summary_chars', '700', @iCategId, '_bx_resources_option_summary_chars', 'digit', '', '', '', 1),
('bx_resources_plain_summary_chars', '240', @iCategId, '_bx_resources_option_plain_summary_chars', 'digit', '', '', '', 2),
('bx_resources_per_page_browse', '12', @iCategId, '_bx_resources_option_per_page_browse', 'digit', '', '', '', 10),
('bx_resources_per_page_profile', '6', @iCategId, '_bx_resources_option_per_page_profile', 'digit', '', '', '', 12),
('bx_resources_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 15),
('bx_resources_rss_num', '10', @iCategId, '_bx_resources_option_rss_num', 'digit', '', '', '', 20),
('bx_resources_searchable_fields', 'title,text', @iCategId, '_bx_resources_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:21:"get_searchable_fields";}', 30);

-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_create_entry', '_bx_resources_page_title_sys_create_entry', '_bx_resources_page_title_create_entry', 'bx_resources', 5, 2147483647, 1, 'create-resource', 'page.php?i=create-resource', '', '', '', 0, 1, 0, 'BxResourcesPageBrowse', 'modules/boonex/resources/classes/BxResourcesPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_resources_create_entry', 1, 'bx_resources', '_bx_resources_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:13:"entity_create";}', 0, 1, 1);


-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_edit_entry', '_bx_resources_page_title_sys_edit_entry', '_bx_resources_page_title_edit_entry', 'bx_resources', 5, 2147483647, 1, 'edit-resource', '', '', '', '', 0, 1, 0, 'BxResourcesPageEntry', 'modules/boonex/resources/classes/BxResourcesPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_resources_edit_entry', 1, 'bx_resources', '_bx_resources_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);


-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_delete_entry', '_bx_resources_page_title_sys_delete_entry', '_bx_resources_page_title_delete_entry', 'bx_resources', 5, 2147483647, 1, 'delete-resource', '', '', '', '', 0, 1, 0, 'BxResourcesPageEntry', 'modules/boonex/resources/classes/BxResourcesPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_resources_delete_entry', 1, 'bx_resources', '_bx_resources_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);


-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_view_entry', '_bx_resources_page_title_sys_view_entry', '_bx_resources_page_title_view_entry', 'bx_resources', 12, 2147483647, 1, 'view-resource', '', '', '', '', 0, 1, 0, 'BxResourcesPageEntry', 'modules/boonex/resources/classes/BxResourcesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_resources_view_entry', 2, 'bx_resources', '', '_bx_resources_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 2),
('bx_resources_view_entry', 2, 'bx_resources', '', '_bx_resources_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:13:"entity_author";}', 0, 0, 1, 1),
('bx_resources_view_entry', 3, 'bx_resources', '_bx_resources_page_block_title_sys_entry_context', '_bx_resources_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:14:"entity_context";}', 0, 0, 1, 1),
('bx_resources_view_entry', 3, 'bx_resources', '', '_bx_resources_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 2),
('bx_resources_view_entry', 2, 'bx_resources', '', '_bx_resources_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 1, 3),
('bx_resources_view_entry', 4, 'bx_resources', '', '_bx_resources_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:14:"entity_actions";}', 0, 0, 0, 0),
('bx_resources_view_entry', 4, 'bx_resources', '', '_bx_resources_page_block_title_entry_social_sharing', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0),
('bx_resources_view_entry', 2, 'bx_resources', '_bx_resources_page_block_title_sys_entry_comments', '_bx_resources_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:15:"entity_comments";}', 0, 0, 1, 6),
('bx_resources_view_entry', 2, 'bx_resources', '', '_bx_resources_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:14:"entity_reports";}', 0, 0, 1, 6);


-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_view_entry_comments', '_bx_resources_page_title_sys_view_entry_comments', '_bx_resources_page_title_view_entry_comments', 'bx_resources', 5, 2147483647, 1, 'view-resource-comments', '', '', '', '', 0, 1, 0, 'BxResourcesPageEntry', 'modules/boonex/resources/classes/BxResourcesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_resources_view_entry_comments', 1, 'bx_resources', '_bx_resources_page_block_title_sys_entry_comments', '_bx_resources_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:15:"entity_comments";}', 0, 0, 1);

-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_author', 'resources-author', '_bx_resources_page_title_sys_entries_of_author', '_bx_resources_page_title_entries_of_author', 'bx_resources', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxResourcesPageAuthor', 'modules/boonex/resources/classes/BxResourcesPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_resources_author', 1, 'bx_resources', '_bx_resources_page_block_title_sys_entries_of_author', '_bx_resources_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:16:"browse_resources";}', 0, 0, 1, 1);

-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_context', 'resources-context', '_bx_resources_page_title_sys_entries_in_context', '_bx_resources_page_title_entries_in_context', 'bx_resources', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxResourcesPageAuthor', 'modules/boonex/resources/classes/BxResourcesPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_resources_context', 1, 'bx_resources', '_bx_resources_page_block_title_sys_entries_in_context', '_bx_resources_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:16:"browse_resources";}', 0, 0, 1, 1);

-- PAGE: manage own entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_manage', '_bx_resources_page_title_sys_manage', '_bx_resources_page_title_manage', 'bx_resources', 5, 2147483647, 1, 'resources-manage', 'page.php?i=resources-manage', '', '', '', 0, 1, 0, 'BxResourcesPageAuthor', 'modules/boonex/resources/classes/BxResourcesPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_resources_manage', 1, 'bx_resources', '_bx_resources_page_block_title_system_manage', '_bx_resources_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_resources";s:6:"method";s:12:"manage_tools";}', 0, 1, 0);

-- PAGE: manage all entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_administration', '_bx_resources_page_title_sys_manage_administration', '_bx_resources_page_title_manage', 'bx_resources', 5, 192, 1, 'resources-administration', 'page.php?i=resources-administration', '', '', '', 0, 1, 0, 'BxResourcesPageBrowse', 'modules/boonex/resources/classes/BxResourcesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_resources_administration', 1, 'bx_resources', '_bx_resources_page_block_title_system_manage_administration', '_bx_resources_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:12:"bx_resources";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 0;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_resources', '_bx_resources_page_block_title_sys_entries_of_author', '_bx_resources_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_resources";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:25:"bx_posts_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0, 1);

SET @iPBCellContext = 0;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('trigger_page_group_view_entry', @iPBCellContext, 'bx_resources', '_bx_resources_page_block_title_sys_entries_in_context', '_bx_resources_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_resources";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:25:"bx_posts_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0, 1);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system` , `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, 'bx_resources', '', '_bx_resources_page_block_title_entries_in_context_by_category', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_resources";s:6:"method";s:26:"browse_context_by_category";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;i:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1);


-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_view', '_bx_resources_menu_title_view_entry', 'bx_resources_view', 'bx_resources', 9, 0, 1, 'BxResourcesMenuView', 'modules/boonex/resources/classes/BxResourcesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_resources_view', 'bx_resources', '_bx_resources_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_resources_view', 'bx_resources', 'edit-resource', '_bx_resources_menu_item_title_system_edit_entry', '_bx_resources_menu_item_title_edit_entry', 'page.php?i=edit-resource&id={content_id}', '', '', 'pencil-alt', '', 2147483647, '', 1, 0, 1),
('bx_resources_view', 'bx_resources', 'delete-resource', '_bx_resources_menu_item_title_system_delete_entry', '_bx_resources_menu_item_title_delete_entry', 'page.php?i=delete-resource&id={content_id}', '', '', 'remove', '', 2147483647, '', 1, 0, 3),
('bx_resources_view', 'bx_resources', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, '', 1, 0, 4);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_view_actions', '_sys_menu_title_view_actions', 'bx_resources_view_actions', 'bx_resources', 15, 0, 1, 'BxResourcesMenuViewActions', 'modules/boonex/resources/classes/BxResourcesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_resources_view_actions', 'bx_resources', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_resources_view_actions', 'bx_resources', 'edit-resource', '_bx_resources_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_resources_view_actions', 'bx_resources', 'delete-resource', '_bx_resources_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_resources_view_actions', 'bx_resources', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_resources_view_actions', 'bx_resources', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_resources_view_actions', 'bx_resources', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_resources_view_actions', 'bx_resources', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_resources_view_actions', 'bx_resources', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_resources_view_actions', 'bx_resources', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_resources_view_actions', 'bx_resources', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_resources_view_actions', 'bx_resources', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_resources&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_resources_view_actions', 'bx_resources', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_resources_view_actions', 'bx_resources', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);


-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_view_submenu', '_bx_resources_menu_title_view_entry_submenu', 'bx_resources_view_submenu', 'bx_resources', 8, 0, 1, 'BxResourcesMenuView', 'modules/boonex/resources/classes/BxResourcesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_resources_view_submenu', 'bx_resources', '_bx_resources_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_resources_view_submenu', 'bx_resources', 'view-resource', '_bx_resources_menu_item_title_system_view_entry', '_bx_resources_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-resource&id={content_id}', '', '', '', '', 2147483647, 0, 0, 1),
('bx_resources_view_submenu', 'bx_resources', 'view-resource-comments', '_bx_resources_menu_item_title_system_view_entry_comments', '_bx_resources_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-resource-comments&id={content_id}', '', '', '', '', 2147483647, 0, 0, 2);


-- MENU: manage tools: item submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_menu_manage_tools', '_bx_resources_menu_title_manage_tools', 'bx_resources_menu_manage_tools', 'bx_resources', 6, 0, 1, 'BxResourcesMenuManageTools', 'modules/boonex/resources/classes/BxResourcesMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_resources_menu_manage_tools', 'bx_resources', '_bx_resources_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_resources_menu_manage_tools', 'bx_resources', 'delete-with-content', '_bx_resources_menu_item_title_system_delete_with_content', '_bx_resources_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_resources', 'resources-author', '_bx_resources_menu_item_title_system_view_entries_author', '_bx_resources_menu_item_title_view_entries_author', 'page.php?i=resources-author&profile_id={profile_id}', '', '', 'warehouse', '', 2147483647, 1, 0, 0),
('trigger_profile_view_actions', 'bx_resources', 'resources-manage', '_bx_resources_menu_item_title_system_entries_manage', '_bx_resources_menu_item_title_entries_manage', 'page.php?i=resources-manage&profile_id={profile_id}', '', '', 'warehouse', '', 2147483647, 1, 0, 0),

('trigger_group_view_submenu', 'bx_resources', 'resources-context', '_bx_resources_menu_item_title_system_view_entries_in_context', '_bx_resources_menu_item_title_view_entries_in_context', 'page.php?i=resources-context&profile_id={profile_id}', '', '', 'warehouse', '', 2147483647, 1, 0, 0),
('trigger_group_view_actions', 'bx_resources', 'resources-manage', '_bx_resources_menu_item_title_system_entries_manage', '_bx_resources_menu_item_title_entries_manage', 'page.php?i=resources-manage&profile_id={profile_id}', '', '', 'warehouse', '', 2147483647, 1, 0, 0);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_resources_allow_view_to', 'bx_resources', 'view', '_bx_resources_form_entry_input_allow_view_to', '3', 'bx_resources_entries', 'id', 'author', '', '');


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_resources', 'create entry', NULL, '_bx_resources_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_resources', 'delete entry', NULL, '_bx_resources_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_resources', 'view entry', NULL, '_bx_resources_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_resources', 'edit any entry', NULL, '_bx_resources_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_resources', 'delete any entry', NULL, '_bx_resources_acl_action_delete_any_entry', '', 1, 3);
SET @iIdActionEntryDeleteAny = LAST_INSERT_ID();

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
(@iPremium, @iIdActionEntryView),

-- edit any entry
(@iModerator, @iIdActionEntryEditAny),
(@iAdministrator, @iIdActionEntryEditAny),

-- delete any entry
(@iAdministrator, @iIdActionEntryDeleteAny);


-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_resources', '_bx_resources', @iSearchOrder + 1, 'BxResourcesSearchResult', 'modules/boonex/resources/classes/BxResourcesSearchResult.php'),
('bx_resources_cmts', '_bx_resources_cmts', @iSearchOrder + 2, 'BxResourcesCmtsSearchResult', 'modules/boonex/resources/classes/BxResourcesCmtsSearchResult.php');


-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_resources_cats', 'bx_resources', 'bx_resources', 'bx_resources', 'bx_resources_cats', 'bx_resources_entries', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = ABS(`bx_resources_entries`.`author`))', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_resources', 'bx_resources', '_bx_resources', 'page.php?i=resources-home', 'warehouse', 'SELECT COUNT(*) FROM `bx_resources_entries` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_resources_growth', '_bx_resources_chart_growth', 'bx_resources_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_resources_growth_speed', '_bx_resources_chart_growth_speed', 'bx_resources_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_resources_administration', 'Sql', 'SELECT `te`.*, `tp`.`id` AS `context_pid`, `tp`.`type` AS `context_module`, `tp`.`content_id` AS `context_cid` FROM `bx_resources_entries` AS `te` INNER JOIN `sys_profiles` AS `tp` ON ABS(`te`.`allow_view_to`)=`tp`.`id`  WHERE 1 ', 'bx_resources_entries', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'te`.`title,te`.`text', '', 'like', 'reports', '', 192, 'BxResourcesGridAdministration', 'modules/boonex/resources/classes/BxResourcesGridAdministration.php'),
('bx_resources_common', 'Sql', 'SELECT * FROM `bx_resources_entries` WHERE 1 ', 'bx_resources_entries', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxResourcesGridCommon', 'modules/boonex/resources/classes/BxResourcesGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_resources_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_resources_administration', 'switcher', '_bx_resources_grid_column_title_adm_active', '8%', 0, 0, '', 2),
('bx_resources_administration', 'reports', '_sys_txt_reports_title', '5%', 0, 0, '', 3),
('bx_resources_administration', 'context_module', '_bx_resources_grid_column_title_adm_context_module', '5%', 0, 0, '', 4),
('bx_resources_administration', 'context_cid', '_bx_resources_grid_column_title_adm_context_cid', '20%', 0, 0, '', 5),
('bx_resources_administration', 'title', '_bx_resources_grid_column_title_adm_title', '20%', 0, 25, '', 6),
('bx_resources_administration', 'added', '_bx_resources_grid_column_title_adm_added', '5%', 1, 25, '', 6),
('bx_resources_administration', 'author', '_bx_resources_grid_column_title_adm_author', '15%', 0, 25, '', 8),
('bx_resources_administration', 'actions', '', '20%', 0, 0, '', 9),

('bx_resources_common', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_resources_common', 'switcher', '_bx_resources_grid_column_title_adm_active', '8%', 0, 0, '', 2),
('bx_resources_common', 'title', '_bx_resources_grid_column_title_adm_title', '15%', 0, 16, '', 3),
('bx_resources_common', 'link', '_bx_resources_grid_column_title_adm_link', '30%', 0, 32, '', 4),
('bx_resources_common', 'added', '_bx_resources_grid_column_title_adm_added', '10%', 1, 25, '', 5),
('bx_resources_common', 'status_admin', '_bx_resources_grid_column_title_adm_status_admin', '15%', 0, 16, '', 6),
('bx_resources_common', 'actions', '', '20%', 0, 0, '', 7);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_resources_administration', 'bulk', 'delete', '_bx_resources_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_resources_administration', 'bulk', 'clear_reports', '_bx_resources_grid_action_title_adm_clear_reports', '', 0, 1, 1),
('bx_resources_administration', 'single', 'edit', '_bx_resources_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_resources_administration', 'single', 'delete', '_bx_resources_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_resources_administration', 'single', 'settings', '_bx_resources_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_resources_administration', 'single', 'audit_content', '_bx_resources_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_resources_administration', 'single', 'clear_reports', '_bx_resources_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_resources_common', 'independent', 'add', '_bx_resources_grid_action_title_adm_add', '', 0, 0, 1),
('bx_resources_common', 'bulk', 'delete', '_bx_resources_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_resources_common', 'single', 'edit', '_bx_resources_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_resources_common', 'single', 'delete', '_bx_resources_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_resources_common', 'single', 'settings', '_bx_resources_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_resources_html5', 1, 'BxResourcesUploaderHTML5', 'modules/boonex/resources/classes/BxResourcesUploaderHTML5.php');


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_resources', 'BxResourcesAlertsResponse', 'modules/boonex/resources/classes/BxResourcesAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler),
('profile', 'search_by_term', @iHandler);
