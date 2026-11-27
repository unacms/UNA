SET @sName = 'bx_media';

-- TABLES
DROP TABLE IF EXISTS `bx_media_input_settings`;

-- STUDIO WIDGET
DELETE FROM `tp`, `tw`, `tpw`
USING `sys_std_pages` AS `tp`, `sys_std_widgets` AS `tw`, `sys_std_pages_widgets` AS `tpw`
WHERE `tp`.`id` = `tw`.`page_id` AND `tw`.`id` = `tpw`.`widget_id` AND `tp`.`name` = @sName;

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` IN('bx_media_uploader', 'bx_media_uploader_attachments');


