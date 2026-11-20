
-- Settings

DELETE FROM `top`, `toc`, `to` USING `sys_options_types` AS `top` LEFT JOIN `sys_options_categories` AS `toc` ON `top`.`id`=`toc`.`type_id` LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `top`.`name` = 'bx_fontawesome';

-- Only a site that uses this module's icon set gets the free Font Awesome set instead.
UPDATE `sys_options` SET `value` = 'sys_fontawesome' WHERE `name` = 'sys_iconset_default' AND `value` = 'bx_fontawesome';

-- Alerts

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_fontawesome');

DELETE FROM `sys_alerts_handlers` WHERE `id`  = @iHandlerId;
DELETE FROM `sys_alerts` WHERE `handler_id` =  @iHandlerId ;

-- CSS Loader

DELETE FROM `sys_preloader` WHERE `module` = 'bx_fontawesome';

-- Injections

DELETE FROM `sys_injections` WHERE `name` IN('bx_fontawesome');

