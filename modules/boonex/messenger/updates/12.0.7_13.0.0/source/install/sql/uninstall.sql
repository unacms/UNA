SET @sName = 'bx_messenger';

DROP TABLE IF EXISTS `bx_messenger_jots`;
DROP TABLE IF EXISTS `bx_messenger_lots`;
DROP TABLE IF EXISTS `bx_messenger_lots_types`;
DROP TABLE IF EXISTS `bx_messenger_users_info`;
DROP TABLE IF EXISTS `bx_messenger_files`;
DROP TABLE IF EXISTS `bx_messenger_photos_resized`;
DROP TABLE IF EXISTS `bx_messenger_videos_processed`;
DROP TABLE IF EXISTS `bx_messenger_mp3_processed`;
DROP TABLE IF EXISTS `bx_messenger_lcomments`;
DROP TABLE IF EXISTS `bx_messenger_jot_reactions`;
DROP TABLE IF EXISTS `bx_messenger_unread_jots`;
DROP TABLE IF EXISTS `bx_messenger_jvc`;
DROP TABLE IF EXISTS `bx_messenger_jvc_track`;
DROP TABLE IF EXISTS `bx_messenger_public_jvc`;
DROP TABLE IF EXISTS `bx_messenger_lots_settings`;
DROP TABLE IF EXISTS `bx_messenger_groups`;
DROP TABLE IF EXISTS `bx_messenger_groups_lots`;
DROP TABLE IF EXISTS `bx_messenger_saved_jots`;
DROP TABLE IF EXISTS `bx_messenger_jots_media_tracker`;

-- STORAGES & TRANSCODERS
DELETE FROM `sys_objects_storage` WHERE `object` LIKE 'bx_messenger%';
DELETE FROM `sys_objects_transcoder` WHERE `storage_object` LIKE 'bx_messenger%';
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` LIKE 'bx_messenger%';
DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` = 'bx_messenger_preview';
DELETE FROM `sys_transcoder_videos_files` WHERE `transcoder_object` LIKE 'bx_messenger%';

-- STUDIO PAGE & WIDGET
DELETE FROM `tp`, `tw`, `tpw`
USING `sys_std_pages` AS `tp`, `sys_std_widgets` AS `tw`, `sys_std_pages_widgets` AS `tpw`
WHERE `tp`.`id` = `tw`.`page_id` AND `tw`.`id` = `tpw`.`widget_id` AND `tp`.`name` = @sName;