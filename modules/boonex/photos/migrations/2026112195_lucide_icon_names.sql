-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_photos_administration' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_photos_administration' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_photos_administration' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_photos_common' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_photos_common' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_photos_common' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'photos-context' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'photos-context' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'photos-author' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'bx_persons_view_submenu' AND `name` = 'photos-author' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_photos_view' AND `name` = 'delete-photo' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_photos_view' AND `name` = 'edit-photo' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'rotate-ccw-clock' WHERE `set_name` = 'bx_photos_view_actions' AND `name` = 'audit' AND `icon` = 'history' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_photos_view_actions' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_photos_view_actions' AND `name` = 'notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_photos_view_actions' AND `name` = 'set-badges' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'sys_account_dashboard_manage_tools' AND `name` = 'photos-administration' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'sys_add_content_links' AND `name` = 'create-photo' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'sys_homepage' AND `name` = 'photos-home' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-my-photos' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'sys_site' AND `name` = 'photos-home' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'trigger_group_view_submenu' AND `name` = 'photos-context' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'camera' WHERE `set_name` = 'trigger_profile_view_submenu' AND `name` = 'photos-author' AND `icon` = 'camera-retro' AND @bLucide > 0;
UPDATE `sys_statistics` SET `icon` = 'camera' WHERE `name` = 'bx_photos' AND `icon` = 'camera-retro' AND @bLucide > 0;
