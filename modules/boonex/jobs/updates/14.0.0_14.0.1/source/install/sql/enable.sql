
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_jobs', '_bx_jobs', 'bx_jobs@modules/boonex/jobs/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_jobs', '_bx_jobs', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_jobs_enable_auto_approve', 'on', @iCategId, '_bx_jobs_option_enable_auto_approve', '', 'checkbox', '', '', '', 0),
('bx_jobs_use_cover_as_thumb', 'on', @iCategId, '_bx_jobs_option_use_cover_as_thumb', '_bx_jobs_option_use_cover_as_thumb_inf', 'checkbox', '', '', '', 5),
('bx_jobs_num_connections_quick', '6', @iCategId, '_bx_jobs_option_num_connections_quick', '', 'digit', '', '', '', 10),
('bx_jobs_per_page_browse', '24', @iCategId, '_bx_jobs_option_per_page_browse', '', 'digit', '', '', '', 11),
('bx_jobs_num_rss', '10', @iCategId, '_bx_jobs_option_num_rss', '', 'digit', '', '', '', 12),
('bx_jobs_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', '', 'digit', '', '', '', 15),
('bx_jobs_per_page_browse_recommended', '10', @iCategId, '_sys_option_per_page_browse_recommended', '', 'digit', '', '', '', 16),
('bx_jobs_per_page_for_favorites_lists', '5', @iCategId, '_bx_jobs_option_per_page_for_favorites_lists', '', 'digit', '', '', '', 17),
('bx_jobs_searchable_fields', 'name,desc', @iCategId, '_bx_jobs_option_searchable_fields', '', 'list', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"get_searchable_fields";}', '', '', 30),
('bx_jobs_members_mode', '', @iCategId, '_bx_jobs_option_members_mode', '', 'select', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:24:"get_options_members_mode";}', '', '', 40),
('bx_jobs_enable_subscribe_wo_join', '', @iCategId, '_bx_jobs_option_enable_subscribe_wo_join', '', 'checkbox', '', '', '', 45),
('bx_jobs_internal_notifications', '', @iCategId, '_bx_jobs_option_internal_notifications', '', 'checkbox', '', '', '', 50);

-- PAGES

-- PAGE: create profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_create_profile', 'create-job-profile', '_bx_jobs_page_title_sys_create_profile', '_bx_jobs_page_title_create_profile', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=create-job-profile', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_create_profile', 1, 'bx_jobs', '_bx_jobs_page_block_title_create_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: view profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_profile', 'view-job-profile', '_bx_jobs_page_title_sys_view_profile', '_bx_jobs_page_title_view_profile', 'bx_jobs', 10, 2147483647, 1, 'page.php?i=view-job-profile', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('bx_jobs_view_profile', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0, 0),
('bx_jobs_view_profile', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 0, 0, 0),
('bx_jobs_view_profile', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_applicants', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:10:"applicants";}', 0, 0, 1, 0, 1),
('bx_jobs_view_profile', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 1, 2),
('bx_jobs_view_profile', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 1, 3),
('bx_jobs_view_profile', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_location', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"entity_location";}', 0, 0, 0, 0, 0),
('bx_jobs_view_profile', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"entity_context";}', 0, 0, 1, 0, 1),
('bx_jobs_view_profile', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_admins', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:6:"admins";}', 0, 0, 1, 0, 3),
('bx_jobs_view_profile', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_fans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:19:"fans_without_admins";}', 0, 0, 1, 0, 4),
('bx_jobs_view_profile', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_location', 3, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"locations_map";s:6:"params";a:2:{i:0;s:7:"bx_jobs";i:1;s:12:"{content_id}";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 0, 1, 0, 5),
('bx_jobs_view_profile', 4, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"entity_comments";}', 0, 0, 0, 0, 0),
('bx_jobs_view_profile', 4, 'bx_jobs', '', '_bx_jobs_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"entity_reports";}', 0, 0, 1, 0, 1);


-- PAGE: view closed profile 

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_profile_closed', 'view-job-profile-closed', '_bx_jobs_page_title_sys_view_profile_closed', '_bx_jobs_page_title_view_profile', 'bx_jobs', 10, 2147483647, 1, 'page.php?i=view-job-profile', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_view_profile_closed', 2, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 0),
('bx_jobs_view_profile_closed', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_fans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:4:"fans";}', 0, 0, 1, 0);

-- PAGE: edit profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_edit_profile', 'edit-job-profile', '_bx_jobs_page_title_sys_edit_profile', '_bx_jobs_page_title_edit_profile', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=edit-job-profile', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_edit_profile', 1, 'bx_jobs', '_bx_jobs_page_block_title_edit_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: questionnaire (join)

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_questionnaire', 'job-questionnaire', '_bx_jobs_page_title_sys_questionnaire', '_bx_jobs_page_title_questionnaire', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=job-questionnaire', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_questionnaire', 1, 'bx_jobs', '_bx_jobs_page_block_title_edit_questionnaire', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:25:"entity_edit_questionnaire";}', 0, 0, 0);

-- PAGE: invite members

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_invite', 'invite-to-job', '_bx_jobs_page_title_sys_invite_to_job', '_bx_jobs_page_title_invite_to_job', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=invite-to-job', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_invite', 1, 'bx_jobs', '_bx_jobs_page_block_title_invite_to_job', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:13:"entity_invite";}', 0, 0, 0);

-- PAGE: delete profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_delete_profile', 'delete-job-profile', '_bx_jobs_page_title_sys_delete_profile', '_bx_jobs_page_title_delete_profile', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=delete-job-profile', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_delete_profile', 1, 'bx_jobs', '_bx_jobs_page_block_title_delete_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: join profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_join_profile', 'join-job-profile', '_bx_jobs_page_title_sys_join_profile', '_bx_jobs_page_title_join_profile', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=join-job-profile', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_join_profile', 1, 'bx_jobs', '_bx_jobs_page_block_title_join_profile', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:11:"entity_join";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 0);

-- PAGE: profile info
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_profile_info', 'job-profile-info', '_bx_jobs_page_title_sys_profile_info', '_bx_jobs_page_title_profile_info', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=job-profile-info', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_profile_info', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_profile_info', '_bx_jobs_page_block_title_profile_info_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:16:"entity_info_full";}', 0, 0, 1, 1),
('bx_jobs_profile_info', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_profile_description', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 2);

-- PAGE: manage profile pricing
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_profile_pricing', 'job-pricing', '_bx_jobs_page_title_sys_profile_pricing', '_bx_jobs_page_title_profile_pricing', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=job-pricing', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_profile_pricing', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_profile_pricing', '_bx_jobs_page_block_title_profile_pricing_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"entity_pricing";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: job fans
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_fans', 'job-fans', '_bx_jobs_page_title_sys_job_fans', '_bx_jobs_page_title_job_fans', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=job-fans', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES 
('bx_jobs_fans', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_fans', '_bx_jobs_page_block_title_fans_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"browse_members";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}}', 0, 0, 1, 1, 1);

