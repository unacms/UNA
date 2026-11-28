
-- TABLES
DROP TABLE IF EXISTS `bx_resources_entries`, `bx_resources_lists`;
DROP TABLE IF EXISTS `bx_resources_covers`, `bx_resources_photos_resized`;
DROP TABLE IF EXISTS `bx_resources_cmts`, `bx_resources_votes`, `bx_resources_votes_track`, `bx_resources_reactions`, `bx_resources_reactions_track`, `bx_resources_views_track`, `bx_resources_reports`, `bx_resources_reports_track`, `bx_resources_scores`, `bx_resources_scores_track`;

-- STORAGES & TRANSCODERS
DELETE FROM `sys_objects_storage` WHERE `object` LIKE 'bx_resources_%';
DELETE FROM `sys_storage_tokens` WHERE `object` LIKE 'bx_resources_%';

DELETE FROM `sys_objects_transcoder` WHERE `object` LIKE 'bx_resources_%';
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` LIKE 'bx_resources_%';
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` LIKE 'bx_resources_%';

-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_resources';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_resources';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_resources';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` LIKE 'bx_resources_%';

-- PRE-VALUES
DELETE FROM `sys_form_pre_lists` WHERE `module` = 'bx_resources';
DELETE FROM `sys_form_pre_values` WHERE `Key` LIKE 'bx_resources_%';

-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_resources%';

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` IN ('bx_resources', 'bx_resources_reactions');

-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` = 'bx_resources';

-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` = 'bx_resources';

-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` = 'bx_resources';

-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_resources', 'bx_resources_cmts');

-- SEARCH EXTENDED
DELETE FROM `sys_objects_search_extended` WHERE `module` = 'bx_resources';

-- STUDIO: page & widget
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_resources';
