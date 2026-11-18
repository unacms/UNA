-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Artificer's "Stretched Header" checkbox becomes "Header width" and "Main menu alignment": empty follows Designer
-- (Designer > Settings > Header, per page layout), a value sets it for every layout. A stretched header stays full
-- width. Running it again changes nothing: the old option is gone after the first run.
SET @iCategoryId = (SELECT `category_id` FROM `sys_options` WHERE `name` = 'bx_artificer_page_width' LIMIT 1);

INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'bx_artificer_header_width', '_bx_artificer_stg_cpt_option_header_width', IF((SELECT `value` FROM `sys_options` WHERE `name` = 'bx_artificer_header_stretched' LIMIT 1) = 'on', 'full', ''), 'select', 'a:2:{s:6:"module";s:12:"bx_artificer";s:6:"method";s:24:"get_options_header_width";}', '', '', 11 FROM DUAL WHERE @iCategoryId IS NOT NULL;
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT @iCategoryId, 'bx_artificer_header_align', '_bx_artificer_stg_cpt_option_header_align', '', 'select', 'a:2:{s:6:"module";s:12:"bx_artificer";s:6:"method";s:24:"get_options_header_align";}', '', '', 12 FROM DUAL WHERE @iCategoryId IS NOT NULL;

DELETE FROM `sys_options` WHERE `name` = 'bx_artificer_header_stretched';
UPDATE `sys_options` SET `order` = 13 WHERE `name` = 'bx_artificer_header_search' AND `order` = 12;
