
-- TABLES

DROP TABLE IF EXISTS `bx_jobs_data`, `bx_jobs_qnr_questions`, `bx_jobs_qnr_answers`, `bx_jobs_pics`, `bx_jobs_pics_resized`, `bx_jobs_cmts`, `bx_jobs_cmts_notes`, `bx_jobs_views_track`, `bx_jobs_meta_keywords`, `bx_jobs_meta_locations`, `bx_jobs_meta_mentions`, `bx_jobs_fans`, `bx_jobs_admins`, `bx_jobs_votes`, `bx_jobs_votes_track`, `bx_jobs_reactions`, `bx_jobs_reactions_track`, `bx_jobs_reports`, `bx_jobs_reports_track`, `bx_jobs_favorites_track`, `bx_jobs_favorites_lists`, `bx_jobs_scores`, `bx_jobs_scores_track`, `bx_jobs_invites`, `bx_jobs_prices`;

-- PROFILES

DELETE FROM sys_profiles WHERE `type` = 'bx_jobs';

-- STORAGES & TRANSCODERS

DELETE FROM `sys_objects_storage` WHERE `object` IN('bx_jobs_pics', 'bx_jobs_pics_resized');
DELETE FROM `sys_storage_tokens` WHERE `object` IN('bx_jobs_pics', 'bx_jobs_pics_resized');

DELETE FROM `sys_objects_transcoder` WHERE `object` IN('bx_jobs_icon', 'bx_jobs_thumb', 'bx_jobs_avatar', 'bx_jobs_avatar_big', 'bx_jobs_picture', 'bx_jobs_cover', 'bx_jobs_cover_thumb', 'bx_jobs_gallery');
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` IN('bx_jobs_icon', 'bx_jobs_thumb', 'bx_jobs_avatar', 'bx_jobs_avatar_big', 'bx_jobs_picture', 'bx_jobs_cover', 'bx_jobs_cover_thumb', 'bx_jobs_gallery');
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` IN('bx_jobs_icon', 'bx_jobs_thumb', 'bx_jobs_avatar', 'bx_jobs_avatar_big', 'bx_jobs_picture', 'bx_jobs_cover', 'bx_jobs_cover_thumb', 'bx_jobs_gallery');

-- FORMS

DELETE FROM `sys_objects_form` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` IN('bx_job_add', 'bx_job_delete', 'bx_job_edit', 'bx_job_edit_cover', 'bx_job_view', 'bx_job_view_full', 'bx_job_invite', 'bx_jobs_price_add', 'bx_jobs_price_edit', 'bx_jobs_question_add', 'bx_jobs_question_edit');

-- PRE-VALUES

DELETE FROM `sys_form_pre_lists` WHERE `module` = 'bx_jobs';

DELETE FROM `sys_form_pre_values` WHERE `Key` LIKE 'bx_jobs%';

-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_jobs%';

-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` = 'bx_jobs';

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` = 'bx_jobs';

-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` = 'bx_jobs';

-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` = 'bx_jobs';

-- FAFORITES
DELETE FROM `sys_objects_favorite` WHERE `name` = 'bx_jobs';

-- FEATURED
DELETE FROM `sys_objects_feature` WHERE `name` = 'bx_jobs';

-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_jobs', 'bx_jobs_cmts');

DELETE FROM `sys_content_info_grids` WHERE `object` IN ('bx_jobs');

-- SEARCH EXTENDED
DELETE FROM `sys_objects_search_extended` WHERE `module` = 'bx_jobs';

-- STUDIO PAGE & WIDGET
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_jobs';
