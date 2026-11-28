-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Sign up and Forgot password have the layout of Sign in: no cover, the block's title is the page's one heading.
-- The password rule shows under the field before the first try, not only in the error.
UPDATE `sys_objects_page` SET `cover` = 0 WHERE `object` IN ('sys_create_account', 'sys_forgot_password') AND `cover` = 1;
UPDATE `sys_form_inputs` SET `info` = '_sys_form_account_input_password_info' WHERE `object` = 'sys_account' AND `module` = 'system' AND `name` = 'password' AND `info` = '';
UPDATE `sys_form_inputs` SET `info` = '_sys_form_account_input_password_info' WHERE `object` = 'sys_forgot_password' AND `module` = 'system' AND `name` = 'password' AND `info` = '';
