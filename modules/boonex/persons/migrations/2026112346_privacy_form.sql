-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The privacy form of account settings > Privacy: who sees the profile, posts on it and contacts it.
INSERT IGNORE INTO `sys_form_displays` (`object`, `display_name`, `module`, `view_mode`, `title`) VALUES
('bx_person', 'bx_person_edit_privacy', 'bx_persons', 0, '_bx_persons_form_profile_display_edit_privacy');

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_person_edit_privacy', 'allow_view_to', 2147483647, 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_person_edit_privacy' AND `input_name` = 'allow_view_to');
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_person_edit_privacy', 'allow_post_to', 2147483647, 1, 2 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_person_edit_privacy' AND `input_name` = 'allow_post_to');
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_person_edit_privacy', 'allow_contact_to', 2147483647, 1, 3 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_person_edit_privacy' AND `input_name` = 'allow_contact_to');
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_person_edit_privacy', 'do_submit', 2147483647, 1, 4 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_person_edit_privacy' AND `input_name` = 'do_submit');
