
-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_fontawesome', '_bx_fontawesome_adm_stg_cpt_type', 'bx_fontawesome@modules/boonex/fontawesome/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_fontawesome_general', '_bx_fontawesome_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_fontawesome_option_icons_style', 'default', @iCategId, '_bx_fontawesome_option_icons_style', 'select', 'default,light,duotone', '', '', 10);

-- The site's icon set (sys_iconset_default) stays as it is: Font Awesome Pro is chosen in Studio, Lucide is the default.


-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_fontawesome', `class` = 'BxFontAwesomeAlerts', `file` = 'modules/boonex/fontawesome/classes/BxFontAwesomeAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_fontawesome');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandlerId);

-- CSS Loader

INSERT INTO `sys_preloader` (`module`, `type`, `content`, `active`) VALUES
('bx_fontawesome', 'css_system', 'modules/boonex/fontawesome/template/css/|fonts-all.css', 1),
('bx_fontawesome', 'css_system', 'modules/boonex/fontawesome/template/css/|fonts-duotone.css', 0),
('bx_fontawesome', 'css_system', 'modules/boonex/fontawesome/template/css/|fonts-light.css', 0);

-- Injections

INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_fontawesome', 0, 'injection_head', 'service', 'a:2:{s:6:"module";s:14:"bx_fontawesome";s:6:"method";s:9:"injection";}', 0, 1);
