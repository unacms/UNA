
-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_opencv', '_bx_opencv_adm_stg_cpt_type', 'bx_opencv@modules/boonex/opencv/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_opencv_general', '_bx_opencv_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_opencv_option_confidence', '0.9', @iCategId, '_bx_opencv_option_confidence', 'digit', '', '', '', 10),
('bx_opencv_option_storages', '', @iCategId, '_bx_opencv_option_storages', 'list', 'a:2:{s:6:"module";s:9:"bx_opencv";s:6:"method";s:12:"get_storages";}', '', '', 20),
('bx_opencv_option_obfuscation_method', 'emoji', @iCategId, '_bx_opencv_option_obfuscation_method', 'select', 'emoji,blur', '', '', 30);

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_opencv', `class` = 'BxOpencvAlerts', `file` = 'modules/boonex/opencv/classes/BxOpencvAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_opencv');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'store_file', @iHandlerId),
('system', 'transcode', @iHandlerId);

