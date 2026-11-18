-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Designer > Settings > Header: the header's width and the main menu's place for each page layout (Standard and
-- Application), used by the site's templates and sent to the apps with each page. The defaults keep the header as it
-- was. The name is a unique key, so running it again adds nothing.
SET @iCategoryId = (SELECT `category_id` FROM `sys_options` WHERE `name` = 'sys_pt_default_member' LIMIT 1);

INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_standard', '_adm_stg_cpt_option_sys_header_width_standard', 'page', 'select', 'page,full', '', '', 12 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_standard', '_adm_stg_cpt_option_sys_header_align_standard', 'start', 'select', 'start,center,end', '', '', 13 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_width_application', '_adm_stg_cpt_option_sys_header_width_application', 'full', 'select', 'page,full', '', '', 14 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_header_align_application', '_adm_stg_cpt_option_sys_header_align_application', 'start', 'select', 'start,center,end', '', '', 15 FROM DUAL WHERE @iCategoryId IS NOT NULL;
