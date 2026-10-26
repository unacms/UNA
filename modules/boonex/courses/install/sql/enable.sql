
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_courses', '_bx_courses', 'bx_courses@modules/boonex/courses/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_courses', '_bx_courses', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_courses_enable_auto_approve', 'on', @iCategId, '_bx_courses_option_enable_auto_approve', '', 'checkbox', '', '', '', 0),
('bx_courses_use_cover_as_thumb', 'on', @iCategId, '_bx_courses_option_use_cover_as_thumb', '_bx_courses_option_use_cover_as_thumb_inf', 'checkbox', '', '', '', 2),
('bx_courses_enable_content', '', @iCategId, '_bx_courses_option_enable_content', '', 'checkbox', '', '', '', 5),
('bx_courses_content_level_max', '3', @iCategId, '_bx_courses_option_content_level_max', '', 'select', '1,2,3', '', '', 6),
('bx_courses_content_modules_st', '', @iCategId, '_bx_courses_option_content_modules_step', '', 'list', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:30:"get_options_content_modules_st";}', '', '', 7),
('bx_courses_content_modules_at', '', @iCategId, '_bx_courses_option_content_modules_attachment', '', 'list', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:30:"get_options_content_modules_at";}', '', '', 8),
('bx_courses_num_connections_quick', '6', @iCategId, '_bx_courses_option_num_connections_quick', '', 'digit', '', '', '', 10),
('bx_courses_per_page_browse', '24', @iCategId, '_bx_courses_option_per_page_browse', '', 'digit', '', '', '', 11),
('bx_courses_num_rss', '10', @iCategId, '_bx_courses_option_num_rss', '', 'digit', '', '', '', 12),
('bx_courses_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', '', 'digit', '', '', '', 15),
('bx_courses_per_page_browse_recommended', '10', @iCategId, '_sys_option_per_page_browse_recommended', '', 'digit', '', '', '', 16),
('bx_courses_per_page_for_favorites_lists', '5', @iCategId, '_bx_courses_option_per_page_for_favorites_lists', '', 'digit', '', '', '', 17),
('bx_courses_searchable_fields', 'name,desc', @iCategId, '_bx_courses_option_searchable_fields', '', 'list', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:21:"get_searchable_fields";}', '', '', 30),
('bx_courses_members_mode', '', @iCategId, '_bx_courses_option_members_mode', '', 'select', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:24:"get_options_members_mode";}', '', '', 40), 
('bx_courses_internal_notifications', '', @iCategId, '_bx_courses_option_internal_notifications', '', 'checkbox', '', '', '', 50);

-- PAGES

-- PAGE: create profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_create_profile', 'create-course-profile', '_bx_courses_page_title_sys_create_profile', '_bx_courses_page_title_create_profile', 'bx_courses', 5, 2147483647, 1, 'page.php?i=create-course-profile', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_create_profile', 1, 'bx_courses', '_bx_courses_page_block_title_create_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: view profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_profile', 'view-course-profile', '_bx_courses_page_title_sys_view_profile', '_bx_courses_page_title_view_profile', 'bx_courses', 12, 2147483647, 1, 'page.php?i=view-course-profile', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_courses_view_profile', 1, 'bx_courses', '', '_bx_courses_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0),
('bx_courses_view_profile', 1, 'bx_courses', '', '_bx_courses_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 0, 0),
('bx_courses_view_profile', 2, 'bx_courses', '', '_bx_courses_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 0),
('bx_courses_view_profile', 2, 'bx_courses', '', '_bx_courses_page_block_title_profile_structure_l1', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:25:"entity_structure_l1_block";}', 0, 0, 1, 1),
('bx_courses_view_profile', 2, 'bx_courses', '', '_bx_courses_page_block_title_profile_structure_l2', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:25:"entity_structure_l2_block";}', 0, 0, 1, 2),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_courses_page_block_title_profile_location', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"entity_location";}', 0, 0, 0, 0),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_events_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:14:"entity_context";}', 0, 0, 1, 1),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_courses_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 2),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_courses_page_block_title_admins', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:6:"admins";}', 0, 0, 1, 3),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_courses_page_block_title_fans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:19:"fans_without_admins";}', 0, 0, 1, 4),
('bx_courses_view_profile', 3, 'bx_courses', '', '_bx_courses_page_block_title_profile_location', 3, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"locations_map";s:6:"params";a:2:{i:0;s:10:"bx_courses";i:1;s:12:"{content_id}";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 0, 1, 5),
('bx_courses_view_profile', 4, 'bx_courses', '', '_bx_courses_page_block_title_profile_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"entity_comments";}', 0, 0, 0, 0),
('bx_courses_view_profile', 2, 'bx_courses', '', '_bx_courses_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:14:"entity_reports";}', 0, 0, 1, 6);

-- PAGE: view profile node 

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_profile_node', 'view-course-profile-node', '_bx_courses_page_title_sys_view_profile_node', '_bx_courses_page_title_view_profile_node', 'bx_courses', 5, 2147483647, 1, 'page.php?i=view-course-profile-node', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_courses_view_profile_node', 1, 'bx_courses', '_bx_courses_page_block_title_system_entry_node', '_bx_courses_page_block_title_entry_node', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:17:"entity_node_block";}', 0, 0, 1, 0);

-- PAGE: view closed profile 

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_profile_closed', 'view-course-profile-closed', '_bx_courses_page_title_sys_view_profile_closed', '_bx_courses_page_title_view_profile', 'bx_courses', 10, 2147483647, 1, 'page.php?i=view-course-profile', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_view_profile_closed', 2, 'bx_courses', '', '_bx_courses_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 0),
('bx_courses_view_profile_closed', 3, 'bx_courses', '', '_bx_courses_page_block_title_fans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:4:"fans";}', 0, 0, 1, 0);

-- PAGE: edit profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_edit_profile', 'edit-course-profile', '_bx_courses_page_title_sys_edit_profile', '_bx_courses_page_title_edit_profile', 'bx_courses', 5, 2147483647, 1, 'page.php?i=edit-course-profile', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_edit_profile', 1, 'bx_courses', '_bx_courses_page_block_title_edit_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: invite members

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_invite', 'invite-to-course', '_bx_courses_page_title_sys_invite_to_course', '_bx_courses_page_title_invite_to_course', 'bx_courses', 5, 2147483647, 1, 'page.php?i=invite-to-course', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_invite', 1, 'bx_courses', '_bx_courses_page_block_title_invite_to_course', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:13:"entity_invite";}', 0, 0, 0);

-- PAGE: delete profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_delete_profile', 'delete-course-profile', '_bx_courses_page_title_sys_delete_profile', '_bx_courses_page_title_delete_profile', 'bx_courses', 5, 2147483647, 1, 'page.php?i=delete-course-profile', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_delete_profile', 1, 'bx_courses', '_bx_courses_page_block_title_delete_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: join profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_join_profile', 'join-course-profile', '_bx_courses_page_title_sys_join_profile', '_bx_courses_page_title_join_profile', 'bx_courses', 5, 2147483647, 1, 'page.php?i=join-course-profile', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_join_profile', 1, 'bx_courses', '_bx_courses_page_block_title_join_profile', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:11:"entity_join";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 0);

