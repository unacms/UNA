SET @sName = 'bx_ai_proxy';

-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES
('modules', @sName, '_bx_ai_proxy', 'bx_ai_proxy@modules/boonex/ai_proxy/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_ai_proxy', 10);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
('bx_ai_proxy_model', '', @iCategId, '_bx_ai_proxy_option_model', '_bx_ai_proxy_option_model_info', 'select', '{"module":"bx_ai_proxy","method":"get_model_options"}', '', '', '', 1);
