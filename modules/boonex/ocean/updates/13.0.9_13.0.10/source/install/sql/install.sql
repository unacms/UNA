SET @sName = 'bx_ocean';

-- SETTINGS
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('templates', @sName, '_bx_ocean_stg_cpt_type', 'bx_ocean@modules/boonex/ocean/|std-mi.png', 2);
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_system'), '_bx_ocean_stg_cpt_category_system', 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_switcher_title'), '_bx_ocean_stg_cpt_option_switcher_name', 'Ocean', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_page_width'), '_bx_ocean_stg_cpt_option_page_width', '1000', 'digit', '', '', '', 2);

SET @iSystemCategoryId = (SELECT IFNULL(`id`, @iCategoryId) FROM `sys_options_categories` WHERE `name`='system' LIMIT 1);
SET @iSystemCategoryOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_options` WHERE `category_id`=@iSystemCategoryId LIMIT 1);
INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iSystemCategoryId, CONCAT(@sName, '_site_logo'), '', '0', 'digit', '', '', '', @iSystemCategoryOrder + 1),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_alt'), '', '', 'text', '', '', '', @iSystemCategoryOrder + 2),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 3);


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_ocean', '_bx_ocean', 'bx_ocean@modules/boonex/ocean/|std-pi.png');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name`='home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id`=@iParentPageId);
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'appearance', CONCAT('{url_studio}design.php?name=', @sName), '', 'bx_ocean@modules/boonex/ocean/|std-wi.png', '_bx_ocean_wgt_cpt', '', 'a:4:{s:6:"module";s:8:"bx_ocean";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:6:"Module";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder + 1);