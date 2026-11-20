
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_workspaces', '_bx_workspaces', 'bx_workspaces@modules/boonex/workspaces/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_workspaces', '_bx_workspaces', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_workspaces_autoapproval', 'on', @iCategId, '_bx_workspaces_option_autoapproval', 'select', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:22:"get_options_activation";}', '', '', 1),
('bx_workspaces_default_acl_level', '3', @iCategId, '_bx_workspaces_option_default_acl_level', 'select', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_memberships";s:6:"params";a:4:{s:11:"purchasable";b:0;s:6:"active";b:1;s:9:"translate";b:1;s:22:"filter_out_auto_levels";b:1;}s:5:"class";s:16:"TemplAclServices";}', '', '', 2),
('bx_workspaces_redirect_aadd', 'profile', @iCategId, '_bx_workspaces_option_redirect_aadd', 'select', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:30:"get_options_redirect_after_add";}', '', '', 3),
('bx_workspaces_redirect_aadd_custom_url', '', @iCategId, '_bx_workspaces_option_redirect_aadd_custom_url', 'digit', '', '', '', 4),
('bx_workspaces_num_connections_quick', '6', @iCategId, '_bx_workspaces_option_num_connections_quick', 'digit', '', '', '', 10),
('bx_workspaces_searchable_fields', '', @iCategId, '_bx_workspaces_option_searchable_fields', 'list', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:21:"get_searchable_fields";}', '', '', 20),
('bx_workspaces_friends', 'on', @iCategId, '_bx_workspaces_option_friends', 'checkbox', '', '', '', 30),
('bx_workspaces_public_subscriptions', '', @iCategId, '_bx_workspaces_option_public_subscriptions', 'checkbox', '', '', '', 35),
('bx_workspaces_public_subscribed_me', '', @iCategId, '_bx_workspaces_option_public_subscribed_me', 'checkbox', '', '', '', 36),
('bx_workspaces_enable_profile_activation_letter', 'on', @iCategId, '_bx_workspaces_option_enable_profile_activation_letter', 'checkbox', '', '', '', 40),
('bx_workspaces_context_module', '', @iCategId, '_bx_workspaces_option_context_module', 'select', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"get_context_modules";}', '', '', 50);

-- PAGES

-- PAGE: create profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_create_profile', 'create-workspaces-profile', '_bx_workspaces_page_title_sys_create_profile', '_bx_workspaces_page_title_create_profile', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=create-workspaces-profile', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_create_profile', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_choose_type', 11, 2147483647, 'menu', 'sys_add_profile_vertical', 0, 1, 0, 0),
('bx_workspaces_create_profile', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_create_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:13:\"entity_create\";}', 0, 1, 1, 1);

-- PAGE: view profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_profile', 'view-workspaces-profile', '_bx_workspaces_page_title_sys_view_profile', '_bx_workspaces_page_title_view_profile', 'bx_workspaces', 7, 2147483647, 1, 'page.php?i=view-workspaces-profile', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_workspaces_view_profile', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_cover_block', '_bx_workspaces_page_block_title_cover_block', 3, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:12:\"entity_cover\";}', 0, 0, 1, 0),
('bx_workspaces_view_profile', 0, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_friends_mutual', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:22:\"profile_friends_mutual\";}', 0, 0, 1, 0),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_subscriptions', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:21:\"profile_subscriptions\";}', 0, 1, 0, 0),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_subscribed_me', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:21:\"profile_subscribed_me\";}', 0, 1, 0, 0),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_related_me', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:18:"profile_related_me";}', 0, 1, 0, 0),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 0),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 1),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_friends', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"profile_friends\";}', 0, 1, 1, 2),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_relations', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:17:"profile_relations";}', 0, 1, 1, 3),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_calendar', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"entity_calendar\";}', 0, 0, 0, 4),
('bx_workspaces_view_profile', 3, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_location', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"entity_location\";}', 0, 0, 0, 0),
('bx_workspaces_view_profile', 3, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 1),
('bx_workspaces_view_profile', 3, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 0, 0),
('bx_workspaces_view_profile', 3, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_membership', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:18:\"profile_membership\";}', 0, 0, 1, 2),
('bx_workspaces_view_profile', 3, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_location', 3, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"locations_map\";s:6:\"params\";a:2:{i:0;s:13:\"bx_workspaces\";i:1;s:12:\"{content_id}\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 0, 1, 3),
('bx_workspaces_view_profile', 2, 'bx_workspaces', '', '_bx_workspaces_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);

-- PAGE: view closed profile 
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_profile_closed', 'view-workspace-profile-closed', '_bx_workspaces_page_title_sys_view_profile_closed', '_bx_workspaces_page_title_view_profile', 'bx_workspaces', 10, 2147483647, 1, 'page.php?i=view-workspace-profile', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_view_profile_closed', 1, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_private', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:19:\"private_profile_msg\";}', 0, 1, 1, 0);

-- PAGE: edit profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_edit_profile', 'edit-workspaces-profile', '_bx_workspaces_page_title_sys_edit_profile', '_bx_workspaces_page_title_edit_profile', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=edit-workspaces-profile', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_edit_profile', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_edit_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:11:\"entity_edit\";}', 0, 0, 0);

-- PAGE: delete profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_delete_profile', 'delete-workspaces-profile', '_bx_workspaces_page_title_sys_delete_profile', '_bx_workspaces_page_title_delete_profile', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=delete-workspaces-profile', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_delete_profile', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_delete_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:13:\"entity_delete\";}', 0, 0, 0);