-- PAGE: profile info
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_profile_info', 'course-profile-info', '_bx_courses_page_title_sys_profile_info', '_bx_courses_page_title_profile_info', 'bx_courses', 5, 2147483647, 1, 'page.php?i=course-profile-info', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_profile_info', 1, 'bx_courses', '_bx_courses_page_block_title_system_profile_info', '_bx_courses_page_block_title_profile_info_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:16:"entity_info_full";}', 0, 0, 1, 1),
('bx_courses_profile_info', 1, 'bx_courses', '', '_bx_courses_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 2);

-- PAGE: manage profile pricing
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_profile_pricing', 'edit-course-pricing', '_bx_courses_page_title_sys_profile_pricing', '_bx_courses_page_title_profile_pricing', 'bx_courses', 5, 2147483647, 1, 'page.php?i=edit-course-pricing', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_profile_pricing', 1, 'bx_courses', '_bx_courses_page_block_title_system_profile_pricing', '_bx_courses_page_block_title_profile_pricing_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:14:"entity_pricing";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: manage profile content
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_profile_content', 'edit-course-content', '_bx_courses_page_title_sys_profile_content', '_bx_courses_page_title_profile_content', 'bx_courses', 5, 2147483647, 1, 'page.php?i=edit-course-content', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_profile_content', 1, 'bx_courses', '_bx_courses_page_block_title_system_profile_structure', '_bx_courses_page_block_title_profile_structure_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:30:"entity_content_structure_block";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_courses_profile_content', 1, 'bx_courses', '_bx_courses_page_block_title_system_profile_data', '_bx_courses_page_block_title_profile_data_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:25:"entity_content_data_block";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 2);

-- PAGE: course fans
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_fans', 'course-fans', '_bx_courses_page_title_sys_entry_fans', '_bx_courses_page_title_entry_fans', 'bx_courses', 5, 2147483647, 1, 'page.php?i=course-fans', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_fans', 1, 'bx_courses', '_bx_courses_page_block_title_system_fans', '_bx_courses_page_block_title_fans_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:10:"fans_table";}', 0, 0, 1, 1),
('bx_courses_fans', 1, 'bx_courses', '_bx_courses_page_block_title_system_invites', '_bx_courses_page_block_title_fans_invites', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:13:"invites_table";}', 0, 0, 1, 1);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_profile_comments', '_bx_courses_page_title_sys_profile_comments', '_bx_courses_page_title_profile_comments', 'bx_courses', 5, 2147483647, 1, 'course-profile-comments', '', '', '', '', 0, 1, 0, 'BxCoursesPageEntry', 'modules/boonex/courses/classes/BxCoursesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_profile_comments', 1, 'bx_courses', '_bx_courses_page_block_title_profile_comments', '_bx_courses_page_block_title_profile_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"entity_comments";}', 0, 0, 0, 1);

-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_home', '_bx_courses_page_title_sys_recent', '_bx_courses_page_title_recent', 'bx_courses', 5, 2147483647, 1, 'courses-home', 'page.php?i=courses-home', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_courses_home', 1, 'bx_courses', '_bx_courses_page_block_title_featured_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 0),
('bx_courses_home', 1, 'bx_courses', '_bx_courses_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"browse_recent_profiles";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1);

-- PAGE: top profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_top', '_bx_courses_page_title_sys_top', '_bx_courses_page_title_top', 'bx_courses', 5, 2147483647, 1, 'courses-top', 'page.php?i=courses-top', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_top', 1, 'bx_courses', '_bx_courses_page_block_title_top_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:19:"browse_top_profiles";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 0);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_search', '_bx_courses_page_title_sys_entries_search', '_bx_courses_page_title_entries_search', 'bx_courses', 5, 2147483647, 1, 'courses-search', 'page.php?i=courses-search', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_search', 1, 'bx_courses', '_bx_courses_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:10:"bx_courses";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_courses_search', 1, 'bx_courses', '_bx_courses_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:10:"bx_courses";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_courses_search', 1, 'bx_courses', '_bx_courses_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:15:"bx_courses_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_courses_search', 1, 'bx_courses', '_bx_courses_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:15:"bx_courses_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: joined profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_joined_courses', '_bx_courses_page_title_sys_joined', '_bx_courses_page_title_joined', 'bx_courses', 5, 2147483647, 1, 'courses-joined', 'page.php?i=courses-joined', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_joined_courses', 1, 'bx_courses', '_bx_courses_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;b:1;}}', 0, 1, 0);

-- PAGE: module manage own

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_manage', '_bx_courses_page_title_sys_manage', '_bx_courses_page_title_manage', 'bx_courses', 5, 2147483647, 1, 'courses-manage', 'page.php?i=courses-manage', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_manage', 1, 'bx_courses', '_bx_courses_page_block_title_system_manage', '_bx_courses_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_administration', '_bx_courses_page_title_sys_manage_administration', '_bx_courses_page_title_manage', 'bx_courses', 5, 192, 1, 'courses-administration', 'page.php?i=courses-administration', '', '', '', 0, 1, 0, 'BxCoursesPageBrowse', 'modules/boonex/courses/classes/BxCoursesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_administration', 1, 'bx_courses', '_bx_courses_page_block_title_system_manage_administration', '_bx_courses_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: context's courses
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_context', 'courses-context', '_bx_courses_page_title_sys_entries_in_context', '_bx_courses_page_title_entries_in_context', 'bx_courses', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxCoursesPageEntriesInContext', 'modules/boonex/courses/classes/BxCoursesPageEntriesInContext.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_courses_context', 1, 'bx_courses', '_bx_courses_page_block_title_sys_entries_in_context', '_bx_courses_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:14:"browse_context";}', 0, 0, 1, 1);

