-- TABLES
CREATE TABLE IF NOT EXISTS `bx_tasks_budget` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL default '0',
  `value_total` int(11) NOT NULL default '0',
  `value_spent` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `context_id` (`context_id`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_budget_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL default '0',
  `profile_id` int(11) NOT NULL default '0',
  `value` int(11) NOT NULL default '0',
  `text` text NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`)
);


-- FORMS
DELETE FROM `sys_form_display_inputs` WHERE `display_name`='bx_tasks_entry_add';
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_tasks_entry_add', 'allow_view_to', 2147483647, 1, 1),
('bx_tasks_entry_add', 'title', 2147483647, 1, 2),
('bx_tasks_entry_add', 'text', 2147483647, 1, 3),
('bx_tasks_entry_add', 'type', 2147483647, 1, 4),
('bx_tasks_entry_add', 'priority', 2147483647, 1, 5),
('bx_tasks_entry_add', 'estimate', 2147483647, 1, 6),
('bx_tasks_entry_add', 'stickers', 2147483647, 1, 7),
('bx_tasks_entry_add', 'initial_members', 192, 1, 8),
('bx_tasks_entry_add', 'due_date', 192, 1, 9),
('bx_tasks_entry_add', 'controls', 2147483647, 1, 10),
('bx_tasks_entry_add', 'do_publish', 2147483647, 1, 11),
('bx_tasks_entry_add', 'do_cancel', 2147483647, 1, 12);

DELETE FROM `sys_form_display_inputs` WHERE `display_name`='bx_tasks_entry_edit';
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_tasks_entry_edit', 'allow_view_to', 2147483647, 1, 1),
('bx_tasks_entry_edit', 'title', 2147483647, 1, 2),
('bx_tasks_entry_edit', 'text', 2147483647, 1, 3),
('bx_tasks_entry_edit', 'attachments', 2147483647, 1, 4),
('bx_tasks_entry_edit', 'pictures', 2147483647, 1, 5),
('bx_tasks_entry_edit', 'videos', 2147483647, 1, 6),
('bx_tasks_entry_edit', 'files', 2147483647, 1, 7),
('bx_tasks_entry_edit', 'type', 2147483647, 1, 8),
('bx_tasks_entry_edit', 'priority', 2147483647, 1, 9),
('bx_tasks_entry_edit', 'estimate', 2147483647, 1, 10),
('bx_tasks_entry_edit', 'stickers', 2147483647, 1, 11),
('bx_tasks_entry_edit', 'initial_members', 192, 1, 12),
('bx_tasks_entry_edit', 'due_date', 192, 1, 13),
('bx_tasks_entry_edit', 'cf', 2147483647, 1, 14),
('bx_tasks_entry_edit', 'controls_edit', 2147483647, 1, 15),
('bx_tasks_entry_edit', 'do_submit', 2147483647, 1, 16),
('bx_tasks_entry_edit', 'do_cancel_edit', 2147483647, 1, 17);

DELETE FROM `sys_form_display_inputs` WHERE `display_name`='bx_tasks_entry_view';
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_tasks_entry_view', 'tasks_list', 2147483647, 1, 1),
('bx_tasks_entry_view', 'initial_members', 2147483647, 1, 2),
('bx_tasks_entry_view', 'stickers', 2147483647, 1, 3),
('bx_tasks_entry_view', 'type', 2147483647, 1, 4),
('bx_tasks_entry_view', 'priority', 2147483647, 1, 5),
('bx_tasks_entry_view', 'estimate', 2147483647, 1, 6),
('bx_tasks_entry_view', 'cat', 2147483647, 1, 7),
('bx_tasks_entry_view', 'added', 2147483647, 1, 8),
('bx_tasks_entry_view', 'changed', 2147483647, 1, 9),
('bx_tasks_entry_view', 'due_date', 192, 1, 10),
('bx_tasks_entry_view', 'state', 2147483647, 1, 11),
('bx_tasks_entry_view', 'gh_issue_url', 2147483647, 1, 12);

DELETE FROM `sys_objects_form` WHERE `object`='bx_tasks_budget';
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_budget', 'bx_tasks', '_bx_tasks_form_budget', '', '', 'submit', 'bx_tasks_budget_track', 'id', '', '', '', 0, 1, 'BxTasksFormBudget', 'modules/boonex/tasks/classes/BxTasksFormBudget.php');

DELETE FROM `sys_form_displays` WHERE `object`='bx_tasks_budget';
INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_tasks_budget_add', 'bx_tasks', 'bx_tasks_budget', '_bx_tasks_form_display_budget_add', 0),
('bx_tasks_budget_edit', 'bx_tasks', 'bx_tasks_budget', '_bx_tasks_form_display_budget_edit', 0);

DELETE FROM `sys_form_inputs` WHERE `object`='bx_tasks_budget';
INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_tasks_budget', 'bx_tasks', 'value', '', '', 0, 'text', '_bx_tasks_form_budget_input_sys_value', '_bx_tasks_form_budget_input_value', '_bx_tasks_form_budget_input_value_info', 1, 0, 0, '', '', '', 'avail', '', '_bx_tasks_form_budget_input_value_err', 'Int', '', 1, 0),
('bx_tasks_budget', 'bx_tasks', 'text', '', '', 0, 'textarea', '_bx_tasks_form_budget_input_sys_text', '_bx_tasks_form_budget_input_text', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_tasks_budget', 'bx_tasks', 'submit', '_bx_tasks_form_budget_input_submit', '', 0, 'submit', '_bx_tasks_form_budget_input_sys_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_tasks_budget', 'bx_tasks', 'cancel', '_bx_tasks_form_budget_input_cancel', '', 0, 'button', '_bx_tasks_form_budget_input_sys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_budget', 'bx_tasks', 'controls', '', 'submit,cancel', 0, 'input_set', '_bx_tasks_form_budget_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

DELETE FROM `sys_form_display_inputs` WHERE `display_name` IN ('bx_tasks_budget_add', 'bx_tasks_budget_edit');
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_tasks_budget_add', 'value', 2147483647, 1, 1),
('bx_tasks_budget_add', 'text', 2147483647, 1, 2),
('bx_tasks_budget_add', 'controls', 2147483647, 1, 3),
('bx_tasks_budget_add', 'submit', 2147483647, 1, 4),
('bx_tasks_budget_add', 'cancel', 2147483647, 1, 5),

('bx_tasks_budget_edit', 'value', 2147483647, 1, 1),
('bx_tasks_budget_edit', 'text', 2147483647, 1, 2),
('bx_tasks_budget_edit', 'controls', 2147483647, 1, 3),
('bx_tasks_budget_edit', 'submit', 2147483647, 1, 4),
('bx_tasks_budget_edit', 'cancel', 2147483647, 1, 5);
