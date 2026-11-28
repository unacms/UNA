-- UNA-Migration-Min-System-Version: 15.0.0-RC4

-- Resources: the administration grid shows the context of a resource (#6374), for a site where Resources was enabled before.
UPDATE `sys_objects_grid`
SET `source` = 'SELECT `te`.*, `tp`.`id` AS `context_pid`, `tp`.`type` AS `context_module`, `tp`.`content_id` AS `context_cid` FROM `bx_resources_entries` AS `te` INNER JOIN `sys_profiles` AS `tp` ON ABS(`te`.`allow_view_to`)=`tp`.`id`  WHERE 1 ',
    `filter_fields` = 'te`.`title,te`.`text'
WHERE `object` = 'bx_resources_administration' AND `source` = 'SELECT * FROM `bx_resources_entries` WHERE 1 ';

-- The old columns move and get narrower only where they still have the values the module set.
UPDATE `sys_grid_fields` SET `width` = '20%', `order` = 6 WHERE `object` = 'bx_resources_administration' AND `name` = 'title' AND `width` = '35%' AND `order` = 4;
UPDATE `sys_grid_fields` SET `width` = '5%', `order` = 6 WHERE `object` = 'bx_resources_administration' AND `name` = 'added' AND `width` = '10%' AND `order` = 5;
UPDATE `sys_grid_fields` SET `width` = '15%', `order` = 8 WHERE `object` = 'bx_resources_administration' AND `name` = 'author' AND `width` = '20%' AND `order` = 6;
UPDATE `sys_grid_fields` SET `order` = 9 WHERE `object` = 'bx_resources_administration' AND `name` = 'actions' AND `order` = 7;

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_resources_administration', 'context_module', '_bx_resources_grid_column_title_adm_context_module', '5%', 0, 0, '', 4
WHERE EXISTS (SELECT 1 FROM `sys_objects_grid` WHERE `object` = 'bx_resources_administration')
    AND NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_resources_administration' AND `name` = 'context_module');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_resources_administration', 'context_cid', '_bx_resources_grid_column_title_adm_context_cid', '20%', 0, 0, '', 5
WHERE EXISTS (SELECT 1 FROM `sys_objects_grid` WHERE `object` = 'bx_resources_administration')
    AND NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_resources_administration' AND `name` = 'context_cid');
