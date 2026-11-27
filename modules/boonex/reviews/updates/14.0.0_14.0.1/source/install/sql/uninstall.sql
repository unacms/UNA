
-- TABLES
DROP TABLE IF EXISTS `bx_reviews_reviews`, `bx_reviews_covers`, `bx_reviews_files`, `bx_reviews_photos`, `bx_reviews_photos_resized`, `bx_reviews_videos`, `bx_reviews_videos_resized`, `bx_reviews_cmts`, `bx_reviews_cmts_notes`, `bx_reviews_votes`, `bx_reviews_votes_track`, `bx_reviews_svotes`, `bx_reviews_svotes_track`, `bx_reviews_reactions`, `bx_reviews_reactions_track`, `bx_reviews_views_track`, `bx_reviews_meta_keywords`, `bx_reviews_meta_locations`, `bx_reviews_meta_mentions`, `bx_reviews_reports`, `bx_reviews_reports_track`, `bx_reviews_favorites_track`, `bx_reviews_favorites_lists`, `bx_reviews_scores`, `bx_reviews_scores_track`, `bx_reviews_polls`, `bx_reviews_polls_answers`, `bx_reviews_polls_answers_votes`, `bx_reviews_polls_answers_votes_track`, `bx_reviews_voting_options`;

-- STORAGES & TRANSCODERS
DELETE FROM `sys_objects_storage` WHERE `object` LIKE 'bx_reviews_%';
DELETE FROM `sys_storage_tokens` WHERE `object` LIKE 'bx_reviews_%';

DELETE FROM `sys_objects_transcoder` WHERE `object` LIKE 'bx_reviews_%';
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` LIKE 'bx_reviews_%';
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` LIKE 'bx_reviews_%';

-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` LIKE 'bx_reviews_%';

-- PRE-VALUES
DELETE FROM `sys_form_pre_lists` WHERE `module` = 'bx_reviews';

DELETE FROM `sys_form_pre_values` WHERE `Key` IN('bx_reviews_cats');

-- CATEGORIES
DELETE FROM `sys_categories` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_categories2objects` WHERE `module` = 'bx_reviews';

-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_reviews%';

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` IN ('bx_reviews', 'bx_reviews_reactions', 'bx_reviews_poll_answers');

-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` = 'bx_reviews';

-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` = 'bx_reviews';

-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` = 'bx_reviews';

-- FAFORITES
DELETE FROM `sys_objects_favorite` WHERE `name` = 'bx_reviews';

-- FEATURED
DELETE FROM `sys_objects_feature` WHERE `name` = 'bx_reviews';

-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_reviews', 'bx_reviews_cmts');

DELETE FROM `sys_content_info_grids` WHERE `object` IN ('bx_reviews');

-- SEARCH EXTENDED
DELETE FROM `sys_objects_search_extended` WHERE `module` = 'bx_reviews';

-- STUDIO: page & widget
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_reviews';