-- PAGE: job manage
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_manage_item', 'job-manage', '_bx_jobs_page_title_sys_manage_profile', '_bx_jobs_page_title_manage_profile', 'bx_jobs', 5, 2147483647, 1, 'page.php?i=manage', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_manage_item', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_fans_manage', '_bx_jobs_page_block_title_fans_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:10:"fans_table";}', 0, 0, 1, 1),
('bx_jobs_manage_item', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_invites_manage', '_bx_jobs_page_block_title_invites', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:13:"invites_table";}', 0, 0, 1, 2),
('bx_jobs_manage_item', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_bans_manage', '_bx_jobs_page_block_title_bans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:10:"bans_table";}', 0, 0, 1, 3);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_profile_comments', '_bx_jobs_page_title_sys_profile_comments', '_bx_jobs_page_title_profile_comments', 'bx_jobs', 5, 2147483647, 1, 'job-profile-comments', '', '', '', '', 0, 1, 0, 'BxJobsPageEntry', 'modules/boonex/jobs/classes/BxJobsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_profile_comments', 1, 'bx_jobs', '_bx_jobs_page_block_title_profile_comments', '_bx_jobs_page_block_title_profile_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"entity_comments";}', 0, 0, 0, 1);

-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_home', '_bx_jobs_page_title_sys_recent', '_bx_jobs_page_title_recent', 'bx_jobs', 5, 2147483647, 1, 'jobs-home', 'page.php?i=jobs-home', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_jobs_home', 1, 'bx_jobs', '_bx_jobs_page_block_title_featured_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 0),
('bx_jobs_home', 1, 'bx_jobs', '_bx_jobs_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"browse_recent_profiles";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1);

-- PAGE: top profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_top', '_bx_jobs_page_title_sys_top', '_bx_jobs_page_title_top', 'bx_jobs', 5, 2147483647, 1, 'jobs-top', 'page.php?i=jobs-top', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_top', 1, 'bx_jobs', '_bx_jobs_page_block_title_top_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:19:"browse_top_profiles";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 0);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_search', '_bx_jobs_page_title_sys_entries_search', '_bx_jobs_page_title_entries_search', 'bx_jobs', 1, 2147483647, 1, 'jobs-search', 'page.php?i=jobs-search', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_search', 1, 'bx_jobs', '_bx_jobs_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:7:"bx_jobs";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_jobs_search', 2, 'bx_jobs', '_bx_jobs_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:7:"bx_jobs";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_jobs_search', 1, 'bx_jobs', '_bx_jobs_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:12:"bx_jobs_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_jobs_search', 2, 'bx_jobs', '_bx_jobs_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:12:"bx_jobs_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_context', 'jobs-context', '_bx_jobs_page_title_sys_entries_in_context', '_bx_jobs_page_title_entries_in_context', 'bx_jobs', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxJobsPageEntriesInContext', 'modules/boonex/jobs/classes/BxJobsPageEntriesInContext.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_jobs_context', 1, 'bx_jobs', '_bx_jobs_page_block_title_sys_entries_in_context', '_bx_jobs_page_block_title_entries_in_context_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"browse_context";}', 0, 0, 1, 1);

-- PAGE: joined profiles
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_joined_jobs', '_bx_jobs_page_title_sys_joined', '_bx_jobs_page_title_joined', 'bx_jobs', 5, 2147483647, 1, 'jobs-joined', 'page.php?i=jobs-joined', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_joined_jobs', 1, 'bx_jobs', '_bx_jobs_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;b:1;}}', 0, 1, 0);

-- PAGE: followed profiles
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_followed_jobs', '_bx_jobs_page_title_sys_followed', '_bx_jobs_page_title_followed', 'bx_jobs', 5, 2147483647, 1, 'jobs-followed', 'page.php?i=jobs-followed', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_followed_jobs', 1, 'bx_jobs', '_bx_jobs_page_block_title_followed_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:23:"browse_followed_entries";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;b:1;}}', 0, 1, 0);

-- PAGE: module manage own

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_manage', '_bx_jobs_page_title_sys_manage', '_bx_jobs_page_title_manage', 'bx_jobs', 5, 2147483647, 1, 'jobs-manage', 'page.php?i=jobs-manage', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_manage', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_manage', '_bx_jobs_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_administration', '_bx_jobs_page_title_sys_manage_administration', '_bx_jobs_page_title_manage', 'bx_jobs', 5, 192, 1, 'jobs-administration', 'page.php?i=jobs-administration', '', '', '', 0, 1, 0, 'BxJobsPageBrowse', 'modules/boonex/jobs/classes/BxJobsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_administration', 1, 'bx_jobs', '_bx_jobs_page_block_title_system_manage_administration', '_bx_jobs_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: user's jobs
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_joined', 'joined-jobs', '_bx_jobs_page_title_sys_joined_entries', '_bx_jobs_page_title_joined_entries', 'bx_jobs', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxJobsPageJoinedEntries', 'modules/boonex/jobs/classes/BxJobsPageJoinedEntries.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_jobs_joined', 1, 'bx_jobs', '_bx_jobs_page_block_title_sys_entries_actions', '_bx_jobs_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_jobs_joined', 1, 'bx_jobs', '_bx_jobs_page_block_title_sys_entries_of_author', '_bx_jobs_page_block_title_sys_entries_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_jobs_joined', 1, 'bx_jobs', '_bx_jobs_page_block_title_sys_favorites_of_author', '_bx_jobs_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"browse_favorite";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 3),
('bx_jobs_joined', 1, 'bx_jobs', '_bx_jobs_page_block_title_sys_joined_entries', '_bx_jobs_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;i:0;i:1;b:1;}}', 0, 0, 1, 4);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_favorites', '_bx_jobs_page_title_sys_entries_favorites', '_bx_jobs_page_title_entries_favorites', 'bx_jobs', 12, 2147483647, 1, 'jobs-favorites', 'page.php?i=jobs-favorites', '', '', '', 0, 1, 0, 'BxJobsPageListEntry', 'modules/boonex/jobs/classes/BxJobsPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_jobs_favorites', 2, 'bx_jobs', '_bx_jobs_page_block_title_sys_favorites_entries', '_bx_jobs_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_jobs_favorites', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_jobs_favorites', 3, 'bx_jobs', '', '_bx_jobs_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);


-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_home', 1, 'bx_jobs', '', '_bx_jobs_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"browse_recent_profiles";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_recommended_entries_view_showcase', '_bx_jobs_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:18:"browse_recommended";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);