-- PAGE: profile info
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_info', 'workspaces-profile-info', '_bx_workspaces_page_title_sys_profile_info', '_bx_workspaces_page_title_profile_info', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-profile-info', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_info', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_info', '_bx_workspaces_page_block_title_profile_info_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:16:\"entity_info_full\";}', 0, 0, 1, 1),
('bx_workspaces_profile_info', 1, 'bx_workspaces', '', '_bx_workspaces_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 2);

-- PAGE: profile friends
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_friends', 'workspaces-profile-friends', '_bx_workspaces_page_title_sys_profile_friends', '_bx_workspaces_page_title_profile_friends', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-profile-friends', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_friends', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_friends', '_bx_workspaces_page_block_title_profile_friends_link', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"connections_table";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}s:5:"class";s:23:"TemplServiceConnections";}', 0, 0, 1, 1);

-- PAGE: profile friend requests
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_friend_requests', 'workspaces-friend-requests', '_bx_workspaces_page_title_sys_friend_requests', '_bx_workspaces_page_title_friend_requests', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-friend-requests', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_friend_requests', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_friend_requests', '_bx_workspaces_page_block_title_friend_requests_link', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:25:\"connections_request_table\";s:5:\"class\";s:23:\"TemplServiceConnections\";}', 0, 0, 1, 1);

-- PAGE: profile favorites
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_favorites', 'workspaces-profile-favorites', '_bx_workspaces_page_title_sys_profile_favorites', '_bx_workspaces_page_title_profile_favorites', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-profile-favorites', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_favorites', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_favorites', '_bx_workspaces_page_block_title_profile_favorites', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:15:"browse_favorite";}', 0, 1, 1, 1);

-- PAGE: profile subscriptions
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_subscriptions', 'workspaces-profile-subscriptions', '_bx_workspaces_page_title_sys_profile_subscriptions', '_bx_workspaces_page_title_profile_subscriptions', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-profile-subscriptions', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_subscriptions', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_subscriptions', '_bx_workspaces_page_block_title_profile_subscriptions', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:19:\"subscriptions_table\";s:5:\"class\";s:23:\"TemplServiceConnections\";}', 0, 0, 1, 1),
('bx_workspaces_profile_subscriptions', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_subscribed_me', '_bx_workspaces_page_block_title_profile_subscribed_me', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:19:\"subscribed_me_table\";s:5:\"class\";s:23:\"TemplServiceConnections\";}', 0, 0, 1, 2);

-- PAGE: profile relations
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_relations', 'workspaces-profile-relations', '_bx_workspaces_page_title_sys_profile_relations', '_bx_workspaces_page_title_profile_relations', 'bx_workspaces', 5, 2147483647, 1, 'page.php?i=workspaces-profile-relations', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_relations', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_relations', '_bx_workspaces_page_block_title_profile_relations', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:15:"relations_table";s:5:"class";s:23:"TemplServiceConnections";}', 0, 0, 1, 1),
('bx_workspaces_profile_relations', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_profile_related_me', '_bx_workspaces_page_block_title_profile_related_me', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:16:"related_me_table";s:5:"class";s:23:"TemplServiceConnections";}', 0, 0, 1, 2);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_profile_comments', '_bx_workspaces_page_title_sys_profile_comments', '_bx_workspaces_page_title_profile_comments', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-profile-comments', '', '', '', '', 0, 1, 0, 'BxWorkspacesPageEntry', 'modules/boonex/workspaces/classes/BxWorkspacesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_profile_comments', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_profile_comments', '_bx_workspaces_page_block_title_profile_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 1);


-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_home', '_bx_workspaces_page_title_sys_recent', '_bx_workspaces_page_title_recent', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-home', 'page.php?i=workspaces-home', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_workspaces_home', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_featured_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 0),
('bx_workspaces_home', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:22:\"browse_recent_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1);

-- PAGE: active profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_active', '_bx_workspaces_page_title_sys_active', '_bx_workspaces_page_title_active', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-active', 'page.php?i=workspaces-active', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_active', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_active_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:22:"browse_active_profiles";s:6:"params";a:2:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;}}', 0, 1, 0);

-- PAGE: online profiles
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_online', '_bx_workspaces_page_title_sys_online', '_bx_workspaces_page_title_online', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-online', 'page.php?i=workspaces-online', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_online', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_online_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:22:\"browse_online_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 0);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_search', '_bx_workspaces_page_title_sys_entries_search', '_bx_workspaces_page_title_entries_search', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-search', 'page.php?i=workspaces-search', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_workspaces_search', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:13:"bx_workspaces";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_workspaces_search', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:13:"bx_workspaces";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_workspaces_search', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:18:"bx_workspaces_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_workspaces_search', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:18:"bx_workspaces_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_manage', '_bx_workspaces_page_title_sys_manage', '_bx_workspaces_page_title_manage', 'bx_workspaces', 5, 2147483647, 1, 'workspaces-manage', 'page.php?i=workspaces-manage', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_manage', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_manage', '_bx_workspaces_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:12:\"manage_tools\";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_administration', '_bx_workspaces_page_title_sys_manage_administration', '_bx_workspaces_page_title_manage', 'bx_workspaces', 5, 192, 1, 'workspaces-administration', 'page.php?i=workspaces-administration', '', '', '', 0, 1, 0, 'BxWorkspacesPageBrowse', 'modules/boonex/workspaces/classes/BxWorkspacesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_workspaces_administration', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_system_manage_administration', '_bx_workspaces_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);

-- PAGE: add block to homepage

SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_home', 1, 'bx_workspaces', '' , '_bx_workspaces_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:22:"browse_recent_profiles";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 1, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_recommended_entries_view_showcase', '_bx_workspaces_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:18:\"browse_recommended\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);

-- PAGE: service blocks

SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_featured_entries_view_showcase', '_bx_workspaces_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_recommended_entries_view_showcase', '_bx_workspaces_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:18:\"browse_recommended\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_active_entries_view_showcase', '_bx_workspaces_page_block_title_active_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:22:\"browse_active_profiles\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:16:\"showcase_wo_info\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_active_profiles', '_bx_workspaces_page_block_title_active_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:22:\"browse_active_profiles\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:12:\"unit_wo_info\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_workspaces', '_bx_workspaces_page_block_title_sys_familiar_profiles', '_bx_workspaces_page_block_title_familiar_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:13:\"bx_workspaces\";s:6:\"method\";s:24:\"browse_familiar_profiles\";s:6:\"params\";a:4:{s:10:\"connection\";s:20:\"sys_profiles_friends\";s:9:\"unit_view\";s:4:\"unit\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 5);

-- MENU

-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_workspaces', 'workspaces-home', '_bx_workspaces_menu_item_title_system_entries_home', '_bx_workspaces_menu_item_title_entries_home', 'page.php?i=workspaces-home', '', '', 'user', 'bx_workspaces_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_workspaces', 'workspaces-home', '_bx_workspaces_menu_item_title_system_entries_home', '_bx_workspaces_menu_item_title_entries_home', 'page.php?i=workspaces-home', '', '', 'user', 'bx_workspaces_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- SET @iCreateProfileMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_profiles_create' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
-- INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
-- ('sys_profiles_create', 'bx_workspaces', 'create-workspace-profile', '_bx_workspaces_menu_item_title_system_profile_type', '_bx_workspaces_menu_item_title_profile_type', 'page.php?i=create-workspaces-profile', '', '', 'user', '', 2147483647, 1, 1, IFNULL(@iCreateProfileMenuOrder, 0) + 1);

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_profile_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_profile_links', 'bx_workspaces', 'create-workspaces-profile', '_bx_workspaces_menu_item_title_system_create_profile', '_bx_workspaces_menu_item_title_create_profile', 'page.php?i=create-workspaces-profile', '', '', 'user', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: view actions

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_actions', '_bx_workspaces_menu_title_view_profile_actions', 'bx_workspaces_view_actions', 'bx_workspaces', 9, 0, 1, 'BxWorkspacesMenuViewActions', 'modules/boonex/workspaces/classes/BxWorkspacesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_view_actions', 'bx_workspaces', '_bx_workspaces_menu_set_title_view_profile_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-friend-add', '_bx_workspaces_menu_item_title_system_befriend', '{title_add_friend}', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_friends\', \'add\', \'{profile_id}\')', '', 'user-plus', '', 0, 2147483647, '', 1, 0, 10),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-friend-remove', '_bx_workspaces_menu_item_title_system_unfriend', '{title_remove_friend}', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_friends\', \'remove\', \'{profile_id}\')', '', 'user-times', '', 0, 2147483647, '', 1, 0, 11),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-relation-add', '_bx_workspaces_menu_item_title_system_relation_add', '_bx_workspaces_menu_item_title_relation_add', 'javascript:void(0)', 'bx_menu_popup(''sys_add_relation'', window, {}, {profile_id: {profile_id}});', '', 'sync', '', 0, 2147483647, '', 1, 0, 15),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-relation-remove', '_bx_workspaces_menu_item_title_system_relation_delete', '_bx_workspaces_menu_item_title_relation_delete', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_relations\', \'remove\', \'{profile_id}\')', '', 'sync', '', 0, 2147483647, '', 1, 0, 16),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-subscribe-add', '_bx_workspaces_menu_item_title_system_subscribe', '_bx_workspaces_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 20),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-subscribe-remove', '_bx_workspaces_menu_item_title_system_unsubscribe', '_bx_workspaces_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'remove\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 21),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-set-acl-level', '_sys_menu_item_title_system_set_acl_level', '_sys_menu_item_title_set_acl_level', 'javascript:void(0)', 'bx_menu_popup(''sys_set_acl_level'', window, {id:{value:''sys_acl_set_{profile_id}'', force:true}, closeOnOuterClick: false, removeOnClose: true, displayMode: ''box'', cssClass: ''''}, {profile_id: {profile_id}});', '', 'certificate', '', 0, 2147483647, '', 1, 0, 30),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_workspaces'', content_id: {content_id}});', '', 'check-circle', '', 0, 192, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 30),
('bx_workspaces_view_actions', 'bx_workspaces', 'profile-actions-more', '_bx_workspaces_menu_item_title_system_more_actions', '_bx_workspaces_menu_item_title_more_actions', 'javascript:void(0)', 'bx_menu_popup(''bx_workspaces_view_actions_more'', this, {}, {profile_id:{profile_id}});', '', 'cog', 'bx_workspaces_view_actions_more', 1, 2147483647, '', 1, 0, 9999);

-- MENU: view actions more

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_actions_more', '_bx_workspaces_menu_title_view_profile_actions_more', 'bx_workspaces_view_actions_more', 'bx_workspaces', 6, 0, 1, 'BxWorkspacesMenuViewActions', 'modules/boonex/workspaces/classes/BxWorkspacesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_view_actions_more', 'bx_workspaces', '_bx_workspaces_menu_set_title_view_profile_actions_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_view_actions_more', 'bx_workspaces', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', 192, 1, 0, 10),
('bx_workspaces_view_actions_more', 'bx_workspaces', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_workspaces&content_id={content_id}', '', '', 'history', '', 192, 1, 0, 20),
('bx_workspaces_view_actions_more', 'bx_workspaces', 'edit-workspaces-profile', '_bx_workspaces_menu_item_title_system_edit_profile', '_bx_workspaces_menu_item_title_edit_profile', 'page.php?i=edit-workspaces-profile&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 30),
('bx_workspaces_view_actions_more', 'bx_workspaces', 'delete-workspaces-profile', '_bx_workspaces_menu_item_title_system_delete_profile', '_bx_workspaces_menu_item_title_delete_profile', 'page.php?i=delete-workspaces-profile&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 40),
('bx_workspaces_view_actions_more', 'bx_workspaces', 'delete-workspaces-account', '_bx_workspaces_menu_item_title_system_delete_account', '_bx_workspaces_menu_item_title_delete_account', 'page.php?i=account-settings-delete&id={account_id}&content=0', '', '', 'user-times', '', 128, 1, 0, 50),
('bx_workspaces_view_actions_more', 'bx_workspaces', 'delete-workspaces-account-content', '_bx_workspaces_menu_item_title_system_delete_account_content', '_bx_workspaces_menu_item_title_delete_account_content', 'page.php?i=account-settings-delete&id={account_id}&content=1', '', '', 'trash', '', 128, 1, 0, 60);

-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_actions_all', '_sys_menu_title_view_actions', 'bx_workspaces_view_actions_all', 'bx_workspaces', 15, 1, 0, 1, 'BxWorkspacesMenuViewActionsAll', 'modules/boonex/workspaces/classes/BxWorkspacesMenuViewActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_view_actions_all', 'bx_workspaces', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-friend-add', '_bx_workspaces_menu_item_title_system_befriend', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-friend-remove', '_bx_workspaces_menu_item_title_system_unfriend', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-relation-add', '_bx_workspaces_menu_item_title_system_relation_add', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 23),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-relation-remove', '_bx_workspaces_menu_item_title_system_relation_delete', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 27),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-subscribe-add', '_bx_workspaces_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-subscribe-remove', '_bx_workspaces_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-set-acl-level', '_sys_menu_item_title_system_set_acl_level', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '', '', '', '', '', '', '', 0, 192, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 60),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 210),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 215),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 217),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_workspaces_view_actions_all', 'bx_workspaces', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: meta (counters) menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_meta', '_bx_workspaces_menu_title_view_profile_meta', 'bx_workspaces_view_meta', 'bx_workspaces', 15, 0, 1, 'BxWorkspacesMenuViewMeta', 'modules/boonex/workspaces/classes/BxWorkspacesMenuViewMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_view_meta', 'bx_workspaces', '_bx_workspaces_menu_set_title_view_profile_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_view_meta', 'bx_workspaces', 'membership', '_sys_menu_item_title_system_vm_membership', '_sys_menu_item_title_vm_membership', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_workspaces_view_meta', 'bx_workspaces', 'badges', '_sys_menu_item_title_system_vm_badges', '_sys_menu_item_title_vm_badges', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_workspaces_view_meta', 'bx_workspaces', 'friends', '_sys_menu_item_title_system_sm_friends', '_sys_menu_item_title_sm_friends', '', '', '', '', '', 0, 2147483647, '', 1, 0, 23),
('bx_workspaces_view_meta', 'bx_workspaces', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 0, 2147483647, '', 1, 0, 25),
('bx_workspaces_view_meta', 'bx_workspaces', 'relations', '_sys_menu_item_title_system_sm_relations', '_sys_menu_item_title_sm_relations', '', '', '', '', '', 0, 2147483647, '', 0, 0, 27),
('bx_workspaces_view_meta', 'bx_workspaces', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_workspaces_view_meta', 'bx_workspaces', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_workspaces_view_meta', 'bx_workspaces', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 0, 2147483647, '', 0, 0, 43),
('bx_workspaces_view_meta', 'bx_workspaces', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 0, 2147483647, '', 0, 0, 46),
('bx_workspaces_view_meta', 'bx_workspaces', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50);

-- MENU: module sub-menu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_submenu', '_bx_workspaces_menu_title_submenu', 'bx_workspaces_submenu', 'bx_workspaces', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_submenu', 'bx_workspaces', '_bx_workspaces_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_submenu', 'bx_workspaces', 'workspaces-home', '_bx_workspaces_menu_item_title_system_entries_recent', '_bx_workspaces_menu_item_title_entries_recent', 'page.php?i=workspaces-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_workspaces_submenu', 'bx_workspaces', 'workspaces-active', '_bx_workspaces_menu_item_title_system_entries_active', '_bx_workspaces_menu_item_title_entries_active', 'page.php?i=workspaces-active', '', '', '', '', 2147483647, 1, 1, 2),
('bx_workspaces_submenu', 'bx_workspaces', 'workspaces-online', '_bx_workspaces_menu_item_title_system_entries_online', '_bx_workspaces_menu_item_title_entries_online', 'page.php?i=workspaces-online', '', '', '', '', 2147483647, 1, 1, 3),
('bx_workspaces_submenu', 'bx_workspaces', 'workspaces-search', '_bx_workspaces_menu_item_title_system_entries_search', '_bx_workspaces_menu_item_title_entries_search', 'page.php?i=workspaces-search', '', '', '', '', 2147483647, 1, 1, 4),
('bx_workspaces_submenu', 'bx_workspaces', 'workspaces-manage', '_bx_workspaces_menu_item_title_system_entries_manage', '_bx_workspaces_menu_item_title_entries_manage', 'page.php?i=workspaces-manage', '', '', '', '', 2147483646, 1, 1, 5);

-- MENU: view submenu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_view_submenu', '_bx_workspaces_menu_title_view_profile_submenu', 'bx_workspaces_view_submenu', 'bx_workspaces', 18, 0, 1, 'BxWorkspacesMenuView', 'modules/boonex/workspaces/classes/BxWorkspacesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_view_submenu', 'bx_workspaces', '_bx_workspaces_menu_set_title_view_profile_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_view_submenu', 'bx_workspaces', 'view-workspaces-profile', '_bx_workspaces_menu_item_title_system_view_profile_view', '_bx_workspaces_menu_item_title_view_profile_view', 'page.php?i=view-workspaces-profile&id={content_id}', '', '', 'user', '', '', 0, 2147483647, 1, 0, 1),
('bx_workspaces_view_submenu', 'bx_workspaces', 'workspaces-profile-info', '_bx_workspaces_menu_item_title_system_view_profile_info', '_bx_workspaces_menu_item_title_view_profile_info', 'page.php?i=workspaces-profile-info&id={content_id}', '', '', 'info-circle col-gray', '', '', 0, 2147483647, 1, 0, 2),
('bx_workspaces_view_submenu', 'bx_workspaces', 'workspaces-profile-friends', '_bx_workspaces_menu_item_title_system_view_profile_friends', '_bx_workspaces_menu_item_title_view_profile_friends', 'page.php?i=workspaces-profile-friends&profile_id={profile_id}', '', '', 'users col-blue3', '', '', 0, 2147483647, 1, 0, 3),
('bx_workspaces_view_submenu', 'bx_workspaces', 'workspaces-profile-relations', '_bx_workspaces_menu_item_title_system_view_profile_relations', '_bx_workspaces_menu_item_title_view_profile_relations', 'page.php?i=workspaces-profile-relations&profile_id={profile_id}', '', '', 'sync col-blue3', '', '', 0, 2147483647, 1, 0, 4),
('bx_workspaces_view_submenu', 'bx_workspaces', 'workspaces-profile-subscriptions', '_bx_workspaces_menu_item_title_system_view_profile_subscriptions', '_bx_workspaces_menu_item_title_view_profile_subscriptions', 'page.php?i=workspaces-profile-subscriptions&profile_id={profile_id}', '', '', 'check col-blue3', '', '', 0, 2147483647, 1, 0, 5),
('bx_workspaces_view_submenu', 'bx_workspaces', 'workspaces-profile-comments', '_bx_workspaces_menu_item_title_system_view_profile_comments', '_bx_workspaces_menu_item_title_view_profile_comments', 'page.php?i=workspaces-profile-comments&id={content_id}', '', '', '', '', '', 0, 2147483647, 0, 0, 6),
('bx_workspaces_view_submenu', 'bx_workspaces', 'more-auto', '_bx_workspaces_menu_item_title_system_view_profile_more_auto', '_bx_workspaces_menu_item_title_view_profile_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_workspaces_snippet_meta', 'bx_workspaces', 15, 0, 1, 'BxWorkspacesMenuSnippetMeta', 'modules/boonex/workspaces/classes/BxWorkspacesMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_snippet_meta', 'bx_workspaces', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `hidden_on_cxt`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_workspaces_snippet_meta', 'bx_workspaces', 'friends-mutual', '_sys_menu_item_title_system_sm_friends_mutual', '_sys_menu_item_title_sm_friends_mutual', '', '', '', '', '', 2147483647, 'all!recom_friends', 1, 0, 1, 0),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, '', 0, 0, 1, 5),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, '', 0, 0, 1, 10),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, '', 0, 0, 1, 15),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, '', 0, 0, 1, 16),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, '', 0, 0, 1, 17),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, '', 0, 0, 1, 18),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, '', 0, 0, 1, 20),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'friends', '_sys_menu_item_title_system_sm_friends', '_sys_menu_item_title_sm_friends', '', '', '', '', '', 2147483647, 'recom_friends,recom_subscriptions', 1, 0, 1, 30),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 2147483647, 'recom_friends', 1, 0, 1, 40),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'membership', '_sys_menu_item_title_system_sm_membership', '_sys_menu_item_title_sm_membership', '', '', '', '', '', 2147483647, '', 0, 0, 1, 50),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'nl', '_sys_menu_item_title_system_sm_nl', '_sys_menu_item_title_sm_nl', '', '', '', '', '', 2147483647, '', 1, 0, 1, 55),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'befriend', '_sys_menu_item_title_system_sm_befriend', '_sys_menu_item_title_sm_befriend', '', '', '', '', '', 2147483647, 'recom_subscriptions', 1, 0, 1, 60),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'unfriend', '_sys_menu_item_title_system_sm_unfriend', '_sys_menu_item_title_sm_unfriend', '', '', '', '', '', 2147483647, 'recom_friends,recom_subscriptions', 1, 0, 1, 65),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'subscribe', '_sys_menu_item_title_system_sm_subscribe', '_sys_menu_item_title_sm_subscribe', '', '', '', '', '', 2147483647, 'recom_friends', 1, 0, 1, 70),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'unsubscribe', '_sys_menu_item_title_system_sm_unsubscribe', '_sys_menu_item_title_sm_unsubscribe', '', '', '', '', '', 2147483647, 'recom_friends,recom_subscriptions', 1, 0, 1, 75),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'ignore-befriend', '_sys_menu_item_title_system_sm_ignore_befriend', '_sys_menu_item_title_sm_ignore', '', '', '', '', '', 2147483647, 'all!recom_friends', 1, 0, 1, 80),
('bx_workspaces_snippet_meta', 'bx_workspaces', 'ignore-subscribe', '_sys_menu_item_title_system_sm_ignore_subscribe', '_sys_menu_item_title_sm_ignore', '', '', '', '', '', 2147483647, 'all!recom_subscriptions', 1, 0, 1, 85);

-- MENU: notifications menu in account popup
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_account_notifications', 'bx_workspaces', 'notifications-friend-requests', '_bx_workspaces_menu_item_title_system_friends', '_bx_workspaces_menu_item_title_friends', 'page.php?i=workspaces-profile-friends&profile_id={member_id}', '', '', 'users', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_unconfirmed_connections_num";s:6:"params";a:1:{i:0;s:20:"sys_profiles_friends";}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:17:"is_enable_friends";}', 1, 0, @iNotifMenuOrder + 1),
('sys_account_notifications', 'bx_workspaces', 'notifications-relation-requests', '_bx_workspaces_menu_item_title_system_relations', '_bx_workspaces_menu_item_title_relations', 'page.php?i=workspaces-profile-relations&profile_id={member_id}', '', '', 'sync', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_unconfirmed_connections_num";s:6:"params";a:1:{i:0;s:22:"sys_profiles_relations";}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"is_enable_relations";}', 1, 0, @iNotifMenuOrder + 2);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_workspaces', 'profile-stats-friend-requests', '_bx_workspaces_menu_item_title_system_friend_requests', '_bx_workspaces_menu_item_title_friend_requests', 'page.php?i=workspaces-profile-friends&profile_id={member_id}', '', '', 'users', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_unconfirmed_connections_num";s:6:"params";a:1:{i:0;s:20:"sys_profiles_friends";}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:17:"is_enable_friends";}', 0, 0, @iNotifMenuOrder + 1),
('sys_profile_stats', 'bx_workspaces', 'profile-stats-manage-profiles', '_bx_workspaces_menu_item_title_system_manage_my_profiles', '_bx_workspaces_menu_item_title_manage_my_profiles', 'page.php?i=workspaces-manage', '', '_self', 'users', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, '', 1, 0, @iNotifMenuOrder + 2),
('sys_profile_stats', 'bx_workspaces', 'profile-stats-favorite-workspaces', '_bx_workspaces_menu_item_title_system_favorites', '_bx_workspaces_menu_item_title_favorites', 'page.php?i=workspaces-profile-favorites&profile_id={member_id}', '', '', 'star', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:38:"get_menu_addon_favorites_profile_stats";}', '', 2147483646, '', 1, 0, @iNotifMenuOrder + 3);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `addon_cache`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_workspaces', 'profile-stats-subscriptions', '_bx_workspaces_menu_item_title_system_subscriptions', '_bx_workspaces_menu_item_title_subscriptions', 'page.php?i=workspaces-profile-subscriptions&profile_id={member_id}#subscriptions', '', '_self', 'rss', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_connected_content_num";s:6:"params";a:1:{i:0;s:26:"sys_profiles_subscriptions";}s:5:"class";s:23:"TemplServiceConnections";}', 0, '', 2147483646, '', 0, 0, @iNotifMenuOrder + 4),
('sys_profile_stats', 'bx_workspaces', 'profile-stats-subscribed-me', '_bx_workspaces_menu_item_title_system_subscribed_me', '_bx_workspaces_menu_item_title_subscribed_me', 'page.php?i=workspaces-profile-subscriptions&profile_id={member_id}#subscribers', '', '_self', 'rss', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"get_connected_initiators_num";s:6:"params";a:1:{i:0;s:26:"sys_profiles_subscriptions";}s:5:"class";s:23:"TemplServiceConnections";}', 1, '', 2147483646, '', 0, 0, @iNotifMenuOrder + 5);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_workspaces', 'profile-stats-relations', '_bx_workspaces_menu_item_title_system_relations', '_bx_workspaces_menu_item_title_relations', 'page.php?i=workspaces-profile-relations&profile_id={member_id}#relations', '', '_self', 'sync', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_connected_content_num";s:6:"params";a:3:{i:0;s:22:"sys_profiles_relations";i:1;i:0;i:2;i:1;}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"is_enable_relations";}', 1, 0, @iNotifMenuOrder + 6),
('sys_profile_stats', 'bx_workspaces', 'profile-stats-related-me', '_bx_workspaces_menu_item_title_system_related_me', '_bx_workspaces_menu_item_title_related_me', 'page.php?i=workspaces-profile-relations&profile_id={member_id}#related-me', '', '_self', 'sync', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"get_connected_initiators_num";s:6:"params";a:3:{i:0;s:22:"sys_profiles_relations";i:1;i:0;i:2;i:1;}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:19:"is_enable_relations";}', 1, 0, @iNotifMenuOrder + 7);

-- MENU: profile followings
SET @iFollowingsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_followings' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_followings', 'bx_workspaces', 'workspaces', '_bx_workspaces_menu_item_title_system_followings', '_bx_workspaces_menu_item_title_followings', 'javascript:void(0)', '', '_self', 'users', '', '', 2147483647, 0, 1, 0, @iFollowingsMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_workspaces_menu_manage_tools', '_bx_workspaces_menu_title_manage_tools', 'bx_workspaces_menu_manage_tools', 'bx_workspaces', 6, 0, 1, 'BxWorkspacesMenuManageTools', 'modules/boonex/workspaces/classes/BxWorkspacesMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_workspaces_menu_manage_tools', 'bx_workspaces', '_bx_workspaces_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_workspaces_menu_manage_tools', 'bx_workspaces', 'clear-reports', '_bx_workspaces_menu_item_title_system_clear_reports', '_bx_workspaces_menu_item_title_clear_reports', 'javascript:void(0)', 'javascript:{js_object}.onClickClearReports({content_id});', '_self', 'eraser', '', 2147483647, 1, 0, 1),
('bx_workspaces_menu_manage_tools', 'bx_workspaces', 'manage-cf', '_bx_workspaces_menu_item_title_system_manage_cf', '_bx_workspaces_menu_item_title_manage_cf', 'javascript:void(0)', 'javascript:{js_object}.onClickManageCf({content_id});', '_self', 'filter', '', 2147483647, 1, 0, 6),
('bx_workspaces_menu_manage_tools', 'bx_workspaces', 'delete-with-content', '_bx_workspaces_menu_item_title_system_delete_with_content', '_bx_workspaces_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 2147483647, 1, 0, 99);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_workspaces', 'workspaces-administration', '_bx_workspaces_menu_item_title_system_admt_workspaces', '_bx_workspaces_menu_item_title_admt_workspaces', 'page.php?i=workspaces-administration', '', '_self', 'user', 'a:2:{s:6:"module";s:13:"bx_workspaces";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_workspaces', 'create entry', NULL, '_bx_workspaces_acl_action_create_profile', '', 1, 1);
SET @iIdActionProfileCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_workspaces', 'delete entry', NULL, '_bx_workspaces_acl_action_delete_profile', '', 1, 1);
SET @iIdActionProfileDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_workspaces', 'view entry', NULL, '_bx_workspaces_acl_action_view_profile', '', 1, 0);
SET @iIdActionProfileView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_workspaces', 'edit any entry', NULL, '_bx_workspaces_acl_action_edit_any_profile', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_workspaces', 'delete any entry', NULL, '_bx_workspaces_acl_action_delete_any_profile', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

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

-- profile create
(@iAccount, @iIdActionProfileCreate),
(@iStandard, @iIdActionProfileCreate),
(@iUnconfirmed, @iIdActionProfileCreate),
(@iPending, @iIdActionProfileCreate),
(@iModerator, @iIdActionProfileCreate),
(@iAdministrator, @iIdActionProfileCreate),
(@iPremium, @iIdActionProfileCreate),

-- profile delete
(@iAccount, @iIdActionProfileDelete),
(@iStandard, @iIdActionProfileDelete),
(@iUnconfirmed, @iIdActionProfileDelete),
(@iPending, @iIdActionProfileDelete),
(@iModerator, @iIdActionProfileDelete),
(@iAdministrator, @iIdActionProfileDelete),
(@iPremium, @iIdActionProfileDelete),

-- profile view
(@iUnauthenticated, @iIdActionProfileView),
(@iAccount, @iIdActionProfileView),
(@iStandard, @iIdActionProfileView),
(@iUnconfirmed, @iIdActionProfileView),
(@iPending, @iIdActionProfileView),
(@iModerator, @iIdActionProfileView),
(@iAdministrator, @iIdActionProfileView),
(@iPremium, @iIdActionProfileView),

-- any profile edit
(@iModerator, @iIdActionProfileEditAny),
(@iAdministrator, @iIdActionProfileEditAny),

-- any profile delete
(@iAdministrator, @iIdActionProfileDeleteAny);

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_workspaces', '_bx_workspaces', @iSearchOrder + 1, 'BxWorkspacesSearchResult', 'modules/boonex/workspaces/classes/BxWorkspacesSearchResult.php'),
('bx_workspaces_cmts', '_bx_workspaces_cmts', @iSearchOrder + 2, 'BxWorkspacesCmtsSearchResult', 'modules/boonex/workspaces/classes/BxWorkspacesCmtsSearchResult.php');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_workspaces', 'bx_workspaces', '_bx_workspaces', 'page.php?i=workspaces-home', 'user', 'SELECT COUNT(*) FROM `bx_workspaces_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_workspaces'' WHERE 1 AND `tp`.`status`=''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_workspaces_growth', '_bx_workspaces_chart_growth', 'bx_workspaces_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_workspaces'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_workspaces_growth_speed', '_bx_workspaces_chart_growth_speed', 'bx_workspaces_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_workspaces'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: administration
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_workspaces_administration', 'Sql', 'SELECT `td`.*, `ta`.`email` AS `account`, `ta`.`logged` AS `last_online`, `tp`.`status` AS `status`, `tp`.`id` as `profile_id` FROM `bx_workspaces_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_workspaces'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_workspaces_data', 'id', 'last_online', 'status', '', 20, NULL, 'start', '', 'fullname,email', '', 'like', 'reports', '', 192, 'BxWorkspacesGridAdministration', 'modules/boonex/workspaces/classes/BxWorkspacesGridAdministration.php'),
('bx_workspaces_common', 'Sql', 'SELECT `td`.*, `ta`.`email` AS `account`, `ta`.`logged` AS `last_online`, `tp`.`status` AS `status` FROM `bx_workspaces_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_workspaces'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_workspaces_data', 'id', 'last_online', 'status', '', 20, NULL, 'start', '', 'fullname', '', 'like', '', '', 2147483647, 'BxWorkspacesGridCommon', 'modules/boonex/workspaces/classes/BxWorkspacesGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_workspaces_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_workspaces_administration', 'switcher', '_bx_workspaces_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_workspaces_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_workspaces_administration', 'fullname', '_bx_workspaces_grid_column_title_adm_fullname', '25%', 0, '', '', 4),
('bx_workspaces_administration', 'last_online', '_bx_workspaces_grid_column_title_adm_last_online', '20%', 1, '25', '', 5),
('bx_workspaces_administration', 'account', '_bx_workspaces_grid_column_title_adm_account', '20%', 0, '25', '', 6),
('bx_workspaces_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_workspaces_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_workspaces_common', 'fullname', '_bx_workspaces_grid_column_title_adm_fullname', '48%', 0, '', '', 2),
('bx_workspaces_common', 'last_online', '_bx_workspaces_grid_column_title_adm_last_online', '30%', 1, '25', '', 3),
('bx_workspaces_common', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_workspaces_administration', 'bulk', 'set_acl_level', '_bx_workspaces_grid_action_title_adm_set_acl_level', '', 0, 0, 1),
('bx_workspaces_administration', 'bulk', 'delete_with_content', '_bx_workspaces_grid_action_title_adm_delete_with_content', '', 0, 1, 2),
('bx_workspaces_administration', 'bulk', 'clear_reports', '_bx_workspaces_grid_action_title_adm_clear_reports', '', 0, 1, 3),
('bx_workspaces_administration', 'single', 'set_acl_level', '_bx_workspaces_grid_action_title_adm_set_acl_level', 'certificate', 1, 0, 1),
('bx_workspaces_administration', 'single', 'settings', '_bx_workspaces_grid_action_title_adm_more_actions', 'cog', 1, 0, 2),
('bx_workspaces_administration', 'single', 'audit_content', '_bx_workspaces_grid_action_title_adm_audit_content', 'search', 1, 0, 3),
('bx_workspaces_administration', 'single', 'audit_profile', '_bx_workspaces_grid_action_title_adm_audit_profile', 'search-location', 1, 0, 4),

('bx_workspaces_common', 'bulk', 'delete_with_content', '_bx_workspaces_grid_action_title_adm_delete_with_content', '', 0, 1, 1),
('bx_workspaces_common', 'single', 'settings', '_bx_workspaces_grid_action_title_adm_more_actions', 'cog', 1, 0, 1);

-- LIVE UPDATES
INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
('bx_workspaces_friend_requests', 1, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:40:"get_live_updates_unconfirmed_connections";s:6:"params";a:5:{i:0;s:13:"bx_workspaces";i:1;s:20:"sys_profiles_friends";i:2;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:3;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:29:"notifications-friend-requests";}i:4;s:7:"{count}";}s:5:"class";s:23:"TemplServiceConnections";}', 1),
('bx_workspaces_friend_requests_new', 1, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:44:"get_live_updates_unconfirmed_connections_new";s:6:"params";a:5:{i:0;s:13:"bx_workspaces";i:1;s:20:"sys_profiles_friends";i:2;a:0:{}i:3;a:0:{}i:4;s:7:"{count}";}s:5:"class";s:23:"TemplServiceConnections";}', 1);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_workspaces', 'BxWorkspacesAlertsResponse', 'modules/boonex/workspaces/classes/BxWorkspacesAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('sys_profiles_friends', 'connection_added', @iHandler),
('bx_timeline', 'post_common', @iHandler),
('bx_workspaces_pictures', 'file_deleted', @iHandler),
('bx_workspaces', 'timeline_view', @iHandler),
('bx_workspaces', 'timeline_post', @iHandler),
('bx_workspaces', 'timeline_delete', @iHandler),
('bx_workspaces', 'timeline_comment', @iHandler),
('bx_workspaces', 'timeline_vote', @iHandler),
('bx_workspaces', 'timeline_score', @iHandler),
('bx_workspaces', 'timeline_report', @iHandler),
('bx_workspaces', 'timeline_repost', @iHandler),
('bx_workspaces', 'timeline_pin', @iHandler),
('bx_workspaces', 'timeline_promote', @iHandler),
('system', 'connection_before_add', @iHandler),
('system', 'connection_removed', @iHandler),
('menu', 'get_code_before', @iHandler),
('system', 'get_logo', @iHandler);

-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_workspaces_allow_view_to', 'bx_workspaces', 'view', '_bx_workspaces_form_profile_input_allow_view_to', '3', '', 'bx_workspaces_data', 'id', 'author', 'BxWorkspacesPrivacy', 'modules/boonex/workspaces/classes/BxWorkspacesPrivacy.php'),
('bx_workspaces_allow_post_to', 'bx_workspaces', 'post', '_bx_workspaces_form_profile_input_allow_post_to', '5', '', 'bx_workspaces_data', 'id', 'author', 'BxWorkspacesPrivacyPost', 'modules/boonex/workspaces/classes/BxWorkspacesPrivacyPost.php'),
('bx_workspaces_allow_contact_to', 'bx_workspaces', 'contact', '_bx_workspaces_form_profile_input_allow_contact_to', '3', '', 'bx_workspaces_data', 'id', 'author', 'BxWorkspacesPrivacyContact', 'modules/boonex/workspaces/classes/BxWorkspacesPrivacyContact.php');

-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_workspaces', '_bx_workspaces_email_friend_request', 'bx_workspaces_friend_request', '_bx_workspaces_email_friend_request_subject', '_bx_workspaces_email_friend_request_body');

-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_workspaces_cover_crop', 1, 'BxWorkspacesUploaderCoverCrop', 'modules/boonex/workspaces/classes/BxWorkspacesUploaderCoverCrop.php'),
('bx_workspaces_picture_crop', 1, 'BxWorkspacesUploaderPictureCrop', 'modules/boonex/workspaces/classes/BxWorkspacesUploaderPictureCrop.php');
