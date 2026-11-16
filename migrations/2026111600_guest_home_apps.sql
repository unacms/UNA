-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The guest home in the apps shows what the site shows: the home menu (as a grid) instead of the sign-in, join and
-- forgot password forms. The splash still gets those three blocks while they are off for the apps (BxDolSplash::AUTH_BLOCKS).
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `type`='menu' AND `content`='sys_homepage' AND `active_api`=0;
UPDATE `sys_pages_blocks` SET `active_api`=0 WHERE `object`='sys_home' AND `module`='system' AND `title` IN ('_sys_page_block_title_create_account', '_sys_page_block_title_login', '_sys_page_block_title_forgot_password') AND `active_api`=1;
UPDATE `sys_objects_menu` SET `config_api`='{"view":"grid"}' WHERE `object`='sys_homepage' AND (`config_api` IS NULL OR `config_api`='');
