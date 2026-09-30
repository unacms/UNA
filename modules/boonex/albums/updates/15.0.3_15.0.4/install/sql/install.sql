-- FORMS
DELETE FROM `sys_form_displays` WHERE `object`='bx_albums_media' AND `display_name`='bx_albums_media_delete';
INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_albums_media', 'bx_albums_media_delete', 'bx_albums', 0, '_bx_albums_form_media_display_delete');

DELETE FROM `sys_form_inputs` WHERE `object`='bx_albums_media' AND `name`='delete_confirm';
INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_albums_media', 'bx_albums', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_albums_form_media_input_sys_delete_confirm', '_bx_albums_form_media_input_delete_confirm', '_bx_albums_form_media_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_albums_form_media_input_delete_confirm_error', '', '', 1, 0);

DELETE FROM `sys_form_display_inputs` WHERE `display_name`='bx_albums_media_delete';
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_albums_media_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_albums_media_delete', 'controls', 2147483647, 1, 2),
('bx_albums_media_delete', 'do_submit', 2147483647, 1, 3),
('bx_albums_media_delete', 'do_cancel', 2147483647, 1, 4);