-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'bx_jobs', '', '_bx_jobs_page_block_title_categories', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:12:"bx_jobs_cats";i:1;a:2:{s:10:"show_empty";b:1;s:21:"show_empty_categories";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 1, 1, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_featured_entries_view_showcase', '_bx_jobs_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"browse_featured";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_recommended_entries_view_showcase', '_bx_jobs_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:18:"browse_recommended";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_labels_tree', '_bx_jobs_page_block_title_labels_tree', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"get_lables_tree";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_jobs_browse_by_label', '_bx_jobs_page_block_title_jobs_browse_by_label', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:15:"browse_by_label";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 5),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_labels_breadcrumbs', '_bx_jobs_page_block_title_labels_breadcrumbs', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"get_lables_breadcrumbs";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_cover_block', '_bx_jobs_page_block_title_cover_block', 3, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:12:"entity_cover";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 7),
('', 0, 'bx_jobs', '_bx_jobs_page_block_title_sys_recom_fans', '_bx_jobs_page_block_title_recom_fans', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:27:"browse_recommendations_fans";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 8);

 -- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('trigger_page_group_view_entry', 4, 'bx_jobs', '_bx_jobs_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:14:"browse_context";s:6:"params";a:1:{s:10:"context_id";s:12:"{profile_id}";}}', 0, 0, 1, 0);


-- MENU

-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_jobs', 'jobs-home', '_bx_jobs_menu_item_title_system_entries_home', '_bx_jobs_menu_item_title_entries_home', 'page.php?i=jobs-home', '', '', 'briefcase', 'bx_jobs_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_jobs', 'jobs-home', '_bx_jobs_menu_item_title_system_entries_home', '_bx_jobs_menu_item_title_entries_home', 'page.php?i=jobs-home', '', '', 'briefcase', 'bx_jobs_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_jobs', 'create-job-profile', '_bx_jobs_menu_item_title_system_create_profile', '_bx_jobs_menu_item_title_create_profile', 'page.php?i=create-job-profile', '', '', 'briefcase', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: view actions

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_actions', '_bx_jobs_menu_title_view_profile_actions', 'bx_jobs_view_actions', 'bx_jobs', 9, 0, 1, 'BxJobsMenuViewActions', 'modules/boonex/jobs/classes/BxJobsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_view_actions', 'bx_jobs', '_bx_jobs_menu_set_title_view_profile_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_jobs_view_actions', 'bx_jobs', 'join-job-profile', '_bx_jobs_menu_item_title_system_pay_and_join', '{title_pay_and_join}', 'page.php?i=join-job-profile&profile_id={profile_id}', '', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"is_paid_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 5),
('bx_jobs_view_actions', 'bx_jobs', 'profile-fan-add', '_bx_jobs_menu_item_title_system_become_fan', '{title_add_fan}', 'javascript:void(0)', '{onclick_add_fan}', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 10),
('bx_jobs_view_actions', 'bx_jobs', 'profile-fan-remove', '_bx_jobs_menu_item_title_system_leave_job', '{title_remove_fan}', 'javascript:void(0)', 'bx_conn_action(this, \'bx_jobs_fans\', \'remove\', \'{profile_id}\')', '', 'sign-out-alt', '', 0, 2147483647, '', 1, 0, 1, 11),
('bx_jobs_view_actions', 'bx_jobs', 'profile-subscribe-add', '_bx_jobs_menu_item_title_system_subscribe', '_bx_jobs_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 20),
('bx_jobs_view_actions', 'bx_jobs', 'profile-subscribe-remove', '_bx_jobs_menu_item_title_system_unsubscribe', '_bx_jobs_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'remove\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 21),
('bx_jobs_view_actions', 'bx_jobs', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_jobs'', content_id: {content_id}});', '', 'check-circle', '', 0, 192, 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 1, 30),
('bx_jobs_view_actions', 'bx_jobs', 'profile-actions-more', '_bx_jobs_menu_item_title_system_more_actions', '_bx_jobs_menu_item_title_more_actions', 'javascript:void(0)', 'bx_menu_popup(''bx_jobs_view_actions_more'', this, {}, {profile_id:{profile_id}});', '', 'cog', 'bx_jobs_view_actions_more', 1, 2147483647, '', 1, 0, 1, 9999);

-- MENU: view actions more

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_actions_more', '_bx_jobs_menu_title_view_profile_actions_more', 'bx_jobs_view_actions_more', 'bx_jobs', 6, 0, 1, 'BxJobsMenuViewActions', 'modules/boonex/jobs/classes/BxJobsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_view_actions_more', 'bx_jobs', '_bx_jobs_menu_set_title_view_profile_actions_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_view_actions_more', 'bx_jobs', 'add-job-content', '_bx_jobs_menu_item_title_system_add_content', '_bx_jobs_menu_item_title_add_content', 'javascript:void(0)', 'bx_menu_popup(''bx_jobs_add_content'', this, {}, {profile_id:{profile_id}});', '', 'plus', 'bx_jobs_add_content', 2147483647, '', 1, 0, 5),
('bx_jobs_view_actions_more', 'bx_jobs', 'job-manage', '_bx_jobs_menu_item_title_system_view_manage', '_bx_jobs_menu_item_title_view_manage', 'page.php?i=job-manage&profile_id={profile_id}', '', '', 'users', '', 2147483647, '', 1, 0, 10),
('bx_jobs_view_actions_more', 'bx_jobs', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', 192, '', 1, 0, 20),
('bx_jobs_view_actions_more', 'bx_jobs', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_jobs&content_id={content_id}', '', '', 'history', '', 192, '', 1, 0, 30),
('bx_jobs_view_actions_more', 'bx_jobs', 'edit-job-profile', '_bx_jobs_menu_item_title_system_edit_profile', '_bx_jobs_menu_item_title_edit_profile', 'page.php?i=edit-job-profile&id={content_id}', '', '', 'pencil-alt', '', 2147483647, '', 1, 0, 40),
('bx_jobs_view_actions_more', 'bx_jobs', 'job-questionnaire', '_bx_jobs_menu_item_title_system_edit_questionnaire', '_bx_jobs_menu_item_title_edit_questionnaire', 'page.php?i=job-questionnaire&profile_id={profile_id}', '', '', 'check-double', '', 2147483647, '', 1, 0, 41),
('bx_jobs_view_actions_more', 'bx_jobs', 'job-pricing', '_bx_jobs_menu_item_title_system_edit_pricing', '_bx_jobs_menu_item_title_edit_pricing', 'page.php?i=job-pricing&profile_id={profile_id}', '', '', 'money-check-alt', '', 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:20:"is_pricing_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 41),
('bx_jobs_view_actions_more', 'bx_jobs', 'invite-to-job', '_bx_jobs_menu_item_title_system_invite', '_bx_jobs_menu_item_title_invite', 'page.php?i=invite-to-job&id={content_id}', '', '', 'user-friends', '', 2147483647, '', 1, 0, 42),
('bx_jobs_view_actions_more', 'bx_jobs', 'delete-job-profile', '_bx_jobs_menu_item_title_system_delete_profile', '_bx_jobs_menu_item_title_delete_profile', 'page.php?i=delete-job-profile&id={content_id}', '', '', 'remove', '', 2147483647, '', 1, 0, 50),
('bx_jobs_view_actions_more', 'bx_jobs', 'approve-job-profile', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, '', 1, 0, 60);

-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_actions_all', '_sys_menu_title_view_actions', 'bx_jobs_view_actions_all', 'bx_jobs', 15, 1, 0, 1, 'BxJobsMenuViewActionsAll', 'modules/boonex/jobs/classes/BxJobsMenuViewActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_view_actions_all', 'bx_jobs', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_view_actions_all', 'bx_jobs', 'join-job-profile', '_bx_jobs_menu_item_title_system_pay_and_join', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 5),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-fans', '_bx_jobs_menu_item_title_system_fans', '', '', '', '', '', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 10),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-fan-add', '_bx_jobs_menu_item_title_system_become_fan', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 12),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-fan-remove', '_bx_jobs_menu_item_title_system_leave_job', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 14),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-subscriptions', '_bx_jobs_menu_item_title_system_subscriptions', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-subscribe-add', '_bx_jobs_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 32),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-subscribe-remove', '_bx_jobs_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 34),
('bx_jobs_view_actions_all', 'bx_jobs', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '', '', '', '', '', '', '', 0, 192, 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 50),
('bx_jobs_view_actions_all', 'bx_jobs', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_jobs_view_actions_all', 'bx_jobs', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_jobs_view_actions_all', 'bx_jobs', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 220),
('bx_jobs_view_actions_all', 'bx_jobs', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 225),
('bx_jobs_view_actions_all', 'bx_jobs', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 230),
('bx_jobs_view_actions_all', 'bx_jobs', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_jobs_view_actions_all', 'bx_jobs', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_jobs_view_actions_all', 'bx_jobs', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_jobs_view_actions_all', 'bx_jobs', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_jobs_view_actions_all', 'bx_jobs', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_jobs_view_actions_all', 'bx_jobs', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: add content menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_add_content', '_bx_jobs_menu_title_add_content', 'sys_add_content_links', 'bx_jobs', 6, 0, 1, 'BxJobsMenuAddContent', 'modules/boonex/jobs/classes/BxJobsMenuAddContent.php');

