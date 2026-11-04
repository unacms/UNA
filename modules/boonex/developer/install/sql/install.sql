SET @sName = 'bx_developer';


--
-- Studio page and widget.
--
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_dev_adm_page_cpt', '_bx_dev_adm_page_cpt', 'bx_developer@modules/boonex/developer/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name`='home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id`=@iParentPageId);
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'extensions', CONCAT('{url_studio}module.php?name=', @sName), '', 'bx_developer@modules/boonex/developer/|std-icon.svg', '_bx_dev_adm_wgt_cpt', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(NOT ISNULL(@iParentPageOrder), @iParentPageOrder + 1, 1));


--
-- Forms Builder -> Grid descriptors
--
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms', 'Sql', 'SELECT * FROM `sys_objects_form` WHERE 1 ', 'sys_objects_form', 'id', 'module,title', 'active', '', 100, NULL, 'start', '', 'module', 'title', 'like', 'module', 'title', 2147483647, 'BxDevFormsForms', 'modules/boonex/developer/classes/BxDevFormsForms.php'),
('bx_developer_forms_displays', 'Sql', 'SELECT `td`.`id` AS `id`, `td`.`object` AS `object`, `td`.`display_name` AS `display_name`, `td`.`title` AS `display_title`, `td`.`module` AS `module`, `tf`.`title` AS `form_title` FROM `sys_form_displays` AS `td` LEFT JOIN `sys_objects_form` AS `tf` ON `td`.`object`=`tf`.`object` WHERE 1 ', 'sys_form_displays', 'id', 'module,object,display_title', '', '', 100, NULL, 'start', '', 'td`.`module', 'td`.`title', 'like', 'module', 'display_title,form_title', 2147483647, 'BxDevFormsDisplays', 'modules/boonex/developer/classes/BxDevFormsDisplays.php'),
('bx_developer_forms_fields', 'Sql', 'SELECT `tdi`.`id` AS `id`, `ti`.`caption_system` AS `caption_system`, `ti`.`caption` AS `caption`, `ti`.`type` AS `type`, `ti`.`module` AS `module`, `tdi`.`visible_for_levels` AS `visible_for_levels`, `tdi`.`active` AS `active`, `ti`.`editable` AS `editable`, `ti`.`deletable` AS `deletable`, `tdi`.`order` AS `order` FROM `sys_form_display_inputs` AS `tdi` LEFT JOIN `sys_form_inputs` AS `ti` ON `tdi`.`input_name`=`ti`.`name` AND `ti`.`object`=? WHERE 1 AND `tdi`.`display_name`=?', 'sys_form_display_inputs', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'ti`.`type', 'ti`.`caption_system', 'like', '', '', 2147483647, 'BxDevFormsFields', 'modules/boonex/developer/classes/BxDevFormsFields.php'),

('bx_developer_forms_pre_lists', 'Sql', 'SELECT * FROM `sys_form_pre_lists` WHERE 1 ', 'sys_form_pre_lists', 'id', '', '', '', 100, NULL, 'start', '', 'module,key', 'title', 'auto', 'module', 'title', 2147483647, 'BxDevFormsPreLists', 'modules/boonex/developer/classes/BxDevFormsPreLists.php'),
('bx_developer_forms_pre_values', 'Sql', 'SELECT * FROM `sys_form_pre_values` WHERE 1 ', 'sys_form_pre_values', 'id', 'Order', '', '', 1000, NULL, 'start', '', 'Key,Value', 'LKey,LKey2', 'auto', '', '', 2147483647, 'BxDevFormsPreValues', 'modules/boonex/developer/classes/BxDevFormsPreValues.php'),

('bx_developer_search_forms', 'Sql', 'SELECT * FROM `sys_objects_search_extended` WHERE 1 ', 'sys_objects_search_extended', 'id', 'module,title', 'active', '', 100, NULL, 'start', '', 'module', 'title', 'like', 'module', 'title', 2147483647, 'BxDevFormsSearchForms', 'modules/boonex/developer/classes/BxDevFormsSearchForms.php'),
('bx_developer_search_forms_fields', 'Sql', 'SELECT * FROM `sys_search_extended_fields` WHERE 1 AND `object`=?', 'sys_search_extended_fields', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'type', 'caption', 'like', '', '', 2147483647, 'BxDevFormsSearchFields', 'modules/boonex/developer/classes/BxDevFormsSearchFields.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_developer_forms', 'switcher', '', '10%', 0, '', '', 1),
('bx_developer_forms', 'title', '_bx_dev_frm_txt_forms_gl_title', '40%', 1, '38', '', 2),
('bx_developer_forms', 'module', '_bx_dev_frm_txt_forms_gl_module', '15%', 0, '13', '', 3),
('bx_developer_forms', 'displays', '_bx_dev_frm_txt_forms_gl_displays', '15%', 0, '13', '', 4),
('bx_developer_forms', 'actions', '', '20%', 0, '', '', 5),

('bx_developer_forms_displays', 'display_title', '_bx_dev_frm_txt_displays_gl_title', '30%', 1, '48', '', 1),
('bx_developer_forms_displays', 'module', '_bx_dev_frm_txt_displays_gl_module', '13%', 0, '11', '', 2),
('bx_developer_forms_displays', 'form_title', '_bx_dev_frm_txt_displays_gl_form', '24%', 1, '22', '', 3),
('bx_developer_forms_displays', 'fields', '_bx_dev_frm_txt_displays_gl_fields', '13%', 0, '11', '', 4),
('bx_developer_forms_displays', 'actions', '', '20%', 0, '', '', 5),

('bx_developer_forms_fields', 'order', '', '1%', 0, '', '', 1),
('bx_developer_forms_fields', 'switcher', '', '9%', 0, '', '', 2),
('bx_developer_forms_fields', 'type', '_bx_dev_frm_txt_fields_gl_type', '5%', 0, '', '', 3),
('bx_developer_forms_fields', 'caption_system', '_bx_dev_frm_txt_fields_gl_caption_system', '40%', 1, '38', '', 4),
('bx_developer_forms_fields', 'module', '_bx_dev_frm_txt_fields_gl_module', '15%', 0, '13', '', 5),
('bx_developer_forms_fields', 'visible_for_levels', '_bx_dev_frm_txt_fields_gl_visible', '10%', 0, '10', '', 6),
('bx_developer_forms_fields', 'actions', '', '20%', 0, '', '', 7),

('bx_developer_forms_pre_lists', 'title', '_bx_dev_frm_txt_pre_lists_gl_title', '45%', 1, '50', '', 1),
('bx_developer_forms_pre_lists', 'values', '_bx_dev_frm_txt_pre_lists_gl_values', '12%', 0, '10', '', 2),
('bx_developer_forms_pre_lists', 'module', '_bx_dev_frm_txt_pre_lists_gl_module', '13%', 0, '11', '', 3),
('bx_developer_forms_pre_lists', 'use_for_sets', '_bx_dev_frm_txt_pre_lists_gl_use_for_sets', '10%', 0, '8', '', 4),
('bx_developer_forms_pre_lists', 'actions', '', '20%', 0, '', '', 5),

('bx_developer_forms_pre_values', 'order', '', '1%', 0, '', '', 1),
('bx_developer_forms_pre_values', 'LKey', '_bx_dev_frm_txt_pre_values_gl_lkey', '79%', 1, '75', '', 2),
('bx_developer_forms_pre_values', 'actions', '', '20%', 0, '', '', 3),

('bx_developer_search_forms', 'switcher', '', '10%', 0, '', '', 1),
('bx_developer_search_forms', 'title', '_bx_dev_frm_txt_search_forms_gl_title', '40%', 1, '38', '', 2),
('bx_developer_search_forms', 'module', '_bx_dev_frm_txt_search_forms_gl_module', '15%', 0, '13', '', 3),
('bx_developer_search_forms', 'fields', '_bx_dev_frm_txt_search_forms_gl_fields', '15%', 0, '13', '', 4),
('bx_developer_search_forms', 'actions', '', '20%', 0, '', '', 5),

