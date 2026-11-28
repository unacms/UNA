SET @sName = 'bx_media';

-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_options_types` WHERE `group` = 'modules');

INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) 
VALUES('modules', @sName, '_bx_media_adm_stg_cpt_type', 'bx_media@modules/boonex/media/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));

SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId,  'bx_media_general', '_bx_media_adm_stg_cpt_category_general', 0, 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_media_profile_cover_enabled', '_bx_media_adm_stg_cpt_profile_cover_enabled', 'on', 'checkbox', '', '', '', '', 1),
(@iCategoryId, 'bx_media_profile_picture_enabled', '_bx_media_adm_stg_cpt_profile_picture_enabled', 'on', 'checkbox', '', '', '', '', 2),
(@iCategoryId, 'bx_media_text_header_image_enabled', '_bx_media_adm_stg_cpt_header_image_enabled', 'on', 'checkbox', '', '', '', '', 3);

-- INJECTION
INSERT INTO `sys_injections`(`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
(@sName, 0, 'injection_head', 'service', 'a:2:{s:6:"module";s:8:"bx_media";s:6:"method";s:10:"include_js";}', 0, 1);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxMediaAlertsResponse', 'modules/boonex/media/classes/BxMediaAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'image_editor', @iHandler);