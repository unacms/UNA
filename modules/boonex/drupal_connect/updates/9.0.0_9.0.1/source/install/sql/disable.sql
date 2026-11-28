
-- Email template

DELETE FROM `sys_email_templates` WHERE `Name` = 'bx_drupal_password_generated';

-- Auth objects

DELETE FROM `sys_objects_auths` WHERE `Name` = 'bx_drupal';

-- Alerts

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name`  =  'bx_drupal');

DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandlerId;
DELETE FROM `sys_alerts` WHERE `handler_id` =  @iHandlerId;

-- Options

DELETE FROM `top`, `toc`, `to` USING `sys_options_types` AS `top` LEFT JOIN `sys_options_categories` AS `toc` ON `top`.`id`=`toc`.`type_id` LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `top`.`name` = 'bx_drupal';

