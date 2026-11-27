-- UNA-Migration-Min-System-Version: 15.0.0-RC4

-- Studio > API > Configs: the grid's "Keep in sync" switch (#6340, #6346), for a site installed before it.
UPDATE `sys_objects_grid` SET `field_active` = 'sync_app' WHERE `object` = 'sys_studio_api_configs' AND `field_active` = '';
UPDATE `sys_objects_grid` SET `field_order` = '' WHERE `object` = 'sys_studio_api_configs' AND `field_order` = 'name';

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`)
SELECT 'sys_studio_api_configs', 'switcher', '_adm_api_ttl_sync_api', '10%', 0, 0, '', '', 1
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'sys_studio_api_configs' AND `name` = 'switcher');

UPDATE `sys_grid_fields` SET `order` = 2 WHERE `object` = 'sys_studio_api_configs' AND `name` = 'title' AND `order` = 1;
UPDATE `sys_grid_fields` SET `order` = 3, `width` = '70%' WHERE `object` = 'sys_studio_api_configs' AND `name` = 'actions' AND `order` = 2 AND `width` = '80%';
