-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Designer > Settings > Header: the header's width and the main menu's place for each page layout (Standard and
-- Application), for visitors and for members, used by the site's templates and sent to the apps with each page. The
-- defaults keep the header as it was. The name is a unique key, so running it again adds nothing.
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
