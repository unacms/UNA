SET @sName = 'bx_new_comments';

-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_options_types` WHERE `group` = 'modules');

INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) 
VALUES('modules', @sName, '_bx_new_comments', 'bx_new_comments@modules/boonex/new_comments/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));

SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId,  'bx_new_comments', '_bx_new_comments', 0, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_new_comments_session_interval', '_bx_new_comments_session_interval', '60', 'digit', '', '', '', '', 0);

-- MENU: add menu item to profiles modules actions menu (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visibility_custom`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_cmts_item_meta', @sName, 'new-comment', '_bx_new_comments_menu_item_title_system_is_new_comment', '_bx_new_comments_menu_item_title_is_new_comment', '', '', '', '', '', '', 2147483646, 1, 0, 0);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxNewCommentsAlertsResponse', 'modules/boonex/new_comments/classes/BxNewCommentsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('comment', 'menu_custom_item', @iHandler);
