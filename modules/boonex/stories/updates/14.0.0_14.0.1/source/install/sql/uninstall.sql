
-- TABLES
DROP TABLE IF EXISTS `bx_stories_entries`, `bx_stories_files`, `bx_stories_photos_resized`, `bx_stories_entries_media`, `bx_stories_cmts`, `bx_stories_cmts_notes`, `bx_stories_votes`, `bx_stories_votes_track`, `bx_stories_reactions`, `bx_stories_reactions_track`, `bx_stories_views_track`, `bx_stories_meta_keywords`, `bx_stories_meta_mentions`, `bx_stories_reports`, `bx_stories_reports_track`, `bx_stories_scores`, `bx_stories_scores_track`;


-- STORAGES & TRANSCODERS
DELETE FROM `sys_objects_storage` WHERE `object` = 'bx_stories_files' OR `object` = 'bx_stories_photos_resized';
DELETE FROM `sys_storage_tokens` WHERE `object` = 'bx_stories_files' OR `object` = 'bx_stories_photos_resized';

DELETE FROM `sys_objects_transcoder` WHERE `object` IN('bx_stories_preview', 'bx_stories_browse', 'bx_stories_big', 'bx_stories_video_poster_browse', 'bx_stories_video_poster_preview', 'bx_stories_video_poster_big', 'bx_stories_video_mp4', 'bx_stories_video_mp4_hd', 'bx_stories_proxy_preview', 'bx_stories_proxy_browse', 'bx_stories_proxy_cover');
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` IN('bx_stories_preview', 'bx_stories_browse', 'bx_stories_big', 'bx_stories_video_poster_browse', 'bx_stories_video_poster_preview', 'bx_stories_video_poster_big', 'bx_stories_video_mp4', 'bx_stories_video_mp4_hd');
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` IN('bx_stories_preview', 'bx_stories_browse', 'bx_stories_big', 'bx_stories_video_poster_browse', 'bx_stories_video_poster_preview', 'bx_stories_video_poster_big', 'bx_stories_video_mp4', 'bx_stories_video_mp4_hd');
DELETE FROM `sys_transcoder_videos_files` WHERE `transcoder_object` IN('bx_stories_video_mp4', 'bx_stories_video_mp4_hd');


-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_stories';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_stories';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_stories';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` LIKE 'bx_stories%';


-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_stories%';


-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` LIKE 'bx_stories%';


-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` LIKE 'bx_stories%';


-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` LIKE 'bx_stories%';


-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` LIKE 'bx_stories%';


-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_stories', 'bx_stories_cmts');

DELETE FROM `sys_content_info_grids` WHERE `object` IN ('bx_stories');


-- SEARCH EXTENDED
DELETE FROM `sys_objects_search_extended` WHERE `module` = 'bx_stories';


-- STUDIO: page & widget
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_stories';
