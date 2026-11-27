SET @sName = 'bx_github';


-- TABLES
DROP TABLE IF EXISTS `bx_github_apps`, `bx_github_authorizations`, `bx_github_settings`;


-- FORMS
DELETE FROM `sys_form_display_inputs` WHERE `display_name` IN (SELECT `display_name` FROM `sys_form_displays` WHERE `module`=@sName);
DELETE FROM `sys_form_inputs` WHERE `module`=@sName;
DELETE FROM `sys_form_displays` WHERE `module`=@sName;
DELETE FROM `sys_objects_form` WHERE `module`=@sName;


-- LOGS
DELETE FROM `sys_objects_logs` WHERE `module`=@sName;


-- STUDIO PAGE & WIDGET
DELETE FROM `tp`, `tw`, `tpw`
USING `sys_std_pages` AS `tp`, `sys_std_widgets` AS `tw`, `sys_std_pages_widgets` AS `tpw`
WHERE `tp`.`id` = `tw`.`page_id` AND `tw`.`id` = `tpw`.`widget_id` AND `tp`.`name` = @sName;