-- MENU: meta (counters) menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_meta', '_bx_jobs_menu_title_view_profile_meta', 'bx_jobs_view_meta', 'bx_jobs', 15, 0, 1, 'BxJobsMenuViewMeta', 'modules/boonex/jobs/classes/BxJobsMenuViewMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_view_meta', 'bx_jobs', '_bx_jobs_menu_set_title_view_profile_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_view_meta', 'bx_jobs', 'members', '_bx_jobs_menu_item_title_system_sm_members', '_bx_jobs_menu_item_title_sm_members', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_jobs_view_meta', 'bx_jobs', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_jobs_view_meta', 'bx_jobs', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_jobs_view_meta', 'bx_jobs', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_jobs_view_meta', 'bx_jobs', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 0, 2147483647, '', 0, 0, 43),
('bx_jobs_view_meta', 'bx_jobs', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 0, 2147483647, '', 0, 0, 46),
('bx_jobs_view_meta', 'bx_jobs', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50);

-- MENU: actions menu for my entries

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_my', '_bx_jobs_menu_title_entries_my', 'bx_jobs_my', 'bx_jobs', 9, 0, 1, 'BxJobsMenu', 'modules/boonex/jobs/classes/BxJobsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_my', 'bx_jobs', '_bx_jobs_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_my', 'bx_jobs', 'create-job-profile', '_bx_jobs_menu_item_title_system_create_profile', '_bx_jobs_menu_item_title_create_profile', 'page.php?i=create-job-profile', '', '', 'briefcase-plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_submenu', '_bx_jobs_menu_title_submenu', 'bx_jobs_submenu', 'bx_jobs', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_submenu', 'bx_jobs', '_bx_jobs_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_submenu', 'bx_jobs', 'jobs-home', '_bx_jobs_menu_item_title_system_entries_recent', '_bx_jobs_menu_item_title_entries_recent', 'page.php?i=jobs-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_jobs_submenu', 'bx_jobs', 'jobs-top', '_bx_jobs_menu_item_title_system_entries_top', '_bx_jobs_menu_item_title_entries_top', 'page.php?i=jobs-top', '', '', '', '', 2147483647, 1, 1, 2),
('bx_jobs_submenu', 'bx_jobs', 'jobs-search', '_bx_jobs_menu_item_title_system_entries_search', '_bx_jobs_menu_item_title_entries_search', 'page.php?i=jobs-search', '', '', '', '', 2147483647, 0, 1, 3),
('bx_jobs_submenu', 'bx_jobs', 'jobs-joined', '_bx_jobs_menu_item_title_system_entries_joined', '_bx_jobs_menu_item_title_entries_joined', 'page.php?i=jobs-joined', '', '', '', '', 2147483647, 1, 1, 4),
('bx_jobs_submenu', 'bx_jobs', 'jobs-followed', '_bx_jobs_menu_item_title_system_entries_followed', '_bx_jobs_menu_item_title_entries_followed', 'page.php?i=jobs-followed', '', '', '', '', 2147483647, 1, 1, 5),
('bx_jobs_submenu', 'bx_jobs', 'jobs-manage', '_bx_jobs_menu_item_title_system_entries_manage', '_bx_jobs_menu_item_title_entries_manage', 'page.php?i=jobs-manage', '', '', '', '', 2147483646, 1, 1, 6);

