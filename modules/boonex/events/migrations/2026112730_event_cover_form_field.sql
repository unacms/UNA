-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Events: enable the cover image field on Add and Edit Event forms by default.
UPDATE `sys_form_display_inputs`
SET `active` = 1
WHERE `display_name` IN ('bx_event_add', 'bx_event_edit')
  AND `input_name` = 'cover'
  AND `active` = 0;
