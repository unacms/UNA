-- SETTINGS
DELETE FROM `tot`, `toc`, `to` USING `sys_options_types` AS `tot` LEFT JOIN `sys_options_categories` AS `toc` ON `tot`.`id`=`toc`.`type_id` LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `tot`.`name`='bx_reminders';


-- PAGES & BLOCKS
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_reminders';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_reminders' OR `object` LIKE 'bx_reminders%';


-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = @sName;
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_reminders';


-- CRON
DELETE FROM `sys_cron_jobs` WHERE `name` LIKE 'bx_reminders%';