-- MENU: view submenu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_view_submenu', '_bx_jobs_menu_title_view_profile_submenu', 'bx_jobs_view_submenu', 'bx_jobs', 18, 0, 1, 'BxJobsMenuView', 'modules/boonex/jobs/classes/BxJobsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_view_submenu', 'bx_jobs', '_bx_jobs_menu_set_title_view_profile_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`) VALUES 
('bx_jobs_view_submenu', 'bx_jobs', 'view-job-profile', '_bx_jobs_menu_item_title_system_view_profile_view', '_bx_jobs_menu_item_title_view_profile_view', 'page.php?i=view-job-profile&id={content_id}', '', '', 'briefcase', '', '', 0, 2147483647, 1, 1, 0, 1),
('bx_jobs_view_submenu', 'bx_jobs', 'job-profile-info', '_bx_jobs_menu_item_title_system_view_profile_info', '_bx_jobs_menu_item_title_view_profile_info', 'page.php?i=job-profile-info&id={content_id}', '', '', 'info-circle col-gray', '', '', 0, 2147483647, 1, 0, 0, 2),
('bx_jobs_view_submenu', 'bx_jobs', 'job-profile-comments', '_bx_jobs_menu_item_title_system_view_profile_comments', '_bx_jobs_menu_item_title_view_profile_comments', 'page.php?i=job-profile-comments&id={content_id}', '', '', '', '', '', 0, 2147483647, 0, 0, 0, 3),
('bx_jobs_view_submenu', 'bx_jobs', 'job-fans', '_bx_jobs_menu_item_title_system_view_fans', '_bx_jobs_menu_item_title_view_fans', 'page.php?i=job-fans&profile_id={profile_id}', '', '', 'briefcase', '', '', 0, 2147483647, 1, 1, 0, 4),
('bx_jobs_view_submenu', 'bx_jobs', 'more-auto', '_bx_jobs_menu_item_title_system_view_profile_more_auto', '_bx_jobs_menu_item_title_view_profile_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 0, 9999);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_jobs_snippet_meta', 'bx_jobs', 15, 0, 1, 'BxJobsMenuSnippetMeta', 'modules/boonex/jobs/classes/BxJobsMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_snippet_meta', 'bx_jobs', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `hidden_on_cxt`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_jobs_snippet_meta', 'bx_jobs', 'privacy', '_bx_jobs_menu_item_title_system_sm_privacy', '_bx_jobs_menu_item_title_sm_privacy', '', '', '', '', '', 2147483647, '', '', 1, 0, 1, 0),
('bx_jobs_snippet_meta', 'bx_jobs', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 1),
('bx_jobs_snippet_meta', 'bx_jobs', 'date-start', '_bx_jobs_menu_item_title_system_sm_date_start', '_bx_jobs_menu_item_title_sm_date_start', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 2),
('bx_jobs_snippet_meta', 'bx_jobs', 'date-end', '_bx_jobs_menu_item_title_system_sm_date_end', '_bx_jobs_menu_item_title_sm_date_end', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 3),
('bx_jobs_snippet_meta', 'bx_jobs', 'budget', '_bx_jobs_menu_item_title_system_sm_budget', '_bx_jobs_menu_item_title_sm_budget', '', '', '', '', '', 2147483647, '', '', 1, 0, 1, 4),
('bx_jobs_snippet_meta', 'bx_jobs', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 5),
('bx_jobs_snippet_meta', 'bx_jobs', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 10),
('bx_jobs_snippet_meta', 'bx_jobs', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 15),
('bx_jobs_snippet_meta', 'bx_jobs', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 16),
('bx_jobs_snippet_meta', 'bx_jobs', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 17),
('bx_jobs_snippet_meta', 'bx_jobs', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 18),
('bx_jobs_snippet_meta', 'bx_jobs', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 20),
('bx_jobs_snippet_meta', 'bx_jobs', 'members', '_bx_jobs_menu_item_title_system_sm_members', '_bx_jobs_menu_item_title_sm_members', '', '', '', '', '', 2147483647, '', '', 1, 0, 1, 25),
('bx_jobs_snippet_meta', 'bx_jobs', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 2147483647, '', '', 0, 0, 1, 30),
('bx_jobs_snippet_meta', 'bx_jobs', 'nl', '_sys_menu_item_title_system_sm_nl', '_sys_menu_item_title_sm_nl', '', '', '', '', '', 2147483647, '', '', 1, 0, 1, 35),
('bx_jobs_snippet_meta', 'bx_jobs', 'join-paid', '_sys_menu_item_title_system_sm_join_paid', '_sys_menu_item_title_sm_join_paid', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:33:"is_paid_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', '', 1, 0, 1, 40),
('bx_jobs_snippet_meta', 'bx_jobs', 'join', '_sys_menu_item_title_system_sm_join', '_sys_menu_item_title_sm_join', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:33:"is_free_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', '', 1, 0, 1, 45),
('bx_jobs_snippet_meta', 'bx_jobs', 'leave', '_sys_menu_item_title_system_sm_leave', '_sys_menu_item_title_sm_leave', '', '', '', '', '', 2147483647, '', 'recom_jobs_fans', 0, 0, 1, 50),
('bx_jobs_snippet_meta', 'bx_jobs', 'subscribe', '_sys_menu_item_title_system_sm_subscribe', '_sys_menu_item_title_sm_subscribe', '', '', '', '', '', 2147483647, '', 'recom_jobs_fans', 0, 0, 1, 55),
('bx_jobs_snippet_meta', 'bx_jobs', 'unsubscribe', '_sys_menu_item_title_system_sm_unsubscribe', '_sys_menu_item_title_sm_unsubscribe', '', '', '', '', '', 2147483647, '', 'recom_jobs_fans', 0, 0, 1, 60),
('bx_jobs_snippet_meta', 'bx_jobs', 'ignore-join', '_sys_menu_item_title_system_sm_ignore', '_sys_menu_item_title_sm_ignore', '', '', '', '', '', 2147483647, '', 'all!recom_jobs_fans', 1, 0, 1, 70);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_jobs', 'profile-stats-my-jobs', '_bx_jobs_menu_item_title_system_manage_my_jobs', '_bx_jobs_menu_item_title_manage_my_jobs', 'page.php?i=joined-jobs&profile_id={member_id}', '', '_self', 'briefcase', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 2);

-- MENU: profile followings
SET @iFollowingsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_followings' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_followings', 'bx_jobs', 'jobs', '_bx_jobs_menu_item_title_system_followings', '_bx_jobs_menu_item_title_followings', 'javascript:void(0)', '', '_self', 'briefcase', '', '', 2147483647, 0, 1, 0, @iFollowingsMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_jobs_menu_manage_tools', '_bx_jobs_menu_title_manage_tools', 'bx_jobs_menu_manage_tools', 'bx_jobs', 6, 0, 1, 'BxJobsMenuManageTools', 'modules/boonex/jobs/classes/BxJobsMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_jobs_menu_manage_tools', 'bx_jobs', '_bx_jobs_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_jobs_menu_manage_tools', 'bx_jobs', 'clear-reports', '_bx_jobs_menu_item_title_system_clear_reports', '_bx_jobs_menu_item_title_clear_reports', 'javascript:void(0)', 'javascript:{js_object}.onClickClearReports({content_id});', '_self', 'eraser', '', 2147483647, 1, 0, 1),
('bx_jobs_menu_manage_tools', 'bx_jobs', 'delete', '_bx_jobs_menu_item_title_system_delete', '_bx_jobs_menu_item_title_delete', 'javascript:void(0)', 'javascript:{js_object}.onClickDelete({content_id});', '_self', 'far trash-alt', '', 2147483647, 1, 0, 2),
('bx_jobs_menu_manage_tools', 'bx_jobs', 'delete-with-content', '_bx_jobs_menu_item_title_system_delete_with_content', '_bx_jobs_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 2147483647, 0, 0, 3);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_jobs', 'jobs-administration', '_bx_jobs_menu_item_title_system_admt_jobs', '_bx_jobs_menu_item_title_admt_jobs', 'page.php?i=jobs-administration', '', '_self', 'briefcase', 'a:2:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_jobs', 'joined-jobs', '_bx_jobs_menu_item_title_system_view_joined_jobs', '_bx_jobs_menu_item_title_view_joined_jobs', 'page.php?i=joined-jobs&profile_id={profile_id}', '', '', 'briefcase', '', 2147483647, '', 1, 0, 0),
('trigger_group_view_submenu', 'bx_jobs', 'jobs-context', '_bx_jobs_menu_item_title_system_view_entries_in_context', '_bx_jobs_menu_item_title_view_entries_in_context', 'page.php?i=jobs-context&profile_id={profile_id}', '', '', 'briefcase', '', 2147483647, 'a:3:{s:6:"module";s:7:"bx_jobs";s:6:"method";s:21:"is_enable_for_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0);

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'create entry', NULL, '_bx_jobs_acl_action_create_profile', '', 1, 1);
SET @iIdActionProfileCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'use paid join', NULL, '_bx_jobs_acl_action_use_paid_join', '', 1, 1);
SET @iIdActionUsePaidJoin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'delete entry', NULL, '_bx_jobs_acl_action_delete_profile', '', 1, 1);
SET @iIdActionProfileDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'view entry', NULL, '_bx_jobs_acl_action_view_profile', '', 1, 0);
SET @iIdActionProfileView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'edit any entry', NULL, '_bx_jobs_acl_action_edit_any_profile', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'delete any entry', NULL, '_bx_jobs_acl_action_delete_any_profile', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_jobs', 'delete invites', NULL, '_bx_jobs_acl_action_delete_invites', '', 1, 3);
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
('bx_jobs', 'bx_jobs', 'bx_jobs_meta_keywords', 'bx_jobs_meta_locations', 'bx_jobs_meta_mentions', '', '');

-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_cats', 'bx_jobs', 'bx_jobs', 'bx_job', 'bx_jobs_cats', 'bx_jobs_data', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`content_id` = `bx_jobs_data`.`id` AND `sys_profiles`.`type` = ''bx_jobs'')', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_jobs', '_bx_jobs', @iSearchOrder + 1, 'BxJobsSearchResult', 'modules/boonex/jobs/classes/BxJobsSearchResult.php');

-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `tt_content`, `tf_id_content`, `tf_count_content`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_fans', 'bx_jobs_fans', 1, 1, 'mutual', 'bx_jobs_data', 'id', 'members', 'BxJobsConnectionFans', 'modules/boonex/jobs/classes/BxJobsConnectionFans.php');

-- RECOMMENDATIONS
INSERT INTO `sys_objects_recommendation` (`name`, `module`, `connection`, `content_info`, `countable`, `active`, `class_name`, `class_file`) VALUES
('bx_jobs_fans', 'bx_jobs', 'bx_jobs_fans', '', 1, 0, 'BxJobsRecommendationFans', 'modules/boonex/jobs/classes/BxJobsRecommendationFans.php');
SET @iRecFans = LAST_INSERT_ID();

INSERT INTO `sys_recommendation_criteria` (`object_id`, `name`, `source_type`, `source`, `params`, `weight`, `active`) VALUES
(@iRecFans, 'by_friends', 'sql', 'SELECT `tgf`.`content` AS `id`, SUM({points}) AS `value` FROM `sys_profiles_conn_friends` AS `tf` INNER JOIN `bx_jobs_fans` AS `tgf` ON `tf`.`content`=`tgf`.`initiator` AND `tgf`.`content` NOT IN (SELECT `content` FROM `bx_jobs_fans` WHERE `initiator`={profile_id}) AND `tgf`.`mutual`=''1'' WHERE `tf`.`initiator`={profile_id} AND `tf`.`mutual`=''1'' GROUP BY `id`', 'a:1:{s:6:"points";i:2;}', 0.5, 1),
(@iRecFans, 'by_subscriptions', 'sql', 'SELECT `tgf`.`content` AS `id`, SUM({points}) AS `value` FROM `sys_profiles_conn_subscriptions` AS `ts` INNER JOIN `sys_profiles` AS `tp` ON `ts`.`content`=`tp`.`id` AND `tp`.`type` IN ({profile_types}) AND `tp`.`status`=''active'' INNER JOIN `bx_jobs_fans` AS `tgf` ON `ts`.`content`=`tgf`.`initiator` AND `tgf`.`content` NOT IN (SELECT `content` FROM `bx_jobs_fans` WHERE `initiator`={profile_id}) AND `tgf`.`mutual`=''1'' WHERE `ts`.`initiator`={profile_id} GROUP BY `id`', 'a:2:{s:6:"points";i:2;s:13:"profile_types";s:0:"";}', 0.2, 1),
(@iRecFans, 'by_fans', 'sql', 'SELECT `tg2`.`content` AS `id`, SUM({points}) AS `value` FROM `bx_jobs_fans` AS `tg1` INNER JOIN `bx_jobs_fans` AS `tm` ON `tg1`.`content`=`tm`.`content` AND `tm`.`initiator`<>{profile_id} AND `tm`.`mutual`=''1'' INNER JOIN `bx_jobs_fans` AS `tg2` ON `tm`.`initiator`=`tg2`.`initiator` AND `tg2`.`mutual`=''1'' AND `tg2`.`content` NOT IN (SELECT `content` FROM `bx_jobs_fans` WHERE `initiator`={profile_id})  WHERE `tg1`.`initiator`={profile_id} AND `tg1`.`mutual`=''1'' GROUP BY `id`', 'a:1:{s:6:"points";i:1;}', 0.2, 1),
(@iRecFans, 'featured', 'sql', 'SELECT `tp`.`id` AS `id`, {points} AS `value` FROM `bx_jobs_data` AS `tg` INNER JOIN `sys_profiles` AS `tp` ON `tg`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_jobs'' WHERE `tg`.`featured`<>''0'' AND `tg`.`status`=''active'' AND `tg`.`status_admin`=''active'' AND `tp`.`id` NOT IN (SELECT `content` FROM `bx_jobs_fans` WHERE `initiator`={profile_id})', 'a:1:{s:6:"points";i:0;}', 0.1, 1);

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_jobs', 'bx_jobs', '_bx_jobs', 'page.php?i=jobs-home', 'briefcase', 'SELECT COUNT(*) FROM `bx_jobs_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_jobs'' WHERE 1 AND `tp`.`status`=''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_jobs_growth', '_bx_jobs_chart_growth', 'bx_jobs_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_jobs'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_jobs_growth_speed', '_bx_jobs_chart_growth_speed', 'bx_jobs_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_jobs'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRID: connections
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_fans', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 1, 'BxJobsGridConnections', 'modules/boonex/jobs/classes/BxJobsGridConnections.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_jobs_fans', 'name', '_sys_name', '40%', '', 10),
('bx_jobs_fans', 'role', '_bx_jobs_txt_role', '10%', '', 15),
('bx_jobs_fans', 'role_added', '_bx_jobs_txt_role_added', '10%', '', 16),
('bx_jobs_fans', 'role_expired', '_bx_jobs_txt_role_expired', '10%', '', 17),
('bx_jobs_fans', 'actions', '', '30%', '', 20);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_jobs_fans', 'single', 'questionnaire', '_bx_jobs_txt_view_answers', 'check-double', 1, 0, 5),
('bx_jobs_fans', 'single', 'accept', '_bx_jobs_txt_accept', '', 0, 0, 10),
('bx_jobs_fans', 'single', 'set_role', '_bx_jobs_txt_set_role', '', 0, 0, 20),
('bx_jobs_fans', 'single', 'set_role_submit', '', '', 0, 0, 21),
('bx_jobs_fans', 'single', 'delete', '_bx_jobs_txt_delete', 'remove', 1, 1, 40),
('bx_jobs_fans', 'single', 'delete_and_ban', '_bx_jobs_txt_delete_and_ban', 'user-slash', 1, 1, 41);

