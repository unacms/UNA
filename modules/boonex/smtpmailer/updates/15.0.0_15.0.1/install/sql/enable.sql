-- SETTINGS
SET @iTypeId = (SELECT `id` FROM `sys_options_types` WHERE `name`='bx_smtp' LIMIT 1);

UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_smtp_password';

DELETE FROM `sys_options_categories` WHERE `name`='bx_smtp_oauth';
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_smtp_oauth', '_bx_smtp_adm_stg_cpt_category_oauth', 2);
SET @iCategId = LAST_INSERT_ID();

UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` LIKE 'bx_smtp_oauth_%';
INSERT IGNORE INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_smtp_oauth_on', '', @iCategId, '_bx_smtp_option_oauth_on', 'checkbox', '', '', 10, ''),
('bx_smtp_oauth_client_id', '', @iCategId, '_bx_smtp_oauth_client_id', 'digit', '', '', 20, ''),
('bx_smtp_oauth_tenant_id', '', @iCategId, '_bx_smtp_oauth_tenant_id', 'digit', '', '', 30, ''),
('bx_smtp_oauth_tenant_name', '', @iCategId, '_bx_smtp_oauth_tenant_name', 'digit', '', '', 40, ''),
('bx_smtp_oauth_cert_public', '', @iCategId, '_bx_smtp_oauth_cert_public', 'text', '', '', 50, ''),
('bx_smtp_oauth_cert_private', '', @iCategId, '_bx_smtp_oauth_cert_private', 'secret_text', '', '', 60, '');
