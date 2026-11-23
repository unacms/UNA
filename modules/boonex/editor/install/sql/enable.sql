-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_editor', '_bx_editor_adm_stg_cpt_type', 'bx_editor@modules/boonex/editor/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_editor_general', '_bx_editor_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES

('bx_editor_option_toolbar_mini', "['bold', 'italic', 'underline','strike','subscript','superscript','code','highlight'],['indent','outdent', 'bulletList', 'codeBlock', 'orderedList'],['alignLeft','alignCenter','alignRight','alignJustify'],['h1','h2','h3','h4'],['link','image','embed']", @iCategId, '_bx_editor_option_toolbar_mini', 'digit', '', '', '', 1),

('bx_editor_option_toolbar_standard', "['bold', 'italic', 'underline','strike','subscript','superscript','code','highlight'],['indent','outdent', 'bulletList', 'codeBlock', 'orderedList'],['alignLeft','alignCenter','alignRight','alignJustify'],['h1','h2','h3','h4'],['link','image','embed']", @iCategId, '_bx_editor_option_toolbar_standard', 'digit', '', '', '', 2),
('bx_editor_option_toolbar_full', "['bold', 'italic', 'underline','strike','subscript','superscript','code','highlight'],['indent','outdent', 'bulletList', 'codeBlock', 'orderedList'],['alignLeft','alignCenter','alignRight','alignJustify'],['h1','h2','h3','h4'],['link','image','embed']", @iCategId, '_bx_editor_option_toolbar_full', 'digit', '', '', '', 3);

-- Editor

INSERT INTO `sys_objects_editor` (`object`, `title`, `skin`, `override_class_name`, `override_class_file`) VALUES
('bx_editor', 'editor', '', 'BxEditorEditor', 'modules/boonex/editor/classes/BxEditorEditor.php');

UPDATE `sys_options` SET `value` = 'bx_editor' WHERE `name` = 'sys_editor_default';

-- Injections

INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_editor', 0, 'injection_footer', 'service', 'a:2:{s:6:"module";s:9:"bx_editor";s:6:"method";s:9:"injection";}', 0, 1);

-- GRIDS: administration
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('bx_editor_toolbar', 'Sql', 'SELECT `ta`.* FROM `bx_editor_toolbar_buttons` AS `ta` WHERE 1 ', 'bx_editor_toolbar_buttons', 'id', 'order', 'active', '', 100, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 0, 'BxEditorGridToolbar', 'modules/boonex/editor/classes/BxEditorGridToolbar.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_editor_toolbar', 'order', '', '2%', 0, '0', '', 1),
('bx_editor_toolbar', 'switcher', '', '8%', 0, '0', '', 2),
('bx_editor_toolbar', 'name', '_bx_editor_grid_column_title_name', '70%', 1, '16', '', 3);


-- GRIDS: drawn by AG Grid in Studio
UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` = 'bx_editor_toolbar' AND `engine` = '';