('bx_developer_search_forms_fields', 'order', '', '1%', 0, '', '', 1),
('bx_developer_search_forms_fields', 'switcher', '', '9%', 0, '', '', 2),
('bx_developer_search_forms_fields', 'type', '_bx_dev_frm_txt_search_forms_fields_gl_type', '10%', 0, '', '', 3),
('bx_developer_search_forms_fields', 'caption', '_bx_dev_frm_txt_search_forms_fields_gl_caption', '40%', 1, '38', '', 4),
('bx_developer_search_forms_fields', 'search_type', '_bx_dev_frm_txt_search_forms_fields_gl_search_type', '10%', 0, '', '', 5),
('bx_developer_search_forms_fields', 'search_operator', '_bx_dev_frm_txt_search_forms_fields_gl_search_operator', '10%', 0, '', '', 6),
('bx_developer_search_forms_fields', 'actions', '', '20%', 0, '', '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_developer_forms', 'independent', 'add', '_bx_dev_frm_btn_forms_gl_create', '', 0, 1),
('bx_developer_forms', 'independent', 'import_full', '_bx_dev_btn_import_full', '', 0, 2),
('bx_developer_forms', 'independent', 'export_full', '_bx_dev_btn_export_full', '', 0, 3),
('bx_developer_forms', 'single', 'export', '', 'download', 0, 1),
('bx_developer_forms', 'single', 'edit', '', 'pencil-alt', 0, 2),

('bx_developer_forms_displays', 'independent', 'add', '_bx_dev_frm_btn_displays_gl_create', '', 0, 1),
('bx_developer_forms_displays', 'single', 'edit', '', 'pencil-alt', 0, 1),

