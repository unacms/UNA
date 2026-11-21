-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Designer > Settings > Page, header and footer: the footer's width for each page layout (Standard and Application),
-- for visitors and for members, as the header's: as wide as the page's content, its separator included (page), or as
-- the window (full). The site's templates use it and the apps get it with each page. The defaults keep the site's
-- footer as it was. The name is a unique key, so running it again adds nothing.
SET @iCategoryId = (SELECT `category_id` FROM `sys_options` WHERE `name` = 'sys_pt_default_member' LIMIT 1);

INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_footer_width_standard_visitor', '_adm_stg_cpt_option_sys_footer_width_standard_visitor', 'page', 'select', 'page,full', '', '', 29 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_footer_width_standard_member', '_adm_stg_cpt_option_sys_footer_width_standard_member', 'page', 'select', 'page,full', '', '', 30 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_footer_width_application_visitor', '_adm_stg_cpt_option_sys_footer_width_application_visitor', 'full', 'select', 'page,full', '', '', 31 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'sys_footer_width_application_member', '_adm_stg_cpt_option_sys_footer_width_application_member', 'full', 'select', 'page,full', '', '', 32 FROM DUAL WHERE @iCategoryId IS NOT NULL;
