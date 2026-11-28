SET @sName = 'bx_decorous';


-- SETTINGS
SET @iSystemCategoryId = (SELECT `id` FROM `sys_options_categories` WHERE `name`='system' LIMIT 1);
SET @iSystemCategoryOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_options` WHERE `category_id`=@iSystemCategoryId LIMIT 1);
INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iSystemCategoryId, CONCAT(@sName, '_site_logo_aspect_ratio'), '', '', 'digit', '', '', '', @iSystemCategoryOrder + 1);

INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('templates', @sName, '_bx_decorous_stg_cpt_type', 'bx_decorous@modules/boonex/decorous/|std-icon.svg', 2);
SET @iTypeId = LAST_INSERT_ID();

-- SETTINGS: Decorous template System
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_system'), '_bx_decorous_stg_cpt_category_system', 10);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_switcher_title'), '_bx_decorous_stg_cpt_option_switcher_name', 'Decorous', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_default_mix'), '_bx_decorous_stg_cpt_option_default_mix', '', 'select', 'a:2:{s:6:"module";s:11:"bx_decorous";s:6:"method";s:23:"get_options_default_mix";}', '', '', 10);


-- SETTINGS: Decorous template Styles General
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_general'), '_bx_decorous_stg_cpt_category_styles_general', 20);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_general_item_bg_color_hover'), '_bx_decorous_stg_cpt_option_general_item_bg_color_hover', 'rgba(245, 245, 245, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_general_item_bg_color_active'), '_bx_decorous_stg_cpt_option_general_item_bg_color_active', 'rgba(230, 247, 255, 1)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_general_item_bg_color_disabled'), '_bx_decorous_stg_cpt_option_general_item_bg_color_disabled', '', 'rgba', '', '', '', 3);


-- SETTINGS: Decorous template Styles Header
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_header'), '_bx_decorous_stg_cpt_category_styles_header', 30);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_header_height'), '_bx_decorous_stg_cpt_option_header_height', '4rem', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_header_content_padding'), '_bx_decorous_stg_cpt_option_header_content_padding', '0.5rem', 'digit', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_header_bg_color'), '_bx_decorous_stg_cpt_option_header_bg_color', 'rgba(255, 255, 255, 0.8)', 'rgba', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_header_bg_image'), '_bx_decorous_stg_cpt_option_header_bg_image', '', 'image', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_header_bg_image_repeat'), '_bx_decorous_stg_cpt_option_header_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_header_bg_image_attachment'), '_bx_decorous_stg_cpt_option_header_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_header_bg_image_size'), '_bx_decorous_stg_cpt_option_header_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_site_logo'), '_bx_decorous_stg_cpt_option_site_logo', '', 'image', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_site_logo_alt'), '_bx_decorous_stg_cpt_option_site_logo_alt', '', 'text', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_header_border_color'), '_bx_decorous_stg_cpt_option_header_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_header_border_size'), '_bx_decorous_stg_cpt_option_header_border_size', '1px', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_header_shadow'), '_bx_decorous_stg_cpt_option_header_shadow', '', 'digit', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_header_icon_color'), '_bx_decorous_stg_cpt_option_header_icon_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_header_icon_color_hover'), '_bx_decorous_stg_cpt_option_header_icon_color_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_header_link_color'), '_bx_decorous_stg_cpt_option_header_link_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_header_link_color_hover'), '_bx_decorous_stg_cpt_option_header_link_color_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 16);

-- SETTINGS: Decorous template Styles Footer
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_footer'), '_bx_decorous_stg_cpt_category_styles_footer', 40);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_footer_bg_color'), '_bx_decorous_stg_cpt_option_footer_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_footer_bg_image'), '_bx_decorous_stg_cpt_option_footer_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_footer_bg_image_repeat'), '_bx_decorous_stg_cpt_option_footer_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_footer_bg_image_attachment'), '_bx_decorous_stg_cpt_option_footer_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_footer_bg_image_size'), '_bx_decorous_stg_cpt_option_footer_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_footer_content_padding'), '_bx_decorous_stg_cpt_option_footer_content_padding', '1rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_footer_border_color'), '_bx_decorous_stg_cpt_option_footer_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_footer_border_size'), '_bx_decorous_stg_cpt_option_footer_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_footer_shadow'), '_bx_decorous_stg_cpt_option_footer_shadow', '', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_footer_font_color'), '_bx_decorous_stg_cpt_option_footer_font_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_footer_icon_color'), '_bx_decorous_stg_cpt_option_footer_icon_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_footer_icon_color_hover'), '_bx_decorous_stg_cpt_option_footer_icon_color_hover', '', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_footer_link_color'), '_bx_decorous_stg_cpt_option_footer_link_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_footer_link_color_hover'), '_bx_decorous_stg_cpt_option_footer_link_color_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14);

-- SETTINGS: Decorous template Styles Body
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_body'), '_bx_decorous_stg_cpt_category_styles_body', 50);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_body_bg_color'), '_bx_decorous_stg_cpt_option_body_bg_color', 'rgb(240, 242, 245)', 'rgb', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_body_bg_image'), '_bx_decorous_stg_cpt_option_body_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_body_bg_image_repeat'), '_bx_decorous_stg_cpt_option_body_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_body_bg_image_attachment'), '_bx_decorous_stg_cpt_option_body_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_body_bg_image_size'), '_bx_decorous_stg_cpt_option_body_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_page_width'), '_bx_decorous_stg_cpt_option_page_width', '100%', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_body_icon_color'), '_bx_decorous_stg_cpt_option_body_icon_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_body_icon_color_hover'), '_bx_decorous_stg_cpt_option_body_icon_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_body_link_color'), '_bx_decorous_stg_cpt_option_body_link_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_body_link_color_hover'), '_bx_decorous_stg_cpt_option_body_link_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 10);


-- SETTINGS: Decorous template Styles Cover
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_cover'), '_bx_decorous_stg_cpt_category_styles_cover', 55);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_cover_height'), '_bx_decorous_stg_cpt_option_cover_height', '30vh', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_cover_bg_color'), '_bx_decorous_stg_cpt_option_cover_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_cover_content_padding'), '_bx_decorous_stg_cpt_option_cover_content_padding', '2rem 3rem 2rem 3rem', 'digit', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_cover_border_color'), '_bx_decorous_stg_cpt_option_cover_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_cover_border_size'), '_bx_decorous_stg_cpt_option_cover_border_size', '1px', 'digit', '', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_cover_border_radius'), '_bx_decorous_stg_cpt_option_cover_border_radius', '0px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_cover_shadow'), '_bx_decorous_stg_cpt_option_cover_shadow', '', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_cover_icon_border_color'), '_bx_decorous_stg_cpt_option_cover_icon_border_color', 'rgba(208, 208, 208, 1)', 'rgba', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_cover_icon_border_size'), '_bx_decorous_stg_cpt_option_cover_icon_border_size', '1px', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_cover_icon_border_radius'), '_bx_decorous_stg_cpt_option_cover_icon_border_radius', '3px', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_cover_icon_shadow'), '_bx_decorous_stg_cpt_option_cover_icon_shadow', 'none', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_cover_text_align'), '_bx_decorous_stg_cpt_option_cover_text_align', 'center', 'select', 'left,center,right', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_cover_text_shadow'), '_bx_decorous_stg_cpt_option_cover_text_shadow', '0px 1px 3px rgba(0, 0, 0, .3)', 'digit', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_cover_font_family'), '_bx_decorous_stg_cpt_option_cover_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_cover_font_size'), '_bx_decorous_stg_cpt_option_cover_font_size', '2.0rem', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_cover_font_color'), '_bx_decorous_stg_cpt_option_cover_font_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 16),
(@iCategoryId, CONCAT(@sName, '_cover_font_weight'), '_bx_decorous_stg_cpt_option_cover_font_weight', '700', 'digit', '', '', '', 17);


-- SETTINGS: Decorous template Styles Block
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_block'), '_bx_decorous_stg_cpt_category_styles_block', 60);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_block_bg_color'), '_bx_decorous_stg_cpt_option_block_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_block_bg_image'), '_bx_decorous_stg_cpt_option_block_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_block_bg_image_repeat'), '_bx_decorous_stg_cpt_option_block_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_block_bg_image_attachment'), '_bx_decorous_stg_cpt_option_block_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_block_bg_image_size'), '_bx_decorous_stg_cpt_option_block_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_block_content_padding'), '_bx_decorous_stg_cpt_option_block_content_padding', '1rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_block_border_color'), '_bx_decorous_stg_cpt_option_block_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_block_border_size'), '_bx_decorous_stg_cpt_option_block_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_block_border_radius'), '_bx_decorous_stg_cpt_option_block_border_radius', '4px', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_block_shadow'), '_bx_decorous_stg_cpt_option_block_shadow', '', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_block_title_bg_color'), '_bx_decorous_stg_cpt_option_block_title_bg_color', '', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_block_title_padding'), '_bx_decorous_stg_cpt_option_block_title_padding', '0.75rem 1.0rem', 'digit', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_block_title_border_color'), '_bx_decorous_stg_cpt_option_block_title_border_color', '', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_block_title_border_size'), '_bx_decorous_stg_cpt_option_block_title_border_size', '', 'digit', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_block_title_border_radius'), '_bx_decorous_stg_cpt_option_block_title_border_radius', '4px 4px 0px 0px', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_block_title_font_family'), '_bx_decorous_stg_cpt_option_block_title_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 16),
(@iCategoryId, CONCAT(@sName, '_block_title_font_size'), '_bx_decorous_stg_cpt_option_block_title_font_size', '1.25rem', 'digit', '', '', '', 17),
(@iCategoryId, CONCAT(@sName, '_block_title_font_color'), '_bx_decorous_stg_cpt_option_block_title_font_color', 'rgba(0, 0, 0, 0.85);', 'rgba', '', '', '', 18),
(@iCategoryId, CONCAT(@sName, '_block_title_font_weight'), '_bx_decorous_stg_cpt_option_block_title_font_weight', '700', 'digit', '', '', '', 19),
(@iCategoryId, CONCAT(@sName, '_block_title_div_height'), '_bx_decorous_stg_cpt_option_block_title_div_height', '1px', 'digit', '', '', '', 20),
(@iCategoryId, CONCAT(@sName, '_block_title_div_bg_color'), '_bx_decorous_stg_cpt_option_block_title_div_bg_color', 'rgba(240, 240, 240, 1)', 'rgba', '', '', '', 21);


-- SETTINGS: Decorous template Styles Card
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_card'), '_bx_decorous_stg_cpt_category_styles_card', 70);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_card_bg_color'), '_bx_decorous_stg_cpt_option_card_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_card_bg_color_hover'), '_bx_decorous_stg_cpt_option_card_bg_color_hover', 'rgba(255, 255, 255, 0.5)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_card_bg_image'), '_bx_decorous_stg_cpt_option_card_bg_image', '', 'image', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_card_bg_image_repeat'), '_bx_decorous_stg_cpt_option_card_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_card_bg_image_attachment'), '_bx_decorous_stg_cpt_option_card_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_card_bg_image_size'), '_bx_decorous_stg_cpt_option_card_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_card_content_padding'), '_bx_decorous_stg_cpt_option_card_content_padding', '1rem', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_card_border_color'), '_bx_decorous_stg_cpt_option_card_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_card_border_size'), '_bx_decorous_stg_cpt_option_card_border_size', '1px', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_card_border_radius'), '_bx_decorous_stg_cpt_option_card_border_radius', '4px', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_card_shadow'), '_bx_decorous_stg_cpt_option_card_shadow', '0px 2px 4px 0px rgba(0, 0, 0, 0.1)', 'digit', '', '', '', 11);


-- SETTINGS: Decorous template Styles Popups
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_popup'), '_bx_decorous_stg_cpt_category_styles_popup', 80);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_popup_bg_color'), '_bx_decorous_stg_cpt_option_popup_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_popup_bg_image'), '_bx_decorous_stg_cpt_option_popup_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_popup_bg_image_repeat'), '_bx_decorous_stg_cpt_option_popup_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_popup_bg_image_attachment'), '_bx_decorous_stg_cpt_option_popup_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_popup_bg_image_size'), '_bx_decorous_stg_cpt_option_popup_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_popup_content_padding'), '_bx_decorous_stg_cpt_option_popup_content_padding', '1.25rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_popup_border_color'), '_bx_decorous_stg_cpt_option_popup_border_color', 'rgba(0, 0, 0, 0.2)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_popup_border_size'), '_bx_decorous_stg_cpt_option_popup_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_popup_border_radius'), '_bx_decorous_stg_cpt_option_popup_border_radius', '3px', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_popup_shadow'), '_bx_decorous_stg_cpt_option_popup_shadow', '0px 1px 5px 0px rgba(0, 0, 0, 0.05)', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_popup_title_bg_color'), '_bx_decorous_stg_cpt_option_popup_title_bg_color', 'rgba(230, 240, 250, 0.9)', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_popup_title_padding'), '_bx_decorous_stg_cpt_option_popup_title_padding', '1.25rem', 'digit', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_popup_title_font_family'), '_bx_decorous_stg_cpt_option_popup_title_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_popup_title_font_size'), '_bx_decorous_stg_cpt_option_popup_title_font_size', '1rem', 'digit', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_popup_title_font_color'), '_bx_decorous_stg_cpt_option_popup_title_font_color', 'rgba(40, 50, 60, 0.9)', 'rgba', '', '', '', 15);


-- SETTINGS: Decorous template Styles Main Menu
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_menu_main'), '_bx_decorous_stg_cpt_category_styles_menu_main', 90);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_menu_main_bg_color'), '_bx_decorous_stg_cpt_option_menu_main_bg_color', 'rgba(255, 255, 255, 1.0)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_menu_main_bg_image'), '_bx_decorous_stg_cpt_option_menu_main_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_menu_main_bg_image_repeat'), '_bx_decorous_stg_cpt_option_menu_main_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_menu_main_bg_image_attachment'), '_bx_decorous_stg_cpt_option_menu_main_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_menu_main_bg_image_size'), '_bx_decorous_stg_cpt_option_menu_main_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_menu_main_content_padding'), '_bx_decorous_stg_cpt_option_menu_main_content_padding', '', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_menu_main_border_color'), '_bx_decorous_stg_cpt_option_menu_main_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_menu_main_border_size'), '_bx_decorous_stg_cpt_option_menu_main_border_size', '0px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_menu_main_shadow'), '_bx_decorous_stg_cpt_option_menu_main_shadow', '2px 0px 8px 0px rgba(0, 0, 0, 0.1)', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_family'), '_bx_decorous_stg_cpt_option_menu_main_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_size'), '_bx_decorous_stg_cpt_option_menu_main_font_size', '1rem', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_color'), '_bx_decorous_stg_cpt_option_menu_main_font_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_color_hover'), '_bx_decorous_stg_cpt_option_menu_main_font_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_color_active'), '_bx_decorous_stg_cpt_option_menu_main_font_color_active', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_shadow'), '_bx_decorous_stg_cpt_option_menu_main_font_shadow', 'none', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_menu_main_font_weight'), '_bx_decorous_stg_cpt_option_menu_main_font_weight', '400', 'digit', '', '', '', 16);


-- SETTINGS: Decorous template Styles Account Menu
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_menu_account'), '_bx_decorous_stg_cpt_category_styles_menu_account', 95);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_menu_account_bg_color'), '_bx_decorous_stg_cpt_option_menu_account_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_menu_account_bg_image'), '_bx_decorous_stg_cpt_option_menu_account_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_menu_account_bg_image_repeat'), '_bx_decorous_stg_cpt_option_menu_account_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_menu_account_bg_image_attachment'), '_bx_decorous_stg_cpt_option_menu_account_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_menu_account_bg_image_size'), '_bx_decorous_stg_cpt_option_menu_account_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_menu_account_content_padding'), '_bx_decorous_stg_cpt_option_menu_account_content_padding', '1.25rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_menu_account_border_color'), '_bx_decorous_stg_cpt_option_menu_account_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_menu_account_border_size'), '_bx_decorous_stg_cpt_option_menu_account_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_menu_account_shadow'), '_bx_decorous_stg_cpt_option_menu_account_shadow', '0px 8px 16px 0px rgba(0, 0, 0, 0.1)', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_family'), '_bx_decorous_stg_cpt_option_menu_account_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_size'), '_bx_decorous_stg_cpt_option_menu_account_font_size', '1rem', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_color'), '_bx_decorous_stg_cpt_option_menu_account_font_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_color_hover'), '_bx_decorous_stg_cpt_option_menu_account_font_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_color_active'), '_bx_decorous_stg_cpt_option_menu_account_font_color_active', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_shadow'), '_bx_decorous_stg_cpt_option_menu_account_font_shadow', 'none', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_menu_account_font_weight'), '_bx_decorous_stg_cpt_option_menu_account_font_weight', '400', 'digit', '', '', '', 16);


-- SETTINGS: Decorous template Styles Add Menu
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_menu_add'), '_bx_decorous_stg_cpt_category_styles_menu_add', 97);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_menu_add_bg_color'), '_bx_decorous_stg_cpt_option_menu_add_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_menu_add_bg_image'), '_bx_decorous_stg_cpt_option_menu_add_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_menu_add_bg_image_repeat'), '_bx_decorous_stg_cpt_option_menu_add_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_menu_add_bg_image_attachment'), '_bx_decorous_stg_cpt_option_menu_add_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_menu_add_bg_image_size'), '_bx_decorous_stg_cpt_option_menu_add_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_menu_add_content_padding'), '_bx_decorous_stg_cpt_option_menu_add_content_padding', '0.5rem 1.25rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_menu_add_border_color'), '_bx_decorous_stg_cpt_option_menu_add_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_menu_add_border_size'), '_bx_decorous_stg_cpt_option_menu_add_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_menu_add_shadow'), '_bx_decorous_stg_cpt_option_menu_add_shadow', '0px 8px 16px 0px rgba(0, 0, 0, 0.1)', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_family'), '_bx_decorous_stg_cpt_option_menu_add_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_size'), '_bx_decorous_stg_cpt_option_menu_add_font_size', '1rem', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_color'), '_bx_decorous_stg_cpt_option_menu_add_font_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_color_hover'), '_bx_decorous_stg_cpt_option_menu_add_font_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_color_active'), '_bx_decorous_stg_cpt_option_menu_add_font_color_active', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_shadow'), '_bx_decorous_stg_cpt_option_menu_add_font_shadow', 'none', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_menu_add_font_weight'), '_bx_decorous_stg_cpt_option_menu_add_font_weight', '400', 'digit', '', '', '', 16);


-- SETTINGS: Decorous template Styles Page Menu
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_menu_page'), '_bx_decorous_stg_cpt_category_styles_menu_page', 100);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_menu_page_bg_color'), '_bx_decorous_stg_cpt_option_menu_page_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_menu_page_bg_image'), '_bx_decorous_stg_cpt_option_menu_page_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_menu_page_bg_image_repeat'), '_bx_decorous_stg_cpt_option_menu_page_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_menu_page_bg_image_attachment'), '_bx_decorous_stg_cpt_option_menu_page_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_menu_page_bg_image_size'), '_bx_decorous_stg_cpt_option_menu_page_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_menu_page_content_padding'), '_bx_decorous_stg_cpt_option_menu_page_content_padding', '0px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_menu_page_border_color'), '_bx_decorous_stg_cpt_option_menu_page_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_menu_page_border_size'), '_bx_decorous_stg_cpt_option_menu_page_border_size', '1px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_menu_page_shadow'), '_bx_decorous_stg_cpt_option_menu_page_shadow', '', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_family'), '_bx_decorous_stg_cpt_option_menu_page_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_size'), '_bx_decorous_stg_cpt_option_menu_page_font_size', '1rem', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_color'), '_bx_decorous_stg_cpt_option_menu_page_font_color', 'rgba(89, 89, 89, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_color_hover'), '_bx_decorous_stg_cpt_option_menu_page_font_color_hover', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_color_active'), '_bx_decorous_stg_cpt_option_menu_page_font_color_active', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_shadow'), '_bx_decorous_stg_cpt_option_menu_page_font_shadow', 'none', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_menu_page_font_weight'), '_bx_decorous_stg_cpt_option_menu_page_font_weight', '400', 'digit', '', '', '', 16);


-- SETTINGS: Decorous template Styles Slide Menus
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_menu_slide'), '_bx_decorous_stg_cpt_category_styles_menu_slide', 110);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_menu_slide_bg_color'), '_bx_decorous_stg_cpt_option_menu_slide_bg_color', 'rgba(255, 255, 255, 0.9)', 'rgba', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_menu_slide_bg_image'), '_bx_decorous_stg_cpt_option_menu_slide_bg_image', '', 'image', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_menu_slide_bg_image_repeat'), '_bx_decorous_stg_cpt_option_menu_slide_bg_image_repeat', 'no-repeat', 'select', 'no-repeat,repeat,repeat-x,repeat-y', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_menu_slide_bg_image_attachment'), '_bx_decorous_stg_cpt_option_menu_slide_bg_image_attachment', 'scroll', 'select', 'fixed,scroll,local', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_menu_slide_bg_image_size'), '_bx_decorous_stg_cpt_option_menu_slide_bg_image_size', 'cover', 'select', 'auto,cover,contain', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_menu_slide_content_padding'), '_bx_decorous_stg_cpt_option_menu_slide_content_padding', '1.25rem', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_menu_slide_border_color'), '_bx_decorous_stg_cpt_option_menu_slide_border_color', 'rgba(0, 0, 0, 0.1)', 'rgba', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_menu_slide_border_size'), '_bx_decorous_stg_cpt_option_menu_slide_border_size', '1px 0px 1px 0px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_menu_slide_shadow'), '_bx_decorous_stg_cpt_option_menu_slide_shadow', 'none', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_family'), '_bx_decorous_stg_cpt_option_menu_slide_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_size'), '_bx_decorous_stg_cpt_option_menu_slide_font_size', '1.0rem', 'digit', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_color'), '_bx_decorous_stg_cpt_option_menu_slide_font_color', 'rgba(40, 50, 60, 0.8)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_color_hover'), '_bx_decorous_stg_cpt_option_menu_slide_font_color_hover', 'rgba(40, 50, 60, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_color_active'), '_bx_decorous_stg_cpt_option_menu_slide_font_color_active', 'rgba(20, 30, 40, 1)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_shadow'), '_bx_decorous_stg_cpt_option_menu_slide_font_shadow', 'none', 'digit', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_menu_slide_font_weight'), '_bx_decorous_stg_cpt_option_menu_slide_font_weight', '400', 'digit', '', '', '', 16);


-- SETTINGS: Decorous template Styles Forms
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_form'), '_bx_decorous_stg_cpt_category_styles_form', 120);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_form_input_height'), '_bx_decorous_stg_cpt_option_form_input_height', '2rem', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_form_input_bg_color'), '_bx_decorous_stg_cpt_option_form_input_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_form_input_bg_color_active'), '_bx_decorous_stg_cpt_option_form_input_bg_color_active', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_form_input_border_color'), '_bx_decorous_stg_cpt_option_form_input_border_color', 'rgba(217, 217, 217, 1)', 'rgba', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_form_input_border_color_active'), '_bx_decorous_stg_cpt_option_form_input_border_color_active', 'rgba(64, 169, 255, 1)', 'rgba', '', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_form_input_border_size'), '_bx_decorous_stg_cpt_option_form_input_border_size', '1px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_form_input_shadow'), '_bx_decorous_stg_cpt_option_form_input_shadow', '', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_form_input_font_family'), '_bx_decorous_stg_cpt_option_form_input_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_form_input_font_size'), '_bx_decorous_stg_cpt_option_form_input_font_size', '1rem', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_form_input_font_color'), '_bx_decorous_stg_cpt_option_form_input_font_color', 'rgba(0, 0, 0, 0.65)', 'rgba', '', '', '', 10);


-- SETTINGS: Decorous template Styles Large Buttons
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_large_button'), '_bx_decorous_stg_cpt_category_styles_large_button', 130);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_button_lg_height'), '_bx_decorous_stg_cpt_option_button_lg_height', '2rem', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_button_lg_bg_color'), '_bx_decorous_stg_cpt_option_button_lg_bg_color', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_button_lg_bg_color_hover'), '_bx_decorous_stg_cpt_option_button_lg_bg_color_hover', 'rgba(64, 169, 255, 1)', 'rgba', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_button_lg_border_color'), '_bx_decorous_stg_cpt_option_button_lg_border_color', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_button_lg_border_color_hover'), '_bx_decorous_stg_cpt_option_button_lg_border_color_hover', 'rgba(64, 169, 255, 1)', 'rgba', '', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_button_lg_border_size'), '_bx_decorous_stg_cpt_option_button_lg_border_size', '1px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_button_lg_border_radius'), '_bx_decorous_stg_cpt_option_button_lg_border_radius', '4px', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_button_lg_shadow'), '_bx_decorous_stg_cpt_option_button_lg_shadow', '0px 2px 0px 0px rgba(0, 0, 0, 0.016)', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_family'), '_bx_decorous_stg_cpt_option_button_lg_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_size'), '_bx_decorous_stg_cpt_option_button_lg_font_size', '0.75rem', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_color'), '_bx_decorous_stg_cpt_option_button_lg_font_color', 'rgba(255, 255, 255, 0.9)', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_color_hover'), '_bx_decorous_stg_cpt_option_button_lg_font_color_hover', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_shadow'), '_bx_decorous_stg_cpt_option_button_lg_font_shadow', '0px -1px 0px; rgba(0, 0, 0, 0.12)', 'digit', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_button_lg_font_weight'), '_bx_decorous_stg_cpt_option_button_lg_font_weight', '600', 'digit', '', '', '', 14);

-- SETTINGS: Decorous template Styles Small Buttons
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_small_button'), '_bx_decorous_stg_cpt_category_styles_small_button', 140);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_button_sm_height'), '_bx_decorous_stg_cpt_option_button_sm_height', '1.75rem', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_button_sm_bg_color'), '_bx_decorous_stg_cpt_option_button_sm_bg_color', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_button_sm_bg_color_hover'), '_bx_decorous_stg_cpt_option_button_sm_bg_color_hover', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_button_sm_border_color'), '_bx_decorous_stg_cpt_option_button_sm_border_color', 'rgba(217, 217, 217, 1)', 'rgba', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_button_sm_border_color_hover'), '_bx_decorous_stg_cpt_option_button_sm_border_color_hover', 'rgba(64, 169, 255, 1)', 'rgba', '', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_button_sm_border_size'), '_bx_decorous_stg_cpt_option_button_sm_border_size', '1px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_button_sm_border_radius'), '_bx_decorous_stg_cpt_option_button_sm_border_radius', '4px', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_button_sm_shadow'), '_bx_decorous_stg_cpt_option_button_sm_shadow', '0px 2px 0px 0px rgba(0, 0, 0, 0.016)', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_family'), '_bx_decorous_stg_cpt_option_button_sm_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_size'), '_bx_decorous_stg_cpt_option_button_sm_font_size', '0.875rem', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_color'), '_bx_decorous_stg_cpt_option_button_sm_font_color', 'rgba(0, 0, 0, 0.65)', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_color_hover'), '_bx_decorous_stg_cpt_option_button_sm_font_color_hover', 'rgba(64, 169, 255, 1)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_shadow'), '_bx_decorous_stg_cpt_option_button_sm_font_shadow', 'none', 'digit', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_button_sm_font_weight'), '_bx_decorous_stg_cpt_option_button_sm_font_weight', '400', 'digit', '', '', '', 14);

-- SETTINGS: Decorous template Styles Font
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_font'), '_bx_decorous_stg_cpt_category_styles_font', 150);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_font_family'), '_bx_decorous_stg_cpt_option_font_family', '-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif', 'digit', '', '', '', 1),
(@iCategoryId, CONCAT(@sName, '_font_size_default'), '_bx_decorous_stg_cpt_option_font_size_default', '16px', 'digit', '', '', '', 2),
(@iCategoryId, CONCAT(@sName, '_font_color_default'), '_bx_decorous_stg_cpt_option_font_color_default', 'rgba(40, 50, 60, 0.9)', 'rgba', '', '', '', 3),
(@iCategoryId, CONCAT(@sName, '_font_color_grayed'), '_bx_decorous_stg_cpt_option_font_color_grayed', 'rgba(40, 50, 60, 0.5)', 'rgba', '', '', '', 4),
(@iCategoryId, CONCAT(@sName, '_font_color_contrasted'), '_bx_decorous_stg_cpt_option_font_color_contrasted', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 5),
(@iCategoryId, CONCAT(@sName, '_font_size_small'), '_bx_decorous_stg_cpt_option_font_size_small', '12px', 'digit', '', '', '', 6),
(@iCategoryId, CONCAT(@sName, '_font_size_middle'), '_bx_decorous_stg_cpt_option_font_size_middle', '16px', 'digit', '', '', '', 7),
(@iCategoryId, CONCAT(@sName, '_font_size_large'), '_bx_decorous_stg_cpt_option_font_size_large', '20px', 'digit', '', '', '', 8),
(@iCategoryId, CONCAT(@sName, '_font_size_h1'), '_bx_decorous_stg_cpt_option_font_size_h1', '28px', 'digit', '', '', '', 9),
(@iCategoryId, CONCAT(@sName, '_font_weight_h1'), '_bx_decorous_stg_cpt_option_font_weight_h1', '700', 'digit', '', '', '', 10),
(@iCategoryId, CONCAT(@sName, '_font_color_default_h1'), '_bx_decorous_stg_cpt_option_font_color_default_h1', 'rgba(40, 50, 60, 1)', 'rgba', '', '', '', 11),
(@iCategoryId, CONCAT(@sName, '_font_color_grayed_h1'), '_bx_decorous_stg_cpt_option_font_color_grayed_h1', 'rgba(40, 50, 60, 0.5)', 'rgba', '', '', '', 12),
(@iCategoryId, CONCAT(@sName, '_font_color_contrasted_h1'), '_bx_decorous_stg_cpt_option_font_color_contrasted_h1', 'rgba(255, 255, 255, 0.9)', 'rgba', '', '', '', 13),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h1'), '_bx_decorous_stg_cpt_option_font_color_link_h1', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 14),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h1_hover'), '_bx_decorous_stg_cpt_option_font_color_link_h1_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 15),
(@iCategoryId, CONCAT(@sName, '_font_size_h2'), '_bx_decorous_stg_cpt_option_font_size_h2', '24px', 'digit', '', '', '', 16),
(@iCategoryId, CONCAT(@sName, '_font_weight_h2'), '_bx_decorous_stg_cpt_option_font_weight_h2', '700', 'digit', '', '', '', 17),
(@iCategoryId, CONCAT(@sName, '_font_color_default_h2'), '_bx_decorous_stg_cpt_option_font_color_default_h2', 'rgba(40, 60, 80, 0.9)', 'rgba', '', '', '', 18),
(@iCategoryId, CONCAT(@sName, '_font_color_grayed_h2'), '_bx_decorous_stg_cpt_option_font_color_grayed_h2', 'rgba(40, 60, 80, 0.5)', 'rgba', '', '', '', 19),
(@iCategoryId, CONCAT(@sName, '_font_color_contrasted_h2'), '_bx_decorous_stg_cpt_option_font_color_contrasted_h2', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 20),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h2'), '_bx_decorous_stg_cpt_option_font_color_link_h2', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 21),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h2_hover'), '_bx_decorous_stg_cpt_option_font_color_link_h2_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 22),
(@iCategoryId, CONCAT(@sName, '_font_size_h3'), '_bx_decorous_stg_cpt_option_font_size_h3', '20px', 'digit', '', '', '', 23),
(@iCategoryId, CONCAT(@sName, '_font_weight_h3'), '_bx_decorous_stg_cpt_option_font_weight_h3', '500', 'digit', '', '', '', 24),
(@iCategoryId, CONCAT(@sName, '_font_color_default_h3'), '_bx_decorous_stg_cpt_option_font_color_default_h3', 'rgba(40, 60, 80, 0.9)', 'rgba', '', '', '', 25),
(@iCategoryId, CONCAT(@sName, '_font_color_grayed_h3'), '_bx_decorous_stg_cpt_option_font_color_grayed_h3', 'rgba(40, 60, 80, 0.5)', 'rgba', '', '', '', 26),
(@iCategoryId, CONCAT(@sName, '_font_color_contrasted_h3'), '_bx_decorous_stg_cpt_option_font_color_contrasted_h3', 'rgba(255, 255, 255, 1)', 'rgba', '', '', '', 27),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h3'), '_bx_decorous_stg_cpt_option_font_color_link_h3', 'rgba(24, 144, 255, 0.9)', 'rgba', '', '', '', 28),
(@iCategoryId, CONCAT(@sName, '_font_color_link_h3_hover'), '_bx_decorous_stg_cpt_option_font_color_link_h3_hover', 'rgba(24, 144, 255, 1)', 'rgba', '', '', '', 29);

-- SETTINGS: Decorous template Custom Styles
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_styles_custom'), '_bx_decorous_stg_cpt_category_styles_custom', 160);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_styles_custom'), '_bx_decorous_stg_cpt_option_styles_custom', 'div.bx-market-unit-cover div.bx-base-text-unit-no-thumb {\r\n border-width: 0px;\r\n}', 'text', '', '', '', 1);

-- SETTINGS: Decorous template Viewport Tablet
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_viewport_tablet'), '_bx_decorous_stg_cpt_category_viewport_tablet', 170);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_vpt_font_size_scale'), '_bx_decorous_stg_cpt_option_vpt_font_size_scale', '100%', 'digit', '', '', '', 1);

-- SETTINGS: Decorous template Viewport Mobile
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `order`) VALUES 
(@iTypeId, CONCAT(@sName, '_viewport_mobile'), '_bx_decorous_stg_cpt_category_viewport_mobile', 180);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, CONCAT(@sName, '_vpm_font_size_scale'), '_bx_decorous_stg_cpt_option_vpm_font_size_scale', '87.5%', 'digit', '', '', '', 1);


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_decorous', '_bx_decorous', 'bx_decorous@modules/boonex/decorous/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name`='home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id`=@iParentPageId);
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'appearance', CONCAT('{url_studio}design.php?name=', @sName), '', 'bx_decorous@modules/boonex/decorous/|std-icon.svg', '_bx_decorous_wgt_cpt', '', 'a:4:{s:6:"module";s:11:"bx_decorous";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:6:"Module";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder + 1);