-- GRID: bans
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_bans', 'Sql', 'SELECT `p`.`id`, `c`.`added` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 1, 'BxJobsGridBans', 'modules/boonex/jobs/classes/BxJobsGridBans.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_jobs_bans', 'name', '_sys_name', '70%', '', 10),
('bx_jobs_bans', 'added', '_bx_jobs_txt_ban_added', '10%', '', 20),
('bx_jobs_bans', 'actions', '', '20%', '', 30);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_jobs_bans', 'single', 'delete', '', 'remove', 1, 1, 10);


-- GRID: invites
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_invites', 'Sql', 'SELECT `bx_jobs_invites`.`id`, `bx_jobs_invites`.`invited_profile_id`, `bx_jobs_invites`.`added`, `bx_jobs_invites`.`author_profile_id` FROM `bx_jobs_invites` INNER JOIN `sys_profiles` AS `p` ON `bx_jobs_invites`.`invited_profile_id` = `p`.`id` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) ', 'bx_jobs_invites', 'id', 'bx_jobs_invites`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxJobsGridInvites', 'modules/boonex/jobs/classes/BxJobsGridInvites.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_jobs_invites', 'name', '_sys_name', '33%', '', 10),
('bx_jobs_invites', 'added', '_sys_added', '33%', '', 20),
('bx_jobs_invites', 'actions', '', '34%', '', 30);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_jobs_invites', 'single', 'delete', '', 'remove', 1, 10);


-- GRIDS: administration

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_administration', 'Sql', 'SELECT `td`.*, `td`.`name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_jobs_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_jobs'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_jobs_data', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'name', '', 'like', 'reports', '', 192, 'BxJobsGridAdministration', 'modules/boonex/jobs/classes/BxJobsGridAdministration.php'),
('bx_jobs_common', 'Sql', 'SELECT `td`.*, `td`.`name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_jobs_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_jobs'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_jobs_data', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'name', '', 'like', '', '', 2147483647, 'BxJobsGridCommon', 'modules/boonex/jobs/classes/BxJobsGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_jobs_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_jobs_administration', 'switcher', '_bx_jobs_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_jobs_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_jobs_administration', 'name', '_bx_jobs_grid_column_title_adm_name', '25%', 0, '', '', 4),
('bx_jobs_administration', 'added_ts', '_bx_jobs_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_jobs_administration', 'account', '_bx_jobs_grid_column_title_adm_account', '20%', 0, '25', '', 6),
('bx_jobs_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_jobs_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_jobs_common', 'switcher', '_bx_jobs_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_jobs_common', 'name', '_bx_jobs_grid_column_title_adm_name', '40%', 0, '', '', 3),
('bx_jobs_common', 'added_ts', '_bx_jobs_grid_column_title_adm_added', '30%', 1, '25', '', 4),
('bx_jobs_common', 'actions', '', '20%', 0, '', '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('bx_jobs_administration', 'bulk', 'clear_reports', '_bx_jobs_grid_action_title_adm_clear_reports', '', 0, 1, 1, 1),
('bx_jobs_administration', 'bulk', 'delete', '_bx_jobs_grid_action_title_adm_delete', '', 0, 1, 1, 2),
('bx_jobs_administration', 'bulk', 'delete_with_content', '_bx_jobs_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 3),
('bx_jobs_administration', 'single', 'settings', '_bx_jobs_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 2),
('bx_jobs_administration', 'single', 'audit_content', '_bx_jobs_grid_action_title_adm_audit_content', 'search', 1, 0, 1, 3),
('bx_jobs_administration', 'single', 'audit_context', '_bx_jobs_grid_action_title_adm_audit_context', 'search-location', 1, 0, 1, 4),

('bx_jobs_common', 'bulk', 'delete', '_bx_jobs_grid_action_title_adm_delete', '', 0, 1, 1, 1),
('bx_jobs_common', 'bulk', 'delete_with_content', '_bx_jobs_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 2),
('bx_jobs_common', 'single', 'settings', '_bx_jobs_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 1);

-- GRIDS: questionnaire
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_questions_manage', 'Sql', 'SELECT * FROM `bx_jobs_qnr_questions` WHERE 1 ', 'bx_jobs_qnr_questions', 'id', 'order', '', '', 100, NULL, 'start', '', 'question', '', 'like', '', '', 2147483647, 'BxJobsGridQuestionsManage', 'modules/boonex/jobs/classes/BxJobsGridQuestionsManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_jobs_questions_manage', 'checkbox', '_sys_select', '1%', 0, '', '', 1),
('bx_jobs_questions_manage', 'order', '', '1%', 0, '', '', 2),
('bx_jobs_questions_manage', 'question', '_bx_jobs_grid_column_title_qn_question', '78%', 0, 64, '', 3),
('bx_jobs_questions_manage', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_jobs_questions_manage', 'independent', 'add', '_bx_jobs_grid_action_title_qn_add', '', 0, 0, 1),
('bx_jobs_questions_manage', 'single', 'edit', '_bx_jobs_grid_action_title_qn_edit', 'pencil-alt', 1, 0, 1),
('bx_jobs_questions_manage', 'single', 'delete', '_bx_jobs_grid_action_title_qn_delete', 'remove', 1, 1, 2),
('bx_jobs_questions_manage', 'bulk', 'delete', '_bx_jobs_grid_action_title_qn_delete', '', 0, 1, 1);

-- GRIDS: Pricing
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_prices_manage', 'Sql', 'SELECT *, `default` AS `default_price` FROM `bx_jobs_prices` WHERE 1 ', 'bx_jobs_prices', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxJobsGridPricesManage', 'modules/boonex/jobs/classes/BxJobsGridPricesManage.php'),
('bx_jobs_prices_view', 'Sql', 'SELECT * FROM `bx_jobs_prices` WHERE `active`<>''0'' ', 'bx_jobs_prices', 'id', 'order', '', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxJobsGridPricesView', 'modules/boonex/jobs/classes/BxJobsGridPricesView.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_jobs_prices_manage', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_jobs_prices_manage', 'order', '', '2%', 0, 0, '', 2),
('bx_jobs_prices_manage', 'switcher', '', '6%', 0, 0, '', 3),
('bx_jobs_prices_manage', 'name', '_bx_jobs_grid_column_title_name', '15%', 0, 16, '', 4),
('bx_jobs_prices_manage', 'caption', '_bx_jobs_grid_column_title_caption', '20%', 0, 32, '', 5),
('bx_jobs_prices_manage', 'price', '_bx_jobs_grid_column_title_price', '15%', 0, 16, '', 6),
('bx_jobs_prices_manage', 'period', '_bx_jobs_grid_column_title_period', '15%', 0, 16, '', 7),
('bx_jobs_prices_manage', 'default_price', '_bx_jobs_grid_column_title_default_price', '5%', 0, 0, '', 8),
('bx_jobs_prices_manage', 'actions', '', '20%', 0, 0, '', 9),

('bx_jobs_prices_view', 'role_id', '_bx_jobs_grid_column_title_role_id', '40%', 0, 32, '', 1),
('bx_jobs_prices_view', 'price', '_bx_jobs_grid_column_title_price', '20%', 0, 16, '', 2),
('bx_jobs_prices_view', 'period', '_bx_jobs_grid_column_title_period', '20%', 0, 16, '', 3),
('bx_jobs_prices_view', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_jobs_prices_manage', 'independent', 'add', '_bx_jobs_grid_action_title_add', '', 0, 0, 1),
('bx_jobs_prices_manage', 'single', 'edit', '_bx_jobs_grid_action_title_edit', 'pencil-alt', 1, 0, 1),
('bx_jobs_prices_manage', 'single', 'delete', '_bx_jobs_grid_action_title_delete', 'remove', 1, 1, 2),
('bx_jobs_prices_manage', 'bulk', 'delete', '_bx_jobs_grid_action_title_delete', '', 0, 1, 1),

('bx_jobs_prices_view', 'single', 'buy', '_bx_jobs_grid_action_title_buy', 'cart-plus', 0, 0, 1),
('bx_jobs_prices_view', 'single', 'subscribe', '_bx_jobs_grid_action_title_subscribe', 'credit-card', 0, 0, 2),
('bx_jobs_prices_view', 'single', 'choose', '_bx_jobs_grid_action_title_choose', 'far check-square', 0, 0, 3);


-- ALERTS

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_jobs', 'BxJobsAlertsResponse', 'modules/boonex/jobs/classes/BxJobsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('bx_timeline', 'post_common', @iHandler),
('bx_jobs_pics', 'file_deleted', @iHandler),
('bx_jobs_fans', 'connection_added', @iHandler),
('bx_jobs_fans', 'connection_removed', @iHandler),
('profile', 'delete', @iHandler),
('bx_jobs', 'fan_added', @iHandler),
('bx_jobs', 'join_invitation', @iHandler),
('bx_jobs', 'join_request', @iHandler),
('bx_jobs', 'join_request_accepted', @iHandler),
('bx_jobs', 'timeline_view', @iHandler),
('bx_jobs', 'timeline_post', @iHandler),
('bx_jobs', 'timeline_delete', @iHandler),
('bx_jobs', 'timeline_comment', @iHandler),
('bx_jobs', 'timeline_vote', @iHandler),
('bx_jobs', 'timeline_score', @iHandler),
('bx_jobs', 'timeline_report', @iHandler),
('bx_jobs', 'timeline_repost', @iHandler),
('bx_jobs', 'timeline_pin', @iHandler),
('bx_jobs', 'timeline_promote', @iHandler);

-- PRIVACY 

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_allow_view_to', 'bx_jobs', 'view', '_bx_jobs_form_profile_input_allow_view_to', '3', 'bx_events,bx_groups,bx_spaces', 'bx_jobs_data', 'id', 'author', 'BxJobsPrivacy', 'modules/boonex/jobs/classes/BxJobsPrivacy.php'),
('bx_jobs_allow_view_notification_to', 'bx_jobs', 'view_event', '_bx_jobs_form_profile_input_allow_view_notification_to', '3', '', 'bx_notifications_events', 'id', 'object_owner_id', 'BxJobsPrivacyNotifications', 'modules/boonex/jobs/classes/BxJobsPrivacyNotifications.php'),
('bx_jobs_allow_post_to', 'bx_jobs', 'post', '_bx_jobs_form_profile_input_allow_post_to', 'p', '', 'bx_jobs_data', 'id', 'author', 'BxJobsPrivacyPost', 'modules/boonex/jobs/classes/BxJobsPrivacyPost.php'),
('bx_jobs_allow_view_favorite_list', 'bx_jobs', 'view_favorite_list', '_bx_jobs_form_profile_input_allow_view_favorite_list', '3', '', 'bx_jobs_favorites_lists', 'id', 'author_id', 'BxJobsPrivacy', 'modules/boonex/jobs/classes/BxJobsPrivacy.php');
-- EMAIL TEMPLATES

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_jobs', '_bx_jobs_email_join_request', 'bx_jobs_join_request', '_bx_jobs_email_join_request_subject', '_bx_jobs_email_join_request_body'),
('bx_jobs', '_bx_jobs_email_join_reject', 'bx_jobs_join_reject', '_bx_jobs_email_join_reject_subject', '_bx_jobs_email_join_reject_body'),
('bx_jobs', '_bx_jobs_email_join_confirm', 'bx_jobs_join_confirm', '_bx_jobs_email_join_confirm_subject', '_bx_jobs_email_join_confirm_body'),
('bx_jobs', '_bx_jobs_email_fan_remove', 'bx_jobs_fan_remove', '_bx_jobs_email_fan_remove_subject', '_bx_jobs_email_fan_remove_body'),
('bx_jobs', '_bx_jobs_email_fan_become_admin', 'bx_jobs_fan_become_admin', '_bx_jobs_email_fan_become_admin_subject', '_bx_jobs_email_fan_become_admin_body'),
('bx_jobs', '_bx_jobs_email_admin_become_fan', 'bx_jobs_admin_become_fan', '_bx_jobs_email_admin_become_fan_subject', '_bx_jobs_email_admin_become_fan_body'),
('bx_jobs', '_bx_jobs_email_set_role', 'bx_jobs_set_role', '_bx_jobs_email_set_role_subject', '_bx_jobs_email_set_role_body'),
('bx_jobs', '_bx_jobs_email_invitation', 'bx_jobs_invitation', '_bx_jobs_email_invitation_subject', '_bx_jobs_email_invitation_body');

-- UPLOADERS

INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_jobs_cover_crop', 1, 'BxJobsUploaderCoverCrop', 'modules/boonex/jobs/classes/BxJobsUploaderCoverCrop.php'),
('bx_jobs_picture_crop', 1, 'BxJobsUploaderPictureCrop', 'modules/boonex/jobs/classes/BxJobsUploaderPictureCrop.php');


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_jobs_pruning', '0 0 * * *', 'BxJobsCronPruning', 'modules/boonex/jobs/classes/BxJobsCronPruning.php', '');
