SET @sName = 'bx_artificer';


-- SETTINGS
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('templates', @sName, '_bx_artificer_stg_cpt_type', 'bx_artificer@modules/boonex/artificer/|std-icon.svg', 2);
SET @iTypeId = LAST_INSERT_ID();

-- SETTINGS: Artificer template System
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_system'), '_bx_artificer_stg_cpt_category_system', 10);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_switcher_title'), '_bx_artificer_stg_cpt_option_switcher_name', 'Artificer', 'digit', '', '', '', 1), 
(@iCategoryId, CONCAT(@sName, '_color_scheme'), '_bx_artificer_stg_cpt_option_color_scheme', 'auto', 'select', 'a:2:{s:6:"module";s:12:"bx_artificer";s:6:"method";s:24:"get_options_color_scheme";}', '', '', 2),

(@iCategoryId, CONCAT(@sName, '_page_width'), '_bx_artificer_stg_cpt_option_page_width', '1280', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_header_width'), '_bx_artificer_stg_cpt_option_header_width', '', 'select', 'a:2:{s:6:"module";s:12:"bx_artificer";s:6:"method";s:24:"get_options_header_width";}', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_header_align'), '_bx_artificer_stg_cpt_option_header_align', '', 'select', 'a:2:{s:6:"module";s:12:"bx_artificer";s:6:"method";s:24:"get_options_header_align";}', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_header_search'), '_bx_artificer_stg_cpt_option_header_search', 'on', 'checkbox', '', '', '', 13),

(@iCategoryId, CONCAT(@sName, '_use_htmx'), '_bx_artificer_stg_cpt_option_use_htmx', '', 'checkbox', '', '', '', 30);

-- SETTINGS: Artificer template Custom Styles
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_custom'), '_bx_artificer_stg_cpt_category_styles_custom', 20);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_styles_custom'), '_bx_artificer_stg_cpt_option_styles_custom', '', 'text', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_images_custom'), '_bx_artificer_stg_cpt_option_images_custom', '', 'text', '', '', '', 10);

-- SETTINGS: Artificer template Site Logo
SET @iSystemCategoryId = (SELECT IFNULL(`id`, @iCategoryId) FROM `sys_options_categories` WHERE `name`='system' LIMIT 1);
SET @iSystemCategoryOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_options` WHERE `category_id`=@iSystemCategoryId LIMIT 1);
INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iSystemCategoryId, CONCAT(@sName, '_site_logo'), '', '0', 'digit', '', '', '', @iSystemCategoryOrder + 1),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 2),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_dark'), '', '0', 'digit', '', '', '', @iSystemCategoryOrder + 3),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_dark_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 4),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_inline'), '', '', 'text', '', '', '', @iSystemCategoryOrder + 5),
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_alt'), '', '', 'text', '', '', '', @iSystemCategoryOrder + 6),

(@iSystemCategoryId, CONCAT(@sName, '_site_mark'), '', '0', 'digit', '', '', '', @iSystemCategoryOrder + 10),
(@iSystemCategoryId, CONCAT(@sName, '_site_mark_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 11),
(@iSystemCategoryId, CONCAT(@sName, '_site_mark_dark'), '', '0', 'digit', '', '', '', @iSystemCategoryOrder + 12),
(@iSystemCategoryId, CONCAT(@sName, '_site_mark_dark_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 13),
(@iSystemCategoryId, CONCAT(@sName, '_site_mark_inline'), '', '', 'text', '', '', '', @iSystemCategoryOrder + 14);


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_artificer', '_bx_artificer', 'bx_artificer@modules/boonex/artificer/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name`='home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id`=@iParentPageId);
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'appearance', CONCAT('{url_studio}design.php?name=', @sName), '', 'bx_artificer@modules/boonex/artificer/|std-icon.svg', '_bx_artificer_wgt_cpt', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioDesigns";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder + 1);