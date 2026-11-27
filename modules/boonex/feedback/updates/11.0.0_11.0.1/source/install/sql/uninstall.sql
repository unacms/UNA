
-- TABLES
DROP TABLE IF EXISTS `bx_fdb_questions`, `bx_fdb_answers`, `bx_fdb_answers2users`;


-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_feedback';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_feedback';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_feedback';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` LIKE 'bx_feedback_%';


-- STUDIO: page & widget
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_feedback';
