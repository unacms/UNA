SET @sName = 'bx_messenger';

-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = @sName LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = @sName;
DELETE FROM `sys_pages_blocks` WHERE `module` = @sName OR `object` = 'bx_messenger_main';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` LIKE CONCAT(@sName, '%') LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- LIVE UPDATES
DELETE FROM `sys_objects_live_updates` WHERE `name` IN ('bx_messenger_new_messages', 'bx_messenger_public_video_conference');

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix`
FROM `sys_acl_actions`, `sys_acl_matrix`
WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = @sName;

DELETE FROM `sys_acl_actions` WHERE `Module` = @sName;

-- MENU
DELETE FROM `sys_menu_items` WHERE `module` = @sName;
DELETE FROM `sys_menu_sets` WHERE `module` = @sName;
DELETE FROM `sys_objects_menu` WHERE `module` = @sName;

-- PRIVACY
--DELETE FROM `sys_objects_privacy` WHERE `object` = 'bx_messenger_allow_view_groups_to';

---- NEO APP FORM
DELETE FROM `sys_objects_form` WHERE `module` = @sName;
DELETE FROM `sys_form_displays` WHERE `module` = @sName;
DELETE FROM `sys_form_inputs` WHERE `module` = @sName;
DELETE FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_messenger_send';

----- NEO REACTION
DELETE FROM `sys_objects_vote` WHERE `Name` = 'bx_messenger_jot';
