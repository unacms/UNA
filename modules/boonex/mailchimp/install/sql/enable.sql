
-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_mailchimp', '_bx_mailchimp_adm_stg_cpt_type', 'bx_mailchimp@modules/boonex/mailchimp/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_mailchimp_general', '_bx_mailchimp_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_mailchimp_option_api_key', '', @iCategId, '_bx_mailchimp_option_api_key', 'secret', '', '', '', 10),
('bx_mailchimp_option_list_id', '', @iCategId, '_bx_mailchimp_option_list_id', 'select', 'a:2:{s:6:"module";s:12:"bx_mailchimp";s:6:"method";s:9:"get_lists";}', '', '', 20);

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_mailchimp', `class` = 'BxMailchimpAlerts', `file` = 'modules/boonex/mailchimp/classes/BxMailchimpAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_mailchimp');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandlerId),
('account', 'delete', @iHandlerId),
('account', 'edited', @iHandlerId),
('account', 'switch_context', @iHandlerId),
('account', 'confirm', @iHandlerId),
-- ('account', 'unconfirm', @iHandlerId),
('profile', 'delete', @iHandlerId),
('profile', 'add', @iHandlerId),
('profile', 'edit', @iHandlerId);

