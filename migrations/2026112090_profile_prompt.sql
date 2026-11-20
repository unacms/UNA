-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- "Require a profile" becomes "Accounts without a profile": '' informer only, 'prompt' a "Create your profile" window
-- after sign-in, 'on' sent to profile creation. A site keeps its value ('' or 'on'), so its behaviour doesn't change.
UPDATE `sys_options` SET `type` = 'select', `extra` = 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:29:"get_profile_requirement_modes";s:5:"class";s:18:"BaseServiceAccount";}' WHERE `name` = 'sys_account_require_profile' AND `type` = 'checkbox';

-- The profile types of "Create your profile" are drawn as the homepage's apps grid, on the site and in the apps.
UPDATE `sys_objects_menu` SET `template_id` = 7 WHERE `object` = 'sys_add_profile' AND `template_id` = 14;
UPDATE `sys_objects_menu` SET `config_api` = '{"view":"grid"}' WHERE `object` = 'sys_add_profile' AND (`config_api` IS NULL OR `config_api` = '');
