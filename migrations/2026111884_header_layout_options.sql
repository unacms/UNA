-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Designer > Settings > Header: the page's width, the header's width and the main menu's place for each page layout
-- (Standard and Application), for visitors and for members, used by the site's templates and sent to the apps with
-- each page. The defaults keep the header as it was, and the page width is Artificer's (whose own setting then
-- follows Designer, modules/boonex/artificer/migrations/2026111886_page_width_designer.sql). The name is a unique key,
-- so running it again adds nothing.
SET @iCategoryId = (SELECT `category_id` FROM `sys_options` WHERE `name` = 'sys_pt_default_member' LIMIT 1);

INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_standard_visitor', '_adm_stg_cpt_option_sys_header_width_standard_visitor', 'page', 'select', 'page,full', '', '', 12 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_standard_visitor', '_adm_stg_cpt_option_sys_header_align_standard_visitor', 'center', 'select', 'start,center,end', '', '', 13 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_standard_member', '_adm_stg_cpt_option_sys_header_width_standard_member', 'page', 'select', 'page,full', '', '', 14 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_standard_member', '_adm_stg_cpt_option_sys_header_align_standard_member', 'center', 'select', 'start,center,end', '', '', 15 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_application_visitor', '_adm_stg_cpt_option_sys_header_width_application_visitor', 'full', 'select', 'page,full', '', '', 16 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_application_visitor', '_adm_stg_cpt_option_sys_header_align_application_visitor', 'start', 'select', 'start,center,end', '', '', 17 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_application_member', '_adm_stg_cpt_option_sys_header_width_application_member', 'full', 'select', 'page,full', '', '', 18 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_application_member', '_adm_stg_cpt_option_sys_header_align_application_member', 'start', 'select', 'start,center,end', '', '', 19 FROM DUAL WHERE @iCategoryId IS NOT NULL;

SET @sPageWidth = (SELECT `value` FROM `sys_options` WHERE `name` = 'bx_artificer_page_width' AND `value` REGEXP '^[0-9]+$' AND `value` BETWEEN 480 AND 3840 LIMIT 1);
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_page_width_standard_visitor', '_adm_stg_cpt_option_sys_page_width_standard_visitor', IFNULL(@sPageWidth, '1280'), 'text', '', '', '', 24 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_page_width_standard_member', '_adm_stg_cpt_option_sys_page_width_standard_member', IFNULL(@sPageWidth, '1280'), 'text', '', '', '', 25 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_page_width_application_visitor', '_adm_stg_cpt_option_sys_page_width_application_visitor', IFNULL(@sPageWidth, '1280'), 'text', '', '', '', 26 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_page_width_application_member', '_adm_stg_cpt_option_sys_page_width_application_member', IFNULL(@sPageWidth, '1280'), 'text', '', '', '', 27 FROM DUAL WHERE @iCategoryId IS NOT NULL;