-- PAGE: user's courses
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_joined', 'joined-courses', '_bx_courses_page_title_sys_joined_entries', '_bx_courses_page_title_joined_entries', 'bx_courses', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxCoursesPageJoinedEntries', 'modules/boonex/courses/classes/BxCoursesPageJoinedEntries.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_courses_joined', 1, 'bx_courses', '_bx_courses_page_block_title_sys_entries_actions', '_bx_courses_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_courses_joined', 1, 'bx_courses', '_bx_courses_page_block_title_sys_entries_of_author', '_bx_courses_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"browse_created_entries";}', 0, 0, 0, 2),
('bx_courses_joined', 1, 'bx_courses', '_bx_courses_page_block_title_sys_favorites_of_author', '_bx_courses_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"browse_favorite";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 3),
('bx_courses_joined', 1, 'bx_courses', '_bx_courses_page_block_title_sys_joined_entries_summary', '_bx_courses_page_block_title_joined_entries_summary', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"joined_entries_summary";}', 0, 0, 1, 4),
('bx_courses_joined', 1, 'bx_courses', '_bx_courses_page_block_title_sys_joined_entries', '_bx_courses_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;i:0;i:1;b:1;}}', 0, 0, 1, 5);

-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_favorites', '_bx_courses_page_title_sys_entries_favorites', '_bx_courses_page_title_entries_favorites', 'bx_courses', 12, 2147483647, 1, 'courses-favorites', 'page.php?i=courses-favorites', '', '', '', 0, 1, 0, 'BxCoursesPageListEntry', 'modules/boonex/courses/classes/BxCoursesPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_courses_favorites', 2, 'bx_courses', '_bx_courses_page_block_title_sys_favorites_entries', '_bx_courses_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_courses_favorites', 3, 'bx_courses', '', '_bx_courses_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_courses_favorites', 3, 'bx_courses', '', '_bx_courses_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_home', 1, 'bx_courses', '', '_bx_courses_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"browse_recent_profiles";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 1, 'bx_courses', '_bx_courses_page_block_title_sys_recommended_entries_view_showcase', '_bx_courses_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:18:"browse_recommended";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'bx_courses', '', '_bx_courses_page_block_title_categories', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:15:"bx_courses_cats";i:1;a:2:{s:10:"show_empty";b:1;s:21:"show_empty_categories";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 1, 1, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_featured_entries_view_showcase', '_bx_courses_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"browse_featured";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_recommended_entries_view_showcase', '_bx_courses_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:18:"browse_recommended";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_labels_tree', '_bx_courses_page_block_title_labels_tree', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"get_lables_tree";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_browse_by_label', '_bx_courses_page_block_title_browse_by_label', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:15:"browse_by_label";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 5),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_labels_breadcrumbs', '_bx_courses_page_block_title_labels_breadcrumbs', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"get_lables_breadcrumbs";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, 'bx_courses', '_bx_courses_page_block_title_sys_cover_block', '_bx_courses_page_block_title_cover_block', 3, 2147483647, 'service', 'a:2:{s:6:\"module\";s:10:\"bx_courses\";s:6:\"method\";s:12:\"entity_cover\";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 7);

-- MENU

-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_courses', 'courses-home', '_bx_courses_menu_item_title_system_entries_home', '_bx_courses_menu_item_title_entries_home', 'page.php?i=courses-home', '', '', 'book-reader', 'bx_courses_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_courses', 'courses-home', '_bx_courses_menu_item_title_system_entries_home', '_bx_courses_menu_item_title_entries_home', 'page.php?i=courses-home', '', '', 'book-reader', 'bx_courses_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_courses', 'create-course-profile', '_bx_courses_menu_item_title_system_create_profile', '_bx_courses_menu_item_title_create_profile', 'page.php?i=create-course-profile', '', '', 'book-reader', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: view actions

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_actions', '_bx_courses_menu_title_view_profile_actions', 'bx_courses_view_actions', 'bx_courses', 9, 0, 1, 'BxCoursesMenuViewActions', 'modules/boonex/courses/classes/BxCoursesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_view_actions', 'bx_courses', '_bx_courses_menu_set_title_view_profile_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_courses_view_actions', 'bx_courses', 'join-course-profile', '_bx_courses_menu_item_title_system_pay_and_join', '{title_pay_and_join}', 'page.php?i=join-course-profile&profile_id={profile_id}', '', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"is_paid_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 5),
('bx_courses_view_actions', 'bx_courses', 'profile-fan-add', '_bx_courses_menu_item_title_system_become_fan', '{title_add_fan}', 'javascript:void(0)', 'bx_conn_action(this, \'bx_courses_fans\', \'add\', \'{profile_id}\')', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 5),
('bx_courses_view_actions', 'bx_courses', 'profile-fan-remove', '_bx_courses_menu_item_title_system_leave_entry', '{title_remove_fan}', 'javascript:void(0)', 'bx_conn_action(this, \'bx_courses_fans\', \'remove\', \'{profile_id}\')', '', 'sign-out-alt', '', 0, 2147483647, '', 1, 0, 1, 6),
('bx_courses_view_actions', 'bx_courses', 'profile-subscribe-add', '_bx_courses_menu_item_title_system_subscribe', '_bx_courses_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 20),
('bx_courses_view_actions', 'bx_courses', 'profile-subscribe-remove', '_bx_courses_menu_item_title_system_unsubscribe', '_bx_courses_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'remove\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 21),
('bx_courses_view_actions', 'bx_courses', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_courses'', content_id: {content_id}});', '', 'check-circle', '', 0, 192, 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 1, 30),
('bx_courses_view_actions', 'bx_courses', 'profile-actions-more', '_bx_courses_menu_item_title_system_more_actions', '_bx_courses_menu_item_title_more_actions', 'javascript:void(0)', 'bx_menu_popup(''bx_courses_view_actions_more'', this, {}, {profile_id:{profile_id}});', '', 'cog', 'bx_courses_view_actions_more', 1, 2147483647, '', 1, 0, 1, 9999);

-- MENU: view actions more

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_actions_more', '_bx_courses_menu_title_view_profile_actions_more', 'bx_courses_view_actions_more', 'bx_courses', 6, 0, 1, 'BxCoursesMenuViewActions', 'modules/boonex/courses/classes/BxCoursesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_view_actions_more', 'bx_courses', '_bx_courses_menu_set_title_view_profile_actions_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_courses_view_actions_more', 'bx_courses', 'add-course-content', '_bx_courses_menu_item_title_system_add_content', '_bx_courses_menu_item_title_add_content', 'javascript:void(0)', 'bx_menu_popup(''bx_courses_add_content'', this, {}, {profile_id:{profile_id}});', '', 'folder-plus', 'bx_courses_add_content', 2147483647, '', 1, 0, 5),
('bx_courses_view_actions_more', 'bx_courses', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', 192, '', 1, 0, 20),
('bx_courses_view_actions_more', 'bx_courses', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_courses&content_id={content_id}', '', '', 'history', '', 192, '', 1, 0, 30),
('bx_courses_view_actions_more', 'bx_courses', 'hide-course-profile', '_bx_courses_menu_item_title_system_hide_profile', '_bx_courses_menu_item_title_hide_profile', 'javascript:void(0);', 'javascript:{js_object}.perform(this, ''hide-course-profile'', {content_id});', '', 'stop-circle', '', 2147483647, '', 1, 0, 35),
('bx_courses_view_actions_more', 'bx_courses', 'unhide-course-profile', '_bx_courses_menu_item_title_system_unhide_profile', '_bx_courses_menu_item_title_unhide_profile', 'javascript:void(0);', 'javascript:{js_object}.perform(this, ''unhide-course-profile'', {content_id});', '', 'play-circle', '', 2147483647, '', 1, 0, 36),
('bx_courses_view_actions_more', 'bx_courses', 'edit-course-profile', '_bx_courses_menu_item_title_system_edit_profile', '_bx_courses_menu_item_title_edit_profile', 'page.php?i=edit-course-profile&id={content_id}', '', '', 'pencil-alt', '', 2147483647, '', 1, 0, 40),
('bx_courses_view_actions_more', 'bx_courses', 'edit-course-pricing', '_bx_courses_menu_item_title_system_edit_pricing', '_bx_courses_menu_item_title_edit_pricing', 'page.php?i=edit-course-pricing&profile_id={profile_id}', '', '', 'money-check-alt', '', 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:20:"is_pricing_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 41),
('bx_courses_view_actions_more', 'bx_courses', 'edit-course-content', '_bx_courses_menu_item_title_system_edit_content', '_bx_courses_menu_item_title_edit_content', 'page.php?i=edit-course-content&profile_id={profile_id}', '', '', 'folder-open', '', 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:20:"is_content_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 42),
('bx_courses_view_actions_more', 'bx_courses', 'invite-to-course', '_bx_courses_menu_item_title_system_invite', '_bx_courses_menu_item_title_invite', 'page.php?i=invite-to-course&id={content_id}', '', '', 'user-friends', '', 2147483647, '', 1, 0, 45),
('bx_courses_view_actions_more', 'bx_courses', 'delete-course-profile', '_bx_courses_menu_item_title_system_delete_profile', '_bx_courses_menu_item_title_delete_profile', 'page.php?i=delete-course-profile&id={content_id}', '', '', 'remove', '', 2147483647, '', 1, 0, 50),
('bx_courses_view_actions_more', 'bx_courses', 'approve-course-profile', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, '', 1, 0, 60);

-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_actions_all', '_sys_menu_title_view_actions', 'bx_courses_view_actions_all', 'bx_courses', 15, 1, 0, 1, 'BxCoursesMenuViewActionsAll', 'modules/boonex/courses/classes/BxCoursesMenuViewActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_view_actions_all', 'bx_courses', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_courses_view_actions_all', 'bx_courses', 'join-course-profile', '_bx_courses_menu_item_title_system_pay_and_join', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 5),
('bx_courses_view_actions_all', 'bx_courses', 'profile-fans', '_bx_courses_menu_item_title_system_fans', '', '', '', '', '', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 10),
('bx_courses_view_actions_all', 'bx_courses', 'profile-fan-add', '_bx_courses_menu_item_title_system_become_fan', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 12),
('bx_courses_view_actions_all', 'bx_courses', 'profile-fan-remove', '_bx_courses_menu_item_title_system_leave_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 14),
('bx_courses_view_actions_all', 'bx_courses', 'profile-subscriptions', '_bx_courses_menu_item_title_system_subscriptions', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_courses_view_actions_all', 'bx_courses', 'profile-subscribe-add', '_bx_courses_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 32),
('bx_courses_view_actions_all', 'bx_courses', 'profile-subscribe-remove', '_bx_courses_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 34),
('bx_courses_view_actions_all', 'bx_courses', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '', '', '', '', '', '', '', 0, 192, 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 50),
('bx_courses_view_actions_all', 'bx_courses', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_courses_view_actions_all', 'bx_courses', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_courses_view_actions_all', 'bx_courses', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 220),
('bx_courses_view_actions_all', 'bx_courses', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 225),
('bx_courses_view_actions_all', 'bx_courses', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 230),
('bx_courses_view_actions_all', 'bx_courses', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_courses_view_actions_all', 'bx_courses', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_courses_view_actions_all', 'bx_courses', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_courses_view_actions_all', 'bx_courses', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_courses_view_actions_all', 'bx_courses', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_courses_view_actions_all', 'bx_courses', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: add content menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_add_content', '_bx_courses_menu_title_add_content', 'sys_add_content_links', 'bx_courses', 6, 0, 1, 'BxCoursesMenuAddContent', 'modules/boonex/courses/classes/BxCoursesMenuAddContent.php');

-- MENU: meta (counters) menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_meta', '_bx_courses_menu_title_view_profile_meta', 'bx_courses_view_meta', 'bx_courses', 15, 0, 1, 'BxCoursesMenuViewMeta', 'modules/boonex/courses/classes/BxCoursesMenuViewMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_view_meta', 'bx_courses', '_bx_courses_menu_set_title_view_profile_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_courses_view_meta', 'bx_courses', 'members', '_sys_menu_item_title_system_sm_members', '_sys_menu_item_title_sm_members', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_courses_view_meta', 'bx_courses', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_courses_view_meta', 'bx_courses', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_courses_view_meta', 'bx_courses', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_courses_view_meta', 'bx_courses', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 0, 2147483647, '', 0, 0, 43),
('bx_courses_view_meta', 'bx_courses', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 0, 2147483647, '', 0, 0, 46),
('bx_courses_view_meta', 'bx_courses', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50);

-- MENU: add content menu for entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_content_add', '_bx_courses_menu_title_content_add', 'bx_courses_content_add', 'bx_courses', 6, 1, 0, 1, 'BxCoursesMenuContentAdd', 'modules/boonex/courses/classes/BxCoursesMenuContentAdd.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_content_add', 'bx_courses', '_bx_courses_menu_set_title_content_add', 0);

-- MENU: actions menu for my entries

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_my', '_bx_courses_menu_title_entries_my', 'bx_courses_my', 'bx_courses', 9, 0, 1, 'BxCoursesMenu', 'modules/boonex/courses/classes/BxCoursesMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_my', 'bx_courses', '_bx_courses_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_courses_my', 'bx_courses', 'create-course-profile', '_bx_courses_menu_item_title_system_create_profile', '_bx_courses_menu_item_title_create_profile', 'page.php?i=create-course-profile', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_submenu', '_bx_courses_menu_title_submenu', 'bx_courses_submenu', 'bx_courses', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_submenu', 'bx_courses', '_bx_courses_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_courses_submenu', 'bx_courses', 'courses-home', '_bx_courses_menu_item_title_system_entries_recent', '_bx_courses_menu_item_title_entries_recent', 'page.php?i=courses-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_courses_submenu', 'bx_courses', 'courses-top', '_bx_courses_menu_item_title_system_entries_top', '_bx_courses_menu_item_title_entries_top', 'page.php?i=courses-top', '', '', '', '', 2147483647, 1, 1, 2),
('bx_courses_submenu', 'bx_courses', 'courses-search', '_bx_courses_menu_item_title_system_entries_search', '_bx_courses_menu_item_title_entries_search', 'page.php?i=courses-search', '', '', '', '', 2147483647, 1, 1, 3),
('bx_courses_submenu', 'bx_courses', 'courses-joined', '_bx_courses_menu_item_title_system_entries_joined', '_bx_courses_menu_item_title_entries_joined', 'page.php?i=courses-joined', '', '', '', '', 2147483647, 1, 1, 4),
('bx_courses_submenu', 'bx_courses', 'courses-manage', '_bx_courses_menu_item_title_system_entries_manage', '_bx_courses_menu_item_title_entries_manage', 'page.php?i=courses-manage', '', '', '', '', 2147483646, 1, 1, 5);

-- MENU: view submenu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_view_submenu', '_bx_courses_menu_title_view_profile_submenu', 'bx_courses_view_submenu', 'bx_courses', 18, 0, 1, 'BxCoursesMenuView', 'modules/boonex/courses/classes/BxCoursesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_view_submenu', 'bx_courses', '_bx_courses_menu_set_title_view_profile_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_courses_view_submenu', 'bx_courses', 'view-course-profile', '_bx_courses_menu_item_title_system_view_profile_view', '_bx_courses_menu_item_title_view_profile_view', 'page.php?i=view-course-profile&id={content_id}', '', '', 'book-reader', '', '', 0, 2147483647, 1, 0, 1),
('bx_courses_view_submenu', 'bx_courses', 'course-profile-info', '_bx_courses_menu_item_title_system_view_profile_info', '_bx_courses_menu_item_title_view_profile_info', 'page.php?i=course-profile-info&id={content_id}', '', '', 'info-circle col-gray', '', '', 0, 2147483647, 1, 0, 2),
('bx_courses_view_submenu', 'bx_courses', 'course-profile-comments', '_bx_courses_menu_item_title_system_view_profile_comments', '_bx_courses_menu_item_title_view_profile_comments', 'page.php?i=course-profile-comments&id={content_id}', '', '', '', '', '', 0, 2147483647, 0, 0, 3),
('bx_courses_view_submenu', 'bx_courses', 'course-fans', '_bx_courses_menu_item_title_system_view_fans', '_bx_courses_menu_item_title_view_fans', 'page.php?i=course-fans&profile_id={profile_id}', '', '', 'users col-blue3', '', '', 0, 2147483647, 1, 0, 4),
('bx_courses_view_submenu', 'bx_courses', 'more-auto', '_bx_courses_menu_item_title_system_view_profile_more_auto', '_bx_courses_menu_item_title_view_profile_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_courses_snippet_meta', 'bx_courses', 15, 0, 1, 'BxCoursesMenuSnippetMeta', 'modules/boonex/courses/classes/BxCoursesMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_snippet_meta', 'bx_courses', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_courses_snippet_meta', 'bx_courses', 'privacy', '_bx_courses_menu_item_title_system_sm_privacy', '_bx_courses_menu_item_title_sm_privacy', '', '', '', '', '', 2147483647, '', 1, 0, 1, 0),
('bx_courses_snippet_meta', 'bx_courses', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, '', 0, 0, 1, 1),
('bx_courses_snippet_meta', 'bx_courses', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, '', 0, 0, 1, 5),
('bx_courses_snippet_meta', 'bx_courses', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, '', 0, 0, 1, 10),
('bx_courses_snippet_meta', 'bx_courses', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, '', 0, 0, 1, 15),
('bx_courses_snippet_meta', 'bx_courses', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, '', 0, 0, 1, 16),
('bx_courses_snippet_meta', 'bx_courses', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, '', 0, 0, 1, 17),
('bx_courses_snippet_meta', 'bx_courses', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, '', 0, 0, 1, 18),
('bx_courses_snippet_meta', 'bx_courses', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, '', 0, 0, 1, 20),
('bx_courses_snippet_meta', 'bx_courses', 'members', '_bx_courses_menu_item_title_system_sm_members', '_bx_courses_menu_item_title_sm_members', '', '', '', '', '', 2147483647, '', 1, 0, 1, 25),
('bx_courses_snippet_meta', 'bx_courses', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 2147483647, '', 0, 0, 1, 30),
('bx_courses_snippet_meta', 'bx_courses', 'reports', '_bx_courses_menu_item_title_system_sm_reports', '', '', '', '', '', '', 2147483647, '', 0, 0, 1, 33),
('bx_courses_snippet_meta', 'bx_courses', 'nl', '_sys_menu_item_title_system_sm_nl', '_sys_menu_item_title_sm_nl', '', '', '', '', '', 2147483647, '', 1, 0, 1, 35),
('bx_courses_snippet_meta', 'bx_courses', 'join-paid', '_sys_menu_item_title_system_sm_join_paid', '_sys_menu_item_title_sm_join_paid', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:33:"is_paid_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 1, 40),
('bx_courses_snippet_meta', 'bx_courses', 'join', '_bx_courses_menu_item_title_system_sm_join', '_bx_courses_menu_item_title_sm_join', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:33:"is_free_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 1, 45),
('bx_courses_snippet_meta', 'bx_courses', 'leave', '_sys_menu_item_title_system_sm_leave', '_sys_menu_item_title_sm_leave', '', '', '', '', '', 2147483647, '', 0, 0, 1, 50),
('bx_courses_snippet_meta', 'bx_courses', 'subscribe', '_sys_menu_item_title_system_sm_subscribe', '_sys_menu_item_title_sm_subscribe', '', '', '', '', '', 2147483647, '', 0, 0, 1, 55),
('bx_courses_snippet_meta', 'bx_courses', 'unsubscribe', '_sys_menu_item_title_system_sm_unsubscribe', '_sys_menu_item_title_sm_unsubscribe', '', '', '', '', '', 2147483647, '', 0, 0, 1, 60),
('bx_courses_snippet_meta', 'bx_courses', 'pass', '_bx_courses_menu_item_title_system_sm_pass', '', '', '', '', '', '', 2147483647, '', 0, 0, 1, 65);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_courses', 'profile-stats-my-courses', '_bx_courses_menu_item_title_system_manage_my_entries', '_bx_courses_menu_item_title_manage_my_entries', 'page.php?i=joined-courses&profile_id={member_id}', '', '_self', 'book-reader', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 2);

-- MENU: profile followings
SET @iFollowingsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_followings' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_followings', 'bx_courses', 'courses', '_bx_courses_menu_item_title_system_followings', '_bx_courses_menu_item_title_followings', 'javascript:void(0)', '', '_self', 'book-reader', '', '', 2147483647, 0, 1, 0, @iFollowingsMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_courses_menu_manage_tools', '_bx_courses_menu_title_manage_tools', 'bx_courses_menu_manage_tools', 'bx_courses', 6, 0, 1, 'BxCoursesMenuManageTools', 'modules/boonex/courses/classes/BxCoursesMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_courses_menu_manage_tools', 'bx_courses', '_bx_courses_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_courses_menu_manage_tools', 'bx_courses', 'clear-reports', '_bx_courses_menu_item_title_system_clear_reports', '_bx_courses_menu_item_title_clear_reports', 'javascript:void(0)', 'javascript:{js_object}.onClickClearReports({content_id});', '_self', 'eraser', '', 2147483647, 1, 0, 1),
('bx_courses_menu_manage_tools', 'bx_courses', 'delete', '_bx_courses_menu_item_title_system_delete', '_bx_courses_menu_item_title_delete', 'javascript:void(0)', 'javascript:{js_object}.onClickDelete({content_id});', '_self', 'far trash-alt', '', 2147483647, 1, 0, 2),
('bx_courses_menu_manage_tools', 'bx_courses', 'delete-with-content', '_bx_courses_menu_item_title_system_delete_with_content', '_bx_courses_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 2147483647, 0, 0, 3);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_courses', 'courses-administration', '_bx_courses_menu_item_title_system_admt_entries', '_bx_courses_menu_item_title_admt_entries', 'page.php?i=courses-administration', '', '_self', 'users', 'a:2:{s:6:"module";s:10:"bx_courses";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_courses', 'joined-courses', '_bx_courses_menu_item_title_system_view_joined_entries', '_bx_courses_menu_item_title_view_joined_entries', 'page.php?i=joined-courses&profile_id={profile_id}', '', '', 'book-reader', '', 2147483647, '', 1, 0, 0),
('trigger_group_view_submenu', 'bx_courses', 'courses-context', '_bx_courses_menu_item_title_system_view_entries_in_context', '_bx_courses_menu_item_title_view_entries_in_context', 'page.php?i=courses-context&profile_id={profile_id}', '', '', 'book-reader', '', 2147483647, 'a:3:{s:6:"module";s:10:"bx_courses";s:6:"method";s:21:"is_enable_for_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0);

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'create entry', NULL, '_bx_courses_acl_action_create_profile', '', 1, 1);
SET @iIdActionProfileCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'use paid join', NULL, '_bx_courses_acl_action_use_paid_join', '', 1, 1);
SET @iIdActionUsePaidJoin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'delete entry', NULL, '_bx_courses_acl_action_delete_profile', '', 1, 1);
SET @iIdActionProfileDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'view entry', NULL, '_bx_courses_acl_action_view_profile', '', 1, 0);
SET @iIdActionProfileView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'edit any entry', NULL, '_bx_courses_acl_action_edit_any_profile', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'delete any entry', NULL, '_bx_courses_acl_action_delete_any_profile', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_courses', 'delete invites', NULL, '_bx_courses_acl_action_delete_invites', '', 1, 3);
SET @iIdActionProfileDeleteInvites = LAST_INSERT_ID();

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

-- use paid join
(@iStandard, @iIdActionUsePaidJoin),
(@iModerator, @iIdActionUsePaidJoin),
(@iAdministrator, @iIdActionUsePaidJoin),
(@iPremium, @iIdActionUsePaidJoin),

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
(@iAdministrator, @iIdActionProfileDeleteAny),

-- any invites edit
(@iModerator, @iIdActionProfileDeleteInvites),
(@iAdministrator, @iIdActionProfileDeleteInvites);


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_courses', 'bx_courses', 'bx_courses_meta_keywords', 'bx_courses_meta_locations', 'bx_courses_meta_mentions', '', '');

-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_cats', 'bx_courses',  'bx_courses', 'bx_course', 'bx_courses_cats', 'bx_courses_data', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`content_id` = `bx_courses_data`.`id` AND `sys_profiles`.`type` = ''bx_courses'')', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_courses', '_bx_courses', @iSearchOrder + 1, 'BxCoursesSearchResult', 'modules/boonex/courses/classes/BxCoursesSearchResult.php');

-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `tt_content`, `tf_id_content`, `tf_count_content`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_fans', 'bx_courses_fans', 1, 1, 'mutual', 'bx_courses_data', 'id', 'members', 'BxCoursesConnectionFans', 'modules/boonex/courses/classes/BxCoursesConnectionFans.php');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_courses', 'bx_courses', '_bx_courses', 'page.php?i=courses-home', 'book-reader', 'SELECT COUNT(*) FROM `bx_courses_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_courses'' WHERE 1 AND `tp`.`status`=''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_courses_growth', '_bx_courses_chart_growth', 'bx_courses_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_courses'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_courses_growth_speed', '_bx_courses_chart_growth_speed', 'bx_courses_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_courses'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRID: connections
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_fans', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxCoursesGridConnections', 'modules/boonex/courses/classes/BxCoursesGridConnections.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_courses_fans', 'name', '_sys_name', '50%', '', 10),
('bx_courses_fans', 'role', '_bx_courses_txt_role', '10%', '', 15),
('bx_courses_fans', 'role_added', '_bx_courses_txt_role_added', '10%', '', 16),
('bx_courses_fans', 'role_expired', '_bx_courses_txt_role_expired', '10%', '', 17),
('bx_courses_fans', 'actions', '', '20%', '', 20);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_courses_fans', 'single', 'accept', '_sys_accept', '', 0, 10),
('bx_courses_fans', 'single', 'set_role', '_bx_courses_txt_set_role', '', 0, 20),
('bx_courses_fans', 'single', 'set_role_submit', '', '', 0, 21),
('bx_courses_fans', 'single', 'delete', '', 'remove', 1, 40);


-- GRID: invites
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_invites', 'Sql', 'SELECT `bx_courses_invites`.`id`, `bx_courses_invites`.`invited_profile_id`, `bx_courses_invites`.`added`, `bx_courses_invites`.`author_profile_id` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) INNER JOIN `bx_courses_invites` ON `bx_courses_invites`.`invited_profile_id` = `p`.`id` ', 'bx_courses_invites', 'id', 'bx_courses_invites`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxCoursesGridInvites', 'modules/boonex/courses/classes/BxCoursesGridInvites.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_courses_invites', 'name', '_sys_name', '33%', '', 10),
('bx_courses_invites', 'added', '_sys_added', '33%', '', 20),
('bx_courses_invites', 'actions', '', '34%', '', 30);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_courses_invites', 'single', 'delete', '', 'remove', 1, 10);


-- GRIDS: administration

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_administration', 'Sql', 'SELECT `td`.*, `td`.`name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_courses_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_courses'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_courses_data', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'name', '', 'like', 'reports', '', 192, 'BxCoursesGridAdministration', 'modules/boonex/courses/classes/BxCoursesGridAdministration.php'),
('bx_courses_common', 'Sql', 'SELECT `td`.*, `td`.`name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_courses_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_courses'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_courses_data', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'name', '', 'like', '', '', 2147483647, 'BxCoursesGridCommon', 'modules/boonex/courses/classes/BxCoursesGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_courses_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_courses_administration', 'switcher', '_bx_courses_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_courses_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_courses_administration', 'name', '_bx_courses_grid_column_title_adm_name', '25%', 0, '', '', 4),
('bx_courses_administration', 'added_ts', '_bx_courses_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_courses_administration', 'account', '_bx_courses_grid_column_title_adm_account', '20%', 0, '25', '', 6),
('bx_courses_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_courses_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_courses_common', 'switcher', '_bx_courses_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_courses_common', 'name', '_bx_courses_grid_column_title_adm_name', '40%', 0, '', '', 3),
('bx_courses_common', 'added_ts', '_bx_courses_grid_column_title_adm_added', '30%', 1, '25', '', 4),
('bx_courses_common', 'actions', '', '20%', 0, '', '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('bx_courses_administration', 'bulk', 'clear_reports', '_bx_courses_grid_action_title_adm_clear_reports', '', 0, 1, 1, 1),
('bx_courses_administration', 'bulk', 'delete', '_bx_courses_grid_action_title_adm_delete', '', 0, 1, 1, 2),
('bx_courses_administration', 'bulk', 'delete_with_content', '_bx_courses_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 3),
('bx_courses_administration', 'single', 'settings', '_bx_courses_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 2),
('bx_courses_administration', 'single', 'audit_content', '_bx_courses_grid_action_title_adm_audit_content', 'search', 1, 0, 1, 3),
('bx_courses_administration', 'single', 'audit_context', '_bx_courses_grid_action_title_adm_audit_context', 'search-location', 1, 0, 1, 4),

('bx_courses_common', 'bulk', 'delete', '_bx_courses_grid_action_title_adm_delete', '', 0, 1, 1, 1),
('bx_courses_common', 'bulk', 'delete_with_content', '_bx_courses_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 2),
('bx_courses_common', 'single', 'settings', '_bx_courses_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 1);

-- GRIDS: Pricing
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_prices_manage', 'Sql', 'SELECT *, `default` AS `default_price` FROM `bx_courses_prices` WHERE 1 ', 'bx_courses_prices', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxCoursesGridPricesManage', 'modules/boonex/courses/classes/BxCoursesGridPricesManage.php'),
('bx_courses_prices_view', 'Sql', 'SELECT * FROM `bx_courses_prices` WHERE `active`<>''0'' ', 'bx_courses_prices', 'id', 'order', '', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxCoursesGridPricesView', 'modules/boonex/courses/classes/BxCoursesGridPricesView.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_courses_prices_manage', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_courses_prices_manage', 'order', '', '2%', 0, 0, '', 2),
('bx_courses_prices_manage', 'switcher', '', '6%', 0, 0, '', 3),
('bx_courses_prices_manage', 'name', '_bx_courses_grid_column_title_name', '15%', 0, 16, '', 4),
('bx_courses_prices_manage', 'caption', '_bx_courses_grid_column_title_caption', '20%', 0, 32, '', 5),
('bx_courses_prices_manage', 'price', '_bx_courses_grid_column_title_price', '15%', 0, 16, '', 6),
('bx_courses_prices_manage', 'period', '_bx_courses_grid_column_title_period', '15%', 0, 16, '', 7),
('bx_courses_prices_manage', 'default_price', '_bx_courses_grid_column_title_default_price', '5%', 0, 0, '', 8),
('bx_courses_prices_manage', 'actions', '', '20%', 0, 0, '', 9),

('bx_courses_prices_view', 'role_id', '_bx_courses_grid_column_title_role_id', '40%', 0, 32, '', 1),
('bx_courses_prices_view', 'price', '_bx_courses_grid_column_title_price', '20%', 0, 16, '', 2),
('bx_courses_prices_view', 'period', '_bx_courses_grid_column_title_period', '20%', 0, 16, '', 3),
('bx_courses_prices_view', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_courses_prices_manage', 'independent', 'add', '_bx_courses_grid_action_title_add', '', 0, 0, 1),
('bx_courses_prices_manage', 'single', 'edit', '_bx_courses_grid_action_title_edit', 'pencil-alt', 1, 0, 1),
('bx_courses_prices_manage', 'single', 'delete', '_bx_courses_grid_action_title_delete', 'remove', 1, 1, 2),
('bx_courses_prices_manage', 'bulk', 'delete', '_bx_courses_grid_action_title_delete', '', 0, 1, 1),

('bx_courses_prices_view', 'single', 'buy', '_bx_courses_grid_action_title_buy', 'cart-plus', 0, 0, 1),
('bx_courses_prices_view', 'single', 'subscribe', '_bx_courses_grid_action_title_subscribe', 'credit-card', 0, 0, 2),
('bx_courses_prices_view', 'single', 'choose', '_bx_courses_grid_action_title_choose', 'far check-square', 0, 0, 3);


-- GRIDS: content structure
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_cnt_structure_manage', 'Sql', 'SELECT `tcn`.*, `tcs`.`parent_id`, `tcs`.`level`, `tcs`.`cn_l2`, `tcs`.`cn_l3` FROM `bx_courses_content_nodes` AS `tcn` LEFT JOIN `bx_courses_content_structure` AS `tcs` ON `tcn`.`id`=`tcs`.`node_id` WHERE 1 ', 'bx_courses_content_nodes', 'id', 'order', 'status', '', 20, NULL, 'start', '', 'title', '', 'like', '', '', 2147483647, 'BxCoursesGridCntStructureManage', 'modules/boonex/courses/classes/BxCoursesGridCntStructureManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_courses_cnt_structure_manage', 'order', '', '4%', 0, 0, '', 1),
('bx_courses_cnt_structure_manage', 'checkbox', '_sys_select', '4%', 0, 0, '', 2),
('bx_courses_cnt_structure_manage', 'switcher', '_bx_courses_grid_column_title_cnt_active', '7%', 0, 0, '', 3),
('bx_courses_cnt_structure_manage', 'title', '_bx_courses_grid_column_title_cnt_title', '35%', 0, 0, '', 4),
('bx_courses_cnt_structure_manage', 'cn_l2', '_bx_courses_grid_column_title_cnt_cn_l2', '10%', 0, 0, '', 5),
('bx_courses_cnt_structure_manage', 'cn_l3', '_bx_courses_grid_column_title_cnt_cn_l3', '10%', 0, 0, '', 6),
('bx_courses_cnt_structure_manage', 'counters', '_bx_courses_grid_column_title_cnt_counters', '20%', 0, 0, '', 7),
('bx_courses_cnt_structure_manage', 'added', '_bx_courses_grid_column_title_cnt_added', '10%', 0, 0, '', 8),
('bx_courses_cnt_structure_manage', 'actions', '', '20%', 0, 0, '', 9);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_courses_cnt_structure_manage', 'independent', 'back', '_bx_courses_grid_action_title_cnt_back', 'arrow-left', 0, 0, 1),
('bx_courses_cnt_structure_manage', 'independent', 'add', '_bx_courses_grid_action_title_cnt_add', '', 0, 0, 2),
('bx_courses_cnt_structure_manage', 'single', 'edit', '_bx_courses_grid_action_title_cnt_edit', 'pencil-alt', 1, 0, 1),
('bx_courses_cnt_structure_manage', 'single', 'delete', '_bx_courses_grid_action_title_cnt_delete', 'remove', 1, 1, 2),
('bx_courses_cnt_structure_manage', 'bulk', 'delete', '_bx_courses_grid_action_title_cnt_delete', '', 0, 1, 1);

-- GRIDS: content data
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_cnt_data_manage', 'Sql', 'SELECT * FROM `bx_courses_content_data` WHERE 1 ', 'bx_courses_content_data', 'id', 'order', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 'BxCoursesGridCntDataManage', 'modules/boonex/courses/classes/BxCoursesGridCntDataManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_courses_cnt_data_manage', 'order', '', '4%', 0, 0, '', 1),
('bx_courses_cnt_data_manage', 'checkbox', '_sys_select', '4%', 0, 0, '', 2),
('bx_courses_cnt_data_manage', 'content_id', '_bx_courses_grid_column_title_cnt_content_id', '42%', 0, 0, '', 3),
('bx_courses_cnt_data_manage', 'content_type', '_bx_courses_grid_column_title_cnt_content_type', '10%', 0, 0, '', 4),
('bx_courses_cnt_data_manage', 'usage', '_bx_courses_grid_column_title_cnt_usage', '10%', 0, 0, '', 5),
('bx_courses_cnt_data_manage', 'added', '_bx_courses_grid_column_title_cnt_added', '10%', 0, 0, '', 6),
('bx_courses_cnt_data_manage', 'actions', '', '20%', 0, '', '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_courses_cnt_data_manage', 'independent', 'back', '_bx_courses_grid_action_title_cnt_back', 'arrow-left', 0, 0, 1),
('bx_courses_cnt_data_manage', 'independent', 'add_st', '_bx_courses_grid_action_title_cnt_add_step', '', 0, 0, 2),
('bx_courses_cnt_data_manage', 'independent', 'add_at', '_bx_courses_grid_action_title_cnt_add_attachment', '', 0, 0, 3),
('bx_courses_cnt_data_manage', 'single', 'edit', '_bx_courses_grid_action_title_cnt_edit', 'pencil-alt', 1, 0, 1),
('bx_courses_cnt_data_manage', 'single', 'delete', '_bx_courses_grid_action_title_cnt_delete', 'remove', 1, 1, 2),
('bx_courses_cnt_data_manage', 'bulk', 'delete', '_bx_courses_grid_action_title_cnt_delete', '', 0, 1, 1);


-- ALERTS

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_courses', 'BxCoursesAlertsResponse', 'modules/boonex/courses/classes/BxCoursesAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('bx_timeline', 'post_common', @iHandler),
('bx_courses_pics', 'file_deleted', @iHandler),
('bx_courses_fans', 'connection_added', @iHandler),
('bx_courses_fans', 'connection_removed', @iHandler),
('profile', 'delete', @iHandler),
('bx_courses', 'fan_added', @iHandler),
('bx_courses', 'join_invitation', @iHandler),
('bx_courses', 'join_request', @iHandler),
('bx_courses', 'join_request_accepted', @iHandler),
('bx_courses', 'timeline_view', @iHandler),
('bx_courses', 'timeline_post', @iHandler),
('bx_courses', 'timeline_delete', @iHandler),
('bx_courses', 'timeline_comment', @iHandler),
('bx_courses', 'timeline_vote', @iHandler),
('bx_courses', 'timeline_score', @iHandler),
('bx_courses', 'timeline_report', @iHandler),
('bx_courses', 'timeline_repost', @iHandler),
('bx_courses', 'timeline_pin', @iHandler),
('bx_courses', 'timeline_promote', @iHandler);

-- PRIVACY

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_allow_view_to', 'bx_courses', 'view', '_bx_courses_form_profile_input_allow_view_to', '3', 'bx_spaces', 'bx_courses_data', 'id', 'author', 'BxCoursesPrivacy', 'modules/boonex/courses/classes/BxCoursesPrivacy.php'),
('bx_courses_allow_view_notification_to', 'bx_courses', 'view_event', '_bx_courses_form_profile_input_allow_view_notification_to', '3', '', 'bx_notifications_events', 'id', 'object_owner_id', 'BxCoursesPrivacyNotifications', 'modules/boonex/courses/classes/BxCoursesPrivacyNotifications.php'),
('bx_courses_allow_post_to', 'bx_courses', 'post', '_bx_courses_form_profile_input_allow_post_to', 'p', '', 'bx_courses_data', 'id', 'author', 'BxCoursesPrivacyPost', 'modules/boonex/courses/classes/BxCoursesPrivacyPost.php'),
('bx_courses_allow_view_favorite_list', 'bx_courses', 'view_favorite_list', '_bx_courses_form_profile_input_allow_view_favorite_list', '3', '', 'bx_courses_favorites_lists', 'id', 'author_id', 'BxCoursesPrivacy', 'modules/boonex/courses/classes/BxCoursesPrivacy.php');

-- EMAIL TEMPLATES

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_courses', '_bx_courses_email_join_request', 'bx_courses_join_request', '_bx_courses_email_join_request_subject', '_bx_courses_email_join_request_body'),
('bx_courses', '_bx_courses_email_join_reject', 'bx_courses_join_reject', '_bx_courses_email_join_reject_subject', '_bx_courses_email_join_reject_body'),
('bx_courses', '_bx_courses_email_join_confirm', 'bx_courses_join_confirm', '_bx_courses_email_join_confirm_subject', '_bx_courses_email_join_confirm_body'),
('bx_courses', '_bx_courses_email_fan_remove', 'bx_courses_fan_remove', '_bx_courses_email_fan_remove_subject', '_bx_courses_email_fan_remove_body'),
('bx_courses', '_bx_courses_email_fan_become_admin', 'bx_courses_fan_become_admin', '_bx_courses_email_fan_become_admin_subject', '_bx_courses_email_fan_become_admin_body'),
('bx_courses', '_bx_courses_email_admin_become_fan', 'bx_courses_admin_become_fan', '_bx_courses_email_admin_become_fan_subject', '_bx_courses_email_admin_become_fan_body'),
('bx_courses', '_bx_courses_email_set_role', 'bx_courses_set_role', '_bx_courses_email_set_role_subject', '_bx_courses_email_set_role_body'),
('bx_courses', '_bx_courses_email_invitation', 'bx_courses_invitation', '_bx_courses_email_invitation_subject', '_bx_courses_email_invitation_body');

-- UPLOADERS

INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_courses_cover_crop', 1, 'BxCoursesUploaderCoverCrop', 'modules/boonex/courses/classes/BxCoursesUploaderCoverCrop.php'),
('bx_courses_picture_crop', 1, 'BxCoursesUploaderPictureCrop', 'modules/boonex/courses/classes/BxCoursesUploaderPictureCrop.php');

-- CRON

INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_courses_pruning', '0 0 * * *', 'BxCoursesCronPruning', 'modules/boonex/courses/classes/BxCoursesCronPruning.php', '');
