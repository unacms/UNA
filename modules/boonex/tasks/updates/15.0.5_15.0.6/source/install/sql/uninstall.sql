
-- TABLES
DROP TABLE IF EXISTS `bx_tasks_tasks`, `bx_tasks_lists`, `bx_tasks_contexts`, `bx_tasks_assignments`, `bx_tasks_pre_lists`, `bx_tasks_pre_values`, `bx_tasks_filters`, `bx_tasks_covers`, `bx_tasks_files`, `bx_tasks_photos`, `bx_tasks_photos_resized`, `bx_tasks_videos`, `bx_tasks_videos_resized`, `bx_tasks_cmts`, `bx_tasks_cmts_notes`, `bx_tasks_votes`, `bx_tasks_votes_track`, `bx_tasks_reactions`, `bx_tasks_reactions_track`, `bx_tasks_views_track`, `bx_tasks_meta_keywords`, `bx_tasks_meta_locations`, `bx_tasks_meta_mentions`, `bx_tasks_reports`, `bx_tasks_reports_track`, `bx_tasks_time`, `bx_tasks_time_track`, `bx_tasks_timers`, `bx_tasks_budget`, `bx_tasks_budget_track`, `bx_tasks_favorites_track`, `bx_tasks_scores`, `bx_tasks_scores_track`;

-- STORAGES & TRANSCODERS
DELETE FROM `sys_objects_storage` WHERE `object` LIKE 'bx_tasks_%';
DELETE FROM `sys_storage_tokens` WHERE `object` LIKE 'bx_tasks_%';

DELETE FROM `sys_objects_transcoder` WHERE `object` LIKE 'bx_tasks_%';
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` LIKE 'bx_tasks_%';
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` LIKE 'bx_tasks_%';

-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` LIKE 'bx_tasks_%';

-- PRE-VALUES
DELETE FROM `sys_form_pre_lists` WHERE `module` = 'bx_tasks';

DELETE FROM `sys_form_pre_values` WHERE `Key` LIKE 'bx_tasks_%';

-- CATEGORIES
DELETE FROM `sys_categories` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_categories2objects` WHERE `module` = 'bx_tasks';

-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_tasks%';

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` IN ('bx_tasks', 'bx_tasks_reactions');

-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` = 'bx_tasks';

-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` IN ('bx_tasks', 'bx_tasks_time');

-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` = 'bx_tasks';

-- FAFORITES
DELETE FROM `sys_objects_favorite` WHERE `name` = 'bx_tasks';

-- FEATURED
DELETE FROM `sys_objects_feature` WHERE `name` = 'bx_tasks';

-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_tasks', 'bx_tasks_cmts');

-- SEARCH EXTENDED
DELETE FROM `sys_objects_search_extended` WHERE `module` = 'bx_tasks';

-- STUDIO: page & widget
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_tasks';