('bx_developer_forms_fields', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_developer_forms_fields', 'single', 'delete', '', 'remove', 1, 2),
('bx_developer_forms_fields', 'single', 'show_to', '_bx_dev_frm_btn_fields_visible', '', 0, 3),
('bx_developer_forms_fields', 'independent', 'add', '_bx_dev_frm_btn_fields_create', '', 0, 1),

('bx_developer_forms_pre_lists', 'independent', 'add', '_bx_dev_frm_btn_pre_lists_create', '', 0, 1),
('bx_developer_forms_pre_lists', 'single', 'export', '', 'download', 0, 1),
('bx_developer_forms_pre_lists', 'single', 'edit', '', 'pencil-alt', 0, 2),
('bx_developer_forms_pre_lists', 'single', 'delete', '', 'remove', 1, 3),

('bx_developer_forms_pre_values', 'independent', 'add', '_bx_dev_frm_btn_pre_values_create', '', 0, 1),
('bx_developer_forms_pre_values', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_developer_forms_pre_values', 'single', 'delete', '', 'remove', 1, 2),

('bx_developer_search_forms', 'independent', 'add', '_bx_dev_frm_btn_search_forms_create', '', 0, 1),
('bx_developer_search_forms', 'single', 'edit', '', 'pencil-alt', 0, 1),

('bx_developer_search_forms_fields', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_developer_search_forms_fields', 'independent', 'reset', '_bx_dev_frm_btn_search_forms_fields_reset', '', 0, 1);


--
-- Forms Builder -> Forms.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_form', @sName, '_bx_dev_frm_txt_forms_form', '', '', 'do_submit', 'sys_objects_form', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_form_add', @sName, 'bx_developer_forms_form', '_bx_dev_frm_txt_forms_display_add', 0),
('bx_developer_forms_form_edit', @sName, 'bx_developer_forms_form', '_bx_dev_frm_txt_forms_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_form', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_forms_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_form', @sName, 'object', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_object', '_bx_dev_frm_txt_forms_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_forms_object', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'module', '', '', 0, 'select', '_bx_dev_frm_txt_sys_forms_module', '_bx_dev_frm_txt_forms_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_forms_module', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'title', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_title', '_bx_dev_frm_txt_forms_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_forms_title', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'action', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_action', '_bx_dev_frm_txt_forms_action', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'form_attrs', '', '', 0, 'textarea', '_bx_dev_frm_txt_sys_forms_form_attrs', '_bx_dev_frm_txt_forms_form_attrs', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'submit_name', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_submit_name', '_bx_dev_frm_txt_forms_submit_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'table', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_table', '_bx_dev_frm_txt_forms_table', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'key', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_key', '_bx_dev_frm_txt_forms_key', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'uri', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_uri', '_bx_dev_frm_txt_forms_uri', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'uri_title', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_uri_title', '_bx_dev_frm_txt_forms_uri_title', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'params', '', '', 0, 'textarea', '_bx_dev_frm_txt_sys_forms_params', '_bx_dev_frm_txt_forms_params', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'deletable', '1', '', 0, 'switcher', '_bx_dev_frm_txt_sys_forms_deletable', '_bx_dev_frm_txt_forms_deletable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_form', @sName, 'override_class_name', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_override_class_name', '_bx_dev_frm_txt_forms_override_class_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'override_class_file', '', '', 0, 'text', '_bx_dev_frm_txt_sys_forms_override_class_file', '_bx_dev_frm_txt_forms_override_class_file', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_form', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_form', @sName, 'do_submit', '_bx_dev_frm_btn_forms_add', '', 0, 'submit', '_bx_dev_frm_btn_sys_forms_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_form', @sName, 'cancel', '_bx_dev_frm_btn_forms_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_forms_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_form_add', 'object', 2147483647, 1, 1),
('bx_developer_forms_form_add', 'module', 2147483647, 1, 2),
('bx_developer_forms_form_add', 'title', 2147483647, 1, 3),
('bx_developer_forms_form_add', 'action', 2147483647, 1, 4),
('bx_developer_forms_form_add', 'form_attrs', 2147483647, 1, 5),
('bx_developer_forms_form_add', 'submit_name', 2147483647, 1, 6),
('bx_developer_forms_form_add', 'table', 2147483647, 1, 7),
('bx_developer_forms_form_add', 'key', 2147483647, 1, 8),
('bx_developer_forms_form_add', 'uri', 2147483647, 1, 9),
('bx_developer_forms_form_add', 'uri_title', 2147483647, 1, 10),
('bx_developer_forms_form_add', 'params', 2147483647, 1, 11),
('bx_developer_forms_form_add', 'deletable', 2147483647, 1, 12),
('bx_developer_forms_form_add', 'override_class_name', 2147483647, 1, 13),
('bx_developer_forms_form_add', 'override_class_file', 2147483647, 1, 14),
('bx_developer_forms_form_add', 'controls', 2147483647, 1, 15),
('bx_developer_forms_form_add', 'do_submit', 2147483647, 1, 16),
('bx_developer_forms_form_add', 'cancel', 2147483647, 1, 17),
('bx_developer_forms_form_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_form_edit', 'object', 2147483647, 1, 2),
('bx_developer_forms_form_edit', 'module', 2147483647, 1, 3),
('bx_developer_forms_form_edit', 'title', 2147483647, 1, 4),
('bx_developer_forms_form_edit', 'action', 2147483647, 1, 5),
('bx_developer_forms_form_edit', 'form_attrs', 2147483647, 1, 6),
('bx_developer_forms_form_edit', 'submit_name', 2147483647, 1, 7),
('bx_developer_forms_form_edit', 'table', 2147483647, 1, 8),
('bx_developer_forms_form_edit', 'key', 2147483647, 1, 9),
('bx_developer_forms_form_edit', 'uri', 2147483647, 1, 10),
('bx_developer_forms_form_edit', 'uri_title', 2147483647, 1, 11),
('bx_developer_forms_form_edit', 'params', 2147483647, 1, 12),
('bx_developer_forms_form_edit', 'deletable', 2147483647, 1, 13),
('bx_developer_forms_form_edit', 'override_class_name', 2147483647, 1, 14),
('bx_developer_forms_form_edit', 'override_class_file', 2147483647, 1, 15),
('bx_developer_forms_form_edit', 'controls', 2147483647, 1, 16),
('bx_developer_forms_form_edit', 'do_submit', 2147483647, 1, 17),
('bx_developer_forms_form_edit', 'cancel', 2147483647, 1, 18);

--
-- Forms Builder -> Displays.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_display', @sName, '_bx_dev_frm_txt_displays_display', '', '', 'do_submit', 'sys_form_displays', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_display_add', @sName, 'bx_developer_forms_display', '_bx_dev_frm_txt_displays_display_add', 0),
('bx_developer_forms_display_edit', @sName, 'bx_developer_forms_display', '_bx_dev_frm_txt_displays_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_display', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_displays_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_display', @sName, 'display_name', '', '', 0, 'text', '_bx_dev_frm_txt_sys_displays_display_name', '_bx_dev_frm_txt_displays_display_name', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_displays_display_name', 'Xss', '', 0, 0),
('bx_developer_forms_display', @sName, 'module', '', '', 0, 'select', '_bx_dev_frm_txt_sys_displays_module', '_bx_dev_frm_txt_displays_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_displays_module', 'Xss', '', 0, 0),
('bx_developer_forms_display', @sName, 'object', '', '', 0, 'select', '_bx_dev_frm_txt_sys_displays_object', '_bx_dev_frm_txt_displays_object', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_displays_object', 'Xss', '', 0, 0),
('bx_developer_forms_display', @sName, 'title', '', '', 0, 'text', '_bx_dev_frm_txt_sys_displays_title', '_bx_dev_frm_txt_displays_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_displays_title', 'Xss', '', 0, 0),
('bx_developer_forms_display', @sName, 'view_mode', '1', '', 0, 'switcher', '_bx_dev_frm_txt_sys_displays_view_mode', '_bx_dev_frm_txt_displays_view_mode', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_display', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_display', @sName, 'do_submit', '_bx_dev_frm_btn_displays_add', '', 0, 'submit', '_bx_dev_frm_btn_sys_displays_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_display', @sName, 'cancel', '_bx_dev_frm_btn_displays_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_displays_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_display_add', 'display_name', 2147483647, 1, 1),
('bx_developer_forms_display_add', 'module', 2147483647, 1, 2),
('bx_developer_forms_display_add', 'object', 2147483647, 1, 3),
('bx_developer_forms_display_add', 'title', 2147483647, 1, 4),
('bx_developer_forms_display_add', 'view_mode', 2147483647, 1, 5),
('bx_developer_forms_display_add', 'controls', 2147483647, 1, 6),
('bx_developer_forms_display_add', 'do_submit', 2147483647, 1, 7),
('bx_developer_forms_display_add', 'cancel', 2147483647, 1, 8),
('bx_developer_forms_display_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_display_edit', 'display_name', 2147483647, 1, 1),
('bx_developer_forms_display_edit', 'module', 2147483647, 1, 2),
('bx_developer_forms_display_edit', 'object', 2147483647, 1, 3),
('bx_developer_forms_display_edit', 'title', 2147483647, 1, 4),
('bx_developer_forms_display_edit', 'view_mode', 2147483647, 1, 5),
('bx_developer_forms_display_edit', 'controls', 2147483647, 1, 6),
('bx_developer_forms_display_edit', 'do_submit', 2147483647, 1, 7),
('bx_developer_forms_display_edit', 'cancel', 2147483647, 1, 8);

--
-- Forms Builder -> Pre Lists.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_prelist', @sName, '_bx_dev_frm_txt_prelists_prelist', '', '', 'do_submit', 'sys_form_pre_lists', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_prelist_add', @sName, 'bx_developer_forms_prelist', '_bx_dev_frm_txt_prelists_display_add', 0),
('bx_developer_forms_prelist_edit', @sName, 'bx_developer_forms_prelist', '_bx_dev_frm_txt_prelists_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_prelist', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_prelists_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'key', '', '', 0, 'text', '_bx_dev_frm_txt_sys_prelists_key', '_bx_dev_frm_txt_prelists_key', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_prelists_key', 'Xss', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'module', '', '', 0, 'select', '_bx_dev_frm_txt_sys_prelists_module', '_bx_dev_frm_txt_prelists_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_prelists_module', 'Xss', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'title', '', '', 0, 'text', '_bx_dev_frm_txt_sys_prelists_title', '_bx_dev_frm_txt_prelists_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_prelists_title', 'Xss', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'use_for_sets', '1', '', 1, 'switcher', '_bx_dev_frm_txt_sys_prelists_use_for_sets', '_bx_dev_frm_txt_prelists_use_for_sets', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'do_submit', '_bx_dev_frm_btn_prelists_add', '', 0, 'submit', '_bx_dev_frm_btn_sys_prelists_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_prelist', @sName, 'cancel', '_bx_dev_frm_btn_prelists_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_prelists_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_prelist_add', 'key', 2147483647, 1, 1),
('bx_developer_forms_prelist_add', 'module', 2147483647, 1, 2),
('bx_developer_forms_prelist_add', 'title', 2147483647, 1, 3),
('bx_developer_forms_prelist_add', 'use_for_sets', 2147483647, 1, 4),
('bx_developer_forms_prelist_add', 'controls', 2147483647, 1, 5),
('bx_developer_forms_prelist_add', 'do_submit', 2147483647, 1, 6),
('bx_developer_forms_prelist_add', 'cancel', 2147483647, 1, 7),
('bx_developer_forms_prelist_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_prelist_edit', 'module', 2147483647, 1, 2),
('bx_developer_forms_prelist_edit', 'title', 2147483647, 1, 3),
('bx_developer_forms_prelist_edit', 'use_for_sets', 2147483647, 1, 4),
('bx_developer_forms_prelist_edit', 'controls', 2147483647, 1, 5),
('bx_developer_forms_prelist_edit', 'do_submit', 2147483647, 1, 6),
('bx_developer_forms_prelist_edit', 'cancel', 2147483647, 1, 7);

--
-- Forms Builder -> Pre Values.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_prevalue', @sName, '_bx_dev_frm_txt_prevalues_prevalue', '', '', 'do_submit', 'sys_form_pre_values', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_prevalue_add', @sName, 'bx_developer_forms_prevalue', '_bx_dev_frm_txt_prevalues_display_add', 0),
('bx_developer_forms_prevalue_edit', @sName, 'bx_developer_forms_prevalue', '_bx_dev_frm_txt_prevalues_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_prevalue', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_prevalues_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'Key', '', '', 0, 'select', '_bx_dev_frm_txt_sys_prevalues_key', '_bx_dev_frm_txt_prevalues_key', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_prevalues_key', 'Xss', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'Value', '', '', 0, 'text', '_bx_dev_frm_txt_sys_prevalues_value', '_bx_dev_frm_txt_prevalues_value', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:1;s:3:"max";i:255;}', '_bx_dev_frm_err_prevalues_value', 'Xss', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'LKey', '', '', 0, 'text', '_bx_dev_frm_txt_sys_prevalues_lkey', '_bx_dev_frm_txt_prevalues_lkey', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:1;s:3:"max";i:100;}', '_bx_dev_frm_err_prevalues_lkey', 'Xss', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'LKey2', '', '', 0, 'text', '_bx_dev_frm_txt_sys_prevalues_lkey2', '_bx_dev_frm_txt_prevalues_lkey2', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'Data', '', '', 0, 'textarea', '_bx_dev_frm_txt_sys_prevalues_data', '_bx_dev_frm_txt_prevalues_data', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'do_submit', '_bx_dev_frm_btn_prevalues_add', '', 0, 'submit', '_bx_dev_frm_btn_sys_prevalues_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_prevalue', @sName, 'cancel', '_bx_dev_frm_btn_prevalues_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_prevalues_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_prevalue_add', 'Key', 2147483647, 1, 1),
('bx_developer_forms_prevalue_add', 'Value', 2147483647, 1, 2),
('bx_developer_forms_prevalue_add', 'LKey', 2147483647, 1, 3),
('bx_developer_forms_prevalue_add', 'LKey2', 2147483647, 1, 4),
('bx_developer_forms_prevalue_add', 'Data', 2147483647, 1, 5),
('bx_developer_forms_prevalue_add', 'controls', 2147483647, 1, 6),
('bx_developer_forms_prevalue_add', 'do_submit', 2147483647, 1, 7),
('bx_developer_forms_prevalue_add', 'cancel', 2147483647, 1, 8),

('bx_developer_forms_prevalue_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_prevalue_edit', 'Key', 2147483647, 1, 2),
('bx_developer_forms_prevalue_edit', 'Value', 2147483647, 1, 3),
('bx_developer_forms_prevalue_edit', 'LKey', 2147483647, 1, 4),
('bx_developer_forms_prevalue_edit', 'LKey2', 2147483647, 1, 5),
('bx_developer_forms_prevalue_edit', 'Data', 2147483647, 1, 6),
('bx_developer_forms_prevalue_edit', 'controls', 2147483647, 1, 7),
('bx_developer_forms_prevalue_edit', 'do_submit', 2147483647, 1, 8),
('bx_developer_forms_prevalue_edit', 'cancel', 2147483647, 1, 9);

--
-- Forms Builder -> Search Forms.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_search_form', @sName, '_bx_dev_frm_txt_search_forms_form', '', '', 'do_submit', 'sys_objects_search_extended', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_search_form_add', @sName, 'bx_developer_forms_search_form', '_bx_dev_frm_txt_search_forms_display_add', 0),
('bx_developer_forms_search_form_edit', @sName, 'bx_developer_forms_search_form', '_bx_dev_frm_txt_search_forms_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_search_form', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_search_forms_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'object', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_forms_object', '_bx_dev_frm_txt_search_forms_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_forms_object', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'object_content_info', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_forms_object_content_info', '_bx_dev_frm_txt_search_forms_object_content_info', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_forms_object_content_info', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'module', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_forms_module', '_bx_dev_frm_txt_search_forms_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_forms_module', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'title', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_forms_title', '_bx_dev_frm_txt_search_forms_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_forms_title', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'class_name', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_forms_class_name', '_bx_dev_frm_txt_search_forms_class_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'class_file', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_forms_class_file', '_bx_dev_frm_txt_search_forms_class_file', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'do_submit', '_bx_dev_frm_btn_search_forms_add', '', 0, 'submit', '_bx_dev_frm_btn_sys_search_forms_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_search_form', @sName, 'cancel', '_bx_dev_frm_btn_search_forms_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_search_forms_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_search_form_add', 'object', 2147483647, 1, 1),
('bx_developer_forms_search_form_add', 'object_content_info', 2147483647, 1, 2),
('bx_developer_forms_search_form_add', 'module', 2147483647, 1, 3),
('bx_developer_forms_search_form_add', 'title', 2147483647, 1, 4),
('bx_developer_forms_search_form_add', 'class_name', 2147483647, 1, 5),
('bx_developer_forms_search_form_add', 'class_file', 2147483647, 1, 6),
('bx_developer_forms_search_form_add', 'controls', 2147483647, 1, 7),
('bx_developer_forms_search_form_add', 'do_submit', 2147483647, 1, 8),
('bx_developer_forms_search_form_add', 'cancel', 2147483647, 1, 9),

