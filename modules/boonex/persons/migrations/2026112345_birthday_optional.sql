-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Persons: the birthday is optional, and only its author sees it until they choose who else does (Me only).
-- The profile forms start with the name.
UPDATE `sys_form_inputs` SET `required` = 0 WHERE `object` = 'bx_person' AND `name` = 'birthday' AND `required` = 1;
UPDATE `sys_form_inputs` SET `privacy` = 1, `privacy_default` = '2' WHERE `object` = 'bx_person' AND `name` = 'birthday' AND `privacy` = 0 AND `privacy_default` = '';

UPDATE `sys_form_display_inputs` SET `order` = 1 WHERE `display_name` IN ('bx_person_add', 'bx_person_edit') AND `input_name` = 'fullname' AND `order` = 4;
UPDATE `sys_form_display_inputs` SET `order` = 4 WHERE `display_name` IN ('bx_person_add', 'bx_person_edit') AND `input_name` = 'birthday' AND `order` = 3;
UPDATE `sys_form_display_inputs` SET `order` = 3 WHERE `display_name` IN ('bx_person_add', 'bx_person_edit') AND `input_name` = 'gender' AND `order` = 2;
UPDATE `sys_form_display_inputs` SET `order` = 2 WHERE `display_name` IN ('bx_person_add', 'bx_person_edit') AND `input_name` = 'picture' AND `order` = 1;
