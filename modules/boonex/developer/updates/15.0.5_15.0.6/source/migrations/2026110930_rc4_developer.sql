-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- install.sql of the update pack
-- FORMS
UPDATE `sys_objects_form` SET `title`='_bx_dev_frm_txt_displays_display' WHERE `object`='bx_developer_forms_display' AND `module`='bx_developer';