('bx_developer_forms_search_form_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_search_form_edit', 'object', 2147483647, 1, 2),
('bx_developer_forms_search_form_edit', 'object_content_info', 2147483647, 1, 3),
('bx_developer_forms_search_form_edit', 'module', 2147483647, 1, 4),
('bx_developer_forms_search_form_edit', 'title', 2147483647, 1, 5),
('bx_developer_forms_search_form_edit', 'class_name', 2147483647, 1, 6),
('bx_developer_forms_search_form_edit', 'class_file', 2147483647, 1, 7),
('bx_developer_forms_search_form_edit', 'controls', 2147483647, 1, 8),
('bx_developer_forms_search_form_edit', 'do_submit', 2147483647, 1, 9),
('bx_developer_forms_search_form_edit', 'cancel', 2147483647, 1, 10);

--
-- Forms Builder -> Search Fields.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_forms_search_fields', @sName, '_bx_dev_frm_txt_search_fields_form', '', '', 'do_submit', 'sys_search_extended_fields', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_forms_search_fields_edit', @sName, 'bx_developer_forms_search_fields', '_bx_dev_frm_txt_search_fields_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_forms_search_fields', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_frm_txt_sys_search_fields_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'object', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_fields_object', '_bx_dev_frm_txt_search_fields_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_forms_object', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'name', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_fields_name', '_bx_dev_frm_txt_search_fields_name', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_search_fields_name', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'type', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_fields_type', '_bx_dev_frm_txt_search_fields_type', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_search_fields_type', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'caption', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_fields_caption', '_bx_dev_frm_txt_search_fields_caption', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_frm_err_search_fields_caption', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'values', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_fields_values', '_bx_dev_frm_txt_search_fields_values', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'search_type', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_fields_search_type', '_bx_dev_frm_txt_search_fields_search_type', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_search_fields_search_type', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'search_value', '', '', 0, 'text', '_bx_dev_frm_txt_sys_search_fields_search_value', '_bx_dev_frm_txt_search_fields_search_value', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'search_operator', '', '', 0, 'select', '_bx_dev_frm_txt_sys_search_fields_search_operator', '_bx_dev_frm_txt_search_fields_search_operator', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_frm_err_search_fields_search_operator', 'Xss', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'do_submit', '_bx_dev_frm_btn_search_fields_save', '', 0, 'submit', '_bx_dev_frm_btn_sys_search_fields_save', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_forms_search_fields', @sName, 'cancel', '_bx_dev_frm_btn_search_fields_cancel', '', 0, 'button', '_bx_dev_frm_btn_sys_search_fields_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_forms_search_fields_edit', 'id', 2147483647, 1, 1),
('bx_developer_forms_search_fields_edit', 'object', 2147483647, 1, 2),
('bx_developer_forms_search_fields_edit', 'name', 2147483647, 1, 3),
('bx_developer_forms_search_fields_edit', 'type', 2147483647, 1, 4),
('bx_developer_forms_search_fields_edit', 'caption', 2147483647, 1, 5),
('bx_developer_forms_search_fields_edit', 'values', 2147483647, 1, 6),
('bx_developer_forms_search_fields_edit', 'search_type', 2147483647, 1, 7),
('bx_developer_forms_search_fields_edit', 'search_value', 2147483647, 1, 8),
('bx_developer_forms_search_fields_edit', 'search_operator', 2147483647, 1, 9),
('bx_developer_forms_search_fields_edit', 'controls', 2147483647, 1, 10),
('bx_developer_forms_search_fields_edit', 'do_submit', 2147483647, 1, 11),
('bx_developer_forms_search_fields_edit', 'cancel', 2147483647, 1, 12);

--
-- Navigation Builder -> Grid descriptors
--
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_nav_menus', 'Sql', 'SELECT `tm`.*, `tms`.`title` AS `set_title`, `tmt`.`title` AS `template_title` FROM `sys_objects_menu` AS `tm` LEFT JOIN `sys_menu_sets` AS `tms` ON `tm`.`set_name`=`tms`.`set_name` LEFT JOIN `sys_menu_templates` AS `tmt` ON `tm`.`template_id`=`tmt`.`id` WHERE 1 ', 'sys_objects_menu', 'id', '', 'active', '', 100, NULL, 'start', '', '', 'tm`.`title,tms`.`title,tmt`.`title', 'auto', '', '', 2147483647, 'BxDevNavigationMenus', 'modules/boonex/developer/classes/BxDevNavigationMenus.php'),
('bx_developer_nav_sets', 'Sql', 'SELECT * FROM `sys_menu_sets` WHERE 1 ', 'sys_menu_sets', 'set_name', '', '', '', 100, NULL, 'start', '', '', 'title', 'auto', '', '', 2147483647, 'BxDevNavigationSets', 'modules/boonex/developer/classes/BxDevNavigationSets.php'),
('bx_developer_nav_items', 'Sql', 'SELECT * FROM `sys_menu_items` WHERE 1 ', 'sys_menu_items', 'id', 'order', 'active', '', 100, NULL, 'start_it', '', 'link', 'title_system', 'like', '', '', 2147483647, 'BxDevNavigationItems', 'modules/boonex/developer/classes/BxDevNavigationItems.php');


INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_developer_nav_menus', 'switcher', '', '10%', 0, '', '', 1),
('bx_developer_nav_menus', 'title', '_bx_dev_nav_txt_menus_gl_title', '17%', 0, '15', '', 2),
('bx_developer_nav_menus', 'set_title', '_bx_dev_nav_txt_menus_gl_set_title', '17%', 1, '15', '', 3),
('bx_developer_nav_menus', 'items', '_bx_dev_nav_txt_menus_gl_items', '10%', 0, '8', '', 4),
('bx_developer_nav_menus', 'template_title', '_bx_dev_nav_txt_menus_gl_template_title', '17%', 1, '15', '', 5),
('bx_developer_nav_menus', 'module', '_bx_dev_nav_txt_menus_gl_module', '12%', 0, '10', '', 6),
('bx_developer_nav_menus', 'actions', '', '17%', 0, '', '', 7),
('bx_developer_nav_sets', 'title', '_bx_dev_nav_txt_sets_gl_title', '50%', 1, '48', '', 1),
('bx_developer_nav_sets', 'module', '_bx_dev_nav_txt_sets_gl_module', '15%', 0, '13', '', 2),
('bx_developer_nav_sets', 'items', '_bx_dev_nav_txt_sets_gl_items', '15%', 0, '13', '', 3),
('bx_developer_nav_sets', 'actions', '', '20%', 0, '', '', 4),
('bx_developer_nav_items', 'order', '', '1%', 0, '', '', 1),
('bx_developer_nav_items', 'switcher', '', '9%', 0, '', '', 2),
('bx_developer_nav_items', 'icon', '_bx_dev_nav_txt_items_gl_icon', '5%', 0, '', '', 3),
('bx_developer_nav_items', 'title_system', '_bx_dev_nav_txt_items_gl_title_system', '23%', 1, '23', '', 4),
('bx_developer_nav_items', 'link', '_bx_dev_nav_txt_items_gl_link', '23%', 0, '23', '', 5),
('bx_developer_nav_items', 'module', '_bx_dev_nav_txt_items_gl_module', '12%', 0, '12', '', 6),
('bx_developer_nav_items', 'visible_for_levels', '_bx_dev_nav_txt_items_gl_visible', '10%', 0, '10', '', 7),
('bx_developer_nav_items', 'actions', '', '17%', 0, '', '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_developer_nav_menus', 'independent', 'add', '_bx_dev_nav_btn_menus_gl_create', '', 0, 1),
('bx_developer_nav_menus', 'independent', 'import_full', '_bx_dev_btn_import_full', '', 0, 2),
('bx_developer_nav_menus', 'independent', 'export_full', '_bx_dev_btn_export_full', '', 0, 3),
('bx_developer_nav_menus', 'single', 'export', '', 'download', 0, 1),
('bx_developer_nav_menus', 'single', 'edit', '', 'pencil-alt', 0, 2),
('bx_developer_nav_menus', 'single', 'delete', '', 'remove', 1, 3),

