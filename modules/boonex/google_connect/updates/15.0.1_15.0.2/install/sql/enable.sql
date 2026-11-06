-- SETTINGS
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name`='bx_googlecon_general' LIMIT 1);

DELETE FROM `sys_options` WHERE `name`='bx_googlecon_client_ids';
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_googlecon_client_ids', '', @iCategId, '_bx_googlecon_option_client_ids', 'digit', '', '', 30, '');
