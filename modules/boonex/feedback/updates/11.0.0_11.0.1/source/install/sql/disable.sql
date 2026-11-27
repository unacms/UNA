
-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_feedback' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_feedback';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_feedback' OR `object` LIKE 'bx_feedback_%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` LIKE 'bx_feedback_%';
DELETE FROM `sys_grid_fields` WHERE `object` LIKE 'bx_feedback_%';
DELETE FROM `sys_grid_actions` WHERE `object` LIKE 'bx_feedback_%';