('bx_developer_nav_sets', 'independent', 'add', '_bx_dev_nav_btn_sets_gl_create', '', 0, 1),
('bx_developer_nav_sets', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_developer_nav_sets', 'single', 'delete', '', 'remove', 1, 2),

('bx_developer_nav_items', 'independent', 'import', '_bx_dev_nav_btn_items_gl_import', '', 0, 1),
('bx_developer_nav_items', 'independent', 'add', '_bx_dev_nav_btn_items_gl_create', '', 0, 2),
('bx_developer_nav_items', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_developer_nav_items', 'single', 'delete', '', 'remove', 1, 2),
('bx_developer_nav_items', 'single', 'show_to', '_bx_dev_nav_btn_items_gl_visible', '', 0, 3);

--
-- Navigation Builder -> Menus.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_nav_menu', @sName, '_bx_dev_nav_txt_menus_menu', '', '', 'do_submit', 'sys_objects_menu', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_nav_menu_add', @sName, 'bx_developer_nav_menu', '_bx_dev_nav_txt_menus_display_add', 0),
('bx_developer_nav_menu_edit', @sName, 'bx_developer_nav_menu', '_bx_dev_nav_txt_menus_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_nav_menu', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_nav_txt_sys_menus_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_menu', @sName, 'object', '', '', 0, 'text', '_bx_dev_nav_txt_sys_menus_object', '_bx_dev_nav_txt_menus_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_nav_err_menus_object', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'module', '', '', 0, 'select', '_bx_dev_nav_txt_sys_menus_module', '_bx_dev_nav_txt_menus_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_menus_module', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'title', '', '', 0, 'text', '_bx_dev_nav_txt_sys_menus_title', '_bx_dev_nav_txt_menus_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_nav_err_menus_title', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'title_public', '', '', 0, 'text', '_bx_dev_nav_txt_sys_menus_title_public', '_bx_dev_nav_txt_menus_title_public', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'set_name', '', '', 0, 'select', '_bx_dev_nav_txt_sys_menus_set_name', '_bx_dev_nav_txt_menus_set_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'template_id', '', '', 0, 'select', '_bx_dev_nav_txt_sys_menus_template_id', '_bx_dev_nav_txt_menus_template_id', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_menus_template_id', 'Int', '', 0, 0),
('bx_developer_nav_menu', @sName, 'config_api', '', '', 0, 'textarea', '_bx_dev_nav_txt_sys_menus_config_api', '_bx_dev_nav_txt_menus_config_api', '', 0, 0, 0, '', '', '', '', '', '', 'XssHtml', '', 0, 0),
('bx_developer_nav_menu', @sName, 'deletable', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_menus_deletable', '_bx_dev_nav_txt_menus_deletable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_menu', @sName, 'override_class_name', '', '', 0, 'text', '_bx_dev_nav_txt_sys_menus_override_class_name', '_bx_dev_nav_txt_menus_override_class_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'override_class_file', '', '', 0, 'text', '_bx_dev_nav_txt_sys_menus_override_class_file', '_bx_dev_nav_txt_menus_override_class_file', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_menu', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_menu', @sName, 'do_submit', '_bx_dev_nav_btn_menus_add', '', 0, 'submit', '_bx_dev_nav_btn_sys_menus_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_menu', @sName, 'cancel', '_bx_dev_nav_btn_menus_cancel', '', 0, 'button', '_bx_dev_nav_btn_sys_menus_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_nav_menu_add', 'object', 2147483647, 1, 1),
('bx_developer_nav_menu_add', 'module', 2147483647, 1, 2),
('bx_developer_nav_menu_add', 'title', 2147483647, 1, 3),
('bx_developer_nav_menu_add', 'title_public', 2147483647, 1, 4),
('bx_developer_nav_menu_add', 'set_name', 2147483647, 1, 5),
('bx_developer_nav_menu_add', 'template_id', 2147483647, 1, 6),
('bx_developer_nav_menu_add', 'config_api', 2147483647, 1, 7),
('bx_developer_nav_menu_add', 'deletable', 2147483647, 1, 8),
('bx_developer_nav_menu_add', 'override_class_name', 2147483647, 1, 9),
('bx_developer_nav_menu_add', 'override_class_file', 2147483647, 1, 10),
('bx_developer_nav_menu_add', 'controls', 2147483647, 1, 11),
('bx_developer_nav_menu_add', 'do_submit', 2147483647, 1, 12),
('bx_developer_nav_menu_add', 'cancel', 2147483647, 1, 13),

('bx_developer_nav_menu_edit', 'id', 2147483647, 1, 1),
('bx_developer_nav_menu_edit', 'object', 2147483647, 1, 2),
('bx_developer_nav_menu_edit', 'module', 2147483647, 1, 3),
('bx_developer_nav_menu_edit', 'title', 2147483647, 1, 4),
('bx_developer_nav_menu_edit', 'title_public', 2147483647, 1, 5),
('bx_developer_nav_menu_edit', 'set_name', 2147483647, 1, 6),
('bx_developer_nav_menu_edit', 'template_id', 2147483647, 1, 7),
('bx_developer_nav_menu_edit', 'config_api', 2147483647, 1, 8),
('bx_developer_nav_menu_edit', 'deletable', 2147483647, 1, 9),
('bx_developer_nav_menu_edit', 'override_class_name', 2147483647, 1, 10),
('bx_developer_nav_menu_edit', 'override_class_file', 2147483647, 1, 11),
('bx_developer_nav_menu_edit', 'controls', 2147483647, 1, 12),
('bx_developer_nav_menu_edit', 'do_submit', 2147483647, 1, 13),
('bx_developer_nav_menu_edit', 'cancel', 2147483647, 1, 14);

--
-- Navigation Builder -> Sets.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_nav_set', @sName, '_bx_dev_nav_txt_sets_set', '', '', 'do_submit', 'sys_menu_sets', 'set_name', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_nav_set_add', @sName, 'bx_developer_nav_set', '_bx_dev_nav_txt_sets_display_add', 0),
('bx_developer_nav_set_edit', @sName, 'bx_developer_nav_set', '_bx_dev_nav_txt_sets_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_nav_set', @sName, 'module', '', '', 0, 'select', '_bx_dev_nav_txt_sys_sets_module', '_bx_dev_nav_txt_sets_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_sets_module', 'Xss', '', 0, 0),
('bx_developer_nav_set', @sName, 'set_name', '', '', 0, 'text', '_bx_dev_nav_txt_sys_sets_set_name', '_bx_dev_nav_txt_sets_set_name', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_nav_err_sets_set_name', 'Xss', '', 0, 0),
('bx_developer_nav_set', @sName, 'title', '', '', 0, 'text', '_bx_dev_nav_txt_sys_sets_title', '_bx_dev_nav_txt_sets_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_nav_err_sets_title', 'Xss', '', 0, 0),
('bx_developer_nav_set', @sName, 'deletable', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_sets_deletable', '_bx_dev_nav_txt_sets_deletable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_set', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_set', @sName, 'do_submit', '_bx_dev_nav_btn_sets_add', '', 0, 'submit', '_bx_dev_nav_btn_sys_sets_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_set', @sName, 'cancel', '_bx_dev_nav_btn_sets_cancel', '', 0, 'button', '_bx_dev_nav_btn_sys_sets_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_nav_set_add', 'module', 2147483647, 1, 1),
('bx_developer_nav_set_add', 'set_name', 2147483647, 1, 2),
('bx_developer_nav_set_add', 'title', 2147483647, 1, 3),
('bx_developer_nav_set_add', 'deletable', 2147483647, 1, 4),
('bx_developer_nav_set_add', 'controls', 2147483647, 1, 5),
('bx_developer_nav_set_add', 'do_submit', 2147483647, 1, 6),
('bx_developer_nav_set_add', 'cancel', 2147483647, 1, 7),
('bx_developer_nav_set_edit', 'module', 2147483647, 1, 1),
('bx_developer_nav_set_edit', 'set_name', 2147483647, 1, 2),
('bx_developer_nav_set_edit', 'title', 2147483647, 1, 3),
('bx_developer_nav_set_edit', 'deletable', 2147483647, 1, 4),
('bx_developer_nav_set_edit', 'controls', 2147483647, 1, 5),
('bx_developer_nav_set_edit', 'do_submit', 2147483647, 1, 6),
('bx_developer_nav_set_edit', 'cancel', 2147483647, 1, 7);

--
-- Navigation Builder -> Items.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_nav_item', @sName, '_bx_dev_nav_txt_items_item', '', '', 'do_submit', 'sys_menu_items', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_nav_item_add', @sName, 'bx_developer_nav_item', '_bx_dev_nav_txt_items_display_add', 0),
('bx_developer_nav_item_edit', @sName, 'bx_developer_nav_item', '_bx_dev_nav_txt_items_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_nav_item', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_nav_txt_sys_items_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'module', '', '', 0, 'select', '_bx_dev_nav_txt_sys_items_module', '_bx_dev_nav_txt_items_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_items_module', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'set_name', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_set_name', '_bx_dev_nav_txt_items_set_name', '', 0, 0, 0, 'a:1:{s:8:"readonly";s:8:"readonly";}', '', '', 'Avail', '', '_bx_dev_nav_err_items_set_name', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'name', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_name', '_bx_dev_nav_txt_items_name', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_items_name', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'title_system', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_title_system', '_bx_dev_nav_txt_items_title_system', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'title', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_title', '_bx_dev_nav_txt_items_title', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_nav_err_items_title', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'link', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_link', '_bx_dev_nav_txt_items_link', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'onclick', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_onclick', '_bx_dev_nav_txt_items_onclick', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'target', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_target', '_bx_dev_nav_txt_items_target', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'icon', '', '', 0, 'textarea', '_bx_dev_nav_txt_sys_items_icon', '_bx_dev_nav_txt_items_icon', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'addon', '', '', 0, 'textarea', '_bx_dev_nav_txt_sys_items_addon', '_bx_dev_nav_txt_items_addon', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'submenu_object', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_submenu_object', '_bx_dev_nav_txt_items_submenu_object', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'submenu_popup', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_items_submenu_popup', '_bx_dev_nav_txt_items_submenu_popup', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'visibility_custom', '', '', 0, 'textarea', '_bx_dev_nav_txt_sys_items_visibility_custom', '_bx_dev_nav_txt_items_visibility_custom', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'hidden_on', '', '', 0, 'select_multiple', '_bx_dev_nav_txt_sys_items_hidden_on', '_bx_dev_nav_txt_items_hidden_on', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 0, 0),
('bx_developer_nav_item', @sName, 'hidden_on_pt', '', '', 0, 'select_multiple', '_bx_dev_nav_txt_sys_items_hidden_on_pt', '_bx_dev_nav_txt_items_hidden_on_pt', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 0, 0),
('bx_developer_nav_item', @sName, 'hidden_on_col', '', '', 0, 'select_multiple', '_bx_dev_nav_txt_sys_items_hidden_on_col', '_bx_dev_nav_txt_items_hidden_on_col', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 0, 0),
('bx_developer_nav_item', @sName, 'hidden_on_cxt', '', '', 0, 'text', '_bx_dev_nav_txt_sys_items_hidden_on_cxt', '_bx_dev_nav_txt_items_hidden_on_cxt', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_nav_item', @sName, 'config_api', '', '', 0, 'textarea', '_bx_dev_nav_txt_sys_items_config_api', '_bx_dev_nav_txt_items_config_api', '', 0, 0, 0, '', '', '', '', '', '', 'XssHtml', '', 0, 0),
('bx_developer_nav_item', @sName, 'primary', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_items_primary', '_bx_dev_nav_txt_items_primary', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'collapsed', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_items_collapsed', '_bx_dev_nav_txt_items_collapsed', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'copyable', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_items_copyable', '_bx_dev_nav_txt_items_copyable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'active_api', '1', '', 0, 'switcher', '_bx_dev_nav_txt_sys_items_active_api', '_bx_dev_nav_txt_items_active_api', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_nav_item', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_item', @sName, 'do_submit', '_bx_dev_nav_btn_items_add', '', 0, 'submit', '_bx_dev_nav_btn_sys_items_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_nav_item', @sName, 'cancel', '_bx_dev_nav_btn_items_cancel', '', 0, 'button', '_bx_dev_nav_btn_sys_items_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_nav_item_add', 'module', 2147483647, 1, 1),
('bx_developer_nav_item_add', 'set_name', 2147483647, 1, 2),
('bx_developer_nav_item_add', 'name', 2147483647, 1, 3),
('bx_developer_nav_item_add', 'title_system', 2147483647, 1, 4),
('bx_developer_nav_item_add', 'title', 2147483647, 1, 5),
('bx_developer_nav_item_add', 'link', 2147483647, 1, 6),
('bx_developer_nav_item_add', 'onclick', 2147483647, 1, 7),
('bx_developer_nav_item_add', 'target', 2147483647, 1, 8),
('bx_developer_nav_item_add', 'icon', 2147483647, 1, 9),
('bx_developer_nav_item_add', 'addon', 2147483647, 1, 10),
('bx_developer_nav_item_add', 'submenu_object', 2147483647, 1, 11),
('bx_developer_nav_item_add', 'submenu_popup', 2147483647, 1, 12),
('bx_developer_nav_item_add', 'visibility_custom', 2147483647, 1, 13),
('bx_developer_nav_item_add', 'hidden_on', 2147483647, 1, 14),
('bx_developer_nav_item_add', 'hidden_on_pt', 2147483647, 1, 15),
('bx_developer_nav_item_add', 'hidden_on_col', 2147483647, 1, 16),
('bx_developer_nav_item_add', 'hidden_on_cxt', 2147483647, 1, 17),
('bx_developer_nav_item_add', 'config_api', 2147483647, 1, 18),
('bx_developer_nav_item_add', 'primary', 2147483647, 1, 19),
('bx_developer_nav_item_add', 'collapsed', 2147483647, 1, 20),
('bx_developer_nav_item_add', 'copyable', 2147483647, 1, 21),
('bx_developer_nav_item_add', 'active_api', 2147483647, 1, 22),
('bx_developer_nav_item_add', 'controls', 2147483647, 1, 23),
('bx_developer_nav_item_add', 'do_submit', 2147483647, 1, 24),
('bx_developer_nav_item_add', 'cancel', 2147483647, 1, 25),

('bx_developer_nav_item_edit', 'id', 2147483647, 1, 1),
('bx_developer_nav_item_edit', 'module', 2147483647, 1, 2),
('bx_developer_nav_item_edit', 'set_name', 2147483647, 1, 3),
('bx_developer_nav_item_edit', 'name', 2147483647, 1, 4),
('bx_developer_nav_item_edit', 'title_system', 2147483647, 1, 5),
('bx_developer_nav_item_edit', 'title', 2147483647, 1, 6),
('bx_developer_nav_item_edit', 'link', 2147483647, 1, 7),
('bx_developer_nav_item_edit', 'onclick', 2147483647, 1, 8),
('bx_developer_nav_item_edit', 'target', 2147483647, 1, 9),
('bx_developer_nav_item_edit', 'icon', 2147483647, 1, 10),
('bx_developer_nav_item_edit', 'addon', 2147483647, 1, 11),
('bx_developer_nav_item_edit', 'submenu_object', 2147483647, 1, 12),
('bx_developer_nav_item_edit', 'submenu_popup', 2147483647, 1, 13),
('bx_developer_nav_item_edit', 'visibility_custom', 2147483647, 1, 14),
('bx_developer_nav_item_edit', 'hidden_on', 2147483647, 1, 15),
('bx_developer_nav_item_edit', 'hidden_on_pt', 2147483647, 1, 16),
('bx_developer_nav_item_edit', 'hidden_on_col', 2147483647, 1, 17),
('bx_developer_nav_item_edit', 'hidden_on_cxt', 2147483647, 1, 18),
('bx_developer_nav_item_edit', 'config_api', 2147483647, 1, 19),
('bx_developer_nav_item_edit', 'primary', 2147483647, 1, 20),
('bx_developer_nav_item_edit', 'collapsed', 2147483647, 1, 21),
('bx_developer_nav_item_edit', 'copyable', 2147483647, 1, 22),
('bx_developer_nav_item_edit', 'active_api', 2147483647, 1, 23),
('bx_developer_nav_item_edit', 'controls', 2147483647, 1, 24),
('bx_developer_nav_item_edit', 'do_submit', 2147483647, 1, 25),
('bx_developer_nav_item_edit', 'cancel', 2147483647, 1, 26);

--
-- Page Builder -> Page.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_bp_page', @sName, '_bx_dev_bp_txt_page_form', '', '', 'do_submit', 'sys_objects_page', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_bp_page_add', @sName, 'bx_developer_bp_page', '_bx_dev_bp_txt_page_display_add', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_bp_page', @sName, 'object', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_object', '_bx_dev_bp_txt_page_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_bp_err_page_object', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'module', '', '', 0, 'select', '_bx_dev_bp_txt_sys_page_module', '_bx_dev_bp_txt_page_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_bp_err_page_module', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'title_system', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_title_system', '_bx_dev_bp_txt_page_title_system', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'title', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_title', '_bx_dev_bp_txt_page_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_bp_err_page_title', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'uri', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_uri', '_bx_dev_bp_txt_page_uri', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'url', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_url', '_bx_dev_bp_txt_page_url', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'layout_id', '', '', 0, 'select', '_bx_dev_bp_txt_sys_page_layout_id', '_bx_dev_bp_txt_page_layout_id', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_bp_err_page_layout_id', 'Int', '', 0, 0),
('bx_developer_bp_page', @sName, 'config_api', '', '', 0, 'textarea', '_bx_dev_bp_txt_sys_page_config_api', '_bx_dev_bp_txt_page_config_api', '', 0, 0, 0, '', '', '', '', '', '', 'XssHtml', '', 0, 0),
('bx_developer_bp_page', @sName, 'deletable', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_page_deletable', '_bx_dev_bp_txt_page_deletable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_page', @sName, 'override_class_name', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_override_class_name', '_bx_dev_bp_txt_page_override_class_name', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'override_class_file', '', '', 0, 'text', '_bx_dev_bp_txt_sys_page_override_class_file', '_bx_dev_bp_txt_page_override_class_file', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_page', @sName, 'controls', '', 'do_submit,cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_bp_page', @sName, 'do_submit', '_bx_dev_bp_btn_page_add', '', 0, 'submit', '_bx_dev_bp_btn_sys_page_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_bp_page', @sName, 'cancel', '_bx_dev_bp_btn_page_cancel', '', 0, 'button', '_bx_dev_bp_btn_sys_page_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_bp_page_add', 'object', 2147483647, 1, 1),
('bx_developer_bp_page_add', 'module', 2147483647, 1, 2),
('bx_developer_bp_page_add', 'title_system', 2147483647, 1, 3),
('bx_developer_bp_page_add', 'title', 2147483647, 1, 4),
('bx_developer_bp_page_add', 'uri', 2147483647, 1, 5),
('bx_developer_bp_page_add', 'url', 2147483647, 1, 6),
('bx_developer_bp_page_add', 'layout_id', 2147483647, 1, 7),
('bx_developer_bp_page_add', 'config_api', 2147483647, 1, 8),
('bx_developer_bp_page_add', 'deletable', 2147483647, 1, 9),
('bx_developer_bp_page_add', 'override_class_name', 2147483647, 1, 10),
('bx_developer_bp_page_add', 'override_class_file', 2147483647, 1, 11),
('bx_developer_bp_page_add', 'controls', 2147483647, 1, 12),
('bx_developer_bp_page_add', 'do_submit', 2147483647, 1, 13),
('bx_developer_bp_page_add', 'cancel', 2147483647, 1, 14);

--
-- Page Builder -> Block.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_bp_block', @sName, '_bx_dev_bp_txt_block_form', '', '', 'do_submit', 'sys_pages_blocks', 'id', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_bp_block_edit', @sName, 'bx_developer_bp_block', '_bx_dev_bp_txt_block_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_bp_block', @sName, 'id', '0', '', 0, 'hidden', '_bx_dev_bp_txt_sys_block_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'object', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_object', '_bx_dev_bp_txt_block_object', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:1;s:3:"max";i:64;}', '_bx_dev_bp_err_block_object', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'module', '', '', 0, 'select', '_bx_dev_bp_txt_sys_block_module', '_bx_dev_bp_txt_block_module', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_bp_err_block_module', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'title_system', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_title_system', '_bx_dev_bp_txt_block_title_system', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'title', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_title', '_bx_dev_bp_txt_block_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:6;s:3:"max";i:100;}', '_bx_dev_bp_err_block_title', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'description', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_description', '_bx_dev_bp_txt_block_description', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'icon', '', '', 0, 'textarea', '_bx_dev_bp_txt_sys_block_icon', '_bx_dev_bp_txt_block_icon', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'designbox_id', '', '', 0, 'select', '_bx_dev_bp_txt_sys_block_designbox_id', '_bx_dev_bp_txt_block_designbox_id', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_bp_err_block_designbox_id', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'content_empty', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_content_empty', '_bx_dev_bp_txt_block_content_empty', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'help', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_help', '_bx_dev_bp_txt_block_help', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'class', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_class', '_bx_dev_bp_txt_block_class', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'cache_lifetime', '', '', 0, 'text', '_bx_dev_bp_txt_sys_block_cache_lifetime', '_bx_dev_bp_txt_block_cache_lifetime', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'config_api', '', '', 0, 'textarea', '_bx_dev_bp_txt_sys_block_config_api', '_bx_dev_bp_txt_block_config_api', '', 0, 0, 0, '', '', '', '', '', '', 'XssHtml', '', 0, 0),

('bx_developer_bp_block', @sName, 'async', '', '', 0, 'select', '_bx_dev_bp_txt_sys_block_async', '_bx_dev_bp_txt_block_async', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'submenu', '', '', 0, 'select', '_bx_dev_bp_txt_sys_block_submenu', '_bx_dev_bp_txt_block_submenu', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'tabs', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_block_tabs', '_bx_dev_bp_txt_block_tabs', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'hidden_on', '', '', 0, 'select_multiple', '_bx_dev_bp_txt_sys_block_hidden_on', '_bx_dev_bp_txt_block_hidden_on', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 0, 0),

('bx_developer_bp_block', @sName, 'visible_for', '', '', 0, 'select', '_bx_dev_bp_txt_sys_block_visible_for', '_bx_dev_bp_txt_block_visible_for', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_developer_bp_block', @sName, 'visible_for_levels', '', '', 0, 'checkbox_set', '_bx_dev_bp_txt_sys_block_visible_for_levels', '_bx_dev_bp_txt_block_visible_for_levels', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'deletable', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_block_deletable', '_bx_dev_bp_txt_block_deletable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'copyable', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_block_copyable', '_bx_dev_bp_txt_block_copyable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'active', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_block_active', '_bx_dev_bp_txt_block_active', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'active_api', '1', '', 0, 'switcher', '_bx_dev_bp_txt_sys_block_active_api', '_bx_dev_bp_txt_block_active_api', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_bp_block', @sName, 'controls', '', 'do_submit,cancel,delete', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_bp_block', @sName, 'do_submit', '_bx_dev_bp_btn_block_add', '', 0, 'submit', '_bx_dev_bp_btn_sys_block_add', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_bp_block', @sName, 'cancel', '_bx_dev_bp_btn_block_cancel', '', 0, 'button', '_bx_dev_bp_btn_sys_block_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_developer_bp_block', @sName, 'delete', '_bx_dev_bp_btn_block_delete', '', 0, 'button', '_bx_dev_bp_btn_sys_block_delete', '', '', 0, 0, 0, 'a:1:{s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_bp_block_edit', 'id', 2147483647, 1, 1),
('bx_developer_bp_block_edit', 'object', 2147483647, 1, 2),
('bx_developer_bp_block_edit', 'module', 2147483647, 1, 3),
('bx_developer_bp_block_edit', 'title_system', 2147483647, 1, 4),
('bx_developer_bp_block_edit', 'title', 2147483647, 1, 5),
('bx_developer_bp_block_edit', 'description', 2147483647, 1, 6),
('bx_developer_bp_block_edit', 'icon', 2147483647, 1, 7),
('bx_developer_bp_block_edit', 'designbox_id', 2147483647, 1, 8),
('bx_developer_bp_block_edit', 'async', 2147483647, 1, 9),
('bx_developer_bp_block_edit', 'submenu', 2147483647, 1, 10),
('bx_developer_bp_block_edit', 'tabs', 2147483647, 1, 11),
('bx_developer_bp_block_edit', 'hidden_on', 2147483647, 1, 12),
('bx_developer_bp_block_edit', 'visible_for', 2147483647, 1, 13),
('bx_developer_bp_block_edit', 'visible_for_levels', 2147483647, 1, 14),
('bx_developer_bp_block_edit', 'content_empty', 2147483647, 1, 15),
('bx_developer_bp_block_edit', 'help', 2147483647, 1, 16),
('bx_developer_bp_block_edit', 'class', 2147483647, 1, 17),
('bx_developer_bp_block_edit', 'cache_lifetime', 2147483647, 1, 18),
('bx_developer_bp_block_edit', 'config_api', 2147483647, 1, 19),
('bx_developer_bp_block_edit', 'deletable', 2147483647, 1, 20),
('bx_developer_bp_block_edit', 'copyable', 2147483647, 1, 21),
('bx_developer_bp_block_edit', 'active', 2147483647, 1, 22),
('bx_developer_bp_block_edit', 'active_api', 2147483647, 1, 23),
('bx_developer_bp_block_edit', 'controls', 2147483647, 1, 24),
('bx_developer_bp_block_edit', 'do_submit', 2147483647, 1, 25),
('bx_developer_bp_block_edit', 'cancel', 2147483647, 1, 26),
('bx_developer_bp_block_edit', 'delete', 2147483647, 1, 27);

--
-- Polyglot -> Grid descriptors
--
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_pgt_manage', 'Sql', 'SELECT * FROM `sys_modules` WHERE 1 ', 'sys_modules', 'id', 'name', '', '', 100, NULL, 'start', '', '', '', '', '', '', 2147483647, 'BxDevPolyglotManage', 'modules/boonex/developer/classes/BxDevPolyglotManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_developer_pgt_manage', 'title', '_bx_dev_pgt_txt_manage_gl_title', '100%', 0, '', '', 1);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_developer_pgt_manage', 'independent', 'add_keys', '_bx_dev_pgt_btn_manage_gl_add_keys', '', 0, 0),
('bx_developer_pgt_manage', 'independent', 'recompile', '_bx_dev_pgt_btn_manage_gl_recompile', '', 0, 1),
('bx_developer_pgt_manage', 'independent', 'restore', '_bx_dev_pgt_btn_manage_gl_restore', '', 0, 2);

--
-- Polyglot -> Manage.
--
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_developer_pgt_keys', @sName, '_bx_dev_pgt_txt_keys_form', '', '', 'do_submit', 'sys_localization_keys', 'ID', '', '', '', 0, 1, 'BxDevFormView', 'modules/boonex/developer/classes/BxDevFormView.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_developer_pgt_keys_add', @sName, 'bx_developer_pgt_keys', '_bx_dev_pgt_txt_keys_display_add', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_developer_pgt_keys', @sName, 'language', '', '', 0, 'select', '_bx_dev_pgt_txt_sys_keys_language', '_bx_dev_pgt_txt_keys_language', '_bx_dev_pgt_inf_keys_language', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'category', '', '', 0, 'select', '_bx_dev_pgt_txt_sys_keys_category', '_bx_dev_pgt_txt_keys_category', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_pgt_err_keys_category', 'Int', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'content', '', '', 0, 'textarea', '_bx_dev_pgt_txt_sys_keys_content', '_bx_dev_pgt_txt_keys_content', '_bx_dev_pgt_inf_keys_content', 1, 0, 0, '', '', '', 'Avail', '', '_bx_dev_pgt_err_keys_content', 'Xss', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'replace', '1', '', 0, 'switcher', '_bx_dev_pgt_txt_sys_keys_replace', '_bx_dev_pgt_txt_keys_replace', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'do_submit', '_bx_dev_pgt_btn_keys_submit', '', 0, 'submit', '_bx_dev_pgt_btn_sys_keys_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_developer_pgt_keys', @sName, 'do_cancel', '_bx_dev_pgt_btn_keys_cancel', '', 0, 'button', '_bx_dev_pgt_btn_sys_keys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_developer_pgt_keys_add', 'language', 2147483647, 1, 1),
('bx_developer_pgt_keys_add', 'category', 2147483647, 1, 2),
('bx_developer_pgt_keys_add', 'content', 2147483647, 1, 3),
('bx_developer_pgt_keys_add', 'replace', 2147483647, 1, 4),
('bx_developer_pgt_keys_add', 'controls', 2147483647, 1, 5),
('bx_developer_pgt_keys_add', 'do_submit', 2147483647, 1, 6),
('bx_developer_pgt_keys_add', 'do_cancel', 2147483647, 1, 7);
